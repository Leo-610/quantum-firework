import {
  CONFIG,
  corsHeaders,
  handleOptions,
  proxyJson,
  buildBotBody,
} from '../_lib/coze-proxy.js'

export default async function handler(req, res) {
  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v))
  if (handleOptions(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body || {}
    const data = await proxyJson(
      { ...CONFIG.outer, label: 'Outer' },
      body,
      () => ({
        ...buildBotBody(body),
        dish_name: body.dish_name || body.dishName || '',
        original_review: body.original_review || body.originalReview || body.message || '',
        target_style: body.target_style || body.targetStyle || 'hupu',
      }),
    )
    return res.status(200).json(data)
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message })
  }
}
