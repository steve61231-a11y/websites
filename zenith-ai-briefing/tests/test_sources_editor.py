import shutil

import pytest

from app.config import CONFIG_DIR, load_sources
from app.dashboard.sources_editor import add_source, remove_source, set_enabled


@pytest.fixture
def ypath(tmp_path):
    p = tmp_path / "sources.yaml"
    shutil.copy(CONFIG_DIR / "sources.yaml", p)
    return p


def test_toggle_add_remove_preserves_comments(ypath):
    before = len(load_sources(ypath, include_disabled=True))
    set_enabled("TechCabal", False, ypath)
    assert "TechCabal" not in [s.name for s in load_sources(ypath)]
    set_enabled("TechCabal", True, ypath)
    assert "TechCabal" in [s.name for s in load_sources(ypath)]
    add_source("Business Daily Tech", "rss", "https://example.com/feed", "kenya", 8, path=ypath)
    assert any(s.name == "Business Daily Tech" for s in load_sources(ypath))
    remove_source("Techweez", ypath)
    names = [s.name for s in load_sources(ypath, include_disabled=True)]
    assert "Techweez" not in names and "TechTrends KE" in names and len(names) == before
    text = ypath.read_text()
    assert "# ───────────────────────── KENYA" in text  # section comments survive
    # the Google News entry (with nested list) still parses
    gn = [s for s in load_sources(ypath) if s.type == "search"][0]
    assert gn.options["queries"]


def test_invalid_add_rejected(ypath):
    with pytest.raises(ValueError):
        add_source("X", "carrier_pigeon", "https://x", "kenya", 5, path=ypath)
    with pytest.raises(ValueError):
        add_source("OpenAI", "rss", "https://x.com/f", "ai_lab", 5, path=ypath)
