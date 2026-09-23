"""Provider-agnostic email delivery. SMTP first (works with Gmail, Outlook, Zoho,
Brevo, Mailgun, SES, Resend… all expose SMTP), so no vendor lock-in.

Add a provider: subclass EmailProvider, implement ``send``, register in PROVIDERS.
"""
from __future__ import annotations

import logging
import smtplib
import ssl
import time
from abc import ABC, abstractmethod
from email.message import EmailMessage
from email.utils import formatdate, make_msgid

from app.config import Settings, get_settings

log = logging.getLogger(__name__)


class EmailError(Exception):
    pass


class EmailProvider(ABC):
    @abstractmethod
    def send(self, subject: str, html: str, text: str, to: list[str]) -> None:
        ...


class SMTPProvider(EmailProvider):
    def __init__(self, s: Settings):
        if not s.email_configured:
            raise EmailError("Email not configured: set SMTP_HOST, EMAIL_FROM and EMAIL_TO")
        self.s = s

    def build_message(self, subject: str, html: str, text: str, to: list[str]) -> EmailMessage:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = self.s.email_from
        msg["To"] = ", ".join(to)
        msg["Date"] = formatdate(localtime=False)
        msg["Message-ID"] = make_msgid(domain=(self.s.email_from or "zenith.local").split("@")[-1].strip(">"))
        msg.set_content(text)
        msg.add_alternative(html, subtype="html")
        return msg

    def send(self, subject: str, html: str, text: str, to: list[str]) -> None:
        s = self.s
        msg = self.build_message(subject, html, text, to)
        mode = s.smtp_security
        if mode == "auto":
            mode = "ssl" if s.smtp_port == 465 else "starttls" if s.smtp_port in (587, 2525) else "none"
        ctx = ssl.create_default_context()
        if mode == "ssl":
            server = smtplib.SMTP_SSL(s.smtp_host, s.smtp_port, timeout=30, context=ctx)
        else:
            server = smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=30)
        try:
            server.ehlo()
            if mode == "starttls":
                server.starttls(context=ctx)
                server.ehlo()
            if s.smtp_username and s.smtp_password:
                server.login(s.smtp_username, s.smtp_password)
            server.send_message(msg)
        finally:
            try:
                server.quit()
            except Exception:
                pass


PROVIDERS = {"smtp": SMTPProvider}


def get_provider(s: Settings | None = None) -> EmailProvider:
    s = s or get_settings()
    cls = PROVIDERS.get(s.email_provider)
    if not cls:
        raise EmailError(f"Unknown EMAIL_PROVIDER {s.email_provider!r}")
    return cls(s)


def send_email(subject: str, html: str, text: str, retries: int = 3, provider: EmailProvider | None = None,
               sleep=None) -> None:
    s = get_settings()
    provider = provider or get_provider(s)
    last = None
    for attempt in range(retries):
        try:
            provider.send(subject, html, text, s.email_to)
            log.info("email sent to %d recipient(s)", len(s.email_to))
            return
        except smtplib.SMTPAuthenticationError as exc:
            raise EmailError(f"SMTP authentication failed — check SMTP_USERNAME/SMTP_PASSWORD (app password?): {exc.smtp_code}") from exc
        except (smtplib.SMTPException, OSError) as exc:
            last = exc
            log.warning("email attempt %d/%d failed: %s", attempt + 1, retries, exc)
            if attempt < retries - 1:
                (sleep or time.sleep)(5 * (attempt + 1))
    raise EmailError(f"email failed after {retries} attempts: {last}")


def render_html_email(briefing: dict) -> str:
    from app.briefing.generator import render_html

    return render_html(briefing)


def send_daily_briefing(briefing: dict, html: str | None = None, text: str | None = None) -> None:
    from app.briefing.generator import render_text

    html = html or render_html_email(briefing)
    text = text or render_text(briefing)
    subject = briefing["subject"]
    if briefing.get("subject_tail"):
        subject = f"{subject}: {briefing['subject_tail']}"
    send_email(subject, html, text)


def send_test_email() -> None:
    from app.briefing.generator import render_html, render_text
    from app.utils.timeutil import date_label, local_date

    s = get_settings()
    date = local_date(s.timezone)
    sample = sample_briefing(date, date_label(date))
    send_email(f"[TEST] {sample['subject']}", render_html(sample), render_text(sample))


def sample_briefing(date: str, label: str) -> dict:
    """A static example briefing used for test emails and template previews."""
    story = {
        "article_id": 0, "event_title": "Test email: your delivery pipeline works",
        "title": "Test", "category": "ai_news", "published_at": None,
        "what_happened": "This is a test of the Zenith AI Business Briefing email. If you can read this on your phone, SMTP is configured correctly.",
        "what_changed": {"before": "No email configured.", "now": "The briefing can reach your inbox every morning.", "still_hard": ""},
        "why_it_matters": "Tomorrow's briefing will arrive in exactly this format.",
        "who_should_care": ["You"], "departments": [], "use_cases": [], "replaces_or_reduces": "",
        "kenyan_example": "A Nairobi founder reads this over chai at 6:30am and knows what to record today.",
        "kenya_lens": {}, "africa_lens": "", "limitations": "",
        "opportunity": None, "tool": None, "watchlist_matches": [],
        "content": {"hook": "If you're reading this, the machine is alive.", "content_angle": "Behind the scenes of an AI research engine."},
        "primary_source": "Zenith", "primary_url": "https://github.com/", "supporting": [], "why_selected": "test", "degraded": False,
    }
    return {
        "date": date, "date_label": label, "subject": f"ZENITH AI BUSINESS BRIEFING — {label}", "subject_tail": "",
        "signal": "Test email — delivery is working.", "top_stories": [story], "more_stories": [],
        "kenya_africa": None, "tool": None, "opportunity": None,
        "watchlist": [{"topic": "Delivery", "note": "Check this arrived in your inbox, not spam.", "sources": []}],
        "video": {"hook": "Happy test day guys.", "talking_points": ["Email works.", "Sources are clickable."],
                  "ending": "See you tomorrow morning.", "sources": [{"source": "Zenith", "url": "https://github.com/", "title": "Test"}]},
        "degraded": False, "degraded_sections": [], "stats": {"sources_checked": 0, "articles_discovered": 0}, "headline": "Test",
    }
