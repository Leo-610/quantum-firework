# 量子烟火 - 项目规范

## 项目概述
量子烟火是一款基于 React + Vite + Tailwind CSS 的可视化项目，展示量子物理相关的烟火效果和数据分析。

## 技术栈
- **前端框架**: React 18.3 + Vite 5.4
- **样式**: Tailwind CSS 3.4 + PostCSS
- **动画**: Framer Motion 11
- **图表**: ECharts 5.5
- **状态管理**: Zustand 4.5
- **包管理**: pnpm

## 目录结构
```
量子烟火/
├── src/              # 源代码
├── public/           # 静态资源
├── dist/             # 构建产物
├── scripts/          # 预览/部署脚本
├── vite.config.js   # Vite 配置
├── tailwind.config.js
└── package.json
```

## 关键入口
- **开发**: `pnpm run dev` 或 `bash scripts/coze-preview-run.sh`
- **构建**: `pnpm run build`

## 预览配置
- 端口: 5000 (统一使用 5000 端口)
- 预览脚本: `scripts/coze-preview-run.sh`
- 构建脚本: `scripts/coze-preview-build.sh`

## Coze 平台配置
- 项目类型: web
- 根目录: `/workspace/projects/.coze`
- 子项目: `/workspace/projects/量子烟火/.coze`
- preview_enable: enabled

## 注意事项
1. 仅使用 pnpm 管理依赖，禁止 npm/yarn
2. Vite 配置端口固定为 5000
3. 预览服务需绑定 0.0.0.0 而非 127.0.0.1
