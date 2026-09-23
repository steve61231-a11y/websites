"""Provider-agnostic LLM layer.

The rest of the app only calls ``LLMClient.json(...)`` with a *role* ("cheap" or
"analysis"); model names come from environment variables, never from code.

Resilience: concurrency cap, retries with exponential backoff + jitter, optional
fallback model, response cache (SQLite), tolerant JSON parsing. A failure raises
``LLMError`` to the caller, which always has a non-AI fallback path.

Adding a provider: subclass ``LLMProvider``, implement ``complete``, and register it
in ``PROVIDERS`` below.
"""
from __future__ import annotations

import json
import logging
import random
import re
import threading
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Callable

from app.config import Settings, get_settings
from app.utils.text import sha1

log = logging.getLogger(__name__)


class LLMError(Exception):
    """Final failure after retries/fallback."""


class LLMRetryableError(LLMError):
    """Transient: rate limit, timeout, 5xx, truncated output."""


class LLMFatalError(LLMError):
    """Won't succeed by retrying the same model: bad key, unknown model, bad request."""


@dataclass
class LLMResponse:
    text: str
    input_tokens: int = 0
    output_tokens: int = 0


class LLMProvider(ABC):
    name = "base"

    @abstractmethod
    def complete(self, system: str, user: str, model: str, max_tokens: int, json_mode: bool = True) -> LLMResponse:
        ...


def parse_json_response(text: str) -> Any:
    """Parse model output into JSON, tolerating code fences and chatter around it."""
    if text is None:
        raise ValueError("empty response")
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t, flags=re.I | re.S).strip()
    try:
        return json.loads(t)
    except json.JSONDecodeError:
        pass
    # Find the first balanced {...} or [...] block.
    for open_ch, close_ch in (("{", "}"), ("[", "]")):
        start = t.find(open_ch)
        while start != -1:
            depth, in_str, esc = 0, False, False
            for i in range(start, len(t)):
                c = t[i]
                if in_str:
                    if esc:
                        esc = False
                    elif c == "\\":
                        esc = True
                    elif c == '"':
                        in_str = False
                elif c == '"':
                    in_str = True
                elif c == open_ch:
                    depth += 1
                elif c == close_ch:
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(t[start:i + 1])
                        except json.JSONDecodeError:
                            break
            start = t.find(open_ch, start + 1)
    # Last resort: strip trailing commas.
    try:
        return json.loads(re.sub(r",\s*([}\]])", r"\1", t))
    except json.JSONDecodeError as exc:
        raise ValueError(f"could not parse JSON from model output: {t[:200]!r}") from exc


@dataclass
class UsageStats:
    calls: int = 0
    cache_hits: int = 0
    failures: int = 0
    fallbacks: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    lock: threading.Lock = field(default_factory=threading.Lock, repr=False)

    def add(self, **kw: int) -> None:
        with self.lock:
            for k, v in kw.items():
                setattr(self, k, getattr(self, k) + v)

    def as_dict(self) -> dict[str, int]:
        return {k: getattr(self, k) for k in ("calls", "cache_hits", "failures", "fallbacks", "input_tokens", "output_tokens")}


class LLMClient:
    def __init__(self, provider: LLMProvider, settings: Settings | None = None,
                 sleep: Callable[[float], None] = time.sleep, use_cache: bool = True):
        self.provider = provider
        self.s = settings or get_settings()
        self.sleep = sleep
        self.use_cache = use_cache
        self.usage = UsageStats()
        self._sem = threading.BoundedSemaphore(max(1, self.s.llm_max_concurrency))

    def model_for(self, role: str) -> str:
        return self.s.cheap_model if role == "cheap" else self.s.analysis_model

    # -- cache ---------------------------------------------------------------
    def _cache_get(self, key: str) -> str | None:
        if not self.use_cache:
            return None
        from app.database import connect

        try:
            conn = connect(timeout=3)  # the cache is optional; never block on it
            try:
                r = conn.execute("SELECT response FROM llm_cache WHERE key=?", (key,)).fetchone()
                return r[0] if r else None
            finally:
                conn.close()
        except Exception:
            return None

    def _cache_put(self, key: str, model: str, text: str) -> None:
        if not self.use_cache:
            return
        from app.database import connect
        from app.utils.timeutil import utcnow_iso

        try:
            conn = connect(timeout=3)  # the cache is optional; never block on it
            try:
                conn.execute("INSERT OR REPLACE INTO llm_cache (key, model, response, created_at) VALUES (?,?,?,?)",
                             (key, model, text, utcnow_iso()))
                conn.commit()
            finally:
                conn.close()
        except Exception as exc:
            log.debug("cache write failed: %s", exc)

    # -- main entry ----------------------------------------------------------
    def json(self, *, role: str, system: str, user: str, max_tokens: int, task: str = "") -> Any:
        """Return parsed JSON. Raises LLMError after retries and fallback are exhausted."""
        models = [self.model_for(role)]
        if self.s.fallback_model and self.s.fallback_model not in models:
            models.append(self.s.fallback_model)
        last_exc: Exception | None = None
        for i, model in enumerate(models):
            if i > 0:
                self.usage.add(fallbacks=1)
                log.warning("LLM %s: falling back to %s after: %s", task, model, last_exc)
            try:
                return self._call_with_retries(model, system, user, max_tokens, task)
            except LLMError as exc:
                last_exc = exc
        self.usage.add(failures=1)
        raise LLMError(f"{task or 'llm'} failed: {last_exc}")

    def _call_with_retries(self, model: str, system: str, user: str, max_tokens: int, task: str) -> Any:
        key = sha1(f"{self.provider.name}|{model}|{max_tokens}|{system}|{user}")
        cached = self._cache_get(key)
        if cached is not None:
            try:
                self.usage.add(cache_hits=1)
                return parse_json_response(cached)
            except ValueError:
                pass
        attempts = max(1, self.s.llm_retries)
        last: Exception | None = None
        for attempt in range(attempts):
            try:
                with self._sem:
                    resp = self.provider.complete(system, user, model, max_tokens, json_mode=True)
                self.usage.add(calls=1, input_tokens=resp.input_tokens, output_tokens=resp.output_tokens)
                data = parse_json_response(resp.text)
                self._cache_put(key, model, resp.text)
                return data
            except LLMFatalError as exc:
                raise exc
            except (LLMRetryableError, ValueError) as exc:
                last = exc
            except Exception as exc:  # unknown provider error: treat as transient
                last = exc
            delay = min(60.0, (2 ** attempt) * 2) + random.uniform(0, 1)
            log.info("LLM %s attempt %d/%d on %s failed (%s); retrying in %.1fs",
                     task, attempt + 1, attempts, model, last, delay)
            if attempt < attempts - 1:
                self.sleep(delay)
        raise LLMRetryableError(str(last))


def _openai_factory(s: Settings) -> LLMProvider:
    from app.llm.openai_provider import OpenAIProvider

    return OpenAIProvider(api_key=s.openai_api_key or "", base_url=s.openai_base_url,
                          reasoning_effort=s.reasoning_effort, temperature=s.llm_temperature)


PROVIDERS: dict[str, Callable[[Settings], LLMProvider]] = {
    "openai": _openai_factory,
    # "anthropic": _anthropic_factory,   # add future providers here
}


def get_llm(settings: Settings | None = None) -> LLMClient | None:
    """Return a client, or None when no provider is configured (the pipeline then
    runs in heuristic/degraded mode and still produces a briefing)."""
    s = settings or get_settings()
    if not s.llm_enabled:
        return None
    factory = PROVIDERS.get(s.llm_provider)
    if not factory:
        log.error("Unknown LLM_PROVIDER %r — running without AI", s.llm_provider)
        return None
    return LLMClient(factory(s), s)
