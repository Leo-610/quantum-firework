import { create } from 'zustand'

/** 全局世界状态：里世界 / 表世界 + 选中地标 + 地图实例 */
export const useWorldStore = create((set, get) => ({
  // 当前世界：'inner' | 'outer'
  world: 'inner',

  // 是否正在切换（动画锁）
  isSwitching: false,

  // 选中的地标
  selectedLandmark: null,

  // 地图实例（非响应式，直接存引用）
  mapInstance: null,

  // 侧边面板是否展开
  isPanelOpen: false,

  // 当前用户 ID（本地 UUID）
  userId: localStorage.getItem('qf_user_id') || null,

  // ── Actions ──
  setWorld: (world) => set({ world }),

  toggleWorld: () => {
    const { world, isSwitching } = get()
    if (isSwitching) return
    set({ isSwitching: true })
    setTimeout(() => {
      set({ world: world === 'inner' ? 'outer' : 'inner', isSwitching: false })
    }, 800)
  },

  setSelectedLandmark: (landmark) => set({ selectedLandmark: landmark, isPanelOpen: !!landmark }),

  setMapInstance: (map) => set({ mapInstance: map }),

  setPanelOpen: (open) => set({ isPanelOpen: open }),

  setUserId: (id) => {
    localStorage.setItem('qf_user_id', id)
    set({ userId: id })
  },
}))
