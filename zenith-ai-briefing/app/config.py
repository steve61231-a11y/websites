"""Configuration: secrets from environment (.env), everything else from config/*.yaml.

Nothing in the application should read os.environ or the YAML files directly —
go through ``get_settings()`` / ``load_sources()`` so configuration stays in one place.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = Path(os.environ.get("ZENITH_CONFIG_DIR", ROOT / "config"))

load_dotenv(ROOT / ".env")

SOURCE_TYPES = {"rss", "atom", "youtube", "reddit", "github_releases", "webpage", "sitemap", "json", "search"}
SOURCE_CATEGORIES = {
    "ai_lab", "ai_news", "business", "africa", "kenya", "tools", "research", "community", "search", "manual",
}


def _env(name: str, default: str | None = None) -> str | None:
    value = os.environ.get(name)
    if value is None or value.strip() == "":
        return default
    return value.strip()


def _env_int(name: str, default: int) -> int:
    value = _env(name)
    try:
        return int(value) if value is not None else default
    except ValueError:
        return default


def _resolve(path: str) -> Path:
    p = Path(path)
    return p if p.is_absolute() else ROOT / p


@dataclass
class Settings:
    # --- schedule ---
    timezone: str = "Africa/Nairobi"
    daily_run_time: str = "06:30"
    lookback_hours: int = 36

    # --- limits (cost control) ---
    max_articles_discovered: int = 500
    max_items_per_source: int = 40
    max_candidates_classified: int = 150
    max_articles_extracted: int = 100
    max_articles_deep_analyzed: int = 20
    max_final_stories: int = 5
    max_article_chars: int = 10000

    # --- LLM ---
    llm_provider: str = "openai"
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    cheap_model: str = "gpt-5-mini"
    analysis_model: str = "gpt-5"
    fallback_model: str | None = None
    reasoning_effort: str | None = None
    llm_temperature: float | None = None
    llm_max_concurrency: int = 3
    classifier_batch_size: int = 20
    max_output_tokens_classifier: int = 4000
    max_output_tokens_analysis: int = 6000
    max_output_tokens_briefing: int = 4000
    llm_retries: int = 3
    llm_cache_days: int = 7

    # --- HTTP ---
    http_timeout: int = 20
    http_max_concurrency: int = 8
    user_agent: str = "Mozilla/5.0 (compatible; ZenithBriefingBot/1.0)"

    # --- email ---
    email_provider: str = "smtp"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_security: str = "auto"  # auto | starttls | ssl | none
    email_from: str | None = None
    email_to: list[str] = field(default_factory=list)

    # --- storage ---
    database_path: Path = ROOT / "data" / "zenith.db"
    output_dir: Path = ROOT / "data" / "briefings"

    # --- dashboard ---
    dashboard_username: str | None = None
    dashboard_password: str | None = None

    # --- misc ---
    content_history_days: int = 21
    recent_coverage_days: int = 4
    retention_days: int = 45
    ranking_weights: dict[str, float] = field(default_factory=dict)
    watchlist: list[dict[str, Any]] = field(default_factory=list)
    log_level: str = "INFO"

    @property
    def llm_enabled(self) -> bool:
        return bool(self.openai_api_key) and self.llm_provider != "none"

    @property
    def email_configured(self) -> bool:
        return bool(self.smtp_host and self.email_from and self.email_to)

    def public_dict(self) -> dict[str, Any]:
        """Settings safe to display (dashboard). Secrets are masked."""
        out = {}
        for key, value in self.__dict__.items():
            if any(s in key for s in ("password", "api_key")):
                value = "••••••" if value else "(not set)"
            out[key] = str(value) if isinstance(value, Path) else value
        return out


def _read_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def build_settings() -> Settings:
    y = _read_yaml(CONFIG_DIR / "settings.yaml")
    limits = y.get("limits", {}) or {}
    llm = y.get("llm", {}) or {}
    http = y.get("http", {}) or {}
    s = Settings()

    s.timezone = _env("TIMEZONE", y.get("timezone", s.timezone))
    s.daily_run_time = _env("DAILY_RUN_TIME", str(y.get("daily_run_time", s.daily_run_time)))
    s.lookback_hours = _env_int("LOOKBACK_HOURS", int(y.get("lookback_hours", s.lookback_hours)))

    for name in (
        "max_articles_discovered", "max_items_per_source", "max_candidates_classified",
        "max_articles_extracted", "max_articles_deep_analyzed", "max_final_stories", "max_article_chars",
    ):
        setattr(s, name, _env_int(name.upper(), int(limits.get(name, getattr(s, name)))))

    s.llm_provider = (_env("LLM_PROVIDER", "openai") or "openai").lower()
    s.openai_api_key = _env("OPENAI_API_KEY")
    s.openai_base_url = _env("OPENAI_BASE_URL")
    # PRIMARY_MODEL is accepted as an alias of ANALYSIS_MODEL.
    s.cheap_model = _env("CHEAP_MODEL", s.cheap_model)
    s.analysis_model = _env("ANALYSIS_MODEL", _env("PRIMARY_MODEL", s.analysis_model))
    s.fallback_model = _env("FALLBACK_MODEL")
    s.reasoning_effort = _env("OPENAI_REASONING_EFFORT")
    temp = _env("LLM_TEMPERATURE")
    s.llm_temperature = float(temp) if temp else None
    s.llm_max_concurrency = _env_int("LLM_MAX_CONCURRENCY", int(llm.get("max_concurrency", s.llm_max_concurrency)))
    s.classifier_batch_size = int(llm.get("classifier_batch_size", s.classifier_batch_size))
    s.max_output_tokens_classifier = int(llm.get("max_output_tokens_classifier", s.max_output_tokens_classifier))
    s.max_output_tokens_analysis = int(llm.get("max_output_tokens_analysis", s.max_output_tokens_analysis))
    s.max_output_tokens_briefing = int(llm.get("max_output_tokens_briefing", s.max_output_tokens_briefing))
    s.llm_retries = int(llm.get("retries", s.llm_retries))
    s.llm_cache_days = int(llm.get("cache_days", s.llm_cache_days))

    s.http_timeout = int(http.get("timeout_seconds", s.http_timeout))
    s.http_max_concurrency = int(http.get("max_concurrency", s.http_max_concurrency))
    s.user_agent = http.get("user_agent", s.user_agent)

    s.email_provider = (_env("EMAIL_PROVIDER", "smtp") or "smtp").lower()
    s.smtp_host = _env("SMTP_HOST")
    s.smtp_port = _env_int("SMTP_PORT", 587)
    s.smtp_username = _env("SMTP_USERNAME")
    s.smtp_password = _env("SMTP_PASSWORD")
    s.smtp_security = (_env("SMTP_SECURITY", "auto") or "auto").lower()
    s.email_from = _env("EMAIL_FROM")
    s.email_to = [e.strip() for e in (_env("EMAIL_TO", "") or "").split(",") if e.strip()]

    s.database_path = _resolve(_env("DATABASE_PATH", "data/zenith.db"))
    s.output_dir = _resolve(_env("OUTPUT_DIR", "data/briefings"))

    s.dashboard_username = _env("DASHBOARD_USERNAME")
    s.dashboard_password = _env("DASHBOARD_PASSWORD")

    s.content_history_days = int(y.get("content_history_days", s.content_history_days))
    s.recent_coverage_days = int(y.get("recent_coverage_days", s.recent_coverage_days))
    s.retention_days = int(y.get("retention_days", s.retention_days))
    s.ranking_weights = {k: float(v) for k, v in (y.get("ranking_weights") or {}).items()}
    s.watchlist = list(y.get("watchlist") or [])
    s.log_level = (_env("LOG_LEVEL", "INFO") or "INFO").upper()
    return s


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return build_settings()


def reload_settings() -> Settings:
    get_settings.cache_clear()
    return get_settings()


# ---------------------------------------------------------------------------
# Sources
# ---------------------------------------------------------------------------

@dataclass
class SourceConfig:
    name: str
    type: str
    url: str
    category: str
    priority: int = 5
    enabled: bool = True
    official: bool = False  # primary/official source (company blog, regulator, etc.)
    aggregator: bool = False  # search/Reddit/etc. — never preferred over an original source
    options: dict[str, Any] = field(default_factory=dict)  # adapter-specific settings

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {
            "name": self.name, "type": self.type, "url": self.url,
            "category": self.category, "priority": self.priority,
        }
        if not self.enabled:
            d["enabled"] = False
        if self.official:
            d["official"] = True
        if self.aggregator:
            d["aggregator"] = True
        d.update(self.options)
        return d


_KNOWN_KEYS = {"name", "type", "url", "category", "priority", "enabled", "official", "aggregator"}


def parse_source(raw: dict[str, Any]) -> SourceConfig:
    required = ("name", "type", "category") if str(raw.get("type")).lower() == "search" else ("name", "type", "url", "category")
    missing = [k for k in required if not raw.get(k)]
    if missing:
        raise ValueError(f"source {raw.get('name', raw)!r} missing {missing}")
    stype = str(raw["type"]).lower()
    if stype not in SOURCE_TYPES:
        raise ValueError(f"source {raw['name']!r}: unknown type {stype!r} (use one of {sorted(SOURCE_TYPES)})")
    return SourceConfig(
        name=str(raw["name"]),
        type=stype,
        url=str(raw.get("url") or ""),
        category=str(raw["category"]).lower(),
        priority=int(raw.get("priority", 5)),
        enabled=bool(raw.get("enabled", True)),
        official=bool(raw.get("official", raw.get("category") == "ai_lab")),
        aggregator=bool(raw.get("aggregator", stype in ("search", "reddit") or raw.get("category") in ("search", "community"))),
        options={k: v for k, v in raw.items() if k not in _KNOWN_KEYS},
    )


def sources_path() -> Path:
    return CONFIG_DIR / "sources.yaml"


def load_sources(path: Path | None = None, include_disabled: bool = False) -> list[SourceConfig]:
    """Load sources.yaml. Invalid entries are skipped with a warning, never fatal."""
    import logging

    log = logging.getLogger(__name__)
    data = _read_yaml(path or sources_path())
    out: list[SourceConfig] = []
    seen: set[str] = set()
    for raw in data.get("sources", []) or []:
        try:
            src = parse_source(raw)
        except (ValueError, TypeError) as exc:
            log.warning("Skipping invalid source entry: %s", exc)
            continue
        if src.name in seen:
            log.warning("Duplicate source name %r ignored", src.name)
            continue
        seen.add(src.name)
        if src.enabled or include_disabled:
            out.append(src)
    return out
