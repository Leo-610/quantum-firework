#!/usr/bin/env bash
# 首次推送需 GitHub 登录，见下方说明
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REMOTE="${1:-https://github.com/Leo-610/quantum-firework.git}"

# 推送前检查：禁止 .env 等敏感文件进入 Git
if git ls-files --cached | grep -qE '(^|/)\.env(\.|$)|\.env\.local'; then
  echo "错误：检测到已暂存的 .env 文件，拒绝推送以保护 API 密钥"
  git ls-files --cached | grep -E '(^|/)\.env(\.|$)|\.env\.local' || true
  exit 1
fi
if git diff --cached --name-only | grep -qE '(^|/)\.env(\.|$)|\.env\.local'; then
  echo "错误：暂存区含 .env 文件"
  exit 1
fi

if ! git remote get-url origin &>/dev/null; then
  git remote add origin "$REMOTE"
fi

echo "推送到 $REMOTE ..."
echo "  分支: main (Production), develop (Preview)"
echo ""

# 优先使用 gh（官方 GitHub CLI）
if command -v gh &>/dev/null; then
  gh auth status || gh auth login
  gh auth setup-git
fi

git push -u origin main
git push -u origin develop

echo ""
echo "完成。GitHub: $REMOTE"
echo "Vercel: main → Production，develop → Preview"
echo "环境变量仅存 Vercel Dashboard，勿提交 .env"
