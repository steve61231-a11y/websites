"""RSS / Atom / YouTube / Reddit / GitHub-releases adapters (all feed-based)."""
from __future__ import annotations

import re
from urllib.parse import quote

import feedparser
from bs4 import BeautifulSoup

from app.config import SourceConfig
from app.ingestion.base import FetchError, RawItem, SourceAdapter, register
from app.utils.text import clean_html
from app.utils.timeutil import parse_date
from app.utils.urls import domain, is_http_url


def parse_feed(content: bytes | str) -> list[dict]:
    parsed = feedparser.parse(content)
    if parsed.bozo and not parsed.entries:
        raise FetchError(f"Unparseable feed: {getattr(parsed, 'bozo_exception', 'unknown error')}")
    return list(parsed.entries)


def entry_to_item(entry: dict) -> RawItem | None:
    link = entry.get("link") or ""
    if not link:
        for l in entry.get("links", []) or []:
            if l.get("rel") in (None, "alternate") and l.get("href"):
                link = l["href"]
                break
    title = clean_html(entry.get("title"), 300)
    if not title or not is_http_url(link):
        return None
    published = None
    for key in ("published_parsed", "updated_parsed", "created_parsed"):
        if entry.get(key):
            published = parse_date(entry[key])
            if published:
                break
    if not published:
        published = parse_date(entry.get("published") or entry.get("updated"))
    description = entry.get("summary") or ""
    if not description and entry.get("content"):
        description = entry["content"][0].get("value", "")
    if not description and entry.get("media_description"):
        description = entry["media_description"]
    return RawItem(
        title=title,
        url=link,
        published_at=published,
        description=clean_html(description, 1000),
        author=clean_html(entry.get("author"), 120) or None,
    )


@register("rss", "atom", "github_releases")
class RSSAdapter(SourceAdapter):
    """Standard RSS/Atom feeds. GitHub releases work too: https://github.com/OWNER/REPO/releases.atom"""

    def fetch(self, source: SourceConfig) -> list[RawItem]:
        result = self.get(source.url)
        items = []
        for entry in parse_feed(result.content):
            item = entry_to_item(entry)
            if item:
                if source.type == "github_releases" and not item.title.lower().startswith(source.name.lower()):
                    item.title = f"{source.name} {item.title}"
                items.append(item)
        return items


@register("youtube")
class YouTubeAdapter(RSSAdapter):
    """YouTube channel feed. ``url`` may be a full feed URL or ``channel_id: UC...`` may be given."""

    def fetch(self, source: SourceConfig) -> list[RawItem]:
        if not source.url.startswith("http"):
            source.url = f"https://www.youtube.com/feeds/videos.xml?channel_id={quote(source.url)}"
        return super().fetch(source)


_REDDIT_LINK = re.compile(r'<a href="([^"]+)">\[link\]</a>')


@register("reddit")
class RedditAdapter(SourceAdapter):
    """Subreddit RSS, e.g. https://www.reddit.com/r/artificial/top/.rss?t=day

    Link posts are unwrapped to the ORIGINAL article URL (the thing worth citing);
    self-posts keep the Reddit permalink. Optional ``min_domain_posts_only: true``
    keeps only posts that link to an external article.
    """

    def fetch(self, source: SourceConfig) -> list[RawItem]:
        result = self.get(source.url)
        external_only = bool(source.options.get("external_links_only", True))
        items = []
        for entry in parse_feed(result.content):
            item = entry_to_item(entry)
            if not item:
                continue
            content = ""
            if entry.get("content"):
                content = entry["content"][0].get("value", "")
            content = content or entry.get("summary", "")
            m = _REDDIT_LINK.search(content)
            target = m.group(1) if m else ""
            if target and is_http_url(target) and "reddit.com" not in domain(target) and "redd.it" not in domain(target):
                item.extra["discussion_url"] = item.url
                item.url = target
            elif external_only:
                continue
            text = BeautifulSoup(content, "html.parser").get_text(" ") if content else ""
            item.description = clean_html(text.replace("[link]", "").replace("[comments]", ""), 600)
            items.append(item)
        return items
