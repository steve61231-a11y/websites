"""Kenya / Africa lens: guidance for the analyst prompt + cheap keyword relevance."""
from __future__ import annotations

import re

KENYA_TERMS = [
    "kenya", "kenyan", "nairobi", "mombasa", "kisumu", "nakuru", "eldoret", "safaricom", "m-pesa", "mpesa",
    "airtel kenya", "equity bank", "kcb", "ncba", "co-operative bank", "absa kenya", "stanbic", "i&m bank",
    "central bank of kenya", "cbk", "kra", "kenya revenue authority", "communications authority", "odpc",
    "konza", "ict authority", "ministry of ict", "sacco", "saccos", "jumia kenya", "twiga", "m-kopa", "sendy",
    "wasoko", "kopo kopo", "cellulant", "pesalink", "huduma", "ecitizen", "nse", "nairobi securities exchange",
]
AFRICA_TERMS = [
    "africa", "african", "nigeria", "lagos", "south africa", "egypt", "ghana", "rwanda", "uganda", "tanzania",
    "ethiopia", "morocco", "senegal", "ivory coast", "côte d'ivoire", "zambia", "east africa", "west africa",
    "sub-saharan", "flutterwave", "paystack", "moniepoint", "opay", "mtn", "vodacom", "chipper", "andela",
    "afreximbank", "african union", "afcfta", "smart africa", "jumia", "orange africa", "wave mobile",
]

KENYA_LENS_GUIDE = """
KENYA LENS — be concrete, never generic.
Ask: could a real Kenyan business use this in the next 3-12 months, with a small team and limited tech staff?
Ground examples in Kenyan operating realities where they genuinely fit:
- WhatsApp as the main customer channel; M-Pesa / Paybill / Till payments and reconciliation
- mobile-first customers; small teams doing manual admin; follow-ups by phone/WhatsApp
- lead management in spreadsheets; limited budgets; intermittent power/connectivity in places
- Kenya Data Protection Act (ODPC) obligations when handling customer data
Pick the most fitting sector: real estate, schools, clinics, hospitals, law firms, accounting firms, logistics,
restaurants, hotels, insurance, banking, SACCOs, retail, e-commerce, manufacturing, construction,
professional services, agriculture, tourism.
Describe a *type* of business ("a 15-person insurance agency in Nairobi"), never invent facts about a named company.
If availability, pricing in KES, language support (English/Swahili/Sheng), or data residency is a real barrier, say so.
If there is honestly no Kenyan relevance, say "low" and explain briefly. Do not force it.
"""

AFRICA_LENS_GUIDE = """
AFRICA LENS: does this matter beyond Kenya (Nigeria, South Africa, Egypt, Ghana, Rwanda, East African Community)?
Consider mobile money, fintech, telecoms, agriculture, public services, cross-border trade, local-language AI.
One or two sentences. "Limited" is an acceptable answer.
"""


def _count(terms: list[str], text: str) -> int:
    return sum(1 for t in terms if re.search(r"(?<![a-z])" + re.escape(t) + r"(?![a-z])", text))


def regional_relevance(text: str) -> tuple[int, int]:
    """(kenya, africa) keyword relevance 0-100 — a cheap signal, not a judgement."""
    t = (text or "").lower()
    k = _count(KENYA_TERMS, t)
    a = _count(AFRICA_TERMS, t)
    kenya = min(100, k * 45)
    africa = min(100, a * 35 + k * 25)
    return kenya, africa
