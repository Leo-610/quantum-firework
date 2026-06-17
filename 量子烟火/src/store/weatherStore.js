import { create } from 'zustand'
import { fetchCampusWeather, fetchCampusWeatherViaPlugin } from '../api/weather'
import { isWeatherTheme } from '../constants/weatherThemes'
import {
  buildMockWeatherLive,
  getWeatherOverrideFromUrl,
} from '../utils/weatherOverride'
import {
  clearManualWeatherPrefs,
  readWeatherPrefs,
  writeWeatherPrefs,
} from '../utils/weatherPreferences'

const CACHE_KEY = 'qf_weather_v1'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.date === todayKey() && parsed.live && isWeatherTheme(parsed.theme)) {
      return parsed
    }
  } catch {
    localStorage.removeItem(CACHE_KEY)
  }
  return null
}

function writeCache(live) {
  if (live?.forced) return
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    date: todayKey(),
    theme: live.theme,
    live,
  }))
}

function applyLive(set, live, source) {
  set({
    theme: live.theme,
    live,
    status: 'ready',
    source,
  })
}

export const useWeatherStore = create((set, get) => {
  const initialPrefs = typeof window !== 'undefined' ? readWeatherPrefs() : { effectsEnabled: true, source: 'live', manualTheme: null }

  return {
    theme: 'clear',
    live: null,
    status: 'idle',
    source: 'live',
    effectsEnabled: initialPrefs.effectsEnabled,
    pickerOpen: false,

    setPickerOpen: (open) => set({ pickerOpen: open }),

    setEffectsEnabled: (enabled) => {
      writeWeatherPrefs({ effectsEnabled: enabled })
      set({ effectsEnabled: enabled })
    },

    setManualTheme: (theme) => {
      if (!isWeatherTheme(theme)) return
      writeWeatherPrefs({ source: 'manual', manualTheme: theme })
      const live = buildMockWeatherLive(theme, { manual: true })
      applyLive(set, live, 'manual')
      set({ effectsEnabled: true })
      writeWeatherPrefs({ effectsEnabled: true })
    },

    resetToLiveWeather: async () => {
      clearManualWeatherPrefs()
      set({ source: 'live', status: 'loading' })
      return get().fetchLiveWeather()
    },

    fetchLiveWeather: async () => {
      set({ status: 'loading' })

      try {
        let live
        if (typeof window !== 'undefined' && window.AMap) {
          try {
            live = await fetchCampusWeatherViaPlugin()
          } catch (pluginErr) {
            console.warn('高德 Weather 插件失败，尝试 REST 代理', pluginErr.message)
            live = await fetchCampusWeather()
          }
        } else {
          live = await fetchCampusWeather()
        }

        writeCache(live)
        applyLive(set, live, 'live')
        return live
      } catch (e) {
        console.warn('天气加载失败，使用默认晴好氛围', e.message)
        set({ theme: 'clear', live: null, status: 'error', source: 'live' })
        return null
      }
    },

    loadWeather: async () => {
      const urlTheme = getWeatherOverrideFromUrl()
      if (urlTheme) {
        const live = buildMockWeatherLive(urlTheme, { manual: false })
        applyLive(set, live, 'url')
        return live
      }

      const prefs = readWeatherPrefs()
      set({ effectsEnabled: prefs.effectsEnabled })

      if (prefs.source === 'manual' && prefs.manualTheme) {
        const live = buildMockWeatherLive(prefs.manualTheme, { manual: true })
        applyLive(set, live, 'manual')
        return live
      }

      const cached = readCache()
      if (cached) {
        applyLive(set, cached.live, 'live')
        return cached.live
      }

      return get().fetchLiveWeather()
    },

    /** 是否加强粒子（手动 / URL 模式） */
    isFxBoost: () => {
      const { source } = get()
      return source === 'manual' || source === 'url'
    },
  }
})
