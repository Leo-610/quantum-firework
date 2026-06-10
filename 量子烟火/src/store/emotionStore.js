import { create } from 'zustand'

function safeLoadPlants() {
  try {
    return JSON.parse(localStorage.getItem('qf_plants') || '[]')
  } catch {
    localStorage.removeItem('qf_plants')
    return []
  }
}

/** 情绪状态：植物、打卡记录、热力图数据 */
export const useEmotionStore = create((set, get) => ({
  // 已种下的情绪植物列表 [{id, lat, lng, plantType, color, glow, echoText, timestamp}]
  plants: safeLoadPlants(),

  // 当前正在处理的情绪（加载状态）
  isProcessing: false,

  // 最新的 AI 回应文本（流式输出累积）
  aiResponse: '',

  // 最新的时空回响
  latestEcho: null,

  // 热力图原始数据
  heatmapData: [],

  // ── Actions ──
  setProcessing: (v) => set({ isProcessing: v }),

  appendResponse: (chunk) => set(s => ({
    aiResponse: s.aiResponse + (typeof chunk === 'string' ? chunk : ''),
  })),

  clearResponse: () => set({ aiResponse: '' }),

  setLatestEcho: (echo) => set({ latestEcho: echo }),

  addPlant: (plant) => {
    const plants = [...get().plants, { ...plant, id: Date.now(), timestamp: new Date().toISOString() }]
    localStorage.setItem('qf_plants', JSON.stringify(plants))
    set({ plants })
    // 同步更新热力图
    set({ heatmapData: plants.map(p => ({ lng: p.lng, lat: p.lat, count: 1 })) })
  },

  loadPlantsToHeatmap: () => {
    const { plants } = get()
    set({ heatmapData: plants.map(p => ({ lng: p.lng, lat: p.lat, count: 1 })) })
  },
}))
