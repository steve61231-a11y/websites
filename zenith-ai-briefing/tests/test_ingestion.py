from app.config import SourceConfig, load_sources, parse_source
from app.database import get_conn, rows
from app.ingestion.base import FetchError, get_adapter
from app.ingestion.collector import collect
from tests.conftest import FakeHttp


def src(**kw):
    base = dict(name="Test", type="rss", url="https://news.example.com/feed", category="ai_news", priority=8)
    base.update(kw)
    return parse_source(base)


def test_rss_parsing_extracts_fields():
    http = FakeHttp({"https://news.example.com/feed": "rss.xml"})
    items = get_adapter("rss", http).fetch(src())
    titles = [i.title for i in items]
    assert "OpenAI launches GPT-6 with built-in agent mode" in titles
    assert all(i.url.startswith("https://") for i in items)  # item without link skipped
    gpt = items[0]
    assert gpt.published_at is not None
    assert "GPT-6" in gpt.description and "<b>" not in gpt.description


def test_atom_parsing():
    http = FakeHttp({"https://lab.example.com": "atom.xml"})
    items = get_adapter("atom", http).fetch(src(type="atom", url="https://lab.example.com/feed"))
    assert items[0].url == "https://lab.example.com/news/claude-opus-5"
    assert items[0].published_at is not None


def test_reddit_unwraps_to_original_article():
    http = FakeHttp({"https://www.reddit.com": "reddit.xml"})
    items = get_adapter("reddit", http).fetch(src(type="reddit", url="https://www.reddit.com/r/artificial/top/.rss", category="community"))
    assert len(items) == 1  # self-post dropped
    assert items[0].url == "https://blog.example.org/gemini-4"


def test_google_news_search_strips_publisher():
    http = FakeHttp({"https://news.google.com": "google_news.xml"})
    s = parse_source(dict(name="GN", type="search", category="kenya", queries=["AI Kenya"], region="KE"))
    assert s.aggregator
    items = get_adapter("search", http).fetch(s)
    assert items[0].title == "KCB rolls out AI credit scoring for SMEs"
    assert items[0].extra["publisher"] == "Business Daily"
    assert "gl=KE" in http.calls[0]


def test_webpage_link_discovery():
    http = FakeHttp({"https://lab.example.com/news": "listing.html"})
    s = src(type="webpage", url="https://lab.example.com/news", link_pattern="/news/[a-z0-9-]+$")
    items = get_adapter("webpage", http).fetch(s)
    urls = {i.url: i for i in items}
    assert "https://lab.example.com/news/mistral-large-3" in urls
    assert urls["https://lab.example.com/news/mistral-large-3"].title.startswith("Mistral Large 3")
    assert urls["https://lab.example.com/news/mistral-large-3"].published_at is not None
    assert not any("other-site" in u or "careers" in u for u in urls)


def test_sitemap_and_json():
    http = FakeHttp({"https://site.example.com/sitemap.xml": "sitemap.xml", "https://api.example.com": "api.json"})
    items = get_adapter("sitemap", http).fetch(src(type="sitemap", url="https://site.example.com/sitemap.xml", link_pattern="/news/", fetch_titles=0))
    assert [i.title for i in items] == ["Ai Voice Agents For Banks"]
    items = get_adapter("json", http).fetch(src(type="json", url="https://api.example.com/x", items_path="hits",
                                               fields={"title": "title", "url": "url", "published": "created_at"}))
    assert len(items) == 1 and items[0].published_at


def test_unknown_adapter():
    try:
        get_adapter("instagram", FakeHttp({}))
        raise AssertionError("should raise")
    except FetchError:
        pass


def test_sources_yaml_is_valid():
    sources = load_sources(include_disabled=True)
    assert len(sources) > 20
    assert len({s.name for s in sources}) == len(sources)
    assert {"ai_lab", "ai_news", "africa", "kenya", "business"} <= {s.category for s in sources}


def test_invalid_source_entries_are_skipped(tmp_path):
    p = tmp_path / "s.yaml"
    p.write_text("sources:\n  - name: ok\n    type: rss\n    url: https://x.com/f\n    category: ai_news\n"
                 "  - name: bad\n    type: carrier_pigeon\n    url: x\n    category: ai_news\n  - {name: missing}\n")
    assert [s.name for s in load_sources(p)] == ["ok"]


def test_collector_isolates_failures_and_dedupes():
    routes = {
        "https://good.example.com": "rss.xml",
        "https://mirror.example.com": "rss.xml",            # same items -> URL duplicates
        "https://broken.example.com": FetchError("HTTP 503", 503),
        "https://empty.example.com": "atom.xml",
    }
    sources = [
        src(name="Good", url="https://good.example.com/feed"),
        src(name="Mirror", url="https://mirror.example.com/feed", priority=3),
        src(name="Broken", url="https://broken.example.com/feed"),
        src(name="Crashy", type="json", url="https://good.example.com/feed"),  # rss body as json -> error
    ]
    stats, errors = {}, []
    with get_conn() as conn:
        collect(conn, sources, stats, errors, http_factory=lambda: FakeHttp(routes))
        arts = rows(conn, "SELECT * FROM articles")
        health = {r["name"]: r for r in rows(conn, "SELECT * FROM sources")}
    assert stats["sources_checked"] == 4 and stats["sources_failed"] == 2
    assert len(arts) == 2  # 2 fresh items; old one filtered; mirror duplicates ignored
    assert stats["url_duplicates"] == 2
    assert all("utm_" not in a["canonical_url"] for a in arts)
    assert health["Broken"]["last_http_status"] == 503 and health["Broken"]["consecutive_failures"] == 1
    assert health["Good"]["last_success_at"]
    assert len(errors) == 2


def test_empty_source_is_fine():
    stats, errors = {}, []
    s = src(name="Empty", url="https://empty.example.com/feed")
    with get_conn() as conn:
        collect(conn, [s], stats, errors, http_factory=lambda: FakeHttp({"https://empty.example.com": "empty.xml"}))
        health = rows(conn, "SELECT * FROM sources")[0]
    assert stats["sources_checked"] == 1 and stats.get("sources_failed", 0) == 0 and not errors
    assert health["last_item_count"] == 0 and health["last_success_at"]


def test_webpage_first_fetch_is_baseline():
    s = src(name="Lab", type="webpage", url="https://lab.example.com/news", link_pattern="/news/[a-z0-9-]+$")
    s2 = src(name="LabUndated", type="webpage", url="https://lab2.example.com/news", link_pattern="/news/")
    routes = {"https://lab.example.com/news": "listing.html", "https://lab2.example.com/news": "listing.html"}
    stats, errors = {}, []
    with get_conn() as conn:
        collect(conn, [s, s2], stats, errors, http_factory=lambda: FakeHttp(routes))
        baseline = rows(conn, "SELECT * FROM articles WHERE extraction_status='baseline'")
    # dated item is news; items without a date on first sight are baseline
    assert not [b for b in baseline if "mistral-large-3" in b["url"] and b["source"] == "Lab"]
