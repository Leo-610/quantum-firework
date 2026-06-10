# 量子烟火 - Agent 维护手册

## 项目概述

北京交通大学校园智能体"量子烟火"，通过情绪工作流和美食工作流为学生提供情感支持和美食点评服务。

## 技术栈

- **前端**: React + Vite + Tailwind CSS + Framer Motion
- **后端**: Express.js (本地代理服务，可选)
- **API**: Coze 平台工作流

## 目录结构

```
/workspace/projects/
├── 量子烟火/           # 前端项目
│   ├── src/
│   │   ├── api/coze.js  # Coze API 调用封装
│   │   └── ...
│   └── dist/            # 构建产物
│
└── 量子烟火-server/     # 后端代理服务（可选）
    └── server.js        # Express 服务
```

## API 配置

### Coze 工作流

- **情绪工作流**: `https://hbm2bmdpjj.coze.site/run`
- **美食工作流**: `https://nkq9pcx6y3.coze.site/run`

### Token 配置

Token 统一放在 `量子烟火-server/.env`，运行 `scripts/setup-server-env.sh` 可从前端 `.env` 迁移 Bot Token。
工作流 Token（emotion/food）需在 Coze 控制台获取后手动填入 server `.env`。

## 运行方式

### 首次配置
```bash
# 从前端 .env 生成后端 .env（Bot Token 自动迁移）
bash 量子烟火/scripts/setup-server-env.sh
# 手动补全 server/.env 中的 COZE_EMOTION_TOKEN 和 COZE_FOOD_TOKEN
```

### 开发预览 (本地)
```bash
bash 量子烟火/scripts/coze-preview-run.sh
# 或分别启动：
cd 量子烟火-server && node server.js   # :3001
cd 量子烟火 && pnpm dev                # :5000
```

浏览器打开 http://localhost:5000

### API 架构
- 前端 → `/api/*` → Vite 代理 → `量子烟火-server:3001` → Coze
- Token 仅存于 `量子烟火-server/.env`，前端无密钥
- API 失败时自动降级 Mock（控制台可见 `[使用 Mock]` / `降级` 日志）

### CORS 说明
- **本地开发**: 经后端代理，无跨域问题
- **Coze 预览环境**: 需确保后端服务可达，或依赖 Mock 降级

### 生产构建
```bash
cd /workspace/projects/量子烟火
pnpm build
```

### CORS 说明
- **本地开发**: Vite 代理 + 后端服务正常工作
- **Coze 预览环境**: 直接调用 Coze API，可能被 CORS 阻止，会自动降级到 Mock 数据

## Mock 数据结构

### 时空回响语料库 (ECHO_RECORDS)
| 场景 | 条目 |
|------|------|
| 思源楼 | 5条 |
| 图书馆 | 5条 |
| 操场 | 5条 |
| 红果园 | 5条 |
| 嘉园宿舍 | 5条 |
| 学苑食堂 | 3条 |
| 通用 | 5条 |

### 情绪植物分类 (共49种)
| 情绪 | 植物数量 | 代表植物 |
|------|----------|----------|
| 焦虑迷茫 | 6种 | 月光花、薰衣草、紫晶簇、忘忧草、白杨、蓝铃花 |
| 失落难过 | 6种 | 彼岸花、曼珠沙华、银杏、紫曜菇、勿忘我、紫罗兰 |
| 疲惫无力 | 6种 | 向日葵、苔藓、垂柳、云朵菇、小雏菊、月光石 |
| 困惑迷茫 | 6种 | 海蓝晶、天使之泪、紫藤萝、萤火星草、罗汉松、风信子 |
| 孤独寂寞 | 6种 | 雪花莲、梧桐、月光藜、金曜石、四叶草、满天星 |
| 期待希望 | 6种 | 雏菊、迎春花、祖母绿、幸运草、樱花、朝阳菇 |
| 平静释然 | 6种 | 睡莲、松柏、琥珀菌、月光石、薰衣草、郁金香 |
| 通用 | 7种 | 火焰兰、青岩草、银叶树、樱草、紫水晶、糖霜菇 |

## 环境变量配置

### 文件说明
| 文件 | 用途 | 备注 |
|------|------|------|
| `.env` | 本地敏感配置 | **不提交到 Git**，包含真实 API Key |
| `.env.example` | 配置模板 | 仅占位符，提交到 Git |
| `.gitignore` | 忽略文件列表 | 保护 `.env` 不被提交 |

### 配置步骤
1. 复制 `.env.example` 为 `.env`
2. 填写真实的高德地图和 Coze API 配置
3. 确保 `.env` 不被提交到版本控制

### 高德地图 Key 配置
```bash
# .env 文件
VITE_AMAP_KEY=你的高德地图 Key
VITE_AMAP_SECURITY_CODE=你的安全密钥
```

获取方式：[高德开放平台](https://lbs.amap.com/dev/key/app)

### 美食点评 12种风格
虎扑JR体、鲁迅体、冰心体、林黛玉体、张爱玲体、王小波体、曼波体、二刺螈体、甄嬛体、苏轼体、鲁班手札体、说明书体

## 坐标配置

地标坐标使用硬编码方式，保存在 `src/api/amap.js` 的 `BJTU_LANDMARKS` 数组中，不依赖 POI 搜索。

如需调整坐标：
1. 开启坐标拾取：在控制台输入 `window.__qf_enableCoordPicker()`
2. 点击地图查看坐标
3. 修改 `BJTU_LANDMARKS` 中的 `lng`/`lat` 值

## Token 更新

更新 API Token 时，修改 `量子烟火-server/.env` 中对应项即可，无需改前端代码。

## 界面增强功能

### 情绪粒子飘散动画
- 位置：`src/components/MapCanvas/EmotionParticles.jsx`
- 触发：生成情绪植物时，屏幕中心会飘散出对应颜色的粒子
- 持续效果：里世界模式下，底部持续生成上升的荧光粒子

### BJTU 点阵灯光效果
- 位置：`src/components/MapCanvas/BJTULights.jsx`
- 效果：
  - 顶部点阵绘制 "BJTU" 字样
  - 青色发光点，呼吸式闪烁
  - 底部装饰曲线点
  - 左右两侧装饰点

### 高德地图 3D 图层
- 位置：`src/api/amap.js`
- 配置：
  - 3D视角，俯仰角55°
  - 里世界：冷青蓝建筑配色
  - 表世界：暖琥珀橙建筑配色
- 地标：12个北交大校园地标（食堂、教学楼、操场、历史雕像等）

