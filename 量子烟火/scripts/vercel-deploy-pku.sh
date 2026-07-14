#!/usr/bin/env bash
# 继续 PKU 部署：同步剩余 env → 生产部署（需已 link 到 quantum-fireworks-pku）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_ENV="${1:-$ROOT/../量子烟火-server/.env}"
FRONT_ENV="${2:-$ROOT/.env}"
BJTU_PROJECT="${VERCEL_BJTU_PROJECT:-quantum-fireworks}"
SCOPE="${VERCEL_SCOPE:-leo-610s-projects}"
VERCEL_DIR="$ROOT/.vercel"
BJTU_LINK_BACKUP="$VERCEL_DIR/project.bjtu.json"

export PATH="${ROOT}/../.tools/node-v20.19.2-darwin-arm64/bin:${PATH:-}"
export NPM_CONFIG_PREFIX="${ROOT}/../.tools/vercel-cli-cache"
mkdir -p "$NPM_CONFIG_PREFIX"
[[ -x "$NPM_CONFIG_PREFIX/node_modules/.bin/vercel" ]] || npm install --prefix "$NPM_CONFIG_PREFIX" vercel@54.17.3 --no-save --silent
VERCEL="$NPM_CONFIG_PREFIX/node_modules/.bin/vercel"

cd "$ROOT"

if [[ ! -f "$VERCEL_DIR/project.json" ]] || ! grep -q quantum-fireworks-pku "$VERCEL_DIR/project.json"; then
  echo "请先运行 ./scripts/vercel-setup-pku.sh 或 vercel link --project quantum-fireworks-pku"
  exit 1
fi

[[ -f "$BJTU_LINK_BACKUP" ]] || cp "$VERCEL_DIR/project.json" "$BJTU_LINK_BACKUP" 2>/dev/null || true

add_var() {
  local key="$1" val="$2" env="${3:-production}"
  echo "→ $key ($env)"
  "$VERCEL" env add "$key" "$env" --value "$val" --yes --force
}

for env in preview development; do
  add_var VITE_CAMPUS pku "$env"
done

if [[ -f "$SERVER_ENV" ]]; then
  for key in COZE_EMOTION_URL COZE_EMOTION_TOKEN COZE_FOOD_URL COZE_FOOD_TOKEN \
    COZE_ROUTER_URL COZE_ROUTER_TOKEN COZE_INNER_URL COZE_INNER_TOKEN \
    COZE_OUTER_URL COZE_OUTER_TOKEN; do
    val=$(grep -E "^${key}=" "$SERVER_ENV" | head -1 | cut -d= -f2- || true)
    [[ -n "$val" ]] || { echo "跳过 $key"; continue; }
    add_var "$key" "$val" production
    add_var "$key" "$val" preview
  done
fi

if [[ -f "$FRONT_ENV" ]]; then
  for key in VITE_AMAP_KEY VITE_AMAP_SECURITY_CODE; do
    val=$(grep -E "^${key}=" "$FRONT_ENV" | head -1 | cut -d= -f2- || true)
    [[ -n "$val" ]] || { echo "跳过 $key"; continue; }
    add_var "$key" "$val" production
    add_var "$key" "$val" preview
  done
fi

echo ""
echo "==> 部署 Production ..."
"$VERCEL" deploy --prod --yes

echo ""
echo "==> 恢复 BJTU link ..."
if [[ -f "$BJTU_LINK_BACKUP" ]] && grep -q quantum-fireworks "$BJTU_LINK_BACKUP" 2>/dev/null; then
  cp "$BJTU_LINK_BACKUP" "$VERCEL_DIR/project.json"
else
  "$VERCEL" link --yes --project "$BJTU_PROJECT" --scope "$SCOPE"
fi

echo ""
echo "✅ PKU 部署完成"
"$VERCEL" ls --project quantum-fireworks-pku --prod 2>/dev/null | head -5 || true
echo "Dashboard: https://vercel.com/$SCOPE/quantum-fireworks-pku"
