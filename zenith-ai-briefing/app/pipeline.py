"""The daily pipeline:

  discover → normalize → deduplicate → AI filter → extract → deep analysis
  (Kenya/Africa lens, opportunity, content) → rank → briefing → email

Every stage is failure-tolerant: a broken source, article, model call or email
never prevents the rest from running. Scheduling lives outside (GitHub Actions,
cron, Task Scheduler…) — this module only knows how to run once.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import timedelta
from pathlib import Path
from typing import Callable

from app.analysis.analyst import analyze_many, analyze_story, business_impact
from app.analysis.classifier import classify
from app.analysis.content_strategy import recent_ideas, save_ideas
from app.analysis.deduplicator import cluster, matches_any
from app.analysis.ranking import select
from app.briefing.generator import build_briefing, render_html, render_text, story_view
from app.config import get_settings, load_sources
from app.database import (active_watchlist, connect, finish_run, get_article, init_db, insert_article, prune, row,
                          rows, save_analysis, start_run, sync_watchlist, vacuum)
from app.delivery.email_service import EmailError, send_daily_briefing
from app.extraction.article_extractor import extract_article, extract_many
from app.ingestion.base import HttpClient
from app.ingestion.collector import collect
from app.llm.provider import LLMClient, get_llm
from app.utils.text import sha1
from app.utils.timeutil import local_date, to_db, utcnow, utcnow_iso
from app.utils.urls import domain, normalize_url

log = logging.getLogger(__name__)
_AUTO = object()


@dataclass
class RunReport:
    mode: str
    run_id: int | None = None
    status: str = "running"
    date: str = ""
    stats: dict = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)
    html_path: Path | None = None
    email_sent: bool = False
    briefing: dict | None = None
    llm_usage: dict = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        return self.status in ("success", "partial", "skipped")

    def summary(self) -> str:
        s = self.stats
        lines = [
            "RUN SUMMARY",
            f"Mode: {self.mode}   Date: {self.date}   Status: {self.status.upper()}",
            f"Sources checked: {s.get('sources_checked', 0)} ({s.get('sources_failed', 0)} failed)",
            f"Articles discovered: {s.get('articles_discovered', 0)} ({s.get('new_articles', 0)} new)",
            f"Duplicates removed: {s.get('duplicates_removed', 0) + s.get('url_duplicates', 0)}",
            f"Articles classified: {s.get('articles_classified', 0)}",
            f"Articles extracted: {s.get('articles_extracted', 0)}",
            f"Articles analyzed: {s.get('articles_analyzed', 0)}",
            f"Final stories: {s.get('final_stories', 0)}",
            f"Email sent: {'YES' if self.email_sent else 'NO'}",
        ]
        if self.llm_usage:
            u = self.llm_usage
            lines.append(f"LLM: {u.get('calls', 0)} calls, {u.get('cache_hits', 0)} cached, "
                         f"{u.get('input_tokens', 0)} in / {u.get('output_tokens', 0)} out tokens, "
                         f"{u.get('failures', 0)} failed")
        if s.get("degraded_classifier") or s.get("degraded_analysis"):
            lines.append("Degraded: " + ", ".join(x for x in (
                "classifier" if s.get("degraded_classifier") else "",
                f"{s.get('degraded_analysis')} analyses" if s.get("degraded_analysis") else "") if x))
        if self.html_path:
            lines.append(f"Briefing: {self.html_path}")
        lines.append(f"Errors: {len(self.errors)}")
        for e in self.errors[:15]:
            lines.append(f"  - {e[:200]}")
        if len(self.errors) > 15:
            lines.append(f"  … and {len(self.errors) - 15} more (see dashboard → Runs)")
        return "\n".join(lines)


def _resolve_llm(llm) -> LLMClient | None:
    return get_llm() if llm is _AUTO else llm


def _candidates(conn, lookback_hours: int) -> list[dict]:
    cutoff = to_db(utcnow() - timedelta(hours=lookback_hours))
    return rows(conn, """
        SELECT * FROM articles
        WHERE processed = 0 AND extraction_status != 'baseline'
          AND (category = 'manual' OR (discovered_at >= ? AND (published_at IS NULL OR published_at >= ?)))
        ORDER BY source_priority DESC, published_at DESC""", (cutoff, cutoff))


def _recently_featured_titles(conn, days: int) -> list[str]:
    return [r["title"] for r in rows(conn, """
        SELECT COALESCE(an.event_title, a.title) AS title FROM articles a
        LEFT JOIN article_analysis an ON an.article_id = a.id
        WHERE a.featured_on IS NOT NULL AND a.featured_on >= date('now', ?)""", (f"-{days} days",))]


def _group_stories(conn, candidates: list[dict], stats: dict) -> list[dict]:
    """Cluster candidates into stories; returns one representative per story."""
    reps = []
    for group in cluster(candidates):
        rep = group[0]
        rep["cluster_size"] = len(group)
        rep["supporting"] = group[1:]
        story_id = rep.get("story_id")
        if not story_id:
            story_id = conn.execute("INSERT INTO stories (title, primary_article_id, article_count, created_at) VALUES (?,?,?,?)",
                                    (rep["title"], rep["id"], len(group), utcnow_iso())).lastrowid
        conn.executemany("UPDATE articles SET story_id=? WHERE id=?", [(story_id, a["id"]) for a in group])
        rep["story_id"] = story_id
        reps.append(rep)
    stats["duplicates_removed"] = stats.get("duplicates_removed", 0) + (len(candidates) - len(reps))
    conn.commit()
    return reps


def _save_outputs(briefing: dict, html: str, text: str, dry_run: bool) -> Path:
    out = get_settings().output_dir
    out.mkdir(parents=True, exist_ok=True)
    stem = f"{'dry-run-' if dry_run else ''}{briefing['date']}"
    (out / f"{stem}.html").write_text(html, encoding="utf-8")
    (out / f"{stem}.txt").write_text(text, encoding="utf-8")
    (out / f"{stem}.json").write_text(json.dumps(briefing, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    return out / f"{stem}.html"


def run_pipeline(mode: str = "run", force: bool = False, sources=None,
                 http_factory: Callable[[], HttpClient] = HttpClient, llm=_AUTO) -> RunReport:
    """mode: 'run' (full, sends email) or 'dry-run' (everything except email/state changes)."""
    s = get_settings()
    dry = mode == "dry-run"
    init_db()
    report = RunReport(mode=mode, date=local_date(s.timezone))
    stats, errors = report.stats, report.errors
    conn = connect()
    report.run_id = start_run(conn, mode)
    conn.commit()
    client = None
    try:
        existing = row(conn, "SELECT * FROM daily_briefings WHERE date=?", (report.date,))
        if not dry and not force and existing and not existing["is_dry_run"]:
            if existing["emailed_at"]:
                log.info("Briefing for %s already delivered at %s — nothing to do (use --force to redo).",
                         report.date, existing["emailed_at"])
                report.status = "skipped"
                return report
            # Generated earlier but the email failed: just resend it.
            log.info("Briefing for %s exists but was not emailed — resending.", report.date)
            report.briefing = json.loads(existing["briefing_json"])
            _deliver(conn, report, existing["html_content"], existing["plain_text"])
            report.status = "success" if report.email_sent else "failed"
            return report

        client = _resolve_llm(llm)
        if client is None:
            log.warning("No LLM configured (OPENAI_API_KEY empty) — running in heuristic mode; briefing will be degraded.")
        sync_watchlist(conn, s.watchlist)
        watchlist = active_watchlist(conn)

        # 1. Discover
        srcs = sources if sources is not None else load_sources()
        log.info("Stage 1/7: collecting from %d sources", len(srcs))
        collect(conn, srcs, stats, errors, http_factory)

        # 2. Deduplicate into stories, drop already-covered events
        candidates = _candidates(conn, s.lookback_hours)
        log.info("Stage 2/7: %d candidate articles → deduplicating", len(candidates))
        reps = _group_stories(conn, candidates, stats)
        covered = _recently_featured_titles(conn, s.recent_coverage_days)
        if covered:
            before = len(reps)
            reps = [r for r in reps if r.get("category") == "manual" or not matches_any(r["title"], covered)]
            stats["duplicates_removed"] += before - len(reps)

        # 3. Cheap AI filter
        log.info("Stage 3/7: filtering %d stories", len(reps))
        kept = classify(conn, reps, client, stats, errors)

        # 4. Extract full text for the best
        log.info("Stage 4/7: extracting %d articles", min(len(kept), s.max_articles_extracted))
        extract_many(conn, kept[: s.max_articles_extracted], stats, errors, http_factory=lambda: http_factory())

        # 5. Deep analysis
        deep = kept[: s.max_articles_deep_analyzed]
        log.info("Stage 5/7: deep analysis of %d stories", len(deep))
        recent = recent_ideas(conn, s.content_history_days)
        analyze_many(conn, deep, client, watchlist, recent, report.date, stats, errors)

        # 6. Rank + build
        log.info("Stage 6/7: ranking and writing the briefing")
        selection = select(deep, recent, s.max_final_stories)
        for st in selection["ranked"]:
            conn.execute("UPDATE article_analysis SET final_score=? WHERE article_id=?", (st["final_score"], st["id"]))
        conn.commit()  # never hold a write lock while LLM calls (and their cache writes) run
        briefing = build_briefing(report.date, selection, client, watchlist, stats, errors)
        stats["final_stories"] = len(briefing["top_stories"]) + len(briefing["more_stories"]) + (1 if briefing["kenya_africa"] else 0)
        html, text = render_html(briefing), render_text(briefing)
        report.briefing = briefing
        report.html_path = _save_outputs(briefing, html, text, dry)
        # A dry run never overwrites a real (possibly already emailed) briefing.
        protect_real = dry and existing and not existing["is_dry_run"]
        if not protect_real:
            conn.execute(
            """INSERT INTO daily_briefings (date, headline, summary, html_content, plain_text, briefing_json, degraded,
                                            is_dry_run, generated_at, run_id)
               VALUES (?,?,?,?,?,?,?,?,?,?)
               ON CONFLICT(date) DO UPDATE SET headline=excluded.headline, summary=excluded.summary,
                 html_content=excluded.html_content, plain_text=excluded.plain_text, briefing_json=excluded.briefing_json,
                 degraded=excluded.degraded, is_dry_run=excluded.is_dry_run, generated_at=excluded.generated_at,
                 run_id=excluded.run_id, emailed_at=NULL""",
            (report.date, briefing["headline"], briefing["signal"], html, text,
             json.dumps(briefing, ensure_ascii=False, default=str), int(briefing["degraded"]), int(dry),
             utcnow_iso(), report.run_id),
            )
        conn.commit()

        # 7. Deliver + persist state (real runs only)
        if not dry:
            featured = [v for v in briefing["top_stories"] + briefing["more_stories"] +
                        [briefing["kenya_africa"], briefing["tool"]] if v]
            conn.executemany("UPDATE articles SET featured_on=? WHERE id=?", [(report.date, v["article_id"]) for v in featured])
            conn.executemany("UPDATE articles SET processed=1 WHERE id=?", [(a["id"],) for a in candidates])
            save_ideas(conn, report.date, featured)
            conn.commit()
            log.info("Stage 7/7: sending email")
            _deliver(conn, report, html, text)
        else:
            log.info("Stage 7/7: dry run — email NOT sent")

        report.status = "success" if not errors else "partial"
        if not dry and not report.email_sent:
            report.status = "failed"
    except Exception as exc:
        log.exception("pipeline crashed")
        errors.append(f"pipeline: {type(exc).__name__}: {exc}")
        report.status = "failed"
    finally:
        if client is not None:
            report.llm_usage = client.usage.as_dict()
        stats["email_sent"] = int(report.email_sent)
        try:
            if not dry:
                prune(conn, s.retention_days)
            finish_run(conn, report.run_id, stats, report.status, errors, report.summary())
            conn.commit()
        finally:
            conn.close()
        if not dry:
            try:
                vacuum()
            except Exception:
                pass
    return report


def _deliver(conn, report: RunReport, html: str, text: str) -> None:
    s = get_settings()
    if not s.email_configured:
        report.errors.append("email: not configured (SMTP_HOST / EMAIL_FROM / EMAIL_TO)")
        return
    try:
        send_daily_briefing(report.briefing, html, text)
        report.email_sent = True
        conn.execute("UPDATE daily_briefings SET emailed_at=? WHERE date=?", (utcnow_iso(), report.date))
        conn.commit()
    except EmailError as exc:
        log.error("EMAIL FAILED: %s", exc)
        report.errors.append(f"email: {exc}")


# ---------------------------------------------------------------------------
# Manual URL ingestion
# ---------------------------------------------------------------------------

def ingest_url(url: str, llm=_AUTO, http: HttpClient | None = None) -> tuple[dict, str]:
    """Fetch, extract and analyse one URL the owner found (Instagram, LinkedIn, X…).
    Returns (story view, plain-text report). The article is also queued for the next briefing."""
    s = get_settings()
    init_db()
    client = _resolve_llm(llm)
    result = extract_article(url, http)
    canonical = normalize_url(result.canonical_url or result.final_url or url)
    conn = connect()
    try:
        sync_watchlist(conn, s.watchlist)
        watchlist = active_watchlist(conn)
        existing = row(conn, "SELECT * FROM articles WHERE canonical_url=?", (canonical,))
        if existing:
            conn.execute("UPDATE articles SET category='manual', processed=0, source_priority=10 WHERE id=?", (existing["id"],))
            article_id = existing["id"]
        else:
            article_id = insert_article(conn, {
                "source": result.sitename or domain(url), "title": result.title or url, "url": url,
                "canonical_url": canonical, "published_at": result.published_at, "category": "manual",
                "source_priority": 10, "description": (result.text or "")[:500], "title_hash": sha1(result.title or url),
            })
        if result.ok:
            conn.execute("UPDATE articles SET full_text=?, extraction_status='ok' WHERE id=?", (result.text, article_id))
        else:
            conn.execute("UPDATE articles SET extraction_status='failed' WHERE id=?", (article_id,))
        conn.commit()
        a = get_article(conn, article_id)
        a["filter"] = {"reason": "manually added by owner"}
        analysis, err = analyze_story(client, a, [], watchlist, recent_ideas(conn, s.content_history_days), local_date(s.timezone))
        save_analysis(conn, article_id, {
            "event_title": analysis["event_title"], "summary": analysis["what_happened"],
            "business_implications": analysis["why_it_matters"], "use_cases": analysis["use_cases"],
            "opportunity": analysis["opportunity"], "content_angle": analysis["content"].get("content_angle"),
            "departments_affected": analysis["departments"], "business_impact_score": business_impact(analysis["scores"]),
            "kenya_relevance_score": analysis["scores"].get("kenya_relevance"),
            "analysis_json": json.dumps(analysis, ensure_ascii=False),
            "analysis_model": "degraded" if analysis.get("degraded") else s.analysis_model,
            "degraded": int(bool(analysis.get("degraded"))), "analyzed_at": utcnow_iso(),
        })
        conn.commit()
    finally:
        conn.close()
    a["analysis"] = analysis
    view = story_view(a)
    report = format_story_report(view, extraction_error=None if result.ok else result.error, analysis_error=err)
    out = s.output_dir
    out.mkdir(parents=True, exist_ok=True)
    (out / f"manual-{article_id}.txt").write_text(report, encoding="utf-8")
    return view, report


def format_story_report(v: dict, extraction_error: str | None = None, analysis_error: str | None = None) -> str:
    c = v["content"]
    wc = v["what_changed"] or {}
    opp = v.get("opportunity") or {}
    lines = [f"STORY: {v['event_title']}", f"Source: {v['primary_source']} → {v['primary_url']}", ""]
    if extraction_error:
        lines += [f"⚠ Could not extract article text ({extraction_error}); analysis used metadata only.", ""]
    if analysis_error:
        lines += [f"⚠ {analysis_error}", ""]

    def sec(title, body):
        if body:
            lines.extend([title, body if isinstance(body, str) else "\n".join(f"- {x}" for x in body), ""])

    sec("WHAT HAPPENED", v["what_happened"])
    sec("WHAT CHANGED", "\n".join(f"{k.replace('_', ' ').title()}: {wc[k]}" for k in ("before", "now", "easier", "still_hard") if wc.get(k)))
    sec("WHY IT MATTERS", v["why_it_matters"])
    sec("WHO SHOULD CARE", ", ".join(v["who_should_care"] or v["departments"]))
    sec("USE CASES", v["use_cases"])
    sec("WHAT IT COULD REPLACE/REDUCE", v["replaces_or_reduces"])
    sec("KENYA LENS", " ".join(x for x in (v["kenya_lens"].get("explanation"), v["kenyan_example"]) if x))
    sec("AFRICA LENS", v["africa_lens"])
    sec("LIMITATIONS", v["limitations"])
    if opp:
        sec("BUSINESS OPPORTUNITY", "\n".join(f"{k.replace('_', ' ').title()}: {val}" for k, val in opp.items() if val))
    sec("HOOK", c.get("hook"))
    sec("TALKING POINTS — WHAT HAPPENED", c.get("what_happened_points"))
    sec("TALKING POINTS — WHY IT MATTERS", c.get("why_it_matters_points"))
    sec("PRACTICAL TAKEAWAY", c.get("practical_takeaway"))
    sec("CONTENT ANGLE", c.get("content_angle"))
    lines.append("Queued for the next daily briefing.")
    return "\n".join(lines)
