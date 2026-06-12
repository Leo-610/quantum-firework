/** 高德实况天气 — 服务端代理与主题映射 */

/** 海淀区 adcode（北交大主校区） */
export const BJTU_ADCODE = '110108'

export function normalizeWeatherTheme(weatherText = '') {
  const w = String(weatherText)
  if (/雪/.test(w)) return 'snow'
  if (/雨|雷|冰雹/.test(w)) return 'rain'
  if (/雾|霾|沙|尘/.test(w)) return 'fog'
  if (/阴/.test(w)) return 'overcast'
  if (/云/.test(w)) return 'cloudy'
  return 'clear'
}

export async function fetchAmapLiveWeather(adcode = BJTU_ADCODE, apiKey) {
  if (!apiKey) {
    const err = new Error('缺少高德 Web 服务 Key，请配置 AMAP_WEB_KEY 或 VITE_AMAP_KEY')
    err.status = 503
    throw err
  }

  const url = new URL('https://restapi.amap.com/v3/weather/weatherInfo')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('city', adcode)
  url.searchParams.set('extensions', 'base')
  url.searchParams.set('output', 'JSON')

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data.status !== '1' || !data.lives?.[0]) {
    const err = new Error(data.info || '天气接口返回异常')
    err.status = 502
    throw err
  }

  const live = data.lives[0]
  const weather = live.weather || '晴'

  return {
    city: live.city || '海淀区',
    adcode: live.adcode || adcode,
    weather,
    theme: normalizeWeatherTheme(weather),
    temperature: live.temperature,
    windDirection: live.winddirection,
    windPower: live.windpower,
    humidity: live.humidity,
    reportTime: live.reporttime,
  }
}

export function getAmapWebKey() {
  return process.env.AMAP_WEB_KEY || process.env.VITE_AMAP_KEY || ''
}
