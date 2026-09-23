"""Minimal internal dashboard.  Start with:  python -m app --dashboard

Server-rendered HTML, no JS build step. If DASHBOARD_USERNAME/PASSWORD are set,
every page requires HTTP Basic auth (needed if you deploy it anywhere public).
"""
from __future__ import annotations

import json
import logging
import secrets
import threading
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.templating import Jinja2Templates

from app.config import SOURCE_CATEGORIES, SOURCE_TYPES, get_settings, load_sources, reload_settings
from app.dashboard import sources_editor
from app.database import active_watchlist, connect, init_db, row, rows, sync_watchlist
from app.utils.timeutil import humanize_age, local_date

log = logging.getLogger(__name__)
_basic = HTTPBasic(auto_error=False)


def auth(creds: HTTPBasicCredentials | None = Depends(_basic)) -> None:
    s = get_settings()
    if not (s.dashboard_username and s.dashboard_password):
        return
    ok = creds is not None and secrets.compare_digest(creds.username, s.dashboard_username) \
        and secrets.compare_digest(creds.password, s.dashboard_password)
    if not ok:
        raise HTTPException(401, "Authentication required", headers={"WWW-Authenticate": "Basic"})


@asynccontextmanager
async def lifespan(_app):
    init_db()
    yield


app = FastAPI(title="Zenith Intelligence", dependencies=[Depends(auth)], docs_url=None, redoc_url=None,
              lifespan=lifespan)
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))
templates.env.filters["age"] = humanize_age
templates.env.filters["fromjson"] = lambda v: json.loads(v) if v else {}

_job = {"running": False, "label": "", "last": ""}
_job_lock = threading.Lock()


def _start_job(label: str, fn) -> bool:
    with _job_lock:
        if _job["running"]:
            return False
        _job.update(running=True, label=label)

    def wrapper():
        try:
            _job["last"] = fn() or f"{label}: done"
        except Exception as exc:  # surfaced on the page, never crashes the server
            log.exception("job failed")
            _job["last"] = f"{label} failed: {exc}"
        finally:
            _job["running"] = False

    threading.Thread(target=wrapper, daemon=True).start()
    return True


def page(request: Request, name: str, **ctx) -> HTMLResponse:
    msg = request.query_params.get("msg")
    return templates.TemplateResponse(request, name, {"job": _job, "msg": msg, "nav": name.split(".")[0], **ctx})


def q(sql: str, params=()) -> list[dict]:
    conn = connect()
    try:
        return rows(conn, sql, params)
    finally:
        conn.close()


# ---------------------------------------------------------------- TODAY / BRIEFINGS
@app.get("/", response_class=HTMLResponse)
def today(request: Request):
    b = q("SELECT * FROM daily_briefings ORDER BY date DESC LIMIT 1")
    briefing = json.loads(b[0]["briefing_json"]) if b and b[0]["briefing_json"] else None
    run = q("SELECT * FROM system_runs ORDER BY id DESC LIMIT 1")
    return page(request, "today.html", b=b[0] if b else None, briefing=briefing, run=run[0] if run else None,
                today=local_date(get_settings().timezone))


@app.get("/briefings", response_class=HTMLResponse)
def briefings(request: Request):
    items = q("SELECT date, headline, summary, degraded, is_dry_run, emailed_at, generated_at FROM daily_briefings ORDER BY date DESC LIMIT 120")
    return page(request, "briefings.html", items=items)


@app.get("/briefings/{date}/email", response_class=HTMLResponse)
def briefing_email(date: str):
    b = q("SELECT html_content FROM daily_briefings WHERE date=?", (date,))
    if not b:
        raise HTTPException(404)
    return HTMLResponse(b[0]["html_content"])


# ---------------------------------------------------------------- STORIES
@app.get("/stories", response_class=HTMLResponse)
def stories(request: Request, days: int = 3):
    items = q("""SELECT a.id, a.title, a.source, a.url, a.category, a.published_at, a.discovered_at, a.featured_on,
                        a.filter_score, a.extraction_status, an.event_title, an.final_score, an.degraded, an.summary
                 FROM articles a JOIN article_analysis an ON an.article_id = a.id
                 WHERE a.discovered_at >= datetime('now', ?)
                 ORDER BY COALESCE(an.final_score, 0) DESC, a.discovered_at DESC LIMIT 200""", (f"-{days} days",))
    filtered = q("""SELECT id, title, source, url, filter_json, filter_score FROM articles
                    WHERE filter_json IS NOT NULL AND discovered_at >= datetime('now', ?)
                    AND id NOT IN (SELECT article_id FROM article_analysis)
                    ORDER BY filter_score DESC LIMIT 100""", (f"-{days} days",))
    return page(request, "stories.html", items=items, filtered=filtered, days=days)


@app.get("/stories/{article_id}", response_class=HTMLResponse)
def story(request: Request, article_id: int):
    a = q("SELECT * FROM articles WHERE id=?", (article_id,))
    if not a:
        raise HTTPException(404)
    an = q("SELECT * FROM article_analysis WHERE article_id=?", (article_id,))
    related = q("SELECT id, title, source, url FROM articles WHERE story_id=? AND id!=?", (a[0]["story_id"], article_id)) \
        if a[0]["story_id"] else []
    analysis = json.loads(an[0]["analysis_json"]) if an and an[0]["analysis_json"] else None
    filt = json.loads(a[0]["filter_json"]) if a[0]["filter_json"] else None
    return page(request, "story.html", a=a[0], an=an[0] if an else None, analysis=analysis, filt=filt, related=related)


# ---------------------------------------------------------------- CONTENT
@app.get("/content", response_class=HTMLResponse)
def content(request: Request):
    return page(request, "content.html", items=q("SELECT * FROM content_ideas ORDER BY date DESC, id LIMIT 300"))


# ---------------------------------------------------------------- WATCHLIST
@app.get("/watchlist", response_class=HTMLResponse)
def watchlist(request: Request):
    conn = connect()
    try:
        sync_watchlist(conn, get_settings().watchlist)
        conn.commit()
        items = rows(conn, "SELECT * FROM watchlist ORDER BY active DESC, topic")
    finally:
        conn.close()
    for w in items:
        w["keywords"] = ", ".join(json.loads(w["keywords"] or "[]"))
    return page(request, "watchlist.html", items=items)


@app.post("/watchlist/add")
def watchlist_add(topic: str = Form(...), keywords: str = Form("")):
    kws = [k.strip().lower() for k in keywords.split(",") if k.strip()] or [topic.strip().lower()]
    conn = connect()
    try:
        conn.execute("INSERT OR REPLACE INTO watchlist (topic, keywords, active, origin, created_at) VALUES (?,?,1,'dashboard',datetime('now'))",
                     (topic.strip(), json.dumps(kws)))
        conn.commit()
    finally:
        conn.close()
    return RedirectResponse("/watchlist?msg=Added", 303)


@app.post("/watchlist/{wid}/toggle")
def watchlist_toggle(wid: int):
    conn = connect()
    try:
        conn.execute("UPDATE watchlist SET active = 1 - active WHERE id=?", (wid,))
        conn.commit()
    finally:
        conn.close()
    return RedirectResponse("/watchlist", 303)


@app.post("/watchlist/{wid}/delete")
def watchlist_delete(wid: int):
    conn = connect()
    try:
        conn.execute("DELETE FROM watchlist WHERE id=? AND origin='dashboard'", (wid,))
        conn.commit()
    finally:
        conn.close()
    return RedirectResponse("/watchlist?msg=Removed (config topics: edit settings.yaml)", 303)


# ---------------------------------------------------------------- SOURCES
@app.get("/sources", response_class=HTMLResponse)
def sources(request: Request):
    health = {r["name"]: r for r in q("SELECT * FROM sources")}
    items = []
    for s in load_sources(include_disabled=True):
        h = health.get(s.name, {})
        if not s.enabled:
            status = "off"
        elif not h.get("last_fetch_at"):
            status = "new"
        elif h.get("consecutive_failures"):
            status = "fail" if h["consecutive_failures"] >= 3 else "warn"
        else:
            status = "ok"
        items.append({"cfg": s, "h": h, "status": status})
    return page(request, "sources.html", items=items, types=sorted(SOURCE_TYPES), categories=sorted(SOURCE_CATEGORIES))


def _edit(fn, *args):
    try:
        fn(*args)
        return RedirectResponse("/sources?msg=Saved to config/sources.yaml — commit it to apply on GitHub Actions", 303)
    except (ValueError, OSError) as exc:
        return RedirectResponse(f"/sources?msg=Error: {exc}", 303)


@app.post("/sources/add")
def sources_add(name: str = Form(...), type: str = Form(...), url: str = Form(""), category: str = Form(...),
                priority: int = Form(5), link_pattern: str = Form("")):
    extra = {"link_pattern": link_pattern} if link_pattern else {}
    return _edit(sources_editor.add_source, name.strip(), type, url.strip(), category, priority, extra)


@app.post("/sources/toggle")
def sources_toggle(name: str = Form(...), enabled: str = Form(...)):
    return _edit(sources_editor.set_enabled, name, enabled == "1")


@app.post("/sources/remove")
def sources_remove(name: str = Form(...)):
    return _edit(sources_editor.remove_source, name)


# ---------------------------------------------------------------- RUNS / ACTIONS
@app.get("/runs", response_class=HTMLResponse)
def runs(request: Request):
    items = q("SELECT * FROM system_runs ORDER BY id DESC LIMIT 60")
    return page(request, "runs.html", items=items)


@app.post("/actions/run")
def action_run(mode: str = Form("dry-run")):
    from app.pipeline import run_pipeline

    mode = "run" if mode == "run" else "dry-run"
    started = _start_job(f"Pipeline ({mode})", lambda: run_pipeline(mode=mode, force=(mode == "run")).summary())
    return RedirectResponse("/runs?msg=" + ("Started — refresh in a few minutes" if started else "A job is already running"), 303)


@app.post("/actions/test-email")
def action_test_email():
    from app.delivery.email_service import EmailError, send_test_email

    try:
        send_test_email()
        msg = "Test email sent"
    except EmailError as exc:
        msg = f"Test email failed: {exc}"
    return RedirectResponse(f"/settings?msg={msg}", 303)


@app.post("/actions/url")
def action_url(url: str = Form(...)):
    from app.pipeline import ingest_url

    def job():
        view, _ = ingest_url(url.strip())
        return f"Analysed: {view['event_title']} (story #{view['article_id']})"

    started = _start_job("Manual URL", job)
    return RedirectResponse("/stories?msg=" + ("Analysing — refresh in a minute" if started else "A job is already running"), 303)


# ---------------------------------------------------------------- SETTINGS
@app.get("/settings", response_class=HTMLResponse)
def settings_page(request: Request):
    s = reload_settings()
    public = s.public_dict()
    public.pop("watchlist", None)
    return page(request, "settings.html", settings=public, sp=s)
