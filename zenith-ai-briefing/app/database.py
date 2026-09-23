"""SQLite storage. One file, no server. Safe to start from an empty/missing database.

Secrets are never stored here — the file may be committed back to the repository
by the GitHub Actions workflow to persist state between runs.
"""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from app.config import get_settings
from app.utils.timeutil import utcnow_iso

SCHEMA = """
CREATE TABLE IF NOT EXISTS sources (
    name TEXT PRIMARY KEY,
    type TEXT, url TEXT, category TEXT, priority INTEGER,
    last_fetch_at TEXT, last_success_at TEXT, last_failure_at TEXT,
    last_error TEXT, last_http_status INTEGER,
    last_item_count INTEGER DEFAULT 0, last_new_count INTEGER DEFAULT 0,
    total_fetches INTEGER DEFAULT 0, total_failures INTEGER DEFAULT 0,
    consecutive_failures INTEGER DEFAULT 0,
    extraction_ok INTEGER DEFAULT 0, extraction_failed INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    primary_article_id INTEGER,
    article_count INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    canonical_url TEXT NOT NULL UNIQUE,
    published_at TEXT,
    discovered_at TEXT NOT NULL,
    category TEXT,
    source_priority INTEGER DEFAULT 5,
    official INTEGER DEFAULT 0,
    aggregator INTEGER DEFAULT 0,
    description TEXT,
    author TEXT,
    full_text TEXT,
    content_hash TEXT,
    title_hash TEXT,
    processed INTEGER DEFAULT 0,
    extraction_status TEXT DEFAULT 'pending',
    story_id INTEGER REFERENCES stories(id),
    filter_json TEXT,
    filter_score REAL,
    featured_on TEXT
);
CREATE INDEX IF NOT EXISTS idx_articles_discovered ON articles(discovered_at);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_story ON articles(story_id);
CREATE INDEX IF NOT EXISTS idx_articles_title_hash ON articles(title_hash);

CREATE TABLE IF NOT EXISTS article_analysis (
    article_id INTEGER PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
    event_title TEXT,
    relevance_score REAL, business_impact_score REAL,
    kenya_relevance_score REAL, africa_relevance_score REAL,
    novelty_score REAL, credibility_score REAL, final_score REAL,
    summary TEXT,
    business_implications TEXT,
    use_cases TEXT,
    opportunity TEXT,
    content_angle TEXT,
    departments_affected TEXT,
    analysis_json TEXT,
    analysis_model TEXT,
    degraded INTEGER DEFAULT 0,
    analyzed_at TEXT
);

CREATE TABLE IF NOT EXISTS daily_briefings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    headline TEXT,
    summary TEXT,
    html_content TEXT,
    plain_text TEXT,
    briefing_json TEXT,
    degraded INTEGER DEFAULT 0,
    is_dry_run INTEGER DEFAULT 0,
    generated_at TEXT,
    emailed_at TEXT,
    run_id INTEGER
);

CREATE TABLE IF NOT EXISTS content_ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    topic TEXT,
    hook TEXT,
    content_angle TEXT,
    source_url TEXT,
    article_id INTEGER,
    created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_content_date ON content_ideas(date);

CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL UNIQUE,
    keywords TEXT,
    active INTEGER DEFAULT 1,
    origin TEXT DEFAULT 'config',
    created_at TEXT,
    last_matched_at TEXT
);

CREATE TABLE IF NOT EXISTS system_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT, finished_at TEXT,
    mode TEXT, status TEXT,
    sources_checked INTEGER DEFAULT 0, sources_failed INTEGER DEFAULT 0,
    articles_discovered INTEGER DEFAULT 0, new_articles INTEGER DEFAULT 0,
    duplicates_removed INTEGER DEFAULT 0, articles_classified INTEGER DEFAULT 0,
    articles_extracted INTEGER DEFAULT 0, articles_analyzed INTEGER DEFAULT 0,
    final_stories INTEGER DEFAULT 0, email_sent INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0, errors_json TEXT, summary TEXT
);

CREATE TABLE IF NOT EXISTS llm_cache (
    key TEXT PRIMARY KEY,
    model TEXT,
    response TEXT,
    created_at TEXT
);
"""


def db_path() -> Path:
    return get_settings().database_path


def connect(path: Path | str | None = None, timeout: float = 30) -> sqlite3.Connection:
    p = Path(path) if path else db_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(p), timeout=timeout, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_conn(path: Path | str | None = None) -> Iterator[sqlite3.Connection]:
    conn = connect(path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db(path: Path | str | None = None) -> None:
    with get_conn(path) as conn:
        conn.executescript(SCHEMA)


def rows(conn: sqlite3.Connection, sql: str, params: tuple | list = ()) -> list[dict[str, Any]]:
    return [dict(r) for r in conn.execute(sql, params).fetchall()]


def row(conn: sqlite3.Connection, sql: str, params: tuple | list = ()) -> dict[str, Any] | None:
    r = conn.execute(sql, params).fetchone()
    return dict(r) if r else None


# ---------------------------------------------------------------------------
# Articles
# ---------------------------------------------------------------------------

def insert_article(conn: sqlite3.Connection, a: dict[str, Any]) -> int | None:
    """Insert an article; returns new id, or None if it already exists (duplicate URL)."""
    cur = conn.execute(
        """INSERT OR IGNORE INTO articles
           (source, title, url, canonical_url, published_at, discovered_at, category,
            source_priority, official, aggregator, description, author, content_hash, title_hash,
            processed, extraction_status)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            a["source"], a["title"], a["url"], a["canonical_url"], a.get("published_at"),
            a.get("discovered_at") or utcnow_iso(), a.get("category"),
            a.get("source_priority", 5), int(bool(a.get("official"))), int(bool(a.get("aggregator"))),
            a.get("description"), a.get("author"), a.get("content_hash"), a.get("title_hash"),
            int(a.get("processed", 0)), a.get("extraction_status", "pending"),
        ),
    )
    return cur.lastrowid if cur.rowcount else None


def get_article(conn: sqlite3.Connection, article_id: int) -> dict[str, Any] | None:
    return row(conn, "SELECT * FROM articles WHERE id = ?", (article_id,))


def save_analysis(conn: sqlite3.Connection, article_id: int, data: dict[str, Any]) -> None:
    cols = [
        "event_title", "relevance_score", "business_impact_score", "kenya_relevance_score",
        "africa_relevance_score", "novelty_score", "credibility_score", "final_score", "summary",
        "business_implications", "use_cases", "opportunity", "content_angle", "departments_affected",
        "analysis_json", "analysis_model", "degraded", "analyzed_at",
    ]
    values = []
    for c in cols:
        v = data.get(c)
        if isinstance(v, (list, dict)):
            v = json.dumps(v, ensure_ascii=False)
        values.append(v)
    conn.execute(
        f"INSERT OR REPLACE INTO article_analysis (article_id, {', '.join(cols)}) "
        f"VALUES (?, {', '.join('?' for _ in cols)})",
        [article_id, *values],
    )


def get_analysis(conn: sqlite3.Connection, article_id: int) -> dict[str, Any] | None:
    r = row(conn, "SELECT * FROM article_analysis WHERE article_id = ?", (article_id,))
    if r and r.get("analysis_json"):
        try:
            r["analysis"] = json.loads(r["analysis_json"])
        except json.JSONDecodeError:
            r["analysis"] = {}
    return r


# ---------------------------------------------------------------------------
# Sources health
# ---------------------------------------------------------------------------

def record_source_result(
    conn: sqlite3.Connection, src: Any, *, ok: bool, status: int | None,
    item_count: int = 0, new_count: int = 0, error: str | None = None,
) -> None:
    now = utcnow_iso()
    conn.execute(
        """INSERT INTO sources (name, type, url, category, priority) VALUES (?,?,?,?,?)
           ON CONFLICT(name) DO UPDATE SET type=excluded.type, url=excluded.url,
             category=excluded.category, priority=excluded.priority""",
        (src.name, src.type, src.url, src.category, src.priority),
    )
    if ok:
        conn.execute(
            """UPDATE sources SET last_fetch_at=?, last_success_at=?, last_http_status=?,
                 last_item_count=?, last_new_count=?, total_fetches=total_fetches+1,
                 consecutive_failures=0, last_error=NULL WHERE name=?""",
            (now, now, status, item_count, new_count, src.name),
        )
    else:
        conn.execute(
            """UPDATE sources SET last_fetch_at=?, last_failure_at=?, last_http_status=?,
                 last_error=?, last_item_count=0, last_new_count=0,
                 total_fetches=total_fetches+1, total_failures=total_failures+1,
                 consecutive_failures=consecutive_failures+1 WHERE name=?""",
            (now, now, status, (error or "")[:500], src.name),
        )


def source_has_succeeded_before(conn: sqlite3.Connection, name: str) -> bool:
    r = row(conn, "SELECT last_success_at FROM sources WHERE name = ?", (name,))
    return bool(r and r["last_success_at"])


def record_extraction(conn: sqlite3.Connection, source_name: str, ok: bool) -> None:
    col = "extraction_ok" if ok else "extraction_failed"
    conn.execute(f"UPDATE sources SET {col} = {col} + 1 WHERE name = ?", (source_name,))


# ---------------------------------------------------------------------------
# Watchlist
# ---------------------------------------------------------------------------

def sync_watchlist(conn: sqlite3.Connection, items: list[dict[str, Any]]) -> None:
    """Upsert watchlist topics from settings.yaml. Dashboard-added topics are kept."""
    for item in items:
        topic = str(item.get("topic", "")).strip()
        if not topic:
            continue
        keywords = json.dumps([str(k).lower() for k in (item.get("keywords") or [topic])])
        conn.execute(
            """INSERT INTO watchlist (topic, keywords, active, origin, created_at) VALUES (?,?,1,'config',?)
               ON CONFLICT(topic) DO UPDATE SET keywords=excluded.keywords""",
            (topic, keywords, utcnow_iso()),
        )


def active_watchlist(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    out = rows(conn, "SELECT * FROM watchlist WHERE active = 1 ORDER BY topic")
    for w in out:
        try:
            w["keywords"] = json.loads(w["keywords"] or "[]")
        except json.JSONDecodeError:
            w["keywords"] = [w["topic"].lower()]
        if not w["keywords"]:
            w["keywords"] = [w["topic"].lower()]
    return out


# ---------------------------------------------------------------------------
# Runs / maintenance
# ---------------------------------------------------------------------------

def start_run(conn: sqlite3.Connection, mode: str) -> int:
    cur = conn.execute(
        "INSERT INTO system_runs (started_at, mode, status) VALUES (?,?, 'running')",
        (utcnow_iso(), mode),
    )
    return int(cur.lastrowid)


def finish_run(conn: sqlite3.Connection, run_id: int, stats: dict[str, Any], status: str,
               errors: list[str], summary: str) -> None:
    fields = [
        "sources_checked", "sources_failed", "articles_discovered", "new_articles",
        "duplicates_removed", "articles_classified", "articles_extracted", "articles_analyzed",
        "final_stories", "email_sent",
    ]
    conn.execute(
        f"""UPDATE system_runs SET finished_at=?, status=?, errors_count=?, errors_json=?, summary=?,
            {', '.join(f'{f}=?' for f in fields)} WHERE id=?""",
        [utcnow_iso(), status, len(errors), json.dumps(errors[:200], ensure_ascii=False), summary,
         *[int(stats.get(f, 0) or 0) for f in fields], run_id],
    )


def prune(conn: sqlite3.Connection, retention_days: int) -> None:
    """Keep the database small enough to commit to git every day."""
    conn.execute(
        """DELETE FROM articles WHERE featured_on IS NULL
           AND discovered_at < datetime('now', ?)""",
        (f"-{retention_days} days",),
    )
    # Full text is only needed for analysis; drop it after a week.
    conn.execute(
        "UPDATE articles SET full_text = NULL WHERE full_text IS NOT NULL AND discovered_at < datetime('now', '-7 days')"
    )
    conn.execute("DELETE FROM llm_cache WHERE created_at < datetime('now', ?)", (f"-{get_settings().llm_cache_days} days",))
    conn.execute("DELETE FROM system_runs WHERE started_at < datetime('now', '-180 days')")
    conn.execute("DELETE FROM stories WHERE id NOT IN (SELECT DISTINCT story_id FROM articles WHERE story_id IS NOT NULL)")


def vacuum(path: Path | str | None = None) -> None:
    conn = connect(path)
    try:
        conn.execute("VACUUM")
    finally:
        conn.close()
