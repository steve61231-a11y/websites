"""Stage 1 AI filter (cheap model) with a keyword heuristic in front of it.

The heuristic pre-ranks everything for free; only the top N candidates are sent to
the cheap model, in batches. If the model is unavailable, the heuristic decides.
"""
from __future__ import annotations

import json
import logging
import re
import sqlite3
from concurrent.futures import ThreadPoolExecutor

from app.analysis.kenya_lens import regional_relevance
from app.analysis.prompts import CLASSIFIER_SYSTEM, CLASSIFIER_USER
from app.config import get_settings
from app.llm.provider import LLMClient, LLMError
from app.utils.text import truncate
from app.utils.timeutil import from_db, utcnow

log = logging.getLogger(__name__)

AI_TERMS = {
    "ai": 8, "artificial intelligence": 10, "genai": 8, "generative": 7, "llm": 7, "model": 3, "agent": 8,
    "agents": 8, "agentic": 8, "chatgpt": 8, "openai": 8, "anthropic": 8, "claude": 7, "gemini": 7, "copilot": 7,
    "llama": 5, "mistral": 5, "nvidia": 4, "automation": 7, "automate": 7, "machine learning": 6, "gpt": 7,
    "chatbot": 6, "voice": 3, "multimodal": 5, "reasoning": 4, "deepfake": 6,
}
BUSINESS_TERMS = {
    "launch": 5, "launches": 5, "released": 4, "releases": 4, "introduces": 5, "announces": 4, "unveils": 5,
    "enterprise": 6, "business": 5, "smes": 7, "sme": 7, "small business": 8, "customers": 3, "pricing": 6,
    "price": 3, "cheaper": 5, "free": 3, "acquire": 6, "acquisition": 6, "acquires": 6, "funding": 5,
    "raises": 5, "invest": 4, "regulation": 6, "law": 3, "policy": 4, "ban": 4, "security": 4, "fraud": 5,
    "marketing": 6, "advertising": 6, "ads": 4, "sales": 6, "crm": 6, "customer service": 7, "support": 3,
    "productivity": 6, "workflow": 6, "fintech": 6, "bank": 4, "payments": 5, "mobile money": 7, "whatsapp": 7,
    "integration": 5, "api": 4, "partnership": 3, "rollout": 4, "available": 3,
}
NEGATIVE_TERMS = {
    "deal": -12, "deals": -15, "discount": -15, "% off": -15, "sale": -8, "review": -6, "hands-on": -6,
    "podcast": -12, "opinion": -8, "how to watch": -20, "best ": -8, "vs.": -3, "rumor": -6, "leak": -5,
    "stock": -4, "shares": -4, "earnings call": -4, "celebrity": -10, "game": -6, "gaming": -8, "movie": -8,
    "quiz": -15, "horoscope": -20, "weekly roundup": -8, "newsletter": -8, "webinar": -10, "sponsored": -20,
}


def _score_terms(text: str, terms: dict[str, int]) -> int:
    total = 0
    for term, w in terms.items():
        if re.search(r"(?<![a-z])" + re.escape(term) + r"(?![a-z])", text):
            total += w
    return total


def heuristic_score(a: dict) -> float:
    """0-100ish relevance guess from headline/description keywords, source priority and recency."""
    text = f"{a.get('title', '')} {a.get('description', '')}".lower()
    ai = min(30, _score_terms(text, AI_TERMS))
    biz = min(25, _score_terms(text, BUSINESS_TERMS))
    neg = _score_terms(text, NEGATIVE_TERMS)
    kenya, africa = regional_relevance(text)
    regional = max(kenya * 0.25, africa * 0.15)
    # Kenya/Africa business news counts even without AI keywords.
    if a.get("category") in ("kenya", "africa") and biz:
        ai = max(ai, 10)
    priority = (a.get("source_priority") or 5) * 2
    cluster_bonus = min(10, ((a.get("cluster_size") or 1) - 1) * 4)  # reported by several outlets
    pub = from_db(a.get("published_at")) or from_db(a.get("discovered_at"))
    recency = 0
    if pub:
        hours = (utcnow() - pub).total_seconds() / 3600
        recency = 8 if hours < 12 else 4 if hours < 24 else 0
    official = 6 if a.get("official") else 0
    score = ai + biz + neg + regional + priority + cluster_bonus + recency + official
    if ai == 0 and a.get("category") not in ("kenya", "africa", "business"):
        score -= 15
    return max(0.0, min(100.0, float(score)))


def combined_score(r: dict, a: dict) -> float:
    """Internal ranking score from the filter output."""
    rel = float(r.get("relevance_score", 0) or 0)
    biz = float(r.get("business_relevance", 0) or 0)
    nov = float(r.get("novelty", 0) or 0)
    ken = float(r.get("kenya_relevance", 0) or 0)
    score = 0.35 * rel + 0.30 * biz + 0.15 * nov + 0.20 * ken
    score += (a.get("source_priority") or 5) * 0.8 + min(6, ((a.get("cluster_size") or 1) - 1) * 2)
    return round(score, 2)


def _heuristic_result(a: dict, reason: str = "heuristic (AI filter unavailable)") -> dict:
    h = heuristic_score(a)
    kenya, _ = regional_relevance(f"{a.get('title', '')} {a.get('description', '')}")
    return {"keep": h >= 40, "relevance_score": h, "business_relevance": h, "novelty": 50,
            "kenya_relevance": kenya, "confidence": 30, "reason": reason, "heuristic": True}


def _format_items(batch: list[dict]) -> str:
    lines = []
    for a in batch:
        also = a.get("cluster_size", 1) - 1
        lines.append(json.dumps({
            "id": a["id"], "title": a["title"], "description": truncate(a.get("description") or "", 300),
            "source": a["source"], "category": a.get("category"), "published": (a.get("published_at") or "")[:10],
            "also_reported_by": also,
        }, ensure_ascii=False))
    return "\n".join(lines)


def classify(
    conn: sqlite3.Connection, candidates: list[dict], llm: LLMClient | None, stats: dict, errors: list[str],
) -> list[dict]:
    """Annotates candidates with filter results; returns the KEPT ones, best first."""
    s = get_settings()
    for a in candidates:
        a["heuristic"] = heuristic_score(a)
    manual = [a for a in candidates if a.get("category") == "manual"]
    pool = sorted([a for a in candidates if a.get("category") != "manual"], key=lambda x: -x["heuristic"])
    to_classify = pool[: s.max_candidates_classified]
    # Everything beyond the cap is rejected without spending tokens.
    for a in pool[s.max_candidates_classified:]:
        a["filter"] = {"keep": False, "reason": "below heuristic cutoff", "relevance_score": a["heuristic"]}

    # Reuse stored filter results (e.g. a dry run earlier today) — no double spend.
    fresh = []
    for a in to_classify:
        if a.get("filter_json"):
            try:
                a["filter"] = json.loads(a["filter_json"])
                continue
            except json.JSONDecodeError:
                pass
        fresh.append(a)

    if fresh and llm is not None:
        size = max(1, s.classifier_batch_size)
        batches = [fresh[i:i + size] for i in range(0, len(fresh), size)]

        def run(batch: list[dict]):
            try:
                data = llm.json(role="cheap", system=CLASSIFIER_SYSTEM,
                                user=CLASSIFIER_USER.format(items=_format_items(batch)),
                                max_tokens=s.max_output_tokens_classifier, task="classify")
                results = data.get("results", data) if isinstance(data, dict) else data
                return {int(r["id"]): r for r in results if isinstance(r, dict) and str(r.get("id", "")).isdigit()}, None
            except (LLMError, ValueError, TypeError, KeyError) as exc:
                return {}, exc

        with ThreadPoolExecutor(max_workers=max(1, s.llm_max_concurrency)) as pool_ex:
            outcomes = list(pool_ex.map(run, batches))
        for batch, (results, exc) in zip(batches, outcomes):
            if exc:
                errors.append(f"classifier: batch of {len(batch)} failed ({exc}); used heuristic")
                stats["degraded_classifier"] = True
            for a in batch:
                r = results.get(a["id"])
                a["filter"] = r if r else _heuristic_result(a)
    else:
        for a in fresh:
            a["filter"] = _heuristic_result(a)
        if fresh:
            stats["degraded_classifier"] = True

    for a in manual:
        a["filter"] = {"keep": True, "relevance_score": 100, "business_relevance": 100, "novelty": 80,
                       "kenya_relevance": 50, "confidence": 100, "reason": "manually added by owner"}

    kept = []
    for a in to_classify + manual:
        f = a["filter"]
        a["filter_score"] = combined_score(f, a) + (100 if a.get("category") == "manual" else 0)
        conn.execute("UPDATE articles SET filter_json=?, filter_score=? WHERE id=?",
                     (json.dumps(f, ensure_ascii=False), a["filter_score"], a["id"]))
        if f.get("keep") and float(f.get("relevance_score", 0) or 0) >= 40:
            kept.append(a)
    conn.commit()
    stats["articles_classified"] = len(to_classify) + len(manual)
    kept.sort(key=lambda x: -x["filter_score"])
    log.info("filter: %d candidates → %d classified → %d kept", len(candidates), len(to_classify), len(kept))
    return kept
