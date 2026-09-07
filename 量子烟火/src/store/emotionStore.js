import { create } from 'zustand'
import { insertEmotionPlant } from '../api/userData'

function safeLoadPlants() {
  try {
    return JSON.parse(localStorage.getItem('qf_plants') || '[]')
  } catch {
    localStorage.removeItem('qf_plants')
    return []
  }
}

function persistPlants(plants) {
  localStorage.setItem('qf_plants', JSON.stringify(plants))
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

  replacePlants: (plants) => {
    persistPlants(plants)
    set({
      plants,
      heatmapData: plants.map(p => ({ lng: p.lng, lat: p.lat, count: 1 })),
    })
  },

  addPlant: (plant) => {
    const localId = String(Date.now())
    const next = {
      ...plant,
      id: localId,
      localId,
      timestamp: new Date().toISOString(),
    }
    const plants = [...get().plants, next]
    persistPlants(plants)
    set({
      plants,
      heatmapData: plants.map(p => ({ lng: p.lng, lat: p.lat, count: 1 })),
    })

    // 已登录则异步写入云端（避免与 authStore 循环依赖）
    import('../store/authStore').then(({ useAuthStore }) => {
      const user = useAuthStore.getState().user
      if (!user) return
      insertEmotionPlant(user.id, next)
        .then((remote) => {
          const merged = get().plants.map(p => (
            p.localId === localId || p.id === localId ? { ...remote, localId } : p
          ))
          persistPlants(merged)
          set({
            plants: merged,
            heatmapData: merged.map(p => ({ lng: p.lng, lat: p.lat, count: 1 })),
          })
        })
        .catch(err => console.warn('[plants] cloud sync failed', err.message))
    })
  },

  loadPlantsToHeatmap: () => {
    const { plants } = get()
    set({ heatmapData: plants.map(p => ({ lng: p.lng, lat: p.lat, count: 1 })) })
  },
}))
