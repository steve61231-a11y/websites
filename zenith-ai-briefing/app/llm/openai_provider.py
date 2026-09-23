"""OpenAI (and OpenAI-compatible endpoints via OPENAI_BASE_URL, e.g. OpenRouter,
Groq, Together, a local Ollama) chat-completions provider."""
from __future__ import annotations

import logging

from app.llm.provider import LLMFatalError, LLMProvider, LLMResponse, LLMRetryableError

log = logging.getLogger(__name__)


class OpenAIProvider(LLMProvider):
    name = "openai"

    def __init__(self, api_key: str, base_url: str | None = None, timeout: float = 180,
                 reasoning_effort: str | None = None, temperature: float | None = None):
        import openai

        self._openai = openai
        # We do our own retries/backoff in LLMClient.
        self.client = openai.OpenAI(api_key=api_key, base_url=base_url or None, timeout=timeout, max_retries=0)
        self.reasoning_effort = reasoning_effort
        self.temperature = temperature
        # Parameters an endpoint has rejected; dropped on later calls.
        self._unsupported: set[str] = set()

    def complete(self, system: str, user: str, model: str, max_tokens: int, json_mode: bool = True) -> LLMResponse:
        o = self._openai
        kwargs = {
            "model": model,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "max_completion_tokens": max_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        if self.temperature is not None:
            kwargs["temperature"] = self.temperature
        if self.reasoning_effort:
            kwargs["reasoning_effort"] = self.reasoning_effort

        for _ in range(4):
            for p in self._unsupported:
                kwargs.pop(p, None)
            if "max_completion_tokens" in self._unsupported:
                kwargs["max_tokens"] = max_tokens
            try:
                resp = self.client.chat.completions.create(**kwargs)
                break
            except o.BadRequestError as exc:
                msg = str(exc).lower()
                bad = next((p for p in ("response_format", "temperature", "reasoning_effort", "max_completion_tokens")
                            if p in msg and p in kwargs and p not in self._unsupported), None)
                if bad:
                    log.info("model %s rejected %s; retrying without it", model, bad)
                    self._unsupported.add(bad)
                    continue
                raise LLMFatalError(f"bad request: {exc}") from exc
            except (o.AuthenticationError, o.PermissionDeniedError, o.NotFoundError) as exc:
                raise LLMFatalError(f"{type(exc).__name__}: {exc}") from exc
            except (o.RateLimitError, o.APITimeoutError, o.APIConnectionError, o.InternalServerError) as exc:
                raise LLMRetryableError(f"{type(exc).__name__}: {exc}") from exc
        else:
            raise LLMFatalError("request rejected repeatedly")

        choice = resp.choices[0]
        text = choice.message.content or ""
        if not text.strip():
            raise LLMRetryableError(f"empty response (finish_reason={choice.finish_reason}) — raise max tokens?")
        usage = getattr(resp, "usage", None)
        return LLMResponse(
            text=text,
            input_tokens=getattr(usage, "prompt_tokens", 0) or 0,
            output_tokens=getattr(usage, "completion_tokens", 0) or 0,
        )
