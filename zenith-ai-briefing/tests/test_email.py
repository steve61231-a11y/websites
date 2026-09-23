import smtplib

import pytest

from app.briefing.generator import render_html, render_text
from app.config import reload_settings
from app.delivery.email_service import EmailError, SMTPProvider, get_provider, sample_briefing, send_email


def test_html_and_text_render_with_links():
    b = sample_briefing("2026-09-24", "Thursday, September 24")
    html, text = render_html(b), render_text(b)
    assert "ZENITH INTELLIGENCE" in html and "AI BUSINESS BRIEFING" in html and "Thursday, September 24" in html
    assert 'href="https://github.com/"' in html and "READ SOURCE" in html
    assert 'name="viewport"' in html and "max-width:640px" in html  # mobile
    assert "Read the original → https://github.com/" in text
    assert "<" not in text.replace("<-", "")


def test_html_escapes_content():
    b = sample_briefing("2026-09-24", "Thursday, September 24")
    b["signal"] = "<script>alert(1)</script>"
    assert "<script>alert" not in render_html(b)


def test_email_not_configured_raises():
    with pytest.raises(EmailError):
        get_provider()


def test_smtp_message_and_ssl_mode(monkeypatch):
    for k, v in {"SMTP_HOST": "smtp.x.com", "SMTP_PORT": "465", "EMAIL_FROM": "Zenith <bot@x.com>",
                 "EMAIL_TO": "a@x.com, b@x.com", "SMTP_USERNAME": "u", "SMTP_PASSWORD": "p"}.items():
        monkeypatch.setenv(k, v)
    s = reload_settings()
    used = {}

    class FakeSSL:
        def __init__(self, host, port, timeout=None, context=None):
            used["ssl"] = (host, port)
        def ehlo(self): pass
        def login(self, u, p): used["login"] = u
        def send_message(self, m): used["msg"] = m
        def quit(self): pass

    monkeypatch.setattr(smtplib, "SMTP_SSL", FakeSSL)
    send_email("Subj", "<p>hi</p>", "hi")
    assert used["ssl"] == ("smtp.x.com", 465) and used["login"] == "u"
    assert used["msg"]["To"] == "a@x.com, b@x.com"
    assert s.email_to == ["a@x.com", "b@x.com"]


def test_auth_failure_is_not_retried(monkeypatch):
    for k, v in {"SMTP_HOST": "smtp.x.com", "EMAIL_FROM": "bot@x.com", "EMAIL_TO": "a@x.com"}.items():
        monkeypatch.setenv(k, v)
    reload_settings()
    calls = []

    class Bad(SMTPProvider):
        def send(self, *a):
            calls.append(1)
            raise smtplib.SMTPAuthenticationError(535, b"bad creds")

    with pytest.raises(EmailError, match="authentication"):
        send_email("s", "h", "t", provider=Bad(reload_settings()), sleep=lambda _: None)
    assert len(calls) == 1
