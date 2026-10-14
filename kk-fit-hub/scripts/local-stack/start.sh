#!/usr/bin/env bash
# Starts a local stand-in for a Supabase project when Docker (and so
# `supabase start`) is unavailable: Postgres 16, Supabase Auth (GoTrue),
# PostgREST, a storage stand-in and a gateway on :54321. Idempotent.
#
#   npm run stack:start      # then: set -a; source .stack/env; set +a
#
# With Docker available, prefer `npx supabase start`, which runs the real
# services and applies supabase/migrations and supabase/seed.sql.
set -euo pipefail
cd "$(dirname "$0")/../.."
ROOT=$(pwd)
STACK=${STACK_DIR:-$ROOT/.stack}
PGPORT=${PGPORT:-54322}
JWT_SECRET=${JWT_SECRET:-super-secret-jwt-token-with-at-least-32-characters-long}
AUTH_VERSION=2.186.0
PGRST_VERSION=12.2.12
mkdir -p "$STACK"/{bin,logs,run}

as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -c "$*"; else bash -c "$*"; fi; }
PGBIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)
psqlc() { psql -v ON_ERROR_STOP=1 -q -h 127.0.0.1 -p "$PGPORT" -U postgres "$@"; }

# 1. Binaries
if [ ! -x "$STACK/bin/auth" ]; then
  curl -fsSL "https://github.com/supabase/auth/releases/download/v$AUTH_VERSION/auth-v$AUTH_VERSION-x86.tar.gz" | tar xz -C "$STACK/bin"
fi
if [ ! -x "$STACK/bin/postgrest" ]; then
  curl -fsSL "https://github.com/PostgREST/postgrest/releases/download/v$PGRST_VERSION/postgrest-v$PGRST_VERSION-linux-static-x86-64.tar.xz" | tar xJ -C "$STACK/bin"
fi

# 2. Postgres
if ! pg_isready -q -h 127.0.0.1 -p "$PGPORT"; then
  if [ ! -d "$STACK/pgdata" ]; then
    mkdir -p "$STACK/pgdata"; [ "$(id -u)" = 0 ] && chown postgres "$STACK/pgdata" "$STACK/logs"
    as_pg "$PGBIN/initdb -D $STACK/pgdata -U postgres --auth=trust >/dev/null"
  fi
  as_pg "$PGBIN/pg_ctl -D $STACK/pgdata -o '-p $PGPORT -k /tmp' -l $STACK/logs/postgres.log start >/dev/null"
  until pg_isready -q -h 127.0.0.1 -p "$PGPORT"; do sleep 0.5; done
fi
psqlc -tc "select 1 from pg_database where datname='kk'" | grep -q 1 || psqlc -c "create database kk"
psqlc -d kk -f scripts/local-stack/bootstrap.sql 2>&1 | grep -v NOTICE || true

export GOTRUE_DB_DRIVER=postgres
export DATABASE_URL="postgres://supabase_auth_admin:auth@127.0.0.1:$PGPORT/kk"
export GOTRUE_DB_MIGRATIONS_PATH="$STACK/bin"
export GOTRUE_JWT_SECRET=$JWT_SECRET GOTRUE_JWT_EXP=3600 GOTRUE_JWT_AUD=authenticated GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated
export API_EXTERNAL_URL="http://127.0.0.1:54321/auth/v1" GOTRUE_SITE_URL="http://localhost:3000"
export GOTRUE_API_HOST=127.0.0.1 PORT=9999
export GOTRUE_DISABLE_SIGNUP=true GOTRUE_EXTERNAL_EMAIL_ENABLED=true GOTRUE_MAILER_AUTOCONFIRM=true
export GOTRUE_MFA_TOTP_ENROLL_ENABLED=true GOTRUE_MFA_TOTP_VERIFY_ENABLED=true GOTRUE_MFA_MAX_ENROLLED_FACTORS=10
export GOTRUE_RATE_LIMIT_HEADER="" GOTRUE_SECURITY_REFRESH_TOKEN_ROTATION_ENABLED=true
(cd "$STACK/bin" && ./auth migrate >"$STACK/logs/auth-migrate.log" 2>&1)

# 3. App schema
if ! psqlc -d kk -tc "select to_regclass('public.activities')" | grep -q activities; then
  for f in supabase/migrations/*.sql; do psqlc -d kk -f "$f"; done
  psqlc -d kk -f supabase/seed.sql
fi

# 4. Keys and services
eval "$(node scripts/local-stack/keys.mjs "$JWT_SECRET")"
start() { # name, command...
  local name=$1; shift
  if [ -f "$STACK/run/$name.pid" ] && kill -0 "$(cat "$STACK/run/$name.pid")" 2>/dev/null; then return; fi
  nohup "$@" >"$STACK/logs/$name.log" 2>&1 &
  echo $! >"$STACK/run/$name.pid"
}
start auth bash -c "cd '$STACK/bin' && exec ./auth serve"
PGRST_DB_URI="postgres://authenticator:authenticator@127.0.0.1:$PGPORT/kk" PGRST_DB_SCHEMAS=public \
  PGRST_DB_ANON_ROLE=anon PGRST_JWT_SECRET=$JWT_SECRET PGRST_SERVER_PORT=3001 PGRST_SERVER_HOST=127.0.0.1 \
  PGRST_DB_CHANNEL_ENABLED=true start rest "$STACK/bin/postgrest"
STORAGE_DIR="$STACK/storage" SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY start storage node scripts/local-stack/storage-mock.mjs
start gateway node scripts/local-stack/gateway.mjs

for i in $(seq 1 40); do
  curl -fs -o /dev/null http://127.0.0.1:54321/auth/v1/health && curl -fs -o /dev/null "http://127.0.0.1:54321/rest/v1/" -H "apikey: $ANON_KEY" && break
  sleep 0.5
done

cat >"$STACK/env" <<ENV
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
DATABASE_URL=postgres://postgres@127.0.0.1:$PGPORT/kk
TEST_DATABASE_URL=postgres://postgres@127.0.0.1:$PGPORT/kk
NEXT_PUBLIC_SITE_URL=http://localhost:3100
CRON_SECRET=local-cron-secret
ENV
echo "Local stack ready. Environment written to .stack/env"
