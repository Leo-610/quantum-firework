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

## 部署（Vercel）

- **生产**：`main` 分支 → https://quantum-fireworks-ebon.vercel.app
- **预览**：`develop` 分支 → Vercel Preview URL

环境变量见 `量子烟火/.env.vercel.example`，**切勿提交 `.env` 文件**。

详细说明：[量子烟火/VERCEL.md](./量子烟火/VERCEL.md)

## 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 生产环境，合并后自动部署 Production |
| `develop` | 开发/预览，Push 后生成 Preview 部署 |

## 安全说明

- `.env` 已在 `.gitignore` 中排除，密钥仅存放在本地与 Vercel Dashboard
- Coze Token、高德 Key 请通过 Vercel Environment Variables 或 `scripts/vercel-sync-env.sh` 配置
