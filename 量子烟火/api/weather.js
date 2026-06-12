import { corsHeaders, handleOptions } from './_lib/coze-proxy.js'
import { BJTU_ADCODE, fetchAmapLiveWeather, getAmapWebKey } from './_lib/weather.js'

export default async function handler(req, res) {
  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v))
  if (handleOptions(req, res)) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const adcode = req.query?.adcode || BJTU_ADCODE
    const live = await fetchAmapLiveWeather(adcode, getAmapWebKey())
    return res.status(200).json({ ok: true, live })
  } catch (e) {
    return res.status(e.status || 500).json({
      ok: false,
      error: e.message || '天气获取失败',
    })
  }
}
