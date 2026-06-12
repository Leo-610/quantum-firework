/** 实况天气 → 氛围主题（轻量模式：地图可读性优先） */

export const WEATHER_THEMES = {
  clear: { label: '晴', hudIcon: 'sun', mapBright: 1.02, mapSat: 1.02 },
  cloudy: { label: '多云', hudIcon: 'cloud', mapBright: 1, mapSat: 0.98 },
  overcast: { label: '阴', hudIcon: 'cloud', mapBright: 0.98, mapSat: 0.97 },
  rain: { label: '雨', hudIcon: 'rain', mapBright: 0.94, mapSat: 0.98 },
  snow: { label: '雪', hudIcon: 'snow', mapBright: 0.97, mapSat: 0.98 },
  fog: { label: '雾', hudIcon: 'fog', mapBright: 0.93, mapSat: 0.95 },
}

export const WEATHER_THEME_KEYS = Object.keys(WEATHER_THEMES)

export function isWeatherTheme(value) {
  return WEATHER_THEME_KEYS.includes(value)
}

export function usesLightHaze(theme) {
  return theme === 'cloudy' || theme === 'overcast'
}
