# 量子烟火 (Quantum Fireworks)

北交大校园情绪可视化 Web 应用 — React + Vite 前端，Coze Bot / 工作流驱动。

## 目录结构

```
量子烟火/          # 前端 + Vercel Serverless API（生产部署根目录）
量子烟火-server/   # 本地开发 Express API 代理
```

## 快速开始（本地）

```bash
# 1. 配置环境变量
cp 量子烟火/.env.example 量子烟火/.env
cp 量子烟火-server/.env.example 量子烟火-server/.env
# 编辑 .env 填入高德 Key 与 Coze Token

# 2. 安装依赖并启动
cd 量子烟火 && pnpm install
cd ../量子烟火-server && npm install
cd ../量子烟火 && bash scripts/coze-preview-run.sh
```

## 部署（Vercel + GitHub）

| 分支 | 部署目标 | 域名 |
|------|----------|------|
| `main` | Production | https://quantum-fireworks-ebon.vercel.app |
| `develop` | Preview | 每次 Push 自动生成 Preview URL |

- **GitHub**：https://github.com/Leo-610/quantum-firework
- **Vercel 项目**：`leo-610s-projects/quantum-fireworks`（Root Directory = `量子烟火`，已关联 GitHub）
- Push 到 `main` 后自动触发生产部署；环境变量已在 Vercel Production 配置

### 首次推送到 GitHub

```bash
cd projects
# 需先登录 GitHub（浏览器或 Personal Access Token）
bash scripts/push-to-github.sh
```

推送脚本会在提交前检查 `.env` 是否误入 Git，**API 密钥不会上传**。

环境变量见 `量子烟火/.env.vercel.example`，仅存放在 Vercel Dashboard 与本地 `.env`。

## 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 生产环境，合并后自动部署 Production |
| `develop` | 开发/预览，Push 后生成 Preview 部署 |

## 安全说明

- `.env` 已在 `.gitignore` 中排除，密钥仅存放在本地与 Vercel Dashboard
- Coze Token、高德 Key 请通过 Vercel Environment Variables 或 `scripts/vercel-sync-env.sh` 配置
