from fastapi.testclient import TestClient

from app.config import reload_settings
from tests.test_pipeline import run


def test_pages_render_after_a_run():
    from app.dashboard.web import app

    run("dry-run")
    c = TestClient(app)
    for path in ("/", "/stories", "/content", "/watchlist", "/sources", "/runs", "/briefings", "/settings"):
        r = c.get(path)
        assert r.status_code == 200, (path, r.text[:500])
    assert "TODAY" in c.get("/").text and "READ SOURCE" in c.get("/").text
    date = c.get("/briefings").text.split("/briefings/")[1][:10]
    assert "ZENITH INTELLIGENCE" in c.get(f"/briefings/{date}/email").text
    story_id = c.get("/stories").text.split('href="/stories/')[1].split('"')[0]
    assert "Why it was selected" in c.get(f"/stories/{story_id}").text


def test_pages_render_on_empty_db():
    from app.dashboard.web import app

    c = TestClient(app)
    assert "No briefing yet" in c.get("/").text
    r = c.post("/watchlist/add", data={"topic": "AI in SACCOs", "keywords": "sacco, saccos"}, follow_redirects=True)
    assert "AI in SACCOs" in r.text


def test_basic_auth_when_configured(monkeypatch):
    monkeypatch.setenv("DASHBOARD_USERNAME", "owner")
    monkeypatch.setenv("DASHBOARD_PASSWORD", "s3cret")
    reload_settings()
    from app.dashboard.web import app

    c = TestClient(app)
    assert c.get("/").status_code == 401
    assert c.get("/", auth=("owner", "wrong")).status_code == 401
    assert c.get("/", auth=("owner", "s3cret")).status_code == 200
