#!/usr/bin/env bash
# 从前端 .env 生成 量子烟火-server/.env（不含硬编码 Token）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FRONT_ENV="$ROOT/量子烟火/.env"
SERVER_ENV="$ROOT/量子烟火-server/.env"
EXAMPLE="$ROOT/量子烟火-server/.env.example"

read_env() {
  local key="$1"
  local file="$2"
  if [ -f "$file" ]; then
    grep -E "^${key}=" "$file" 2>/dev/null | head -1 | cut -d= -f2- || true
  fi
}

if [ -f "$SERVER_ENV" ]; then
  echo "已存在 $SERVER_ENV，跳过生成"
  exit 0
fi

ROUTER_TOKEN="$(read_env VITE_COZE_ROUTER_TOKEN "$FRONT_ENV")"
INNER_TOKEN="$(read_env VITE_COZE_INNER_TOKEN "$FRONT_ENV")"
OUTER_TOKEN="$(read_env VITE_COZE_OUTER_TOKEN "$FRONT_ENV")"
ROUTER_URL="$(read_env VITE_COZE_ROUTER_URL "$FRONT_ENV")"
INNER_URL="$(read_env VITE_COZE_INNER_URL "$FRONT_ENV")"
OUTER_URL="$(read_env VITE_COZE_OUTER_URL "$FRONT_ENV")"

{
  echo "PORT=3001"
  echo ""
  echo "COZE_EMOTION_URL=https://hbm2bmdpjj.coze.site/run"
  echo "COZE_EMOTION_TOKEN=${COZE_EMOTION_TOKEN:-your_emotion_workflow_token}"
  echo ""
  echo "COZE_FOOD_URL=https://nkq9pcx6y3.coze.site/run"
  echo "COZE_FOOD_TOKEN=${COZE_FOOD_TOKEN:-your_food_workflow_token}"
  echo ""
  echo "COZE_ROUTER_URL=${ROUTER_URL:-https://wpfzsvhxzc.coze.site/stream_run}"
  echo "COZE_ROUTER_TOKEN=${ROUTER_TOKEN:-your_router_bot_token}"
  echo ""
  echo "COZE_INNER_URL=${INNER_URL:-https://z645x6r9ym.coze.site/stream_run}"
  echo "COZE_INNER_TOKEN=${INNER_TOKEN:-your_inner_bot_token}"
  echo ""
  echo "COZE_OUTER_URL=${OUTER_URL:-https://f78t3fzp7w.coze.site/stream_run}"
  echo "COZE_OUTER_TOKEN=${OUTER_TOKEN:-your_outer_bot_token}"
} > "$SERVER_ENV"

chmod 600 "$SERVER_ENV" 2>/dev/null || true
echo "已生成 $SERVER_ENV"
echo "请确认 COZE_EMOTION_TOKEN / COZE_FOOD_TOKEN 已从 Coze 控制台填入"
