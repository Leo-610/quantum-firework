import {
  CONFIG,
  corsHeaders,
  handleOptions,
  proxyJson,
} from './_lib/coze-proxy.js'

export default async function handler(req, res) {
  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v))
  if (handleOptions(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const data = await proxyJson(
      { ...CONFIG.emotion, label: 'EmotionWF' },
      req.body || {},
      (body) => ({
        user_text: body.user_text || body.userText || '',
        location: body.location || {},
      }),
    )
    return res.status(200).json(data)
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message })
  }
}
