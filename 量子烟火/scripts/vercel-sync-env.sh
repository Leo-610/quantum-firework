#!/usr/bin/env bash
# 将本地 .env 同步到 Vercel Production（密钥不进 Git）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT/../量子烟火-server/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "找不到 $ENV_FILE"
  exit 1
fi

cd "$ROOT"
export PATH="${ROOT}/../.tools/node-v20.19.2-darwin-arm64/bin:${PATH:-}"

add_var() {
  local key="$1"
  local val="$2"
  echo "设置 $key (production) ..."
  npx vercel@latest env add "$key" production --value "$val" --yes --force
}

VARS=(
  COZE_EMOTION_URL COZE_EMOTION_TOKEN
  COZE_FOOD_URL COZE_FOOD_TOKEN
  COZE_ROUTER_URL COZE_ROUTER_TOKEN
  COZE_INNER_URL COZE_INNER_TOKEN
  COZE_OUTER_URL COZE_OUTER_TOKEN
)

for key in "${VARS[@]}"; do
  val=$(grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d= -f2- || true)
  if [[ -z "$val" ]]; then
    echo "跳过 $key（未设置）"
    continue
  fi
  add_var "$key" "$val"
done

if [[ -f "$ROOT/.env" ]]; then
  for key in VITE_AMAP_KEY VITE_AMAP_SECURITY_CODE; do
    val=$(grep -E "^${key}=" "$ROOT/.env" | head -1 | cut -d= -f2- || true)
    [[ -n "$val" ]] && add_var "$key" "$val" || echo "跳过 $key（未设置）"
  done
fi

echo "Production 环境变量已同步。Preview 请在 Vercel Dashboard 勾选 Preview 后批量复制。"
