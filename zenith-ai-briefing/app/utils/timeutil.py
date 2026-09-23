"""Date/time helpers. All stored timestamps are UTC strings 'YYYY-MM-DD HH:MM:SS'
(SQLite's native format, so SQL date arithmetic compares correctly)."""
from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from dateutil import parser as dateparser

DB_FMT = "%Y-%m-%d %H:%M:%S"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def to_db(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime(DB_FMT)


def utcnow_iso() -> str:
    return to_db(utcnow())  # type: ignore[return-value]


def from_db(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(value[:19], DB_FMT).replace(tzinfo=timezone.utc)
    except ValueError:
        return parse_date(value)


def parse_date(value) -> datetime | None:
    """Parse almost any date representation into an aware UTC datetime. Never raises."""
    if value is None or value == "":
        return None
    try:
        if isinstance(value, datetime):
            dt = value
        elif isinstance(value, time.struct_time):
            dt = datetime(*value[:6], tzinfo=timezone.utc)
        elif isinstance(value, (int, float)):
            ts = value / 1000 if value > 1e11 else value
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        else:
            dt = dateparser.parse(str(value))
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt = dt.astimezone(timezone.utc)
        # Ignore obviously bogus dates (far future is common in broken feeds).
        if dt > utcnow() + timedelta(days=2) or dt.year < 2000:
            return None
        return dt
    except (ValueError, OverflowError, TypeError):
        return None


def local_now(tz_name: str) -> datetime:
    return utcnow().astimezone(ZoneInfo(tz_name))


def local_date(tz_name: str) -> str:
    """Today's date (YYYY-MM-DD) in the owner's timezone — the briefing date."""
    return local_now(tz_name).strftime("%Y-%m-%d")


def date_label(date_str: str) -> str:
    """'2026-09-24' -> 'Thursday, September 24'."""
    d = datetime.strptime(date_str, "%Y-%m-%d")
    return f"{d.strftime('%A')}, {d.strftime('%B')} {d.day}"


def cron_for_local_time(hhmm: str, tz_name: str) -> str:
    """UTC cron expression that fires daily at local time hh:mm in tz_name.

    GitHub Actions cron is evaluated in UTC. Africa/Nairobi has no DST, so the
    conversion is stable all year. For DST zones, re-run this when clocks change.
    """
    hour, minute = (int(x) for x in hhmm.split(":"))
    tz = ZoneInfo(tz_name)
    today = datetime.now(tz).replace(hour=hour, minute=minute, second=0, microsecond=0)
    utc = today.astimezone(timezone.utc)
    return f"{utc.minute} {utc.hour} * * *"


def humanize_age(value: str | None) -> str:
    dt = from_db(value)
    if not dt:
        return "never"
    secs = (utcnow() - dt).total_seconds()
    if secs < 90:
        return "just now"
    if secs < 3600:
        return f"{int(secs // 60)} min ago"
    if secs < 86400:
        return f"{int(secs // 3600)} h ago"
    return f"{int(secs // 86400)} d ago"
