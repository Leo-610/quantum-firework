import { corsHeaders, handleOptions } from './_lib/coze-proxy.js'

export default async function handler(req, res) {
  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v))
  if (handleOptions(req, res)) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.status(200).json({
    status: 'ok',
    service: '量子烟火-API代理',
    platform: 'vercel',
    endpoints: ['router', 'inner/stream', 'outer', 'emotion', 'food'],
  })
}
