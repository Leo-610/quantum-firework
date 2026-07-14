# 量子烟火 (Quantum Fireworks)

北交大双模态校园情感智能体 — **里世界**情绪倾诉 × **表世界**食堂烟火，Coze 多 Agent + 高德 3D 地图。

| | |
|---|---|
| **在线体验** | https://bjtu.app |
| **GitHub** | https://github.com/Leo-610/quantum-firework |
| **竞赛** | 首届「火山杯」AI 应用创新大赛 · 北京交通大学 |

## 火山杯提交材料

| 材料 | 路径 | 说明 |
|------|------|------|
| 作品介绍文档 | [`量子烟火/竞赛提交文档.md`](./量子烟火/竞赛提交文档.md) | 简介 / 设计 / 技术 / 功能 / 价值（≤5MB） |
| 录屏脚本 | [`量子烟火/docs/竞赛录屏脚本.md`](./量子烟火/docs/竞赛录屏脚本.md) | 3–5 分钟分镜（≤50MB） |
| PPT 大纲 | [`量子烟火/docs/竞赛PPT大纲.md`](./量子烟火/docs/竞赛PPT大纲.md) | 16–18 页结构（≤20MB） |
| Coze 复现 | [`量子烟火/Coze配置手册.md`](./量子烟火/Coze配置手册.md) | Bot / 工作流配置 |

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

| 分支 | 项目 | 部署目标 | 域名 |
|------|------|----------|------|
| `main` | `quantum-fireworks` | Production | https://bjtu.app · https://quantum-fireworks-ebon.vercel.app |
| `main` | `quantum-fireworks-pku` | Production | https://quantum-fireworks-pku.vercel.app |
| `develop` | 两项目 Preview | Preview | 每次 Push 自动生成 Preview URL |

- **北交大 Vercel 项目**：`leo-610s-projects/quantum-fireworks`（Root Directory = `量子烟火`，默认 `VITE_CAMPUS=bjtu`）
- **北大 Vercel 项目**：`leo-610s-projects/quantum-fireworks-pku`（Root Directory = `量子烟火`，`VITE_CAMPUS=pku`）
- Push 到 `main` 后，若已连接 Git，两项目可分别自动部署

### PKU 一键部署 / 更新

```bash
cd 量子烟火
./scripts/vercel-deploy-pku.sh   # 同步 env + 生产部署
```

或首次完整配置：`./scripts/vercel-setup-pku.sh`

PKU 环境变量模板见 `.env.pku.example`；Coze / 高德 Key 与北交大项目共用同一套 Token。

### 首次推送到 GitHub

```bash
cd projects
bash scripts/push-to-github.sh
```

环境变量见 `量子烟火/.env.vercel.example`，仅存放在 Vercel Dashboard 与本地 `.env`。

## 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 生产环境，合并后自动部署 Production |
| `develop` | 开发/预览，Push 后生成 Preview 部署 |

## 文档索引

| 文档 | 说明 |
|------|------|
| [竞赛提交文档](./量子烟火/竞赛提交文档.md) | 作品介绍（火山杯主文档） |
| [后续计划与商业化](./量子烟火/后续计划与商业化.md) | 路线图与商业化 |
| [VERCEL.md](./量子烟火/VERCEL.md) | 生产部署 |
| [AGENTS.md](./量子烟火/AGENTS.md) | 开发指南 |

## 安全说明

- `.env` 已在 `.gitignore` 中排除，密钥仅存放在本地与 Vercel Dashboard
- Coze Token、高德 Key 请通过 Vercel Environment Variables 配置
