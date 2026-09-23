from app.database import get_conn, insert_article, get_article
from app.extraction.article_extractor import extract_article, extract_from_html, extract_many
from app.ingestion.base import FetchError
from tests.conftest import FakeHttp, load_fixture


def test_extracts_main_text_and_drops_boilerplate():
    r = extract_from_html(load_fixture("article.html"), "https://news.example.com/2026/09/openai-gpt-6?utm_source=x")
    assert r.ok
    assert "reconcile invoices" in r.text
    assert "cookies" not in r.text.lower()
    assert "ADVERTISEMENT" not in r.text
    assert "All rights reserved" not in r.text
    assert r.title == "OpenAI launches GPT-6 with built-in agent mode"
    assert r.canonical_url == "https://news.example.com/2026/09/openai-gpt-6"
    assert r.published_at.startswith("2026-09-22")


def test_extraction_failure_does_not_raise():
    http = FakeHttp({"https://paywall.example.com": FetchError("HTTP 403", 403)})
    r = extract_article("https://paywall.example.com/story", http)
    assert not r.ok and "403" in r.error
    short = extract_from_html("<html><body><p>Subscribe to read.</p></body></html>", "https://x.com/a")
    assert not short.ok


def test_extract_many_updates_db_and_continues_on_failure():
    routes = {"https://news.example.com": "article.html", "https://bad.example.com": FetchError("timeout")}
    with get_conn() as conn:
        ids = []
        for url in ("https://news.example.com/a", "https://bad.example.com/b"):
            ids.append(insert_article(conn, dict(source="S", title="t " + url, url=url, canonical_url=url)))
        arts = [get_article(conn, i) for i in ids]
        stats, errors = {}, []
        extract_many(conn, arts, stats, errors, http_factory=lambda: FakeHttp(routes))
        assert stats["articles_extracted"] == 1 and len(errors) == 1
        assert get_article(conn, ids[0])["extraction_status"] == "ok"
        assert get_article(conn, ids[1])["extraction_status"] == "failed"
        assert get_article(conn, ids[1])["title"]  # metadata preserved
