import os
import sys
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
FIXTURES = Path(__file__).parent / "fixtures"

from app.ingestion.base import FetchError, FetchResult, HttpClient  # noqa: E402


def load_fixture(name: str) -> str:
    now = datetime.now(timezone.utc) - timedelta(hours=2)
    text = (FIXTURES / name).read_text(encoding="utf-8")
    return text.replace("{{NOW_RFC822}}", format_datetime(now)).replace("{{NOW_ISO}}", now.strftime("%Y-%m-%dT%H:%M:%SZ"))


class FakeHttp(HttpClient):
    """Maps URL (or URL prefix) -> fixture name, or -> exception."""

    def __init__(self, routes: dict):
        self.routes = routes
        self.timeout = 5
        self.calls: list[str] = []

    def get(self, url, **kwargs):
        self.calls.append(url)
        for prefix, target in self.routes.items():
            if url.startswith(prefix):
                if isinstance(target, Exception):
                    raise target
                body = load_fixture(target)
                return FetchResult(body, body.encode(), 200, url, {})
        raise FetchError(f"HTTP 404 for {url}", 404)

    def close(self):
        pass


@pytest.fixture(autouse=True)
def isolated_env(tmp_path, monkeypatch):
    """Every test gets its own database and no real credentials."""
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("OUTPUT_DIR", str(tmp_path / "briefings"))
    for var in ("OPENAI_API_KEY", "SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD", "EMAIL_FROM", "EMAIL_TO",
                "FALLBACK_MODEL", "OPENAI_BASE_URL"):
        monkeypatch.setenv(var, "")
    from app.config import reload_settings
    from app.database import init_db

    reload_settings()
    init_db()
    yield
    reload_settings()


@pytest.fixture
def fake_http():
    return FakeHttp
