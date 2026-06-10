# 量子烟火 · 完善计划

> 按优先级排序，标注实现难度与阶段。

---

## ✅ 已完成
- 3D 建筑配色随世界切换（销毁重建 Buildings 图层）
- 里/表世界地图底图切换（dark / darkblue）
- 世界切换动画与状态锁

---

## 🔧 纯前端优化（立即可做）

### P0 · 稳定性

- [ ] **#1 localStorage JSON.parse 容错**
  - 文件：`src/store/emotionStore.js`
  - 问题：存储损坏时 `JSON.parse` 抛异常，整个 store 崩溃
  - 方案：try/catch 包裹，失败回退空数组

- [ ] **#2 Buildings 图层缓存**
  - 文件：`src/hooks/useMapMarker.js` + `src/api/amap.js`
  - 问题：每次切换世界都销毁重建 `AMap.Buildings`，有性能浪费
  - 方案：初始化时创建两个 Buildings 实例，切换时 add/remove

### P1 · 体验

- [ ] **#3 错误与加载状态**
  - 文件：`src/components/InnerWorld/index.jsx`、`src/components/OuterWorld/index.jsx`
  - 问题：Coze API 失败时用户无任何提示
  - 方案：catch 里展示内联错误文字；按钮加防重复点击

- [ ] **#4 空状态引导**
  - 文件：`src/components/InnerWorld/index.jsx`
  - 问题：新用户热力图为空、回响区为空，三个"白洞"
  - 方案：无 plants 时展示种子引导文案；加"xxx 位同学已留下情绪"计数

- [ ] **#5 表世界分享/复制按钮**
  - 文件：`src/components/OuterWorld/index.jsx`、`src/components/OuterWorld/StyleRewriter.jsx`
  - 问题：AI 改写结果无法导出，每次都是一次性的
  - 方案：加"复制到剪贴板"按钮，复制后显示短暂 ✓ 反馈

- [ ] **#6 情绪历史时间轴**
  - 文件：`src/components/InnerWorld/index.jsx`（新增子组件）
  - 问题：用户种下多颗植物后看不到历史记录
  - 方案：里世界面板底部加折叠式历史列表，按时间倒序，显示地点+植物类型+回响文字前 30 字

### P2 · 氛围

- [ ] **#7 世界切换音效**
  - 文件：`src/components/WorldSwitch/index.jsx` 或 `src/store/worldStore.js`
  - 方案：Web Audio API 生成短促的"量子跃迁"音效，无需音频资源文件
  - 细节：内世界切外世界用上扬音调，外→内用下沉音调，音量 < 0.3

---

## 🔒 需要后端（二期）

- [ ] **#8 Coze API Token 代理**
  - 问题：`VITE_COZE_API_TOKEN` 打包进 bundle，任何人可从 DevTools 获取
  - 方案：Vercel/Cloudflare Worker 代理，token 留服务端

- [ ] **#9 热力图多用户共享**
  - 问题：plants 只在 localStorage，用户看不到他人情绪
  - 方案：Supabase 存储 plants 表（lng, lat, plant_type, color, timestamp），前端拉取并合并

---

## 📱 移动端（三期）

- [ ] **#10 响应式布局**
  - 侧边面板宽度在窄屏下固定，需加 `sm:` 断点
  - 地图 pitch=55 在手机上视角过压，小屏降至 35

---

## 进度记录

| # | 名称 | 状态 | 完成日期 |
|---|------|------|----------|
| 1 | localStorage 容错 | ✅ 完成 | 2026-05-23 |
| 2 | Buildings 缓存 | ✅ 完成 | 2026-05-23 |
| 3 | 错误/加载状态 | ✅ 完成 | 2026-05-23 |
| 4 | 空状态引导 | ✅ 完成 | 2026-05-23 |
| 5 | 分享复制按钮 | ✅ 完成 | 2026-05-23 |
| 6 | 情绪历史时间轴 | ✅ 完成 | 2026-05-23 |
| 7 | 世界切换音效 | ✅ 完成 | 2026-05-23 |
| 8 | Token 代理 | 待开始 | - |
| 9 | 热力图共享 | 待开始 | - |
| 10 | 移动端适配 | 待开始 | - |
