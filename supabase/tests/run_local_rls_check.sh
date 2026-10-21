#!/usr/bin/env bash
# Spins up a throwaway local PostgreSQL cluster and runs local_rls_check.sql. Linux/macOS/WSL only.
set -euo pipefail
cd "$(dirname "$0")/../.."
PGBIN=$(ls -d /usr/lib/postgresql/*/bin | tail -1)
DIR=$(mktemp -d); chown postgres "$DIR" 2>/dev/null || true
run() { if [ "$(id -u)" = 0 ]; then su postgres -c "$*"; else bash -c "$*"; fi; }
run "$PGBIN/initdb -D $DIR/data -A trust >/dev/null"
run "$PGBIN/pg_ctl -D $DIR/data -o '-p 54399 -k $DIR' -l $DIR/log start >/dev/null"
trap 'run "$PGBIN/pg_ctl -D '$DIR'/data stop >/dev/null" || true' EXIT
sleep 2
run "$PGBIN/createdb -h $DIR -p 54399 rlscheck"
run "cd $PWD && $PGBIN/psql -h $DIR -p 54399 -d rlscheck -v ON_ERROR_STOP=1 -f ${1:-supabase/tests/local_rls_check.sql}" 2>&1 | grep -E "PASS|FAIL|ERROR|ALL "
