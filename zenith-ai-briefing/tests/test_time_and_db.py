from datetime import datetime, timezone

from app.config import get_settings
from app.database import get_conn, init_db, insert_article, prune, row, rows, sync_watchlist, active_watchlist
from app.utils.timeutil import (cron_for_local_time, date_label, from_db, local_date, parse_date, to_db)


def test_cron_conversion_nairobi():
    assert cron_for_local_time("06:30", "Africa/Nairobi") == "30 3 * * *"
    assert cron_for_local_time("02:00", "Africa/Nairobi") == "0 23 * * *"


def test_date_label_and_local_date():
    assert date_label("2026-09-24") == "Thursday, September 24"
    assert len(local_date("Africa/Nairobi")) == 10


def test_parse_date_variants():
    assert parse_date("Tue, 22 Sep 2026 08:00:00 GMT") == datetime(2026, 9, 22, 8, tzinfo=timezone.utc)
    assert parse_date("2026-09-22T11:00:00+03:00") == datetime(2026, 9, 22, 8, tzinfo=timezone.utc)
    assert parse_date(1790000000) is not None
    assert parse_date("not a date") is None
    assert parse_date("2099-01-01") is None  # future dates from broken feeds ignored
    assert parse_date(None) is None


def test_db_roundtrip_format():
    dt = datetime(2026, 9, 22, 8, 0, tzinfo=timezone.utc)
    assert to_db(dt) == "2026-09-22 08:00:00"
    assert from_db("2026-09-22 08:00:00") == dt


def test_init_is_idempotent_and_duplicates_rejected():
    init_db()
    init_db()
    with get_conn() as conn:
        a = dict(source="S", title="T", url="https://x.com/a", canonical_url="https://x.com/a")
        assert insert_article(conn, a)
        assert insert_article(conn, a) is None
        assert len(rows(conn, "SELECT * FROM articles")) == 1


def test_watchlist_sync_keeps_dashboard_topics():
    with get_conn() as conn:
        sync_watchlist(conn, get_settings().watchlist)
        conn.execute("INSERT INTO watchlist (topic, keywords, origin) VALUES ('AI in SACCOs', '[\"sacco\"]', 'dashboard')")
        sync_watchlist(conn, get_settings().watchlist)
        topics = [w["topic"] for w in active_watchlist(conn)]
    assert "AI in SACCOs" in topics and "Safaricom AI" in topics


def test_prune_keeps_featured():
    with get_conn() as conn:
        insert_article(conn, dict(source="S", title="old", url="https://x.com/o", canonical_url="https://x.com/o",
                                  discovered_at="2020-01-01 00:00:00"))
        insert_article(conn, dict(source="S", title="feat", url="https://x.com/f", canonical_url="https://x.com/f",
                                  discovered_at="2020-01-01 00:00:00"))
        conn.execute("UPDATE articles SET featured_on='2020-01-01' WHERE title='feat'")
        prune(conn, 45)
        assert [r["title"] for r in rows(conn, "SELECT title FROM articles")] == ["feat"]
