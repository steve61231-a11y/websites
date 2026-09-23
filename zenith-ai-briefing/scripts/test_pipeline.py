"""End-to-end dry run. Never sends email.

  python scripts/test_pipeline.py            # real sources + your configured model
  python scripts/test_pipeline.py --offline  # bundled fixtures + fake model (no network, no API key)

Exit code 0 = a valid briefing was produced.
"""
from __future__ import annotations

import argparse
import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", action="store_true", help="use test fixtures and a fake LLM")
    args = ap.parse_args()

    if args.offline:
        tmp = Path(tempfile.mkdtemp(prefix="zenith-offline-"))
        os.environ["DATABASE_PATH"] = str(tmp / "offline.db")
        os.environ["OUTPUT_DIR"] = str(tmp / "briefings")

    from app.config import reload_settings
    from app.utils.logging_setup import setup_logging

    s = reload_settings()
    setup_logging("INFO")
    from app.pipeline import run_pipeline

    if args.offline:
        from app.llm.provider import LLMClient
        from tests.conftest import FakeHttp
        from tests.fakes import FakeProvider
        from tests.test_pipeline import ROUTES, sources

        report = run_pipeline(mode="dry-run", sources=sources(), http_factory=lambda: FakeHttp(ROUTES),
                              llm=LLMClient(FakeProvider(), sleep=lambda _: None))
    else:
        report = run_pipeline(mode="dry-run")

    print("\n" + report.summary())
    b = report.briefing
    problems = []
    if not b:
        problems.append("no briefing generated")
    else:
        if not b.get("signal"):
            problems.append("missing TODAY'S SIGNAL")
        for st in b["top_stories"]:
            if not st["primary_url"].startswith("http"):
                problems.append(f"story without a source link: {st['event_title']}")
        if not b["top_stories"]:
            print("\nNote: no stories cleared the quality bar (possible on quiet days or with most sources failing).")
    if problems:
        print("\n✗ " + "\n✗ ".join(problems))
        return 1
    print(f"\n✓ Dry run OK — open {report.html_path} in a browser to see the email.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
