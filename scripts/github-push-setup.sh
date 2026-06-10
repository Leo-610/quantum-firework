#!/usr/bin/env bash
# 安装 GitHub CLI 并完成登录后推送（需在本机终端交互执行一次）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$ROOT/.tools"
GH_DIR="$TOOLS/gh"
GH_BIN="$GH_DIR/bin/gh"
PATH="$ROOT/.tools/node-v20.19.2-darwin-arm64/bin:$PATH"

if [[ ! -x "$GH_BIN" ]]; then
  echo "正在下载 GitHub CLI..."
  mkdir -p "$TOOLS"
  tmp=$(mktemp -d)
  curl -fsSL "https://github.com/cli/cli/releases/download/v2.67.0/gh_2.67.0_macOS_arm64.zip" -o "$tmp/gh.zip"
  unzip -qo "$tmp/gh.zip" -d "$tmp"
  rm -rf "$GH_DIR"
  mv "$tmp/gh_2.67.0_macOS_arm64" "$GH_DIR"
  rm -rf "$tmp"
fi

export PATH="$GH_DIR/bin:$PATH"

if ! gh auth status &>/dev/null; then
  echo "请在浏览器中完成 GitHub 登录..."
  gh auth login --hostname github.com --git-protocol https --web
fi

gh auth setup-git
cd "$ROOT"
bash scripts/push-to-github.sh
