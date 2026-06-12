/** 实况天气 → 氛围主题 */

export const WEATHER_THEMES = {
  clear: {
    label: '晴',
    hudIcon: 'sun',
  },
  cloudy: {
    label: '多云',
    hudIcon: 'cloud',
  },
  overcast: {
    label: '阴',
    hudIcon: 'cloud',
  },
  rain: {
    label: '雨',
    hudIcon: 'rain',
  },
  snow: {
    label: '雪',
    hudIcon: 'snow',
  },
  fog: {
    label: '雾',
    hudIcon: 'fog',
  },
}

export const WEATHER_THEME_KEYS = Object.keys(WEATHER_THEMES)

export function isWeatherTheme(value) {
  return WEATHER_THEME_KEYS.includes(value)
}
