"""Final daily ranking. Scores are internal only — never shown to the audience."""
from __future__ import annotations

from app.analysis.analyst import business_impact
from app.analysis.content_strategy import is_repeat
from app.analysis.deduplicator import dedupe_events
from app.config import get_settings

DEFAULT_WEIGHTS = {"significance": 1.5, "business_impact": 2.0, "novelty": 1.0, "practical_usefulness": 1.5,
                   "kenya_relevance": 1.2, "africa_relevance": 0.6, "content_potential": 1.2, "credibility": 1.0}


def story_score(st: dict, weights: dict | None = None) -> float:
    w = {**DEFAULT_WEIGHTS, **(weights or get_settings().ranking_weights)}
    a = st["analysis"]
    sc = a.get("scores", {})
    comps = {
        "significance": sc.get("significance", 0), "business_impact": business_impact(sc),
        "novelty": sc.get("novelty", 0), "practical_usefulness": sc.get("practical_usefulness", 0),
        "kenya_relevance": sc.get("kenya_relevance", 0), "africa_relevance": sc.get("africa_relevance", 0),
        "content_potential": sc.get("content_potential", 0), "credibility": sc.get("credibility", 0),
    }
    total_w = sum(w.get(k, 0) for k in comps) or 1
    score = sum(comps[k] * w.get(k, 0) for k in comps) / total_w
    score += 0.15 * float(st.get("filter_score") or 0)       # first-pass signal
    score += min(4, (st.get("cluster_size", 1) - 1) * 1.5)    # widely reported
    gate_fails = sum(1 for v in a.get("quality_gate", {}).values() if not v)
    score -= 4 * gate_fails
    if st.get("repeat"):
        score *= 0.6
    if st.get("category") == "manual":
        score += 25  # the owner picked it
    return round(score, 2)


def is_rejected(st: dict) -> bool:
    a = st["analysis"]
    if a.get("degraded"):
        return False
    gate_fails = sum(1 for v in a.get("quality_gate", {}).values() if not v)
    return bool(a.get("reject")) or gate_fails >= 3


def _regional(st: dict) -> bool:
    a = st["analysis"]
    sc = a.get("scores", {})
    return (st.get("category") in ("kenya", "africa") or a.get("kenya_lens", {}).get("relevance") == "high"
            or sc.get("kenya_relevance", 0) >= 70 or sc.get("africa_relevance", 0) >= 70)


def _regional_strength(st: dict) -> float:
    sc = st["analysis"].get("scores", {})
    local = 25 if st.get("category") in ("kenya", "africa") else 0
    return sc.get("kenya_relevance", 0) + 0.5 * sc.get("africa_relevance", 0) + local + 0.3 * st["final_score"]


def select(stories: list[dict], recent_ideas: list[dict], max_final: int) -> dict:
    """Returns {'top': [...], 'kenya_africa': story|None, 'tool': story|None, 'rejected': [...], 'ranked': [...]}"""
    for st in stories:
        a = st["analysis"]
        st["repeat"] = is_repeat(a.get("event_title") or st["title"], a.get("content", {}).get("hook", ""), recent_ideas)
        st["final_score"] = story_score(st)
    rejected = [st for st in stories if is_rejected(st)]
    ranked = sorted([st for st in stories if not is_rejected(st)], key=lambda x: -x["final_score"])
    for st in ranked:
        st["event_title"] = st["analysis"].get("event_title") or st["title"]
    ranked, dupes = dedupe_events(ranked)
    rejected += dupes

    top = ranked[:max_final]
    headline_ids = {st["id"] for st in top[:3]}

    regional = [st for st in ranked if st["id"] not in headline_ids and _regional(st)]
    kenya_africa = max(regional, key=_regional_strength) if regional else None
    if kenya_africa and kenya_africa in top:
        top.remove(kenya_africa)
        extra = next((st for st in ranked if st not in top and st is not kenya_africa), None)
        if extra:
            top.append(extra)

    used = {st["id"] for st in top[:3]} | ({kenya_africa["id"]} if kenya_africa else set())
    tool = next((st for st in ranked if st["id"] not in used and st["analysis"].get("tool")), None) \
        or next((st for st in ranked if st["analysis"].get("tool")), None)
    return {"top": top, "kenya_africa": kenya_africa, "tool": tool, "rejected": rejected, "ranked": ranked}
