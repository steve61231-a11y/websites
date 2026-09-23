"""Deterministic stand-in for a real LLM, used by tests and the offline smoke test.
It answers the three prompt types (classify / analyze / editor) with valid JSON."""
from __future__ import annotations

import json
import re

from app.llm.provider import LLMProvider, LLMResponse, LLMRetryableError


class FakeProvider(LLMProvider):
    name = "fake"

    def __init__(self, fail_tasks: set[str] | None = None, fail_models: set[str] | None = None, garbage: bool = False):
        self.fail_tasks = fail_tasks or set()
        self.fail_models = fail_models or set()
        self.garbage = garbage
        self.calls: list[tuple[str, str]] = []

    def complete(self, system, user, model, max_tokens, json_mode=True):
        kind = "classify" if "FIRST-PASS FILTER" in system else "editor" if "EDITOR" in system else "analyze"
        self.calls.append((kind, model))
        if kind in self.fail_tasks or model in self.fail_models:
            raise LLMRetryableError(f"simulated {kind} outage")
        if self.garbage:
            return LLMResponse("I'm sorry, I can't produce JSON today.")
        return LLMResponse("```json\n" + json.dumps(getattr(self, f"_{kind}")(user)) + "\n```", 100, 50)

    @staticmethod
    def _classify(user):
        results = []
        for line in user.split("ITEMS:")[1].strip().splitlines():
            item = json.loads(line)
            t = item["title"].lower()
            keep = any(k in t for k in ("ai", "gpt", "claude", "safaricom", "agent", "kcb", "whatsapp"))
            results.append({"id": item["id"], "keep": keep, "relevance_score": 85 if keep else 10,
                            "business_relevance": 80 if keep else 5, "novelty": 70, "confidence": 80,
                            "kenya_relevance": 90 if any(k in t for k in ("safaricom", "kenya", "kcb", "m-pesa")) else 20,
                            "reason": "concrete business capability" if keep else "no business angle"})
        return {"results": results}

    @staticmethod
    def _analyze(user):
        title = re.search(r"HEADLINE: (.*)", user).group(1).strip()
        kenyan = any(k in title.lower() for k in ("safaricom", "kenya", "kcb", "m-pesa"))
        tool = "whatsapp" in title.lower() or "show hn" in title.lower()
        return {
            "event_title": title, "story_type": "product_launch", "is_tool": tool,
            "what_happened": f"{title}. See https://fabricated.example.com/should-be-stripped for more.",
            "what_changed": {"before": "Staff did this by hand.", "now": "Software can do the routine part.",
                             "easier": "Follow-ups and reconciliation.", "still_hard": "Edge cases need a human."},
            "why_it_matters": "It cuts hours of admin from customer-facing teams.",
            "who_should_care": ["CEO", "Operations"], "departments": ["Sales", "Operations", "Nonsense"],
            "use_cases": ["Automate lead follow-up", "Reconcile payments"],
            "replaces_or_reduces": "Manual data entry",
            "opportunity": {"problem": "Slow follow-up", "target_business": "Nairobi real-estate agencies",
                            "workflow": "Agents copy leads into Excel", "ai_capability": "Agentic follow-up",
                            "implementation_idea": "WhatsApp bot + Google Sheets CRM", "expected_benefit": "Faster response",
                            "difficulty": "medium", "service_category": "WhatsApp automation"},
            "kenya_lens": {"relevance": "high" if kenyan else "medium", "explanation": "Works on WhatsApp.",
                           "example": "A 10-person insurance agency in Westlands automates renewal reminders."},
            "africa_lens": "Relevant wherever mobile money dominates.", "limitations": "English-first.",
            "tool": {"name": title.split(":")[-1].strip()[:40], "what_it_does": "Answers customers", "who_needs_it": "SMEs",
                     "practical_use": "Front desk", "limitations": "Needs WhatsApp Business API"} if tool else None,
            "content": {"hook": f"Forget the announcement — here's what {title.split()[0]} means for your business.",
                        "what_happened_points": ["It launched", "It's available now"],
                        "why_it_matters_points": ["Less admin", "Faster customers"],
                        "kenyan_example": "A Mombasa hotel answers booking questions at 2am.",
                        "practical_takeaway": "List three repetitive tasks this week.", "content_angle": f"What {title} means for SMEs"},
            "watchlist_matches": [],
            "scores": {k: (90 if kenyan and "kenya" in k else 75) for k in (
                "significance", "revenue", "cost_reduction", "time_savings", "customer_experience", "employee_productivity",
                "automation_potential", "competitive_advantage", "new_opportunity", "novelty", "practical_usefulness",
                "kenya_relevance", "africa_relevance", "content_potential", "credibility")},
            "quality_gate": {"learn_something_useful": True, "explainable_in_2_min": True, "concrete_takeaway": True,
                             "credible_source": True, "verifiable": True, "business_implication": True,
                             "interesting_without_ai_interest": True},
            "reject": False, "reject_reason": "",
        }

    @staticmethod
    def _editor(user):
        ids = re.findall(r'"id": "(S\d+)"', user)
        return {
            "signal": "AI is moving from chat windows into the tools SMEs already use.",
            "subject": "Agents get practical; Safaricom moves",
            "opportunity": {"title": "WhatsApp lead follow-up", "problem": "Leads go cold", "target_business": "Real estate",
                            "workflow": "Manual", "ai_capability": "Agents", "implementation_idea": "Bot + Sheets",
                            "expected_benefit": "Faster replies", "difficulty": "medium", "service_category": "Automation",
                            "story_ids": ids[:1]},
            "watchlist": [{"topic": "OpenAI agents", "note": "Watch pricing for SMEs.", "story_ids": ids[:1]}],
            "video": {"hook": "Happy Thursday guys. Three things happened in AI yesterday.",
                      "talking_points": ["Point one", "Point two", "Point three"], "ending": "Which would you try?",
                      "story_ids": ids[:3] + ["S99"]},
        }
