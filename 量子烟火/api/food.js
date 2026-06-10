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
    const body = req.body || {}
    const data = await proxyJson(
      { ...CONFIG.food, label: 'FoodWF' },
      body,
      (b) => ({
        dish_name: b.dish_name || b.dishName || '',
        original_review: b.original_review || b.originalReview || b.userText || '',
        target_style: b.target_style || b.targetStyle || 'hupu',
      }),
    )
    return res.status(200).json(data)
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message })
  }
}
