# 量子烟火 · Vercel 部署指南

> 原项目已备份至：`../projects-backup-20260610/`（不含 node_modules）

## 架构

```
浏览器 → Vercel CDN (dist 静态资源)
       → /api/* → Vercel Serverless Functions (api/*.js)
                 → Coze *.coze.site
```

本地开发不变：仍用 `量子烟火-server` + Vite 代理。  
Vercel 部署使用 `api/` 目录，与 Express 共用 `api/_lib/coze-proxy.js` 逻辑。

## 部署结果（2026-06-10）

| 项 | 北交大 | 北大燕园 |
|----|--------|----------|
| 生产域名 | https://bjtu.app | https://quantum-fireworks-pku.vercel.app |
| Vercel 项目 | `quantum-fireworks` | `quantum-fireworks-pku` |
| 关键 env | 默认（无 `VITE_CAMPUS`） | `VITE_CAMPUS=pku` |
| Dashboard | [quantum-fireworks](https://vercel.com/leo-610s-projects/quantum-fireworks) | [quantum-fireworks-pku](https://vercel.com/leo-610s-projects/quantum-fireworks-pku) |

两项目共用同一 Git 仓库，**Root Directory 均设为 `量子烟火`**。北大版需在 PKU 项目中单独设置 `VITE_CAMPUS=pku`（其余 Coze / 高德变量与北交大相同）。

### PKU 部署脚本

```bash
cd projects/量子烟火
./scripts/vercel-setup-pku.sh   # 首次：创建项目 + 同步 env + 部署
./scripts/vercel-deploy-pku.sh  # 后续：同步 env + 重新部署
```

可选：在 PKU 项目 Domains 中绑定 `pku.app`。

### 启用真实 Coze API

在项目目录执行（会从 `../量子烟火-server/.env` 读取 Token 并写入 Vercel）：

```bash
cd projects/量子烟火
./scripts/vercel-sync-env.sh
vercel --prod
```

或在 [Vercel Dashboard → quantum-fireworks → Settings → Environment Variables](https://vercel.com/leo-610s-projects/quantum-fireworks/settings/environment-variables) 手动粘贴 `.env.vercel.example` 中的变量。

## 一键部署

```bash
cd projects/量子烟火

# 1. 安装 Vercel CLI（若未安装）
npm i -g vercel

# 2. 登录并关联项目
vercel login
vercel link

# 3. 从本地 server .env 同步 Token（可选）
# 手动在 Vercel Dashboard 填入，或：
vercel env add COZE_EMOTION_TOKEN
# ... 其余 COZE_* 变量见 .env.vercel.example

# 4. Preview 部署
vercel

# 5. 生产部署
vercel --prod
```

## 环境变量清单

| 变量 | 必填 | 说明 |
|------|------|------|
| COZE_EMOTION_TOKEN | ✅ | 情绪工作流 |
| COZE_FOOD_TOKEN | ✅ | 美食工作流 |
| COZE_ROUTER_TOKEN | ✅ | Router Bot |
| COZE_INNER_TOKEN | ✅ | Inner Bot 流式 |
| COZE_OUTER_TOKEN | ✅ | Outer Bot |
| VITE_AMAP_KEY | ✅ | 高德地图 |
| VITE_AMAP_SECURITY_CODE | ✅ | 高德安全密钥 |
| VITE_CAMPUS | PKU 项目必填 | `pku` 启用北大燕园；北交大项目不设或 `bjtu` |

Token 可从 `../量子烟火-server/.env` 复制。

## 部署后验证

```bash
# 健康检查
curl https://你的域名.vercel.app/api/health

# 情绪工作流
curl -X POST https://你的域名.vercel.app/api/emotion \
  -H "Content-Type: application/json" \
  -d '{"user_text":"今天好焦虑","location":{"name":"思源楼"}}'
```

浏览器 Console 应出现 `[Emotion Workflow] 响应:` 而非 Mock 降级。

## 函数超时

`vercel.json` 已设 `maxDuration: 60` 秒。若 Coze 响应 >60s，在 Dashboard 开启 Fluid Compute 或升级 Pro。

## 回滚

如需恢复部署前状态，从 `projects-backup-20260610/` 复制回来；或删除 `api/`、`vercel.json` 即可恢复纯本地模式。
