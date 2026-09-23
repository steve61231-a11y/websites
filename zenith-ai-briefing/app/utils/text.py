"""Small text helpers."""
from __future__ import annotations

import hashlib
import html
import re

from bs4 import BeautifulSoup

_WS = re.compile(r"\s+")


def clean_html(value: str | None, max_len: int = 1200) -> str:
    """HTML fragment -> plain single-spaced text, truncated."""
    if not value:
        return ""
    if "<" in value:
        value = BeautifulSoup(value, "html.parser").get_text(" ")
    value = _WS.sub(" ", html.unescape(value)).strip()
    return truncate(value, max_len)


def truncate(value: str, max_len: int) -> str:
    if not value or len(value) <= max_len:
        return value or ""
    cut = value[:max_len].rsplit(" ", 1)[0]
    return cut + "…"


def sha1(value: str) -> str:
    return hashlib.sha1(value.encode("utf-8", "ignore")).hexdigest()


def slug_to_title(slug: str) -> str:
    slug = slug.strip("/").split("/")[-1]
    slug = re.sub(r"\.(html?|php|aspx?)$", "", slug)
    words = re.split(r"[-_]+", slug)
    return " ".join(w.capitalize() if w.islower() else w for w in words if w)


def as_list(value) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        return [value] if value.strip() else []
    return [value]
