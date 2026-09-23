"""Watchlist matching (keywords from settings.yaml / dashboard)."""
from __future__ import annotations

import re


def match_watchlist(text: str, watchlist: list[dict]) -> list[str]:
    t = (text or "").lower()
    hits = []
    for w in watchlist:
        for kw in w.get("keywords") or [w["topic"].lower()]:
            if re.search(r"(?<![a-z0-9])" + re.escape(kw.lower()) + r"(?![a-z0-9])", t):
                hits.append(w["topic"])
                break
    return hits
