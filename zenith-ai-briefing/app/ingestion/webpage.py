"""Plain web page adapter for sources without a feed (e.g. a company's /news page).

Finds article links on a listing page. Config options:
  link_pattern: regex the article URL must match (strongly recommended), e.g. "/news/[a-z0-9-]+$"
  min_title_length: ignore links whose text is shorter (default 25)
Dates: looks for a nearby <time datetime> element; otherwise the item is undated and
the collector treats first-ever sightings as baseline (not "news").
"""
from __future__ import annotations

import re

from bs4 import BeautifulSoup

from app.config import SourceConfig
from app.ingestion.base import RawItem, SourceAdapter, register
from app.utils.text import clean_html
from app.utils.timeutil import parse_date
from app.utils.urls import absolute_url, domain, is_http_url, normalize_url


def _nearby_date(a_tag):
    node = a_tag
    for _ in range(4):
        if node is None:
            break
        t = node.find("time") if hasattr(node, "find") else None
        if t is not None:
            return parse_date(t.get("datetime") or t.get_text(" ", strip=True))
        node = node.parent
    return None


_TITLE_CLASS = re.compile(r"title|headline|heading", re.I)


def _link_title(a_tag) -> str:
    for sel in ("h1", "h2", "h3", "h4"):
        h = a_tag.find(sel)
        if h:
            return clean_html(h.get_text(" ", strip=True), 300)
    h = a_tag.find(class_=_TITLE_CLASS)
    if h:
        return clean_html(h.get_text(" ", strip=True), 300)
    # Fall back to the link text minus dates/labels
    parts = [t for t in a_tag.find_all(string=True) if t.parent.name != "time"]
    text = clean_html(" ".join(parts), 300)
    return text or clean_html(a_tag.get("aria-label") or a_tag.get("title") or "", 300)


def extract_links(html: str, base_url: str, link_pattern: str | None = None, min_title_length: int = 25) -> list[RawItem]:
    soup = BeautifulSoup(html, "html.parser")
    pattern = re.compile(link_pattern) if link_pattern else None
    base_domain = domain(base_url)
    listing = normalize_url(base_url)
    seen: dict[str, RawItem] = {}
    for a in soup.find_all("a", href=True):
        href = absolute_url(base_url, a["href"])
        if not is_http_url(href) or domain(href) != base_domain:
            continue
        key = normalize_url(href)
        if key == listing:
            continue
        if pattern and not pattern.search(href):
            continue
        title = _link_title(a)
        if len(title) < min_title_length:
            # the same URL may appear again with a better title (image link + headline link)
            continue
        if key in seen and len(seen[key].title) >= len(title):
            continue
        seen[key] = RawItem(title=title, url=href, published_at=_nearby_date(a))
    return list(seen.values())


@register("webpage")
class WebPageAdapter(SourceAdapter):
    undated = True

    def fetch(self, source: SourceConfig) -> list[RawItem]:
        result = self.get(source.url)
        return extract_links(
            result.text, result.url or source.url,
            source.options.get("link_pattern"),
            int(source.options.get("min_title_length", 25)),
        )
