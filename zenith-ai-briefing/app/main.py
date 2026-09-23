"""Command-line entry point:  python -m app --help"""
from __future__ import annotations

import argparse
import sys


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="python -m app", description="Zenith AI Morning Intelligence Engine")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--run", action="store_true", help="full pipeline + email (what the scheduler runs)")
    g.add_argument("--dry-run", action="store_true", help="full pipeline, save briefing locally, NO email")
    g.add_argument("--send-test", action="store_true", help="send one test email")
    g.add_argument("--url", metavar="URL", help="analyse one article URL you found yourself")
    g.add_argument("--check-sources", action="store_true", help="fetch every source once and report health")
    g.add_argument("--dashboard", action="store_true", help="start the local dashboard")
    g.add_argument("--init-db", action="store_true", help="create the database tables")
    g.add_argument("--cron", nargs="?", const="", metavar="HH:MM",
                   help="print the UTC cron line for a local delivery time (default DAILY_RUN_TIME)")
    p.add_argument("--force", action="store_true", help="with --run: regenerate/resend even if today's briefing was sent")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=8000)
    args = p.parse_args(argv)

    from app.config import get_settings
    from app.utils.logging_setup import setup_logging

    s = get_settings()
    setup_logging(s.log_level)

    if args.init_db:
        from app.database import init_db

        init_db()
        print(f"Database ready: {s.database_path}")
        return 0

    if args.cron is not None:
        from app.utils.timeutil import cron_for_local_time

        hhmm = args.cron or s.daily_run_time
        print(f'cron: "{cron_for_local_time(hhmm, s.timezone)}"   # {hhmm} {s.timezone}, expressed in UTC')
        return 0

    if args.send_test:
        from app.delivery.email_service import EmailError, send_test_email

        try:
            send_test_email()
        except EmailError as exc:
            print(f"✗ Test email failed: {exc}")
            return 1
        print(f"✓ Test email sent to {', '.join(s.email_to)}")
        return 0

    if args.url:
        from app.pipeline import ingest_url

        _, report = ingest_url(args.url)
        print("\n" + report)
        return 0

    if args.check_sources:
        return _check_sources()

    if args.dashboard:
        import uvicorn

        if args.host not in ("127.0.0.1", "localhost") and not (s.dashboard_username and s.dashboard_password):
            print("Refusing to expose the dashboard without DASHBOARD_USERNAME/DASHBOARD_PASSWORD set.")
            return 1
        uvicorn.run("app.dashboard.web:app", host=args.host, port=args.port, log_level="info")
        return 0

    from app.pipeline import run_pipeline

    report = run_pipeline(mode="dry-run" if args.dry_run else "run", force=args.force)
    print("\n" + report.summary())
    return 0 if report.ok else 1


def _check_sources() -> int:
    from concurrent.futures import ThreadPoolExecutor

    from app.config import load_sources
    from app.database import get_conn, init_db, record_source_result
    from app.ingestion.collector import fetch_source

    init_db()
    sources = load_sources()
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(fetch_source, sources))
    bad = 0
    with get_conn() as conn:
        for src, (items, status, error, _) in zip(sources, results):
            record_source_result(conn, src, ok=not error, status=status, item_count=len(items), error=error)
            if error:
                bad += 1
                print(f"✗ {src.name:<34} {error[:90]}")
            else:
                dated = sum(1 for i in items if i.published_at)
                print(f"✓ {src.name:<34} {len(items):>3} items ({dated} dated)")
    print(f"\n{len(sources) - bad}/{len(sources)} sources OK. Fix or disable failing ones in config/sources.yaml.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
