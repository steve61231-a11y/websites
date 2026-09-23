"""News-search adapter: mass discovery through news indexes, driven by queries.

One source entry can run many queries. Supported engines (all free, no API key):
  google_news  — https://news.google.com/rss/search (localizable with hl/gl, e.g. Kenya)
  bing_news    — https://www.bing.com/news/search?format=rss (links unwrapped to the original article)

Example:
  - name: Google News — Kenya AI
    type: search
    engine: google_news
    category: kenya
    region: KE          # optional, default US
    queries: ["artificial intelligence Kenya", "Safaricom AI"]
    when: 2d            # google_news only: recency window

Search results are marked as aggregator items: if the same story also arrives from
an original source, the original wins. Google News links are real redirect links to
the publisher; the article extractor follows them where possible.
"""
from __future__ import annotations

import logging
from urllib.parse import parse_qs, quote_plus, urlparse

from app.config import SourceConfig
from app.ingestion.base import FetchError, RawItem, SourceAdapter, register
from app.ingestion.rss import entry_to_item, parse_feed

log = logging.getLogger(__name__)

_REGIONS = {"KE": ("en-KE", "KE", "KE:en"), "NG": ("en-NG", "NG", "NG:en"), "ZA": ("en-ZA", "ZA", "ZA:en"),
            "US": ("en-US", "US", "US:en"), "GB": ("en-GB", "GB", "GB:en")}


def google_news_url(query: str, region: str = "US", when: str | None = None) -> str:
    hl, gl, ceid = _REGIONS.get(region.upper(), _REGIONS["US"])
    q = f"{query} when:{when}" if when else query
    return f"https://news.google.com/rss/search?q={quote_plus(q)}&hl={hl}&gl={gl}&ceid={ceid}"


def bing_news_url(query: str, region: str = "US") -> str:
    market = {"KE": "en-KE", "NG": "en-NG", "ZA": "en-ZA", "GB": "en-GB"}.get(region.upper(), "en-US")
    return f"https://www.bing.com/news/search?q={quote_plus(query)}&format=rss&mkt={market}"


def unwrap_bing(url: str) -> str:
    p = urlparse(url)
    if "bing.com" in p.netloc:
        target = parse_qs(p.query).get("url", [""])[0]
        if target.startswith("http"):
            return target
    return url


def strip_publisher_suffix(title: str) -> tuple[str, str | None]:
    """Google News titles end with ' - Publisher'."""
    if " - " in title:
        head, _, tail = title.rpartition(" - ")
        if head and len(tail) < 60:
            return head.strip(), tail.strip()
    return title, None


@register("search")
class NewsSearchAdapter(SourceAdapter):
    def fetch(self, source: SourceConfig) -> list[RawItem]:
        engine = str(source.options.get("engine", "google_news")).lower()
        region = str(source.options.get("region", "US"))
        queries = source.options.get("queries") or ([source.url] if source.url else [])
        if not queries:
            raise FetchError("search source needs 'queries'")
        items: list[RawItem] = []
        failures = 0
        for q in queries:
            url = google_news_url(q, region, source.options.get("when", "2d")) if engine == "google_news" else bing_news_url(q, region)
            try:
                entries = parse_feed(self.get(url).content)
            except FetchError as exc:
                failures += 1
                log.warning("search %s query %r failed: %s", source.name, q, exc)
                continue
            for entry in entries[:25]:
                item = entry_to_item(entry)
                if not item:
                    continue
                if engine == "google_news":
                    item.title, publisher = strip_publisher_suffix(item.title)
                    src = entry.get("source") or {}
                    item.extra["publisher"] = src.get("title") or publisher
                    item.extra["publisher_url"] = src.get("href")
                    item.description = ""  # Google's description just repeats the title
                else:
                    item.url = unwrap_bing(item.url)
                item.extra["query"] = q
                items.append(item)
        if failures == len(queries):
            raise FetchError(f"all {failures} search queries failed", self.last_status)
        return items
