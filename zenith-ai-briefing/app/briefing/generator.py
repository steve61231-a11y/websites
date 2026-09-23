"""Assemble the daily briefing from ranked, analysed stories.

The editor pass (one strong-model call) writes TODAY'S SIGNAL, the BUSINESS
OPPORTUNITY, WATCHLIST notes and TODAY'S VIDEO. Source links always come from the
database — the model refers to stories by id only, so URLs can't be fabricated.
"""
from __future__ import annotations

import json
import logging
import re
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.analysis.opportunity import OPPORTUNITY_FIELDS
from app.analysis.prompts import AUDIENCE, STYLE
from app.config import get_settings
from app.llm.provider import LLMClient, LLMError
from app.utils.text import as_list, truncate
from app.utils.timeutil import date_label

log = logging.getLogger(__name__)
TEMPLATES = Path(__file__).parent / "templates"

EDITOR_SYSTEM = AUDIENCE + STYLE + """
You are the EDITOR of the Zenith AI Business Briefing. You receive today's selected stories (already analysed)
and write the connective sections. Reference stories ONLY by their ids (e.g. "S1"). Never write URLs.
Respond with JSON only.
"""

EDITOR_USER = """Today is {label}. Selected stories:
{stories}

Watchlist topics: {watchlist}

Return JSON:
{{
 "signal": "ONE sentence: the most important overall theme today, specific not generic",
 "subject": "email subject tail, max 8 words, specific (e.g. 'OpenAI agents get cheaper; Safaricom bets on AI')",
 "opportunity": {{"title": "short name", "problem": "", "target_business": "", "workflow": "", "ai_capability": "",
                 "implementation_idea": "", "expected_benefit": "", "difficulty": "", "service_category": "",
                 "story_ids": ["S1"]}} or null if nothing practical emerges today,
 "watchlist": [{{"topic": "watchlist topic or a new thing worth monitoring", "note": "one sentence: what to watch for next", "story_ids": ["S2"]}}] (2-5 items),
 "video": {{"hook": "opening line, e.g. 'Happy Thursday guys. Three things happened in AI yesterday that Kenyan business owners should know about…'",
           "talking_points": ["3-5 punchy points, each tied to a story"], "ending": "closing line with a practical call to action",
           "story_ids": ["S1", "S2"]}}
}}"""


def story_view(st: dict) -> dict:
    """Flatten a ranked story (article + analysis + cluster) for templates."""
    a = st["analysis"]
    content = a.get("content", {})
    supporting, seen = [], {st["source"]}
    for s in st.get("supporting", []):
        if s["source"] not in seen and s.get("url"):
            seen.add(s["source"])
            supporting.append({"source": s["source"], "url": s["url"]})
    f = st.get("filter") or {}
    why_selected = f.get("reason") or ""
    if st.get("cluster_size", 1) > 1:
        why_selected += f" · reported by {st['cluster_size']} sources"
    return {
        "article_id": st["id"],
        "event_title": a.get("event_title") or st["title"],
        "title": st["title"],
        "category": st.get("category"),
        "published_at": st.get("published_at"),
        "what_happened": a.get("what_happened") or st.get("description") or st["title"],
        "what_changed": a.get("what_changed") or {},
        "why_it_matters": a.get("why_it_matters", ""),
        "who_should_care": a.get("who_should_care", []),
        "departments": a.get("departments", []),
        "use_cases": a.get("use_cases", []),
        "replaces_or_reduces": a.get("replaces_or_reduces", ""),
        "kenyan_example": content.get("kenyan_example") or a.get("kenya_lens", {}).get("example", ""),
        "kenya_lens": a.get("kenya_lens", {}),
        "africa_lens": a.get("africa_lens", ""),
        "limitations": a.get("limitations", ""),
        "opportunity": a.get("opportunity"),
        "content": content,
        "tool": a.get("tool"),
        "watchlist_matches": a.get("watchlist_matches", []),
        "primary_source": st["source"],
        "primary_url": st["url"],
        "supporting": supporting[:4],
        "why_selected": why_selected.strip(" ·"),
        "degraded": bool(a.get("degraded")),
        "final_score": st.get("final_score"),
    }


def _stories_for_editor(views: dict[str, dict]) -> str:
    out = []
    for sid, v in views.items():
        out.append(json.dumps({
            "id": sid, "event": v["event_title"], "source": v["primary_source"],
            "what_happened": truncate(v["what_happened"], 400), "why_it_matters": truncate(v["why_it_matters"], 400),
            "kenya": truncate(v["kenyan_example"], 300), "hook": v["content"].get("hook", ""),
            "opportunity": v["opportunity"], "watchlist": v["watchlist_matches"],
        }, ensure_ascii=False))
    return "\n".join(out)


def _sources_for(ids, views: dict[str, dict]) -> list[dict]:
    out, seen = [], set()
    for sid in as_list(ids):
        v = views.get(str(sid).strip())
        if v and v["primary_url"] not in seen:
            seen.add(v["primary_url"])
            out.append({"source": v["primary_source"], "url": v["primary_url"], "title": v["event_title"]})
    return out


def fallback_editorial(views: dict[str, dict], watchlist: list[dict], label: str) -> dict:
    items = list(views.items())
    top = [v for _, v in items[:3]]
    lead = top[0] if top else None
    opp_sid, opp = next(((sid, v["opportunity"]) for sid, v in items if v.get("opportunity")), (None, None))
    wl = []
    for sid, v in items:
        for topic in v["watchlist_matches"]:
            if topic not in [w["topic"] for w in wl]:
                wl.append({"topic": topic, "note": v["event_title"], "story_ids": [sid]})
    day = label.split(",")[0]
    return {
        "signal": (lead["content"].get("hook") or lead["event_title"]) if lead else "A quiet day — no major developments passed the quality bar.",
        "subject": lead["event_title"] if lead else "Quiet day",
        "opportunity": ({**opp, "title": opp.get("service_category") or "Opportunity", "story_ids": [opp_sid]} if opp else None),
        "watchlist": wl[:5],
        "video": {
            "hook": f"Happy {day} guys. {len(top) or 'A few'} things happened in AI that Kenyan business owners should know about.",
            "talking_points": [f"{v['event_title']}: {truncate(v['why_it_matters'] or v['what_happened'], 180)}" for v in top],
            "ending": "Which one of these would you actually use in your business? Tell me in the comments.",
            "story_ids": [sid for sid, _ in items[:3]],
        },
        "degraded": True,
    }


def build_briefing(date: str, selection: dict, llm: LLMClient | None, watchlist: list[dict],
                   stats: dict, errors: list[str]) -> dict:
    s = get_settings()
    label = date_label(date)
    top = [story_view(st) for st in selection["top"]]
    kenya = story_view(selection["kenya_africa"]) if selection.get("kenya_africa") else None
    tool_story = story_view(selection["tool"]) if selection.get("tool") else None

    views: dict[str, dict] = {}
    for v in top + ([kenya] if kenya else []) + ([tool_story] if tool_story else []):
        if v["primary_url"] not in [x["primary_url"] for x in views.values()]:
            views[f"S{len(views) + 1}"] = v

    editorial = None
    if llm is not None and views:
        try:
            editorial = llm.json(role="analysis", system=EDITOR_SYSTEM,
                                 user=EDITOR_USER.format(label=label, stories=_stories_for_editor(views),
                                                         watchlist=", ".join(w["topic"] for w in watchlist)),
                                 max_tokens=s.max_output_tokens_briefing, task="editor")
            if not isinstance(editorial, dict) or not editorial.get("signal"):
                raise ValueError("editor returned no signal")
            editorial["degraded"] = False
        except (LLMError, ValueError, TypeError) as exc:
            errors.append(f"editor: {exc}; used fallback editorial")
            editorial = None
    if editorial is None:
        editorial = fallback_editorial(views, watchlist, label)

    from app.analysis.analyst import _clean_str  # strip any URLs the model wrote

    video = editorial.get("video") or {}
    opp = editorial.get("opportunity") if isinstance(editorial.get("opportunity"), dict) else None
    briefing = {
        "date": date,
        "date_label": label,
        "subject": f"ZENITH AI BUSINESS BRIEFING — {label}",
        "subject_tail": _clean_str(editorial.get("subject"), 90),
        "signal": _clean_str(editorial.get("signal"), 400),
        "top_stories": top[:3],
        "more_stories": top[3:],
        "kenya_africa": kenya,
        "tool": tool_story,
        "opportunity": ({k: _clean_str(opp.get(k), 500) for k in ["title", *OPPORTUNITY_FIELDS]}
                        | {"sources": _sources_for(opp.get("story_ids"), views)}) if opp else None,
        "watchlist": [{"topic": _clean_str(w.get("topic"), 80), "note": _clean_str(w.get("note"), 300),
                       "sources": _sources_for(w.get("story_ids"), views)}
                      for w in as_list(editorial.get("watchlist")) if isinstance(w, dict) and w.get("topic")][:6],
        "video": {
            "hook": _clean_str(video.get("hook"), 400),
            "talking_points": [_clean_str(p, 300) for p in as_list(video.get("talking_points")) if p][:5],
            "ending": _clean_str(video.get("ending"), 300),
            "sources": _sources_for(video.get("story_ids"), views) or [
                {"source": v["primary_source"], "url": v["primary_url"], "title": v["event_title"]} for v in top[:3]],
        },
        "degraded": bool(editorial.get("degraded")) or any(v["degraded"] for v in views.values()),
        "degraded_sections": ([("editorial" if editorial.get("degraded") else None)] +
                              [f"story:{v['article_id']}" for v in views.values() if v["degraded"]]),
        "stats": {k: stats.get(k, 0) for k in ("sources_checked", "articles_discovered", "articles_analyzed")},
    }
    briefing["degraded_sections"] = [x for x in briefing["degraded_sections"] if x]
    briefing["headline"] = briefing["subject_tail"] or (top[0]["event_title"] if top else "Quiet day")
    return briefing


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------

_env = Environment(loader=FileSystemLoader(str(TEMPLATES)), autoescape=select_autoescape(["html"]),
                   trim_blocks=True, lstrip_blocks=True)


def render_html(briefing: dict) -> str:
    return _env.get_template("email.html").render(b=briefing)


_TEXT_HEADINGS = re.compile(
    r"\n(?=(WHAT HAPPENED|WHAT CHANGED|WHY IT MATTERS|WHO SHOULD CARE|KENYAN EXAMPLE|BUSINESS OPPORTUNITY|"
    r"CONTENT ANGLE|Read the original|HOOK:|ENDING:|SOURCES:)\b)")


def render_text(briefing: dict) -> str:
    text = _env.get_template("email.txt").render(b=briefing)
    text = _TEXT_HEADINGS.sub("\n\n", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip() + "\n"
