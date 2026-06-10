import {
  CONFIG,
  corsHeaders,
  handleOptions,
  proxyStream,
  buildBotBody,
} from '../_lib/coze-proxy.js'

export default async function handler(req, res) {
  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v))
  if (handleOptions(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await proxyStream(
      { ...CONFIG.inner, label: 'Inner' },
      req.body || {},
      buildBotBody,
      res,
    )
  } catch (error) {
    if (!res.headersSent) {
      return res.status(error.status || 500).json({ error: error.message })
    }
    res.end()
  }
}
