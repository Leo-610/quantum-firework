#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER_DIR="$(cd "$PROJECT_DIR/../量子烟火-server" && pwd)"

kill_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti "tcp:${port}" | xargs kill -9 2>/dev/null || true
  elif command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  fi
}

kill_port 3001
kill_port 5000
sleep 1

if [ ! -f "$SERVER_DIR/.env" ]; then
  bash "$PROJECT_DIR/scripts/setup-server-env.sh" || true
fi

cd "$SERVER_DIR"
node server.js &
BACKEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

sleep 2

cd "$PROJECT_DIR"
export PORT=5000
export NODE_ENV=development
exec pnpm exec vite --host 0.0.0.0 --port 5000
