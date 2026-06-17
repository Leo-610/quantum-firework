/** 录屏 / 答辩演示：URL 强制天气，不请求高德实况 API */

import { isWeatherTheme, WEATHER_THEMES } from '../constants/weatherThemes'

const MOCK_BY_THEME = {
  clear: { weather: '晴', temperature: '24', windDirection: '北', windPower: '2', humidity: '45' },
  cloudy: { weather: '多云', temperature: '22', windDirection: '东', windPower: '3', humidity: '55' },
  overcast: { weather: '阴', temperature: '20', windDirection: '东南', windPower: '2', humidity: '70' },
  rain: { weather: '小雨', temperature: '18', windDirection: '东南', windPower: '3', humidity: '85' },
  snow: { weather: '小雪', temperature: '2', windDirection: '北', windPower: '2', humidity: '60' },
  fog: { weather: '雾', temperature: '15', windDirection: '无', windPower: '≤3', humidity: '92' },
}

/** 从 URL 读取 ?weather=rain（录屏用） */
export function getWeatherOverrideFromUrl() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('weather')?.trim().toLowerCase()
  if (!raw || !isWeatherTheme(raw)) return null
  return raw
}

/** 构造演示用 live 数据（不调用高德） */
export function buildMockWeatherLive(theme) {
  const preset = MOCK_BY_THEME[theme] || MOCK_BY_THEME.clear
  const now = new Date()
  const reportTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return {
    city: '海淀区',
    adcode: '110108',
    theme,
    weather: preset.weather,
    temperature: preset.temperature,
    windDirection: preset.windDirection,
    windPower: preset.windPower,
    humidity: preset.humidity,
    reportTime,
    forced: true,
    forcedLabel: WEATHER_THEMES[theme]?.label || theme,
  }
}

export function isForcedWeatherLive(live) {
  return Boolean(live?.forced)
}
