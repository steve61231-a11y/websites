"""Full-text extraction for the stories selected for deeper analysis.

Uses trafilatura (boilerplate removal: nav, cookie notices, ads, related links).
Extraction failure is normal (paywalls, JS-only pages) — the article keeps its
feed metadata and is marked extraction_status='failed'. Nothing here raises.
"""
from __future__ import annotations

import json
import logging
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Callable

import trafilatura

from app.config import get_settings
from app.database import record_extraction
from app.ingestion.base import FetchError, HttpClient
from app.utils.text import sha1
from app.utils.timeutil import parse_date, to_db
from app.utils.urls import is_http_url

log = logging.getLogger(__name__)

MIN_TEXT_CHARS = 280


@dataclass
class ExtractionResult:
    ok: bool
    text: str = ""
    title: str | None = None
    published_at: str | None = None
    canonical_url: str | None = None
    author: str | None = None
    sitename: str | None = None
    final_url: str | None = None
    error: str | None = None


def extract_from_html(html: str, url: str) -> ExtractionResult:
    try:
        raw = trafilatura.extract(
            html, url=url, output_format="json", with_metadata=True,
            include_comments=False, include_tables=False, include_images=False,
            favor_precision=True,
        )
    except Exception as exc:  # trafilatura can choke on malformed markup
        return ExtractionResult(False, error=f"extractor error: {exc}")
    if not raw:
        return ExtractionResult(False, error="no main content found")
    data = json.loads(raw)
    text = (data.get("text") or "").strip()
    canonical = data.get("source") if is_http_url(data.get("source") or "") else None
    result = ExtractionResult(
        ok=len(text) >= MIN_TEXT_CHARS,
        text=text,
        title=data.get("title"),
        published_at=to_db(parse_date(data.get("date"))),
        canonical_url=canonical,
        author=data.get("author"),
        sitename=data.get("sitename") or data.get("hostname"),
    )
    if not result.ok:
        result.error = f"text too short ({len(text)} chars) — paywall or JS page?"
    return result


def extract_article(url: str, http: HttpClient | None = None) -> ExtractionResult:
    own = http is None
    http = http or HttpClient(retries=1)
    try:
        page = http.get(url)
        result = extract_from_html(page.text, page.url or url)
        result.final_url = page.url
        return result
    except FetchError as exc:
        return ExtractionResult(False, error=str(exc))
    except Exception as exc:
        return ExtractionResult(False, error=f"{type(exc).__name__}: {exc}")
    finally:
        if own:
            http.close()


def extract_many(
    conn: sqlite3.Connection,
    articles: list[dict],
    stats: dict,
    errors: list[str],
    http_factory: Callable[[], HttpClient] = lambda: HttpClient(retries=1),
) -> None:
    """Extract full text for articles (dicts with id/url/source). Updates DB and the dicts in place."""
    todo = [a for a in articles if a.get("extraction_status") not in ("ok",) and not a.get("full_text")]
    if not todo:
        return
    s = get_settings()

    def work(a: dict) -> ExtractionResult:
        http = http_factory()
        try:
            return extract_article(a["url"], http)
        finally:
            http.close()

    with ThreadPoolExecutor(max_workers=max(1, s.http_max_concurrency)) as pool:
        results = list(pool.map(work, todo))

    for a, r in zip(todo, results):
        if r.ok:
            a["full_text"] = r.text
            a["extraction_status"] = "ok"
            if not a.get("published_at") and r.published_at:
                a["published_at"] = r.published_at
            conn.execute(
                """UPDATE articles SET full_text=?, content_hash=?, extraction_status='ok',
                   published_at=COALESCE(published_at, ?) WHERE id=?""",
                (r.text, sha1(r.text), r.published_at, a["id"]),
            )
            stats["articles_extracted"] = stats.get("articles_extracted", 0) + 1
        else:
            a["extraction_status"] = "failed"
            conn.execute("UPDATE articles SET extraction_status='failed' WHERE id=?", (a["id"],))
            log.info("extraction failed for %s: %s", a["url"], r.error)
            errors.append(f"extract:{a['source']}: {r.error}")
        record_extraction(conn, a["source"], r.ok)
    conn.commit()
