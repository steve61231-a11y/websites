import pytest

from app.analysis.analyst import normalize_analysis
from app.config import reload_settings
from app.llm.provider import LLMClient, LLMError, LLMFatalError, LLMResponse, LLMProvider, parse_json_response
from tests.fakes import FakeProvider


@pytest.mark.parametrize("text,expected", [
    ('{"a": 1}', {"a": 1}),
    ('```json\n{"a": 1}\n```', {"a": 1}),
    ('Sure! Here you go:\n{"a": {"b": "x}y"}}\nHope that helps', {"a": {"b": "x}y"}}),
    ('[{"id": 1}]', [{"id": 1}]),
    ('{"a": 1,}', {"a": 1}),
])
def test_parse_json_response(text, expected):
    assert parse_json_response(text) == expected


def test_parse_json_garbage_raises():
    with pytest.raises(ValueError):
        parse_json_response("no json here")


class Flaky(LLMProvider):
    name = "flaky"

    def __init__(self, fail_times, exc=None):
        self.fail_times, self.calls, self.exc = fail_times, [], exc

    def complete(self, system, user, model, max_tokens, json_mode=True):
        self.calls.append(model)
        if len(self.calls) <= self.fail_times:
            raise (self.exc or RuntimeError("503"))
        return LLMResponse('{"ok": true}', 10, 5)


def test_retries_with_backoff_then_succeeds():
    sleeps = []
    client = LLMClient(Flaky(2), sleep=sleeps.append, use_cache=False)
    assert client.json(role="cheap", system="s", user="u", max_tokens=10) == {"ok": True}
    assert len(sleeps) == 2 and sleeps[1] > sleeps[0]


def test_fallback_model_used_after_primary_fails(monkeypatch):
    monkeypatch.setenv("FALLBACK_MODEL", "backup-model")
    monkeypatch.setenv("ANALYSIS_MODEL", "main-model")
    s = reload_settings()
    provider = FakeProvider(fail_models={"main-model"})
    client = LLMClient(provider, s, sleep=lambda _: None, use_cache=False)
    data = client.json(role="analysis", system="EDITOR", user='{"id": "S1"}', max_tokens=10)
    assert data["signal"]
    assert [m for _, m in provider.calls] == ["main-model"] * s.llm_retries + ["backup-model"]
    assert client.usage.fallbacks == 1


def test_fatal_error_skips_retries_and_total_failure_raises():
    p = Flaky(99, exc=LLMFatalError("bad key"))
    client = LLMClient(p, sleep=lambda _: None, use_cache=False)
    with pytest.raises(LLMError):
        client.json(role="cheap", system="s", user="u", max_tokens=10)
    assert len(p.calls) == 1


def test_garbage_output_is_retried_then_fails():
    client = LLMClient(FakeProvider(garbage=True), sleep=lambda _: None, use_cache=False)
    with pytest.raises(LLMError):
        client.json(role="cheap", system="FIRST-PASS FILTER", user="ITEMS:\n", max_tokens=10)


def test_cache_avoids_second_call():
    p = Flaky(0)
    client = LLMClient(p, sleep=lambda _: None)
    client.json(role="cheap", system="s", user="same", max_tokens=10)
    client.json(role="cheap", system="s", user="same", max_tokens=10)
    assert len(p.calls) == 1 and client.usage.cache_hits == 1


def test_normalize_analysis_strips_urls_and_coerces():
    raw = FakeProvider._analyze("HEADLINE: OpenAI launches GPT-6\n")
    raw["scores"]["significance"] = "150"
    out = normalize_analysis(raw)
    assert "http" not in out["what_happened"]
    assert out["departments"] == ["Sales", "Operations"]
    assert out["scores"]["significance"] == 100
    with pytest.raises(ValueError):
        normalize_analysis({"event_title": "x"})
