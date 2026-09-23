"""XML sitemap adapter. Useful when a site has no RSS but publishes a sitemap.

Options:
  link_pattern: regex URLs must match (e.g. "/news/")
  max_child_sitemaps: for sitemap indexes, how many child sitemaps to read (default 3, newest first)
  fetch_titles: fetch page <title> for the newest N matching URLs (default 10), since
                sitemaps rarely carry titles. Otherwise the title is derived from the slug.
"""
from __future__ import annotations

import re
from xml.etree import ElementTree as ET

from bs4 import BeautifulSoup

from app.config import SourceConfig
from app.ingestion.base import FetchError, RawItem, SourceAdapter, register
from app.utils.text import clean_html, slug_to_title
from app.utils.timeutil import parse_date

_NS = re.compile(r"^\{.*?\}")


def _strip(tag: str) -> str:
    return _NS.sub("", tag)


def parse_sitemap(xml: bytes) -> tuple[list[tuple[str, str | None]], list[tuple[str, str | None]]]:
    """Returns (urls, child_sitemaps) as lists of (loc, lastmod)."""
    try:
        root = ET.fromstring(xml)
    except ET.ParseError as exc:
        raise FetchError(f"Invalid sitemap XML: {exc}") from exc
    urls, children = [], []
    for node in root:
        kind = _strip(node.tag)
        loc = lastmod = None
        for child in node:
            t = _strip(child.tag)
            if t == "loc":
                loc = (child.text or "").strip()
            elif t == "lastmod":
                lastmod = (child.text or "").strip()
        if not loc:
            continue
        (children if kind == "sitemap" else urls).append((loc, lastmod))
    return urls, children


def page_title(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    og = soup.find("meta", property="og:title")
    if og and og.get("content"):
        return clean_html(og["content"], 300)
    return clean_html(soup.title.get_text() if soup.title else "", 300)


@register("sitemap")
class SitemapAdapter(SourceAdapter):
    def fetch(self, source: SourceConfig) -> list[RawItem]:
        pattern = re.compile(source.options["link_pattern"]) if source.options.get("link_pattern") else None
        urls, children = parse_sitemap(self.get(source.url).content)
        if children:
            children.sort(key=lambda c: c[1] or "", reverse=True)
            for loc, _ in children[: int(source.options.get("max_child_sitemaps", 3))]:
                try:
                    more, _ = parse_sitemap(self.get(loc).content)
                    urls.extend(more)
                except FetchError:
                    continue
        if pattern:
            urls = [u for u in urls if pattern.search(u[0])]
        urls.sort(key=lambda u: u[1] or "", reverse=True)
        items = []
        fetch_titles = int(source.options.get("fetch_titles", 10))
        for i, (loc, lastmod) in enumerate(urls[:200]):
            title = slug_to_title(loc)
            if i < fetch_titles:
                try:
                    title = page_title(self.http.get(loc).text) or title
                except FetchError:
                    pass
            items.append(RawItem(title=title, url=loc, published_at=parse_date(lastmod)))
        return items
