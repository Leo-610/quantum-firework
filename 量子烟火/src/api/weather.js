/** 前端天气 API — 走 /api/weather 代理 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export async function fetchCampusWeather() {
  const res = await fetch(`${API_BASE}/weather`)
  const data = await res.json()

  if (!res.ok || !data.ok || !data.live) {
    throw new Error(data.error || `天气请求失败 (${res.status})`)
  }

  return data.live
}

/** 客户端 fallback：高德 JS Weather 插件（API 不可用时） */
export function fetchCampusWeatherViaPlugin() {
  return new Promise((resolve, reject) => {
    if (typeof AMap === 'undefined') {
      reject(new Error('AMap 未加载'))
      return
    }

    AMap.plugin('AMap.Weather', () => {
      const weather = new AMap.Weather()
      weather.getLive('海淀区', (err, data) => {
        if (err || !data) {
          reject(err || new Error('插件天气获取失败'))
          return
        }

        const text = data.weather || '晴'
        resolve({
          city: '海淀区',
          adcode: '110108',
          weather: text,
          theme: normalizeClientTheme(text),
          temperature: data.temperature,
          windDirection: data.winddirection,
          windPower: data.windpower,
          humidity: data.humidity,
          reportTime: data.reportTime,
        })
      })
    })
  })
}

function normalizeClientTheme(weatherText = '') {
  const w = String(weatherText)
  if (/雪/.test(w)) return 'snow'
  if (/雨|雷|冰雹/.test(w)) return 'rain'
  if (/雾|霾|沙|尘/.test(w)) return 'fog'
  if (/阴/.test(w)) return 'overcast'
  if (/云/.test(w)) return 'cloudy'
  return 'clear'
}
