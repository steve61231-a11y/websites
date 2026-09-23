"""Generic JSON endpoint adapter.

Options:
  items_path: dot path to the list of items in the response (e.g. "hits" or "data.items"); "" = root
  fields: mapping of our field -> dot path in each item, e.g.
          {title: title, url: url, published: created_at, description: summary}
  url_template: optional, build the URL from item fields, e.g. "https://huggingface.co/papers/{paper.id}"
"""
from __future__ import annotations

import json
import re

from app.config import SourceConfig
from app.ingestion.base import FetchError, RawItem, SourceAdapter, register
from app.utils.text import clean_html
from app.utils.timeutil import parse_date
from app.utils.urls import is_http_url


def dig(obj, path: str):
    if not path:
        return obj
    for part in path.split("."):
        if isinstance(obj, dict):
            obj = obj.get(part)
        elif isinstance(obj, list) and part.isdigit() and int(part) < len(obj):
            obj = obj[int(part)]
        else:
            return None
    return obj


_TEMPLATE = re.compile(r"\{([^}]+)\}")


def render_template(template: str, item: dict) -> str:
    return _TEMPLATE.sub(lambda m: str(dig(item, m.group(1)) or ""), template)


@register("json")
class JSONAPIAdapter(SourceAdapter):
    def fetch(self, source: SourceConfig) -> list[RawItem]:
        try:
            data = json.loads(self.get(source.url).text)
        except json.JSONDecodeError as exc:
            raise FetchError(f"Invalid JSON: {exc}") from exc
        items = dig(data, source.options.get("items_path", ""))
        if not isinstance(items, list):
            raise FetchError("items_path did not resolve to a list")
        f = {"title": "title", "url": "url", "published": "published", "description": "description", "author": "author"}
        f.update(source.options.get("fields") or {})
        template = source.options.get("url_template")
        out = []
        for it in items:
            if not isinstance(it, dict):
                continue
            url = render_template(template, it) if template else dig(it, f["url"])
            title = clean_html(str(dig(it, f["title"]) or ""), 300)
            if not title or not url or not is_http_url(str(url)):
                continue
            out.append(RawItem(
                title=title, url=str(url),
                published_at=parse_date(dig(it, f["published"])),
                description=clean_html(str(dig(it, f["description"]) or ""), 1000),
                author=clean_html(str(dig(it, f["author"]) or ""), 120) or None,
            ))
        return out
