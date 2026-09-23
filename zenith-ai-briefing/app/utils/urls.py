"""URL normalization — the first line of duplicate detection."""
from __future__ import annotations

import re
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

TRACKING_PARAMS = {
    "fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid", "igshid", "yclid", "_hsenc", "_hsmi",
    "ref", "ref_src", "ref_url", "source", "cmpid", "ncid", "sr_share", "smid", "cid", "icid",
    "guccounter", "guce_referrer", "guce_referrer_sig", "mkt_tok", "spm", "s", "share", "via",
    "output", "amp", "feature", "si", "sref", "taid", "trk", "wt.mc_id", "rss", "partner",
}
TRACKING_PREFIXES = ("utm_", "pk_", "mtm_", "hsa_", "__")


def normalize_url(url: str) -> str:
    """Canonical form used as the uniqueness key for articles.

    - https, lowercase host, no leading www./m./amp.
    - tracking params removed, remaining params sorted
    - fragment removed, trailing slash and /amp suffix removed
    YouTube watch URLs keep their v= parameter.
    """
    if not url:
        return ""
    url = url.strip()
    if url.startswith("//"):
        url = "https:" + url
    p = urlparse(url)
    if not p.scheme:
        p = urlparse("https://" + url)
    host = (p.hostname or "").lower()
    for prefix in ("www.", "m.", "amp.", "mobile."):
        if host.startswith(prefix) and host.count(".") >= 2:
            host = host[len(prefix):]
    if p.port and p.port not in (80, 443):
        host = f"{host}:{p.port}"
    path = re.sub(r"/{2,}", "/", p.path or "/")
    path = re.sub(r"/(amp|index\.html?)/?$", "/", path)
    if len(path) > 1:
        path = path.rstrip("/")
    query = [
        (k, v) for k, v in parse_qsl(p.query, keep_blank_values=False)
        if k.lower() not in TRACKING_PARAMS and not k.lower().startswith(TRACKING_PREFIXES)
    ]
    query.sort()
    return urlunparse(("https", host, path, "", urlencode(query), ""))


def absolute_url(base: str, href: str) -> str:
    return urljoin(base, href.strip())


def domain(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()
    return host[4:] if host.startswith("www.") else host


def is_http_url(url: str) -> bool:
    try:
        p = urlparse(url)
    except ValueError:
        return False
    return p.scheme in ("http", "https") and bool(p.netloc)
