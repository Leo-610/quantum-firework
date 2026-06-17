/** 用户天气偏好（本机 localStorage） */

import { isWeatherTheme } from '../constants/weatherThemes'

const PREFS_KEY = 'qf_weather_prefs_v1'

const DEFAULT_PREFS = {
  effectsEnabled: true,
  source: 'live',
  manualTheme: null,
}

export function readWeatherPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw)
    return {
      effectsEnabled: parsed.effectsEnabled !== false,
      source: parsed.source === 'manual' ? 'manual' : 'live',
      manualTheme: isWeatherTheme(parsed.manualTheme) ? parsed.manualTheme : null,
    }
  } catch {
    localStorage.removeItem(PREFS_KEY)
    return { ...DEFAULT_PREFS }
  }
}

export function writeWeatherPrefs(partial) {
  const next = { ...readWeatherPrefs(), ...partial }
  localStorage.setItem(PREFS_KEY, JSON.stringify(next))
  return next
}

export function clearManualWeatherPrefs() {
  return writeWeatherPrefs({ source: 'live', manualTheme: null })
}
