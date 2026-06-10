/** Coze API 代理逻辑 — 本地 Express 与 Vercel Serverless 共用 */

export const CONFIG = {
  emotion: {
    url: process.env.COZE_EMOTION_URL || 'https://hbm2bmdpjj.coze.site/run',
    token: process.env.COZE_EMOTION_TOKEN || '',
  },
  food: {
    url: process.env.COZE_FOOD_URL || 'https://nkq9pcx6y3.coze.site/run',
    token: process.env.COZE_FOOD_TOKEN || '',
  },
  router: {
    url: process.env.COZE_ROUTER_URL || 'https://wpfzsvhxzc.coze.site/stream_run',
    token: process.env.COZE_ROUTER_TOKEN || '',
  },
  inner: {
    url: process.env.COZE_INNER_URL || 'https://z645x6r9ym.coze.site/stream_run',
    token: process.env.COZE_INNER_TOKEN || '',
  },
  outer: {
    url: process.env.COZE_OUTER_URL || 'https://f78t3fzp7w.coze.site/stream_run',
    token: process.env.COZE_OUTER_TOKEN || '',
  },
}

export function requireToken(token, name = 'Coze') {
  if (!token) {
    const err = new Error(`缺少 ${name} Token，请配置环境变量`)
    err.status = 503
    throw err
  }
}

export function buildBotBody(body = {}) {
  const userInput = body.user_input || body.message || body.query || body.content || ''
  const location = body.location ?? {}
  return {
    user_input: userInput,
    message: userInput,
    query: userInput,
    BOT_USER_INPUT: userInput,
    location: typeof location === 'string' ? location : JSON.stringify(location),
    user_id: body.user_id || 'anonymous',
    meta_data: { location: JSON.stringify(location) },
  }
}

export async function cozeFetch(config, payload) {
  requireToken(config.token, config.label || 'Coze')
  return fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function tryParseJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

export async function proxyJson(config, body, mapBody) {
  const payload = mapBody(body)
  const response = await cozeFetch({ ...config, label: config.label }, payload)
  const text = await response.text()

  if (!response.ok) {
    const err = new Error(text.slice(0, 300) || `HTTP ${response.status}`)
    err.status = response.status
    throw err
  }

  return tryParseJson(text) ?? { raw: text }
}

export async function proxyStream(config, body, mapBody, res) {
  const payload = mapBody(body)
  const response = await cozeFetch({ ...config, label: config.label }, payload)

  if (!response.ok) {
    const text = await response.text()
    const err = new Error(text.slice(0, 300) || `HTTP ${response.status}`)
    err.status = response.status
    throw err
  }

  const contentType = response.headers.get('content-type') || 'text/event-stream'
  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  if (response.body) {
    const reader = response.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(Buffer.from(value))
    }
  }
  res.end()
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders())
    res.end()
    return true
  }
  return false
}
