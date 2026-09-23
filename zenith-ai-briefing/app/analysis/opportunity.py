"""Business opportunity engine: guidance + formatting."""
from __future__ import annotations

OPPORTUNITY_GUIDE = """
OPPORTUNITY ENGINE — ask: "If I were an AI consultant in Kenya, what could I build or implement
because of this development?" Only answer if something real emerges; never force a sales pitch.
Return: problem, target_business, workflow (the current manual steps), ai_capability (what this development
makes possible), implementation_idea (concrete: tools, integrations such as WhatsApp Business API, M-Pesa Daraja,
Google Sheets, a CRM), expected_benefit (time/cost/revenue, realistic, no invented statistics),
difficulty (low | medium | high, with one-line reason), service_category (e.g. "WhatsApp automation",
"AI receptionist", "document processing", "sales follow-up automation", "internal knowledge assistant").
No pricing.
"""

OPPORTUNITY_FIELDS = ["problem", "target_business", "workflow", "ai_capability", "implementation_idea",
                      "expected_benefit", "difficulty", "service_category"]


def opportunity_summary(opp: dict | None) -> str:
    if not opp or not isinstance(opp, dict):
        return ""
    parts = []
    if opp.get("target_business") and opp.get("problem"):
        parts.append(f"{opp['target_business']}: {opp['problem']}")
    if opp.get("implementation_idea"):
        parts.append(str(opp["implementation_idea"]))
    return " — ".join(parts)
