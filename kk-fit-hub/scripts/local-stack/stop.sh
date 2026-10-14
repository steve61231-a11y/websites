#!/usr/bin/env bash
# Stops the local stack services (Postgres keeps running; stop it with pg_ctl).
cd "$(dirname "$0")/../.."
for f in .stack/run/*.pid; do [ -f "$f" ] && kill "$(cat "$f")" 2>/dev/null; rm -f "$f"; done
echo "Stopped."
