import { create } from 'zustand'
import { fetchCampusWeather, fetchCampusWeatherViaPlugin } from '../api/weather'
import { isWeatherTheme } from '../constants/weatherThemes'

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
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    date: todayKey(),
    theme: live.theme,
    live,
  }))
}

export const useWeatherStore = create((set) => ({
  theme: 'clear',
  live: null,
  status: 'idle',

  loadWeather: async () => {
    const cached = readCache()
    if (cached) {
      set({ theme: cached.theme, live: cached.live, status: 'ready' })
      return cached.live
    }

    set({ status: 'loading' })

    try {
      let live
      // 优先 JS 插件（与页面 Web 端 Key 一致）；REST 代理需单独开通 Web 服务 Key
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
      set({ theme: live.theme, live, status: 'ready' })
      return live
    } catch (e) {
      console.warn('天气加载失败，使用默认晴好氛围', e.message)
      set({ theme: 'clear', live: null, status: 'error' })
      return null
    }
  },
}))
