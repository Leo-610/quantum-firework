#!/usr/bin/env bash
# 配置 Vercel PKU 项目：切换 link → 同步 env → 生产部署 → 恢复 BJTU link
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_ENV="${1:-$ROOT/../量子烟火-server/.env}"
FRONT_ENV="${2:-$ROOT/.env}"
PKU_PROJECT="${VERCEL_PKU_PROJECT:-quantum-fireworks-pku}"
BJTU_PROJECT="${VERCEL_BJTU_PROJECT:-quantum-fireworks}"
SCOPE="${VERCEL_SCOPE:-leo-610s-projects}"
VERCEL_DIR="$ROOT/.vercel"
BJTU_LINK_BACKUP="$VERCEL_DIR/project.bjtu.json"

export PATH="${ROOT}/../.tools/node-v20.19.2-darwin-arm64/bin:${PATH:-}"

cd "$ROOT"

VERCEL_BIN="${VERCEL_BIN:-$(command -v vercel 2>/dev/null || true)}"
if [[ -z "$VERCEL_BIN" ]]; then
  export NPM_CONFIG_PREFIX="${ROOT}/../.tools/vercel-cli-cache"
  mkdir -p "$NPM_CONFIG_PREFIX"
  npm install --prefix "$NPM_CONFIG_PREFIX" vercel@54.17.3 --no-save --silent 2>/dev/null || true
  VERCEL_BIN="$NPM_CONFIG_PREFIX/node_modules/.bin/vercel"
fi
vercel() { "$VERCEL_BIN" "$@"; }

echo "==> Vercel PKU 部署配置"
echo "    PKU 项目: $SCOPE/$PKU_PROJECT"
echo "    工作目录: $ROOT"

if [[ -f "$VERCEL_DIR/project.json" ]]; then
  cp "$VERCEL_DIR/project.json" "$BJTU_LINK_BACKUP"
  echo "    已备份 BJTU link → .vercel/project.bjtu.json"
fi

if ! vercel project ls 2>/dev/null | grep -q "$PKU_PROJECT"; then
  echo "==> 创建项目 $PKU_PROJECT ..."
  vercel project add "$PKU_PROJECT"
fi

echo "==> 关联本地目录到 $PKU_PROJECT ..."
vercel link --yes --project "$PKU_PROJECT" --scope "$SCOPE"

add_var() {
  local key="$1"
  local val="$2"
  local env="${3:-production}"
  echo "设置 $key ($env) ..."
  vercel env add "$key" "$env" --value "$val" --yes --force
}

add_var VITE_CAMPUS pku production
add_var VITE_CAMPUS pku preview
add_var VITE_CAMPUS pku development

if [[ -f "$SERVER_ENV" ]]; then
  VARS=(
    COZE_EMOTION_URL COZE_EMOTION_TOKEN
    COZE_FOOD_URL COZE_FOOD_TOKEN
    COZE_ROUTER_URL COZE_ROUTER_TOKEN
    COZE_INNER_URL COZE_INNER_TOKEN
    COZE_OUTER_URL COZE_OUTER_TOKEN
  )
  for key in "${VARS[@]}"; do
    val=$(grep -E "^${key}=" "$SERVER_ENV" | head -1 | cut -d= -f2- || true)
    if [[ -z "$val" ]]; then
      echo "跳过 $key（$SERVER_ENV 未设置）"
      continue
    fi
    add_var "$key" "$val" production
    add_var "$key" "$val" preview
  done
else
  echo "警告: 找不到 $SERVER_ENV，Coze 变量请手动在 Dashboard 配置"
fi

if [[ -f "$FRONT_ENV" ]]; then
  for key in VITE_AMAP_KEY VITE_AMAP_SECURITY_CODE; do
    val=$(grep -E "^${key}=" "$FRONT_ENV" | head -1 | cut -d= -f2- || true)
    if [[ -n "$val" ]]; then
      add_var "$key" "$val" production
      add_var "$key" "$val" preview
    else
      echo "跳过 $key（$FRONT_ENV 未设置）"
    fi
  done
else
  echo "警告: 找不到 $FRONT_ENV，地图 Key 请手动配置"
fi

echo ""
echo "==> 部署 PKU Production ..."
vercel deploy --prod --yes

DEPLOY_URL=$(vercel ls --prod 2>/dev/null | awk 'NR==2 {print $2}' || true)

echo ""
echo "==> 恢复 BJTU 本地 link ($BJTU_PROJECT) ..."
if [[ -f "$BJTU_LINK_BACKUP" ]]; then
  cp "$BJTU_LINK_BACKUP" "$VERCEL_DIR/project.json"
else
  vercel link --yes --project "$BJTU_PROJECT" --scope "$SCOPE"
fi

echo ""
echo "✅ PKU 部署完成"
[[ -n "$DEPLOY_URL" ]] && echo "   Production URL: https://$DEPLOY_URL"
echo "   Dashboard: https://vercel.com/$SCOPE/$PKU_PROJECT"
echo ""
echo "建议后续在 Dashboard 完成："
echo "  · Git → 连接 Leo-610/quantum-firework，Root Directory = 量子烟火"
echo "  · Domains → 绑定 pku.app（可选）"
