"""Structured-ish logging: one line per event, key=value context, never secrets."""
from __future__ import annotations

import logging
import sys


def setup_logging(level: str = "INFO") -> None:
    root = logging.getLogger()
    if getattr(root, "_zenith_configured", False):
        root.setLevel(level)
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)-7s %(name)s | %(message)s", "%H:%M:%S"))
    root.handlers[:] = [handler]
    root.setLevel(level)
    for noisy in ("httpx", "httpcore", "urllib3", "trafilatura", "htmldate", "charset_normalizer", "openai"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
    root._zenith_configured = True  # type: ignore[attr-defined]
