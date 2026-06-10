# 量子烟火（Quantum Fireworks）实现计划书

> 基于 Coze 平台与高德 3D LBS 技术的双面校园情感与美食共鸣智能体
> 面向：北京交通大学校园生活 · 心理大健康 · 后勤膳食服务

---

## 项目全貌速览

```
用户端（浏览器）
    └── React + AMap 3D WebGL
            │  HTTP / WebSocket
            ▼
       Coze Bot API
            ├── Router Agent（意图分类）
            ├── 里世界 Agent（情感支持）
            └── 表世界 Agent（美食点评）
                    │
            ┌───────┼───────┐
         知识库    数据库   工作流插件
       (RAG检索) (mood/food) (Python雷达图)
```

---

## 一、技术选型确认

| 层次 | 技术 | 理由 |
|------|------|------|
| 前端框架 | React 18 + Vite | 生态成熟，组件化开发，Coze WebSDK 友好 |
| 样式 | Tailwind CSS | 快速构建赛博朋克暗黑风，与项目文档描述一致 |
| 地图引擎 | 高德地图 JS API 2.0 | 原生 3D WebGL，fill-extrusion 建筑拉伸，GLTF 模型加载 |
| AI 后端 | 扣子（Coze）平台 | 多 Agent 编排，内置 RAG/数据库/工作流，开放 API |
| Coze API 模式 | Bot Chat API（`/v3/chat`）+ Workflow API | 对话管理 + 独立工作流调用 |
| 图表 | ECharts 5 | 五维雷达图渲染，支持主题定制 |
| 状态管理 | Zustand | 轻量，适合情绪/地图状态跨组件共享 |
| 动画 | Framer Motion | 里世界情绪植物呼吸光效 |

---

## 二、目录结构规划

```
D:\量子烟火\
├── public/
│   ├── models/              # Blender Low-Poly .gltf 模型
│   │   ├── canteen_2.gltf   # 二食堂
│   │   └── siyuan.gltf      # 思源楼
│   └── textures/
├── src/
│   ├── api/
│   │   ├── coze.js          # Coze API 封装（Chat + Workflow）
│   │   └── amap.js          # 高德地图初始化与操作
│   ├── components/
│   │   ├── MapCanvas/       # 高德 3D 地图容器
│   │   ├── InnerWorld/      # 里世界 UI 面板
│   │   │   ├── EmotionInput.jsx
│   │   │   ├── PlantEffect.jsx   # 情绪植物 + 呼吸光柱
│   │   │   └── EchoCard.jsx      # 时空回响卡片
│   │   ├── OuterWorld/      # 表世界 UI 面板
│   │   │   ├── FoodReview.jsx
│   │   │   ├── StyleRewriter.jsx # 文豪文体复印机
│   │   │   └── RadarChart.jsx    # 五维战力雷达图
│   │   ├── WorldSwitch/     # 表里双面切换动画
│   │   └── HeatmapLayer/    # 情绪热力图图层
│   ├── store/
│   │   ├── worldStore.js    # 当前世界（inner/outer）+ 坐标
│   │   └── emotionStore.js  # 情绪标签、植物状态
│   ├── hooks/
│   │   ├── useCozeChat.js   # Coze 流式对话 Hook
│   │   └── useMapMarker.js  # 地图标记点管理
│   ├── styles/
│   │   └── cyberpunk.css    # 赛博朋克全局主题变量
│   ├── App.jsx
│   └── main.jsx
├── .env                     # API Keys（高德/Coze）
├── index.html
├── tailwind.config.js
└── vite.config.js
```

---

## 三、Coze 平台配置方案（核心）

### 3.1 Bot 架构：三层 Agent

#### 🔀 主控路由 Agent（Router Bot）
- **职责**：接收用户输入 + 当前坐标，判断意图
- **输入变量**：`user_input`（字符串）、`location`（JSON: `{lat, lng, name}`）
- **系统提示词核心逻辑**：
  ```
  你是量子烟火的智慧入口。请判断用户意图：
  - 若涉及食堂/菜品/排队/吃饭 → 输出 {"world": "outer", "intent": "food_review"}
  - 若涉及焦虑/迷茫/难过/失败 → 输出 {"world": "inner", "intent": "emotion_anchor"}
  - 若模糊 → 引导用户明确
  输出纯 JSON，不附加任何说明文字。
  ```
- **技术实现**：调用 `/v3/chat` API，解析 JSON 响应后前端路由

#### 🌱 里世界 Agent（Inner World Bot）
- **职责**：情感陪伴、情绪植物生成、时空回响检索
- **挂载知识库**：王阳明心学精髓、存在主义哲学选段、交大历届学长学姐匿名回响语料
- **挂载数据库**：`mood_tracks` 表（见 3.3）
- **工作流**：情绪空间锚定流（见 3.4）
- **系统提示词方向**：拒绝导师腔，以诗意隐喻回应，每次回复植入一个经典引用

#### 🍜 表世界 Agent（Outer World Bot）
- **职责**：美食点评改写、五维雷达图生成、虎扑神评输出
- **挂载数据库**：`food_ratings` 表（见 3.3）
- **工作流**：动态文体复印流（见 3.4）
- **系统提示词方向**：可在鲁迅体/冰心体/虎扑体/用户自定义体之间切换

---

### 3.2 Coze API 调用方案

```javascript
// src/api/coze.js

const COZE_API_BASE = 'https://api.coze.cn/v3';
const BOT_IDS = {
  router: 'BOT_ID_ROUTER',    // 从 Coze 平台获取
  inner:  'BOT_ID_INNER',
  outer:  'BOT_ID_OUTER',
};

/**
 * 非流式调用（路由判断 / 雷达图数据）
 */
export async function cozeChat({ botId, userId, message, variables = {} }) {
  const res = await fetch(`${COZE_API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_COZE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bot_id: botId,
      user_id: userId,
      stream: false,
      auto_save_history: true,
      additional_messages: [{
        role: 'user',
        content: message,
        content_type: 'text',
      }],
      // 通过 metadata 传递坐标等结构化变量
      meta_data: variables,
    }),
  });
  return res.json();
}

/**
 * 流式调用（里世界情感回应，SSE 流式输出）
 */
export async function cozeChatStream({ botId, userId, message, variables = {}, onChunk }) {
  const res = await fetch(`${COZE_API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_COZE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bot_id: botId,
      user_id: userId,
      stream: true,
      auto_save_history: true,
      additional_messages: [{
        role: 'user',
        content: message,
        content_type: 'text',
      }],
      meta_data: variables,
    }),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = JSON.parse(line.slice(5));
        if (data.type === 'answer') onChunk(data.content);
      }
    }
  }
}

/**
 * 调用 Coze Workflow（五维雷达图数据生成）
 */
export async function cozeWorkflow({ workflowId, parameters }) {
  const res = await fetch(`${COZE_API_BASE}/workflows/runs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_COZE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ workflow_id: workflowId, parameters }),
  });
  return res.json();
}
```

---

### 3.3 Coze 数据库表结构

#### `mood_tracks`（情绪轨迹表）
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT | UUID |
| `location_name` | TEXT | 地点名（思源楼/图书馆等） |
| `lat` | FLOAT | 纬度 |
| `lng` | FLOAT | 经度 |
| `emotion_tags` | TEXT | 逗号分隔（焦虑,疲惫,迷茫） |
| `plant_type` | TEXT | AI 生成的植物类型 |
| `echo_text` | TEXT | 时空回响原文（匿名） |
| `resolved` | BOOLEAN | 是否已上岸（用于回响筛选） |
| `created_at` | DATETIME | 打卡时间 |
| `is_public` | BOOLEAN | 是否公开显示在热力图 |

#### `food_ratings`（食堂评分表）
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT | UUID |
| `canteen_name` | TEXT | 食堂名（一食堂/二食堂） |
| `dish_name` | TEXT | 菜品名 |
| `price_score` | INT | 性价比（1-10） |
| `fullness_score` | INT | 抗饿度（1-10） |
| `queue_score` | INT | 排队难度（越低越好） |
| `aunt_shake_score` | INT | 阿姨手抖指数（1-10） |
| `risk_score` | INT | 踩雷率（越低越好） |
| `original_review` | TEXT | 原始吐槽文本 |
| `rewritten_luxun` | TEXT | 鲁迅体改写版 |
| `created_at` | DATETIME | 提交时间 |

---

### 3.4 Coze 工作流设计

#### 工作流①：情绪空间锚定流
```
输入节点
  ├─ user_text（用户情绪文本）
  └─ location（坐标 JSON）
        │
  [LLM节点] 情绪标签提取
  → 输出：emotion_tags[], intensity(0-1), color_hex
        │
  [LLM节点] 文学隐喻叙事重构
  → 输出：metaphor_text（诗意回应正文）
        │
  [数据库节点] 写入 mood_tracks
        │
  [数据库节点] 检索 mood_tracks
  → WHERE location_name = 当前地点 AND resolved = true AND emotion_tags 相似
  → 输出：echo_record（时空回响）
        │
  输出节点
  → { metaphor_text, emotion_tags, color_hex, plant_type, echo_record }
```

#### 工作流②：动态文体复印流
```
输入节点
  ├─ dish_name（菜品名）
  ├─ original_review（原始吐槽）
  └─ target_style（"luxun" | "bingxin" | "hupu" | "custom"）
        │
  [代码节点] 风格提示词构建器
  → 根据 target_style 拼装 System Prompt
        │
  [LLM节点] 文体改写
  → 输出：rewritten_text
        │
  [代码节点/Python插件] 五维评分计算
  → 基于关键词抽取 price/fullness/queue/shake/risk 分值
        │
  [数据库节点] 写入 food_ratings
        │
  输出节点
  → { rewritten_text, radar_data: {price, fullness, queue, shake, risk} }
```

---

## 四、前端核心模块实现

### 4.1 高德 3D 地图初始化
```javascript
// src/api/amap.js
export function initMap(container) {
  return new AMap.Map(container, {
    viewMode: '3D',
    pitch: 60,           // 俯仰角
    zoom: 17,
    center: [116.3494, 39.9541], // 北交大红果园中心坐标
    mapStyle: 'amap://styles/dark',  // 暗黑底图
  });
}
```

**关键 3D 效果实现**：
- 建筑白模：通过高德 `AMap.Buildings` 图层，配置 `zIndex` 与自定义填充色实现赛博朋克风格
- GLTF 模型：使用 `AMap.GLCustomLayer` + Three.js 加载 `.gltf` 模型叠加到食堂坐标
- 情绪光柱：`AMap.GLCustomLayer` 绘制脉冲呼吸圆柱，颜色由情绪标签动态映射
- 热力图：`AMap.HeatMap` 图层，数据来自 `mood_tracks` 的坐标聚合

### 4.2 表里世界切换动画（Framer Motion）
- 切换时触发全屏翻转动画（3D rotateY 180°）
- 里世界：深蓝/紫罗兰色调，粒子星尘背景
- 表世界：暖橙/赤金色调，蒸汽烟雾粒子

### 4.3 五维雷达图（ECharts）
```javascript
// 五维指标映射
const radarIndicators = [
  { name: '性价比', max: 10 },
  { name: '抗饿度', max: 10 },
  { name: '排队难度', max: 10 },
  { name: '阿姨手抖指数', max: 10 },
  { name: '踩雷率', max: 10 },
];
```
样式：暗黑背景 + 霓虹渐变多边形 + 动画入场

---

## 五、开发阶段规划

### Phase 0：环境搭建（第1天）
- [ ] Vite + React + Tailwind CSS 项目初始化
- [ ] 高德地图开发者 Key 申请与配置
- [ ] Coze 平台注册，创建 3 个 Bot 框架
- [ ] `.env` 配置文件填写

### Phase 1：地图底座（第2-3天）
- [ ] 高德 3D 地图渲染（暗黑主题）
- [ ] 北交大校区建筑白模 3D 拉伸
- [ ] 食堂标记点与点击弹窗
- [ ] 表里世界切换 UI 框架

### Phase 2：Coze 智能体搭建（第3-5天）
- [ ] Router Agent 配置与测试（意图分类准确率 > 95%）
- [ ] 里世界 Agent：知识库上传 + 工作流①联调
- [ ] 表世界 Agent：文体复印工作流②联调
- [ ] 两个数据库表创建与测试

### Phase 3：前后端联调（第5-7天）
- [ ] `coze.js` API 封装完成
- [ ] 情绪输入 → Coze 工作流① → 地图光柱渲染 全链路
- [ ] 吐槽输入 → Coze 工作流② → 雷达图渲染 全链路
- [ ] 时空回响卡片展示
- [ ] 文豪改写卡片输出

### Phase 4：UI 精修与演示数据注入（第7-8天）
- [ ] 赛博朋克 CSS 全局主题精修
- [ ] 预置 10+ 条 `food_ratings` 演示数据
- [ ] 预置 5+ 条 `mood_tracks` 时空回响种子数据
- [ ] 响应式适配 / 移动端兼容

### Phase 5：打包与演示准备（第9-10天）
- [ ] 生产构建测试
- [ ] 演示脚本录制
- [ ] 作品介绍 PDF 最终版输出

---

## 六、开放问题与待确认事项

> [!IMPORTANT]
> **问题 1：Coze API Token 与 Bot ID**
> 请确认是否已有扣子平台账号，需要从 [扣子开放平台](https://www.coze.cn/open) 获取 API Token 并创建 Bot 后填入 `.env`。Bot ID 在 Bot 发布后的 API 设置页可找到。

> [!IMPORTANT]
> **问题 2：高德地图 Key**
> 需申请高德开放平台 Web JS API Key（免费额度每日 30 万次调用足够演示使用）。是否已有 Key？

> [!WARNING]
> **问题 3：GLTF 模型来源**
> 计划书提及用 Blender 制作低多边形模型。目前是否已有模型文件？若没有，可以：
> - 方案A：使用简单的几何体（圆柱/棱柱）替代，代码实现
> - 方案B：从 Sketchfab 等平台下载免费低面数 CC0 授权模型

> [!NOTE]
> **问题 4：用户身份系统**
> 时空回响功能需要区分"当前用户"与"历史匿名数据"。演示版建议使用本地随机 UUID 作为 `user_id`（无需注册登录），是否认可？

> [!NOTE]
> **问题 5：知识库素材**
> 里世界 RAG 知识库需要录入王阳明心学/存在主义文本，以及"时空回响"种子语料（学长学姐匿名暖心留言）。这些内容是否需要我帮助生成示例素材？

---

## 七、验收标准

| 功能 | 验收要求 |
|------|---------|
| 3D 地图渲染 | 暗黑赛博朋克风格，建筑立体，可俯仰旋转 |
| 意图分类 | 输入"今天排队好久" → 路由到表世界；"好焦虑" → 路由到里世界 |
| 情绪植物光柱 | 情绪输入后地图对应坐标出现 3D 呼吸光效 |
| 时空回响 | 触发后展示匿名历史回响卡片（≥1条种子数据） |
| 文豪改写 | 吐槽输入后输出鲁迅体/虎扑体改写版本 |
| 雷达图 | 五维评分雷达图正确渲染，数据来自 Coze 工作流 |
| 表里切换 | 世界切换有明显动画，UI 风格差异显著 |
