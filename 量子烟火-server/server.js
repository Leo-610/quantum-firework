// ═══════════════════════════════════════════════════════════════════
// 量子烟火 - Coze API 统一代理（Token 仅存服务端）
// ═══════════════════════════════════════════════════════════════════

import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvFile() {
  const envPath = join(__dirname, '.env')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvFile()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const CONFIG = {
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

function requireToken(name, token) {
  if (!token) {
    const err = new Error(`缺少 ${name} Token，请在 量子烟火-server/.env 中配置`)
    err.status = 503
    throw err
  }
}

function buildBotBody(body = {}) {
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

async function cozeFetch(config, payload) {
  requireToken(config.url, config.token)
  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return response
}

async function readResponseText(response) {
  const text = await response.text()
  return text
}

function tryParseJson(text) {
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

async function proxyJsonRoute(config, req, res, mapBody) {
  try {
    const payload = mapBody(req.body)
    console.log(`[${config.label}] 请求:`, payload)
    const response = await cozeFetch(config, payload)
    const text = await readResponseText(response)

    if (!response.ok) {
      console.error(`[${config.label}] HTTP ${response.status}:`, text.slice(0, 300))
      return res.status(response.status).json({ error: text, source: 'coze' })
    }

    const data = tryParseJson(text) ?? { raw: text }
    console.log(`[${config.label}] 响应:`, typeof data === 'object' ? JSON.stringify(data).slice(0, 200) : data)
    res.json(data)
  } catch (error) {
    console.error(`[${config.label}] 错误:`, error.message)
    res.status(error.status || 500).json({ error: error.message })
  }
}

async function proxyStreamRoute(config, req, res, mapBody) {
  try {
    const payload = mapBody(req.body)
    console.log(`[${config.label}] 流式请求:`, { ...payload, message: payload.message?.slice?.(0, 80) })
    const response = await cozeFetch(config, payload)

    if (!response.ok) {
      const text = await readResponseText(response)
      console.error(`[${config.label}] HTTP ${response.status}:`, text.slice(0, 300))
      return res.status(response.status).json({ error: text, source: 'coze' })
    }

    const contentType = response.headers.get('content-type') || 'text/event-stream'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    if (response.body) {
      for await (const chunk of response.body) {
        res.write(chunk)
      }
    }
    res.end()
  } catch (error) {
    console.error(`[${config.label}] 流式错误:`, error.message)
    if (!res.headersSent) {
      res.status(error.status || 500).json({ error: error.message })
    } else {
      res.end()
    }
  }
}

// ── 健康检查 ──
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: '量子烟火-API代理',
    endpoints: ['router', 'inner/stream', 'outer', 'emotion', 'food'],
  })
})

// ── Router Bot（意图路由，非流式聚合） ──
app.post('/api/router', (req, res) => {
  proxyJsonRoute(
    { ...CONFIG.router, label: 'Router' },
    req,
    res,
    buildBotBody,
  )
})

// ── Inner Bot（里世界，SSE 流式） ──
app.post('/api/inner/stream', (req, res) => {
  proxyStreamRoute(
    { ...CONFIG.inner, label: 'Inner' },
    req,
    res,
    buildBotBody,
  )
})

// ── Outer Bot（表世界，JSON） ──
app.post('/api/outer', (req, res) => {
  const body = req.body || {}
  proxyJsonRoute(
    { ...CONFIG.outer, label: 'Outer' },
    req,
    res,
    () => ({
      ...buildBotBody(body),
      dish_name: body.dish_name || body.dishName || '',
      original_review: body.original_review || body.originalReview || body.message || '',
      target_style: body.target_style || body.targetStyle || 'hupu',
    }),
  )
})

// ── 情绪工作流 ──
app.post('/api/emotion', (req, res) => {
  proxyJsonRoute(
    { ...CONFIG.emotion, label: 'EmotionWF' },
    req,
    res,
    (body) => ({
      user_text: body.user_text || body.userText || '',
      location: body.location || {},
    }),
  )
})

// ── 美食工作流 ──
app.post('/api/food', (req, res) => {
  proxyJsonRoute(
    { ...CONFIG.food, label: 'FoodWF' },
    req,
    res,
    (body) => ({
      dish_name: body.dish_name || body.dishName || '',
      original_review: body.original_review || body.originalReview || body.userText || '',
      target_style: body.target_style || body.targetStyle || 'hupu',
    }),
  )
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 量子烟火 API 代理已启动  http://localhost:${PORT}`)
  console.log('')
  console.log('接口:')
  console.log('  GET  /health')
  console.log('  POST /api/router')
  console.log('  POST /api/inner/stream')
  console.log('  POST /api/outer')
  console.log('  POST /api/emotion')
  console.log('  POST /api/food')
  console.log('')
  const missing = Object.entries(CONFIG)
    .filter(([, v]) => !v.token)
    .map(([k]) => k)
  if (missing.length) {
    console.warn(`⚠️  未配置 Token: ${missing.join(', ')} → 复制 .env.example 为 .env`)
  }
})
