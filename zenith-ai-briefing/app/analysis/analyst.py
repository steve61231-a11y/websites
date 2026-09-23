"""Stage 2: deep business analysis of the best stories (strong model).

One call per story returns everything the briefing needs — what changed, who should
care, departments, Kenya/Africa lens, opportunity, content material, scores and a
quality gate. One call instead of five keeps cost and latency down.
If the model fails, ``degraded_analysis`` builds a minimal entry from metadata.
"""
from __future__ import annotations

import json
import logging
import re
import sqlite3
from concurrent.futures import ThreadPoolExecutor

from app.analysis.content_strategy import recent_angles_text
from app.analysis.kenya_lens import regional_relevance
from app.analysis.opportunity import OPPORTUNITY_FIELDS
from app.analysis.prompts import analyst_system
from app.analysis.watchlist import match_watchlist
from app.config import get_settings
from app.database import get_analysis, save_analysis
from app.llm.provider import LLMClient, LLMError
from app.utils.text import as_list, clean_html, truncate
from app.utils.timeutil import utcnow_iso

log = logging.getLogger(__name__)

DEPARTMENTS = ["Sales", "Marketing", "Operations", "Customer Service", "HR", "Finance", "Management", "IT", "Communications"]
SCORE_KEYS = ["significance", "revenue", "cost_reduction", "time_savings", "customer_experience",
              "employee_productivity", "automation_potential", "competitive_advantage", "new_opportunity",
              "novelty", "practical_usefulness", "kenya_relevance", "africa_relevance", "content_potential", "credibility"]
IMPACT_KEYS = ["revenue", "cost_reduction", "time_savings", "customer_experience", "employee_productivity",
               "automation_potential", "competitive_advantage", "new_opportunity"]
GATE_KEYS = ["learn_something_useful", "explainable_in_2_min", "concrete_takeaway", "credible_source",
             "verifiable", "business_implication", "interesting_without_ai_interest"]

SCHEMA = """{
 "event_title": "short neutral name of the underlying event, e.g. 'OpenAI releases GPT-6'",
 "story_type": "model_release|product_launch|tool|integration|pricing|funding|acquisition|regulation|security|deployment|research|kenya_africa|other",
 "is_tool": true/false (is this a specific tool/product a business could try soon?),
 "what_happened": "plain English, 1-2 sentences",
 "what_changed": {"before": "...", "now": "...", "easier": "...", "still_hard": "..."},
 "why_it_matters": "business implications, 2-3 sentences",
 "who_should_care": ["CEO", "Marketing", ...],
 "departments": ["Sales", "Marketing", "Operations", "Customer Service", "HR", "Finance", "Management", "IT", "Communications"] (only relevant ones),
 "use_cases": ["practical use case", "..."] (2-4),
 "replaces_or_reduces": "repetitive work, cost or time this could replace/reduce",
 "opportunity": {"problem": "", "target_business": "", "workflow": "", "ai_capability": "", "implementation_idea": "", "expected_benefit": "", "difficulty": "", "service_category": ""} or null if nothing real,
 "kenya_lens": {"relevance": "high|medium|low|none", "explanation": "...", "example": "realistic Kenyan business example"},
 "africa_lens": "1-2 sentences",
 "limitations": "what cannot realistically be done yet; caveats",
 "tool": {"name": "", "what_it_does": "", "who_needs_it": "", "practical_use": "", "limitations": ""} or null,
 "content": {"hook": "", "what_happened_points": ["", ""], "why_it_matters_points": ["", ""], "kenyan_example": "", "practical_takeaway": "", "content_angle": ""},
 "watchlist_matches": ["topics from the watchlist this relates to"],
 "scores": {"significance": 0-100, "revenue": 0-100, "cost_reduction": 0-100, "time_savings": 0-100, "customer_experience": 0-100, "employee_productivity": 0-100, "automation_potential": 0-100, "competitive_advantage": 0-100, "new_opportunity": 0-100, "novelty": 0-100, "practical_usefulness": 0-100, "kenya_relevance": 0-100, "africa_relevance": 0-100, "content_potential": 0-100, "credibility": 0-100},
 "quality_gate": {"learn_something_useful": true/false, "explainable_in_2_min": true/false, "concrete_takeaway": true/false, "credible_source": true/false, "verifiable": true/false, "business_implication": true/false, "interesting_without_ai_interest": true/false},
 "reject": true/false,
 "reject_reason": ""
}"""

USER_TEMPLATE = """Analyse this development for the briefing dated {date}.

PRIMARY SOURCE: {source} ({kind})
HEADLINE: {title}
PUBLISHED: {published}
ALSO REPORTED BY: {supporting}
FEED DESCRIPTION: {description}
WATCHLIST TOPICS: {watchlist}

RECENTLY COVERED ANGLES (don't repeat these; find what is new):
{recent}

ARTICLE TEXT {text_note}:
\"\"\"
{text}
\"\"\"

Return one JSON object with exactly these keys:
{schema}"""

_URL = re.compile(r"https?://\S+|www\.\S+")


def _clean_str(v, max_len: int = 1200) -> str:
    if v is None:
        return ""
    if isinstance(v, (dict, list)):
        v = json.dumps(v, ensure_ascii=False)
    # Sources are attached from the database only — strip any model-written URLs.
    return truncate(_URL.sub("", clean_html(str(v), max_len * 2)).strip(), max_len)


def _score(v) -> float:
    try:
        return max(0.0, min(100.0, float(v)))
    except (TypeError, ValueError):
        return 0.0


def normalize_analysis(data: dict) -> dict:
    """Coerce model output into a predictable shape. Missing fields become empty."""
    if not isinstance(data, dict):
        raise ValueError("analysis is not an object")
    out: dict = {}
    for k in ("event_title", "story_type", "what_happened", "why_it_matters", "replaces_or_reduces",
              "africa_lens", "limitations", "reject_reason"):
        out[k] = _clean_str(data.get(k), 200 if k == "event_title" else 1200)
    out["is_tool"] = bool(data.get("is_tool"))
    out["reject"] = bool(data.get("reject"))
    wc = data.get("what_changed") if isinstance(data.get("what_changed"), dict) else {}
    out["what_changed"] = {k: _clean_str(wc.get(k), 600) for k in ("before", "now", "easier", "still_hard")}
    out["who_should_care"] = [_clean_str(x, 60) for x in as_list(data.get("who_should_care")) if x][:8]
    deps = []
    for d in as_list(data.get("departments")):
        match = next((D for D in DEPARTMENTS if D.lower() == str(d).strip().lower()), None)
        if match and match not in deps:
            deps.append(match)
    out["departments"] = deps
    out["use_cases"] = [_clean_str(x, 300) for x in as_list(data.get("use_cases")) if x][:5]
    opp = data.get("opportunity")
    out["opportunity"] = {k: _clean_str(opp.get(k), 500) for k in OPPORTUNITY_FIELDS} if isinstance(opp, dict) and any(opp.values()) else None
    kl = data.get("kenya_lens") if isinstance(data.get("kenya_lens"), dict) else {"explanation": data.get("kenya_lens")}
    rel = str(kl.get("relevance") or "").lower()
    out["kenya_lens"] = {"relevance": rel if rel in ("high", "medium", "low", "none") else "low",
                         "explanation": _clean_str(kl.get("explanation"), 700), "example": _clean_str(kl.get("example"), 700)}
    tool = data.get("tool")
    out["tool"] = {k: _clean_str(tool.get(k), 400) for k in ("name", "what_it_does", "who_needs_it", "practical_use", "limitations")} \
        if isinstance(tool, dict) and tool.get("name") else None
    c = data.get("content") if isinstance(data.get("content"), dict) else {}
    out["content"] = {
        "hook": _clean_str(c.get("hook"), 300),
        "what_happened_points": [_clean_str(x, 300) for x in as_list(c.get("what_happened_points")) if x][:3],
        "why_it_matters_points": [_clean_str(x, 300) for x in as_list(c.get("why_it_matters_points")) if x][:3],
        "kenyan_example": _clean_str(c.get("kenyan_example"), 600),
        "practical_takeaway": _clean_str(c.get("practical_takeaway"), 400),
        "content_angle": _clean_str(c.get("content_angle"), 300),
    }
    out["watchlist_matches"] = [_clean_str(x, 80) for x in as_list(data.get("watchlist_matches")) if x][:6]
    sc = data.get("scores") if isinstance(data.get("scores"), dict) else {}
    out["scores"] = {k: _score(sc.get(k)) for k in SCORE_KEYS}
    qg = data.get("quality_gate") if isinstance(data.get("quality_gate"), dict) else {}
    out["quality_gate"] = {k: bool(qg.get(k, True)) for k in GATE_KEYS}
    if not out["what_happened"]:
        raise ValueError("analysis missing what_happened")
    return out


def business_impact(scores: dict) -> float:
    vals = [scores.get(k, 0) for k in IMPACT_KEYS]
    return round(sum(vals) / len(vals), 1) if vals else 0.0


def degraded_analysis(a: dict, watchlist: list[dict]) -> dict:
    """Metadata-only entry used when the analysis model is unavailable. Marked degraded."""
    text = f"{a.get('title', '')} {a.get('description', '')}"
    kenya, africa = regional_relevance(text)
    h = float(a.get("heuristic") or 50)
    f = a.get("filter") or {}
    desc = a.get("description") or ""
    return {
        "event_title": a["title"], "story_type": "other", "is_tool": a.get("category") == "tools",
        "what_happened": desc or a["title"],
        "what_changed": {"before": "", "now": "", "easier": "", "still_hard": ""},
        "why_it_matters": f.get("reason") or "",
        "who_should_care": [], "departments": [], "use_cases": [], "replaces_or_reduces": "",
        "opportunity": None,
        "kenya_lens": {"relevance": "high" if kenya >= 45 else "low", "explanation": "", "example": ""},
        "africa_lens": "", "limitations": "", "tool": None,
        "content": {"hook": a["title"], "what_happened_points": [truncate(desc, 250)] if desc else [],
                    "why_it_matters_points": [], "kenyan_example": "", "practical_takeaway": "", "content_angle": ""},
        "watchlist_matches": match_watchlist(text, watchlist),
        "scores": {**{k: h for k in SCORE_KEYS}, "kenya_relevance": float(kenya), "africa_relevance": float(africa),
                   "credibility": float((a.get("source_priority") or 5) * 10)},
        "quality_gate": {k: True for k in GATE_KEYS},
        "reject": False, "reject_reason": "", "degraded": True,
    }


def build_prompt(a: dict, supporting: list[dict], watchlist: list[dict], recent: list[dict], date: str) -> str:
    s = get_settings()
    text = a.get("full_text") or ""
    note = "(full text)" if text else "(NOT AVAILABLE — only headline/description; be cautious and lower credibility)"
    return USER_TEMPLATE.format(
        date=date, source=a["source"],
        kind="official/primary source" if a.get("official") else a.get("category"),
        title=a["title"], published=a.get("published_at") or "unknown",
        supporting=", ".join(sorted({x["source"] for x in supporting})) or "none",
        description=truncate(a.get("description") or "", 600),
        watchlist=", ".join(w["topic"] for w in watchlist) or "none",
        recent=recent_angles_text(recent), text_note=note,
        text=truncate(text, s.max_article_chars) if text else "(none)", schema=SCHEMA,
    )


def analyze_story(llm: LLMClient | None, a: dict, supporting: list[dict], watchlist: list[dict],
                  recent: list[dict], date: str) -> tuple[dict, str | None]:
    """Returns (analysis, error). Never raises."""
    if llm is None:
        return degraded_analysis(a, watchlist), "no LLM configured"
    try:
        data = llm.json(role="analysis", system=analyst_system(),
                        user=build_prompt(a, supporting, watchlist, recent, date),
                        max_tokens=get_settings().max_output_tokens_analysis, task=f"analyze:{a['id']}")
        result = normalize_analysis(data)
        # Keyword watchlist hits complement the model's judgement.
        text = f"{a['title']} {a.get('description') or ''}"
        for topic in match_watchlist(text, watchlist):
            if topic not in result["watchlist_matches"]:
                result["watchlist_matches"].append(topic)
        result["degraded"] = False
        return result, None
    except (LLMError, ValueError, TypeError, KeyError) as exc:
        return degraded_analysis(a, watchlist), f"analysis failed for {a['id']} ({exc}); degraded"


def analyze_many(conn: sqlite3.Connection, stories: list[dict], llm: LLMClient | None, watchlist: list[dict],
                 recent: list[dict], date: str, stats: dict, errors: list[str]) -> None:
    """Attach ``analysis`` to each story dict (primary article + supporting). Reuses stored non-degraded analyses."""
    s = get_settings()
    model = s.analysis_model if llm else "none"
    todo = []
    for st in stories:
        existing = get_analysis(conn, st["id"])
        if existing and not existing.get("degraded") and existing.get("analysis"):
            st["analysis"] = existing["analysis"]
            st["analysis"]["degraded"] = False
        else:
            todo.append(st)

    def work(st):
        return analyze_story(llm, st, st.get("supporting", []), watchlist, recent, date)

    with ThreadPoolExecutor(max_workers=max(1, s.llm_max_concurrency)) as pool:
        results = list(pool.map(work, todo))

    for st, (analysis, err) in zip(todo, results):
        st["analysis"] = analysis
        if err and llm is not None:
            errors.append(err)
        if analysis.get("degraded"):
            stats["degraded_analysis"] = stats.get("degraded_analysis", 0) + 1
        sc = analysis["scores"]
        save_analysis(conn, st["id"], {
            "event_title": analysis["event_title"],
            "relevance_score": (st.get("filter") or {}).get("relevance_score"),
            "business_impact_score": business_impact(sc),
            "kenya_relevance_score": sc.get("kenya_relevance"), "africa_relevance_score": sc.get("africa_relevance"),
            "novelty_score": sc.get("novelty"), "credibility_score": sc.get("credibility"),
            "summary": analysis["what_happened"], "business_implications": analysis["why_it_matters"],
            "use_cases": analysis["use_cases"], "opportunity": analysis["opportunity"],
            "content_angle": analysis["content"].get("content_angle"), "departments_affected": analysis["departments"],
            "analysis_json": json.dumps(analysis, ensure_ascii=False),
            "analysis_model": "degraded" if analysis.get("degraded") else model,
            "degraded": int(bool(analysis.get("degraded"))), "analyzed_at": utcnow_iso(),
        })
    stats["articles_analyzed"] = len(stories)
    conn.commit()
