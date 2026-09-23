"""Duplicate detection: many articles about one event -> one STORY.

Layers (cheapest first):
  1. canonical URL           (database UNIQUE constraint, see utils.urls.normalize_url)
  2. normalized title hash   (same headline syndicated on several sites)
  3. title similarity + shared entities (e.g. "OpenAI" + "GPT-6")
  4. event-title similarity after deep analysis (the LLM names the underlying event;
     see ``dedupe_events``) — catches rewrites that share few words.
Semantic embeddings are deliberately not used in v1: they add cost and a dependency
for a marginal gain over layers 3+4.
"""
from __future__ import annotations

import re
from collections import defaultdict
from difflib import SequenceMatcher
from typing import Iterable

STOPWORDS = set("""
a an the and or but of for to in on at by with from as is are was were be been being it its this that these
those into over after before about than then so if not no new says said say will would can could may might
how why what who when where which you your we our they their he she his her i my me us up out more most
just now also has have had do does did get gets got via amid vs versus report reports exclusive update
""".split())

_SUFFIX = re.compile(r"\s+[\-|–—:]\s+[^\-|–—:]{2,40}$")
_TOKEN = re.compile(r"[a-z0-9$€£]+(?:[.\-][a-z0-9]+)*", re.I)


def normalize_title(title: str) -> str:
    t = (title or "").strip()
    t = _SUFFIX.sub("", t) if len(t) > 40 else t  # "Headline - The Verge" / "Headline | TechCrunch"
    t = t.lower().replace("’", "'")
    t = re.sub(r"'s\b", "", t)
    return " ".join(_TOKEN.findall(t))


def _stem(tok: str) -> str:
    if len(tok) > 4 and tok.endswith("ies"):
        return tok[:-3] + "y"
    if len(tok) > 4 and tok.endswith("s") and not tok.endswith("ss"):
        return tok[:-1]
    return tok


def tokens(title: str) -> set[str]:
    return {_stem(t) for t in normalize_title(title).split() if t not in STOPWORDS and (len(t) > 1 or t.isdigit())}


def entities(title: str) -> set[str]:
    """Names and model identifiers: OpenAI, GPT-6, iPhone, M-Pesa, Safaricom, $2B…"""
    raw = re.findall(r"[A-Za-z0-9$][A-Za-z0-9$.\-']*", _SUFFIX.sub("", title or ""))
    words = [w.strip(".'-").replace("'s", "") for w in raw]
    words = [w for w in words if w]
    caps = sum(1 for w in words if w[0].isupper())
    title_case = words and caps / len(words) > 0.6
    out = set()
    for i, w in enumerate(words):
        lw = w.lower()
        if lw in STOPWORDS:
            continue
        inner_cap = any(c.isupper() for c in w[1:])
        has_digit = any(c.isdigit() for c in w) and any(c.isalpha() or c == "$" for c in w)
        long_number = w.isdigit() and len(w) >= 2
        capitalized = w[0].isupper() and not title_case
        if inner_cap or has_digit or long_number or capitalized:
            out.add(_stem(lw))
    return out


class TitleFeatures:
    __slots__ = ("norm", "toks", "ents")

    def __init__(self, title: str):
        self.norm = normalize_title(title)
        self.toks = tokens(title)
        self.ents = entities(title)


def same_event(a: TitleFeatures | str, b: TitleFeatures | str) -> bool:
    fa = a if isinstance(a, TitleFeatures) else TitleFeatures(a)
    fb = b if isinstance(b, TitleFeatures) else TitleFeatures(b)
    if not fa.toks or not fb.toks:
        return False
    if fa.norm == fb.norm:
        return True
    shared = fa.toks & fb.toks
    overlap = len(shared) / min(len(fa.toks), len(fb.toks))
    jaccard = len(shared) / len(fa.toks | fb.toks)
    shared_ents = len(fa.ents & fb.ents)
    # Both sides name something the other doesn't (Gemini vs Gemma, Kenya vs Nigeria):
    # demand much stronger evidence.
    conflicting = bool(fa.ents - fb.ents) and bool(fb.ents - fa.ents)
    if conflicting:
        return shared_ents >= 2 and overlap >= 0.7
    seq = SequenceMatcher(None, fa.norm, fb.norm).ratio()
    if seq >= 0.85:
        return True
    if shared_ents >= 2 and overlap >= 0.5:
        return True
    return shared_ents >= 1 and jaccard >= 0.5


def cluster(articles: list[dict], title_key: str = "title") -> list[list[dict]]:
    """Group articles describing the same event. Returns clusters, each ordered with
    the preferred (primary) article first."""
    n = len(articles)
    feats = [TitleFeatures(a[title_key]) for a in articles]
    parent = list(range(n))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    # Inverted index: only compare pairs sharing at least two tokens.
    index: dict[str, list[int]] = defaultdict(list)
    for i, f in enumerate(feats):
        for t in f.toks:
            index[t].append(i)
    pair_counts: dict[tuple[int, int], int] = defaultdict(int)
    for ids in index.values():
        if len(ids) > 200:  # extremely common token, useless for matching
            continue
        for x in range(len(ids)):
            for y in range(x + 1, len(ids)):
                pair_counts[(ids[x], ids[y])] += 1
    for (i, j), count in pair_counts.items():
        if count >= 2 or feats[i].norm == feats[j].norm:
            if find(i) != find(j) and same_event(feats[i], feats[j]):
                parent[find(j)] = find(i)

    groups: dict[int, list[dict]] = defaultdict(list)
    for i, a in enumerate(articles):
        groups[find(i)].append(a)
    return [sorted(g, key=primary_sort_key) for g in groups.values()]


def primary_sort_key(a: dict):
    """Official source > original reporting > aggregator; then priority; then earliest."""
    return (
        0 if a.get("official") else 1,
        1 if a.get("aggregator") else 0,
        -(a.get("source_priority") or 0),
        a.get("published_at") or "9999",
    )


def matches_any(title: str, others: Iterable[str]) -> bool:
    f = TitleFeatures(title)
    return any(same_event(f, TitleFeatures(o)) for o in others if o)


def dedupe_events(items: list[dict], key: str = "event_title") -> tuple[list[dict], list[dict]]:
    """Second-pass dedupe on LLM-named events. Items must be in rank order;
    returns (kept, dropped)."""
    kept: list[dict] = []
    dropped: list[dict] = []
    for it in items:
        name = it.get(key) or it.get("title") or ""
        if any(same_event(name, k.get(key) or k.get("title") or "") for k in kept):
            dropped.append(it)
        else:
            kept.append(it)
    return kept, dropped
