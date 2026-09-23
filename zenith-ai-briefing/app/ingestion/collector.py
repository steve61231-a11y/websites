"""Mass discovery: fetch every enabled source, normalize, store new items.

Network fetches run in a small thread pool; all database writes happen on the
calling thread. A failing source is recorded in source health and skipped — it
never stops the run.
"""
from __future__ import annotations

import logging
import sqlite3
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import timedelta
from typing import Callable

from app.analysis.deduplicator import normalize_title
from app.config import SourceConfig, get_settings
from app.database import insert_article, record_source_result, source_has_succeeded_before
from app.ingestion.base import FetchError, HttpClient, RawItem, get_adapter
from app.utils.text import sha1
from app.utils.timeutil import to_db, utcnow
from app.utils.urls import is_http_url, normalize_url

log = logging.getLogger(__name__)


def fetch_source(source: SourceConfig, http_factory: Callable[[], HttpClient] = HttpClient):
    """Returns (items, status, error, undated_adapter). Never raises."""
    http = None
    try:
        http = http_factory()
        adapter = get_adapter(source.type, http)
        items = adapter.fetch(source)
        return items, adapter.last_status or 200, None, adapter.undated
    except FetchError as exc:
        return [], exc.status, str(exc), False
    except Exception as exc:  # adapter bug or unexpected content — isolate it
        log.exception("source %s crashed", source.name)
        return [], None, f"{type(exc).__name__}: {exc}", False
    finally:
        if http is not None:
            http.close()


def collect(
    conn: sqlite3.Connection,
    sources: list[SourceConfig],
    stats: dict,
    errors: list[str],
    http_factory: Callable[[], HttpClient] = HttpClient,
) -> None:
    s = get_settings()
    cutoff = utcnow() - timedelta(hours=s.lookback_hours)
    budget = s.max_articles_discovered
    stats.setdefault("new_articles", 0)

    results: dict[str, tuple] = {}
    with ThreadPoolExecutor(max_workers=max(1, s.http_max_concurrency)) as pool:
        futures = {pool.submit(fetch_source, src, http_factory): src for src in sources}
        for fut in as_completed(futures):
            results[futures[fut].name] = fut.result()

    # Process higher-priority sources first so the discovery budget favours them.
    for src in sorted(sources, key=lambda x: -x.priority):
        items, status, error, undated = results[src.name]
        stats["sources_checked"] = stats.get("sources_checked", 0) + 1
        if error:
            stats["sources_failed"] = stats.get("sources_failed", 0) + 1
            errors.append(f"source:{src.name}: {error}")
            log.warning("✗ %-32s %s", src.name, error)
            record_source_result(conn, src, ok=False, status=status, error=error)
            continue

        first_time = not source_has_succeeded_before(conn, src.name)
        fresh: list[RawItem] = []
        for it in items:
            if not it.title or not is_http_url(it.url):
                continue
            if it.published_at and it.published_at < cutoff:
                continue
            fresh.append(it)
        fresh.sort(key=lambda i: i.published_at or utcnow(), reverse=True)
        fresh = fresh[: s.max_items_per_source]
        stats["articles_discovered"] = stats.get("articles_discovered", 0) + len(fresh)

        new = 0
        for it in fresh:
            if budget <= 0:
                break
            # Undated items seen on a source's very first successful fetch are a
            # baseline (the page's existing back-catalogue), not today's news.
            baseline = first_time and it.published_at is None
            publisher = it.extra.get("publisher")
            article = {
                "source": publisher or src.name,
                "title": it.title,
                "url": it.url,
                "canonical_url": normalize_url(it.url),
                "published_at": to_db(it.published_at),
                "category": src.category,
                "source_priority": src.priority,
                "official": src.official,
                "aggregator": src.aggregator,
                "description": it.description,
                "author": it.author,
                "title_hash": sha1(normalize_title(it.title)),
                "processed": 1 if baseline else 0,
                "extraction_status": "baseline" if baseline else "pending",
            }
            if insert_article(conn, article):
                new += 1
                budget -= 1
                if not baseline:
                    stats["new_articles"] += 1
            else:
                stats["url_duplicates"] = stats.get("url_duplicates", 0) + 1
        log.info("✓ %-32s %3d items, %3d fresh, %3d new%s", src.name, len(items), len(fresh), new,
                 " (baseline)" if first_time and undated else "")
        record_source_result(conn, src, ok=True, status=status, item_count=len(items), new_count=new)
        conn.commit()
