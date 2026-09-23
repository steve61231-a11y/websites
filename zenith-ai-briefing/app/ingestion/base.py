"""Source adapter architecture.

Every adapter turns one configured source into a list of ``RawItem``s. Adding a new
platform (Instagram, LinkedIn, X, TikTok…) means writing one small class with a
``fetch`` method and decorating it with ``@register("type_name")`` — nothing else in
the pipeline changes.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Callable

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.config import SourceConfig, get_settings

log = logging.getLogger(__name__)


@dataclass
class RawItem:
    title: str
    url: str
    published_at: datetime | None = None
    description: str = ""
    author: str | None = None
    extra: dict = field(default_factory=dict)


class FetchError(Exception):
    def __init__(self, message: str, status: int | None = None):
        super().__init__(message)
        self.status = status


@dataclass
class FetchResult:
    text: str
    content: bytes
    status: int
    url: str
    headers: dict


class HttpClient:
    """Thin wrapper over requests with retries, timeout and a sane User-Agent."""

    def __init__(self, timeout: int | None = None, user_agent: str | None = None, retries: int = 2):
        s = get_settings()
        self.timeout = timeout or s.http_timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": user_agent or s.user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/rss+xml,application/atom+xml,application/json;q=0.8,*/*;q=0.5",
            "Accept-Language": "en-US,en;q=0.9",
        })
        retry = Retry(total=retries, backoff_factor=1.5, status_forcelist=(429, 500, 502, 503, 504),
                      allowed_methods=("GET", "HEAD"), raise_on_status=False)
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def get(self, url: str, **kwargs) -> FetchResult:
        try:
            resp = self.session.get(url, timeout=self.timeout, allow_redirects=True, **kwargs)
        except requests.Timeout as exc:
            raise FetchError(f"timeout after {self.timeout}s", None) from exc
        except (requests.exceptions.ProxyError, requests.exceptions.SSLError, requests.ConnectionError) as exc:
            reason = "403 from proxy/firewall" if "403" in str(exc) else type(exc).__name__
            raise FetchError(f"connection failed ({reason})", None) from exc
        except requests.RequestException as exc:
            raise FetchError(f"{type(exc).__name__}: {str(exc)[:160]}", None) from exc
        if resp.status_code >= 400:
            raise FetchError(f"HTTP {resp.status_code} for {url}", resp.status_code)
        return FetchResult(resp.text, resp.content, resp.status_code, resp.url, dict(resp.headers))

    def close(self) -> None:
        self.session.close()


class SourceAdapter:
    """Base class. ``fetch`` returns items; it may raise FetchError."""

    type_name: str = ""
    #: True when the adapter cannot see publication dates reliably (web pages).
    undated: bool = False

    def __init__(self, http: HttpClient):
        self.http = http
        self.last_status: int | None = None

    def fetch(self, source: SourceConfig) -> list[RawItem]:  # pragma: no cover - interface
        raise NotImplementedError

    def get(self, url: str) -> FetchResult:
        result = self.http.get(url)
        self.last_status = result.status
        return result


ADAPTERS: dict[str, type[SourceAdapter]] = {}


def register(*type_names: str) -> Callable[[type[SourceAdapter]], type[SourceAdapter]]:
    def deco(cls: type[SourceAdapter]) -> type[SourceAdapter]:
        for name in type_names:
            ADAPTERS[name] = cls
        cls.type_name = type_names[0]
        return cls
    return deco


def get_adapter(source_type: str, http: HttpClient) -> SourceAdapter:
    # Import adapter modules so their @register decorators run.
    from app.ingestion import json_api, rss, search, sitemap, webpage  # noqa: F401

    cls = ADAPTERS.get(source_type)
    if cls is None:
        raise FetchError(f"No adapter registered for source type {source_type!r}")
    return cls(http)
