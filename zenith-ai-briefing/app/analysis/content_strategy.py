"""Content strategist guidance + content history (avoid repeating the same narrative)."""
from __future__ import annotations

import sqlite3
from difflib import SequenceMatcher

from app.analysis.deduplicator import TitleFeatures, same_event
from app.database import rows
from app.utils.timeutil import utcnow_iso

CONTENT_GUIDE = """
CONTENT STRATEGIST — the owner records a short (under 2 minute) video from this.
- hook: ONE strong opening sentence a Kenyan business owner can't scroll past. Specific, not clickbait.
- what_happened_points: 2-3 concise talking points (plain English, factual, from the article).
- why_it_matters_points: 2-3 concise talking points (business consequences).
- kenyan_example: one realistic example with a Kenyan business type (no invented company facts).
- practical_takeaway: what the viewer should actually do this week.
- content_angle: one sentence describing the video/post angle.
Avoid repeating angles already covered recently (listed below when available) — find what is NEW.
"""


def recent_ideas(conn: sqlite3.Connection, days: int) -> list[dict]:
    return rows(conn, "SELECT * FROM content_ideas WHERE created_at >= datetime('now', ?) ORDER BY created_at DESC",
                (f"-{days} days",))


def is_repeat(topic: str, hook: str, recent: list[dict]) -> bool:
    """True when this topic/hook substantially repeats something covered recently."""
    f = TitleFeatures(topic or "")
    for r in recent:
        if topic and r.get("topic") and same_event(f, TitleFeatures(r["topic"])):
            return True
        if hook and r.get("hook") and SequenceMatcher(None, hook.lower(), r["hook"].lower()).ratio() > 0.8:
            return True
    return False


def recent_angles_text(recent: list[dict], limit: int = 25) -> str:
    lines = [f"- {r['date']}: {r.get('topic') or ''} — {r.get('content_angle') or r.get('hook') or ''}" for r in recent[:limit]]
    return "\n".join(lines) or "(none yet)"


def save_ideas(conn: sqlite3.Connection, date: str, stories: list[dict]) -> None:
    conn.execute("DELETE FROM content_ideas WHERE date = ?", (date,))  # re-runs replace the day's ideas
    now = utcnow_iso()
    for st in stories:
        c = st.get("content") or {}
        conn.execute(
            "INSERT INTO content_ideas (date, topic, hook, content_angle, source_url, article_id, created_at) VALUES (?,?,?,?,?,?,?)",
            (date, st.get("event_title") or st.get("title"), c.get("hook"), c.get("content_angle"),
             st.get("primary_url"), st.get("article_id"), now),
        )
