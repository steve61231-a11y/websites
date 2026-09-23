import json
import re
import smtplib

import pytest

from app.config import parse_source, reload_settings
from app.database import get_conn, row, rows
from app.ingestion.base import FetchError
from app.llm.provider import LLMClient
from app.pipeline import ingest_url, run_pipeline
from tests.conftest import FakeHttp
from tests.fakes import FakeProvider

ROUTES = {
    "https://news.example.com/feed": "rss.xml",
    "https://lab.example.com/feed": "atom.xml",
    "https://news.google.com": "google_news.xml",
    "https://www.reddit.com": "reddit.xml",
    "https://api.example.com": "api.json",
    "https://broken.example.com": FetchError("HTTP 500", 500),
    "https://news.example.com/2026": "article.html",   # article pages
    "https://lab.example.com/news": "article.html",
}
FIXTURE_URLS = {
    "https://news.example.com/2026/09/openai-gpt-6?utm_source=rss&utm_medium=feed",
    "https://news.example.com/2026/09/safaricom-ai-assistant",
    "https://lab.example.com/news/claude-opus-5",
    "https://news.google.com/rss/articles/CBMiabc?oc=5",
    "https://blog.example.org/gemini-4",
    "https://github.com/example/wa-receptionist",
}


def sources():
    return [parse_source(d) for d in [
        dict(name="Example News", type="rss", url="https://news.example.com/feed", category="ai_news", priority=8),
        dict(name="Lab", type="atom", url="https://lab.example.com/feed", category="ai_lab", priority=10),
        dict(name="GN Kenya", type="search", category="kenya", queries=["AI Kenya"], region="KE", priority=7),
        dict(name="r/artificial", type="reddit", url="https://www.reddit.com/r/artificial/top/.rss", category="community", priority=4),
        dict(name="HN", type="json", url="https://api.example.com/hn", category="tools", items_path="hits",
             fields={"title": "title", "url": "url", "published": "created_at"}, priority=5),
        dict(name="Broken", type="rss", url="https://broken.example.com/feed", category="ai_news"),
    ]]


def fake_llm(**kw):
    return LLMClient(FakeProvider(**kw), sleep=lambda _: None)


class FakeSMTP:
    sent: list = []
    fail = False

    def __init__(self, host, port, timeout=None, **kw):
        if FakeSMTP.fail:
            raise smtplib.SMTPServerDisconnected("down")

    def ehlo(self): pass
    def starttls(self, context=None): pass
    def login(self, u, p): pass
    def send_message(self, msg): FakeSMTP.sent.append(msg)
    def quit(self): pass


@pytest.fixture
def email_env(monkeypatch):
    for k, v in {"SMTP_HOST": "smtp.example.com", "SMTP_PORT": "587", "SMTP_USERNAME": "u", "SMTP_PASSWORD": "p",
                 "EMAIL_FROM": "bot@example.com", "EMAIL_TO": "owner@example.com"}.items():
        monkeypatch.setenv(k, v)
    reload_settings()
    FakeSMTP.sent, FakeSMTP.fail = [], False
    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)
    monkeypatch.setattr("app.delivery.email_service.time.sleep", lambda _: None)


def run(mode="dry-run", llm="fake", **kw):
    client = fake_llm(**kw) if llm == "fake" else llm
    return run_pipeline(mode=mode, sources=sources(), http_factory=lambda: FakeHttp(ROUTES), llm=client)


def test_dry_run_produces_valid_briefing_with_real_links():
    r = run("dry-run")
    assert r.status == "partial"  # broken source recorded as an error, run continues
    assert any("Broken" in e for e in r.errors)
    b = r.briefing
    assert b["signal"] and b["top_stories"]
    assert b["video"]["hook"] and b["video"]["sources"]
    assert not r.email_sent
    html = r.html_path.read_text()
    assert "READ SOURCE" in html and "ZENITH INTELLIGENCE" in html and "TODAY'S SIGNAL" in html
    # Every link in the email must come from a fetched source — never invented.
    links = set(re.findall(r'href="([^"]+)"', html))
    assert links, "email has no links"
    assert all(l.replace("&amp;", "&") in FIXTURE_URLS for l in links), links - FIXTURE_URLS
    assert "fabricated.example.com" not in html
    # Official source chosen as primary for its story; Kenya slot filled
    assert b["kenya_africa"] is not None
    with get_conn() as conn:
        assert rows(conn, "SELECT * FROM articles WHERE processed=1") == []  # dry run leaves state untouched
        assert row(conn, "SELECT is_dry_run FROM daily_briefings")["is_dry_run"] == 1
        run_row = row(conn, "SELECT * FROM system_runs ORDER BY id DESC")
        assert run_row["status"] == "partial" and run_row["sources_checked"] == 6 and run_row["sources_failed"] == 1


def test_duplicate_story_merged_across_sources():
    r = run("dry-run")
    with get_conn() as conn:
        groups = rows(conn, "SELECT story_id, COUNT(*) n FROM articles GROUP BY story_id HAVING n > 1")
    # KCB/Safaricom/GPT stories each appear once in the briefing
    titles = [s["event_title"] for s in r.briefing["top_stories"] + r.briefing["more_stories"]]
    assert len(titles) == len(set(titles))


def test_full_run_sends_email_once_and_marks_state(email_env):
    r = run("run")
    assert r.email_sent and r.status in ("success", "partial")
    assert len(FakeSMTP.sent) == 1
    msg = FakeSMTP.sent[0]
    assert msg["Subject"].startswith("ZENITH AI BUSINESS BRIEFING")
    kinds = [p.get_content_type() for p in msg.walk()]
    assert "text/html" in kinds and "text/plain" in kinds
    with get_conn() as conn:
        assert row(conn, "SELECT emailed_at FROM daily_briefings")["emailed_at"]
        assert rows(conn, "SELECT * FROM articles WHERE processed=0 AND extraction_status!='baseline'") == []
        assert rows(conn, "SELECT * FROM content_ideas")
        assert rows(conn, "SELECT * FROM articles WHERE featured_on IS NOT NULL")
    # Backup schedule fires again the same day: no duplicate email.
    r2 = run("run")
    assert r2.status == "skipped" and len(FakeSMTP.sent) == 1
    # And a later dry run does not un-mark the delivered briefing
    run("dry-run")
    with get_conn() as conn:
        assert row(conn, "SELECT emailed_at, is_dry_run FROM daily_briefings")["is_dry_run"] == 0


def test_email_failure_then_backup_run_resends(email_env):
    FakeSMTP.fail = True
    r = run("run")
    assert not r.email_sent and r.status == "failed"
    assert any(e.startswith("email:") for e in r.errors)
    FakeSMTP.fail = False
    r2 = run("run")
    assert r2.email_sent and len(FakeSMTP.sent) == 1


def test_runs_without_any_llm_degraded():
    r = run("dry-run", llm=None)
    assert r.briefing is not None and r.briefing["degraded"]
    assert r.html_path.exists()
    assert "without full AI analysis" in r.html_path.read_text()


def test_analysis_model_outage_degrades_gracefully():
    r = run("dry-run", fail_tasks={"analyze", "editor"})
    assert r.briefing["top_stories"], "should still have stories from metadata"
    assert r.briefing["degraded"]
    assert any("analysis failed" in e for e in r.errors) and any(e.startswith("editor") for e in r.errors)


def test_classifier_outage_uses_heuristic():
    r = run("dry-run", fail_tasks={"classify"})
    assert r.stats.get("degraded_classifier")
    assert r.briefing["top_stories"]


def test_empty_sources_still_produce_briefing():
    r = run_pipeline(mode="dry-run", sources=[], http_factory=lambda: FakeHttp({}), llm=fake_llm())
    assert r.briefing is not None and r.briefing["top_stories"] == []
    assert "No development cleared the quality bar" in r.html_path.read_text()


def test_manual_url_ingestion():
    view, report = ingest_url("https://news.example.com/2026/09/openai-gpt-6", llm=fake_llm(),
                              http=FakeHttp(ROUTES))
    assert view["primary_url"] == "https://news.example.com/2026/09/openai-gpt-6"
    assert "WHY IT MATTERS" in report and "HOOK" in report
    with get_conn() as conn:
        a = row(conn, "SELECT * FROM articles WHERE category='manual'")
        assert a and a["extraction_status"] == "ok" and a["processed"] == 0
