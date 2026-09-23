import pytest

from app.analysis.deduplicator import cluster, dedupe_events, matches_any, normalize_title, same_event
from app.utils.urls import normalize_url


@pytest.mark.parametrize("a,b", [
    ("https://www.Example.com/story/?utm_source=x&utm_medium=y", "https://example.com/story"),
    ("http://example.com/story#comments", "https://example.com/story"),
    ("https://example.com/a?b=2&a=1&fbclid=zz", "https://example.com/a?a=1&b=2"),
    ("https://m.example.com/story/amp/", "https://example.com/story"),
    ("https://example.com//x//y/", "https://example.com/x/y"),
])
def test_url_normalization(a, b):
    assert normalize_url(a) == normalize_url(b)


def test_url_normalization_keeps_meaningful_params():
    assert normalize_url("https://youtube.com/watch?v=abc") != normalize_url("https://youtube.com/watch?v=def")
    assert normalize_url("") == ""


def test_title_normalization_strips_publisher():
    assert normalize_title("OpenAI launches GPT-6 with agent mode | TechCrunch") == "openai launches gpt-6 with agent mode"


@pytest.mark.parametrize("a,b,expected", [
    ("OpenAI launches GPT-6 with agent mode", "OpenAI's new GPT-6 model can run agents for you", True),
    ("Safaricom launches AI assistant for M-Pesa users - TechCabal", "Safaricom unveils AI assistant for M-Pesa customers", True),
    ("Anthropic releases Claude Opus 5", "Anthropic's Claude Opus 5 is here: what businesses need to know", True),
    ("OpenAI launches GPT-6", "OpenAI hires new CFO from Google", False),
    ("Google releases Gemini 3", "Google releases Gemma 3", False),
    ("Kenya passes AI bill", "Nigeria passes AI bill", False),
    ("Microsoft adds Copilot to Teams", "Nvidia earnings beat expectations", False),
])
def test_same_event(a, b, expected):
    assert same_event(a, b) is expected


def test_cluster_prefers_official_then_original_source():
    arts = [
        dict(id=1, title="OpenAI's new GPT-6 model can run agents for you", source="The Verge", source_priority=8, published_at="2026-09-22 10:00:00"),
        dict(id=2, title="OpenAI launches GPT-6 with agent mode - Google News", source="GN", aggregator=1, source_priority=9, published_at="2026-09-22 08:00:00"),
        dict(id=3, title="Introducing GPT-6: agent mode for OpenAI customers", source="OpenAI", official=1, source_priority=10, published_at="2026-09-22 09:00:00"),
        dict(id=4, title="Safaricom unveils AI assistant for M-Pesa merchants", source="Techweez", source_priority=9),
        dict(id=5, title="Nvidia earnings beat expectations on data center demand", source="TC", source_priority=8),
    ]
    groups = cluster(arts)
    by_first = {g[0]["id"]: [a["id"] for a in g] for g in groups}
    assert len(groups) == 3
    assert by_first[3][0] == 3 and set(by_first[3]) == {1, 2, 3}  # official first
    assert by_first[3][-1] == 2  # aggregator last


def test_matches_recent_coverage_and_event_dedupe():
    assert matches_any("OpenAI launches GPT-6 agent mode", ["Nvidia results", "OpenAI GPT-6 launches with agent mode"])
    items = [dict(event_title="OpenAI releases GPT-6"), dict(event_title="OpenAI's GPT-6 released"), dict(event_title="Safaricom AI assistant")]
    kept, dropped = dedupe_events(items)
    assert len(kept) == 2 and len(dropped) == 1


def test_cluster_scales():
    arts = [dict(id=i, title=f"Company {i} announces product number {i} for market segment {i % 7}") for i in range(500)]
    assert len(cluster(arts)) > 400


def _st(i, title, cat="ai_news", kenya=10, africa=10, score=70, tool=None):
    scores = {k: score for k in ("significance", "revenue", "cost_reduction", "time_savings", "customer_experience",
              "employee_productivity", "automation_potential", "competitive_advantage", "new_opportunity", "novelty",
              "practical_usefulness", "content_potential", "credibility")}
    scores.update(kenya_relevance=kenya, africa_relevance=africa)
    return {"id": i, "title": title, "category": cat, "filter_score": 50, "cluster_size": 1,
            "analysis": {"event_title": title, "scores": scores, "quality_gate": {}, "tool": tool,
                         "kenya_lens": {"relevance": "high" if kenya > 70 else "low"}, "content": {}}}


def test_selection_slots():
    from app.analysis.ranking import select

    stories = [
        _st(1, "OpenAI releases GPT-6", score=95),
        _st(2, "Microsoft adds Copilot agents to Teams", score=90),
        _st(3, "Nvidia cuts inference prices", score=88),
        _st(4, "Google launches Gemini ads tools", score=85, kenya=60),
        _st(5, "Safaricom launches M-Pesa AI assistant", cat="kenya", kenya=95, score=70),
        _st(6, "Show HN: WhatsApp AI receptionist", cat="tools", score=60, tool={"name": "WA bot"}),
        _st(7, "OpenAI's GPT-6 is here", score=94),   # duplicate event
    ]
    stories[0]["analysis"]["reject"] = False
    sel = select(stories, [], 5)
    ids = [s["id"] for s in sel["top"]]
    assert ids[0] == 1 and 7 not in ids  # duplicate GPT-6 event dropped
    assert sel["kenya_africa"]["id"] == 5 and 5 not in ids
    assert sel["tool"]["id"] == 6
