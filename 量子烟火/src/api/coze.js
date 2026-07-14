// ═══════════════════════════════════════════════════════════════════
// Coze API 封装 — 经本地后端代理（/api → :3001）
// Token 仅存于 量子烟火-server/.env，失败时降级 Mock
// ═══════════════════════════════════════════════════════════════════

import { CAMPUS_EMOTION_LOCATION_MAP } from '../config/campus'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status}${errText ? `: ${errText.slice(0, 120)}` : ''}`)
  }
  return response
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

function extractAnswerText(data) {
  if (!data) return ''
  if (typeof data === 'string') return data

  const content = data.content
  if (typeof content === 'string') return content
  if (content && typeof content === 'object') {
    if (typeof content.text === 'string') return content.text
    if (typeof content.answer === 'string') return content.answer
    if (Array.isArray(content)) {
      return content
        .map(part => (typeof part === 'string' ? part : part?.text || part?.content || ''))
        .join('')
    }
  }

  const message = data.message
  if (typeof message === 'string') return message
  if (message && typeof message === 'object') {
    const mc = message.content
    if (typeof mc === 'string') return mc
    if (mc && typeof mc === 'object') return mc.text || mc.answer || ''
  }

  if (data.delta?.content) {
    const dc = data.delta.content
    return typeof dc === 'string' ? dc : (dc.text || '')
  }

  if (typeof data.output === 'string') return data.output
  if (typeof data.answer === 'string') return data.answer
  if (typeof data.text === 'string') return data.text
  if (typeof data.rewritten_text === 'string') return data.rewritten_text
  if (typeof data.raw === 'string') return data.raw

  if (data.data) {
    const nested = typeof data.data === 'string' ? tryParseJson(data.data) ?? data.data : data.data
    if (nested !== data.data) return extractAnswerText(nested)
  }

  return ''
}

/** 从 SSE 单条 payload 提取可显示的文本片段 */
function extractStreamChunk(data) {
  const text = extractAnswerText(data)
  return typeof text === 'string' ? text : ''
}

function normalizeRouterResult(data) {
  const parsed = typeof data === 'string' ? tryParseJson(data) : data
  if (!parsed) return null
  if (parsed.world) return parsed
  const nested = parsed.data || parsed.result || parsed.output
  if (typeof nested === 'string') {
    const inner = tryParseJson(nested)
    if (inner?.world) return inner
  }
  if (nested?.world) return nested
  return null
}

function routeIntentLocal({ userInput }) {
  const innerKeywords = ['焦虑', '迷茫', '难过', '考挂', '崩溃', '失眠', '压力', '心情', 'emo', '想哭', '累', '失败', '挫折', '失落']
  const outerKeywords = ['食堂', '吃饭', '菜品', '排队', '红烧肉', '好吃', '难吃', '菜价', '宫保鸡丁', '推荐', '味道']

  const innerScore = innerKeywords.filter(k => userInput.includes(k)).length
  const outerScore = outerKeywords.filter(k => userInput.includes(k)).length

  if (innerScore > outerScore) {
    return { world: 'inner', intent: 'emotion_anchor', confidence: 0.9, source: 'local' }
  }
  if (outerScore > innerScore) {
    return { world: 'outer', intent: 'food_review', confidence: 0.9, source: 'local' }
  }
  return {
    world: 'ambiguous',
    intent: 'clarify',
    confidence: 0.8,
    question: '你是想倾诉一下，还是找食堂推荐呀？',
    source: 'local',
  }
}

async function consumeSSE(response, onChunk) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split('\n')
    buffer = parts.pop() || ''

    for (const line of parts) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (!payload || payload === '[DONE]') continue

      const data = tryParseJson(payload)
      if (!data) continue

      const chunk = extractStreamChunk(data)
      if (chunk) {
        fullText += chunk
        onChunk?.(chunk)
      }
    }
  }

  if (!fullText && buffer.trim()) {
    const data = tryParseJson(buffer.trim().replace(/^data:/, '').trim())
    const chunk = extractStreamChunk(data)
    if (chunk) {
      fullText = chunk
      onChunk?.(chunk)
    }
  }

  return fullText
}

async function simulateStream(text, onChunk) {
  for (let i = 0; i < text.length; i += 3) {
    await new Promise(r => setTimeout(r, 30))
    onChunk?.(text.slice(i, i + 3))
  }
  return text
}

// ═══════════════════════════════════════════════════════════════════
// Router Bot（经后端代理，失败降级本地关键词）
// ═══════════════════════════════════════════════════════════════════
export async function routeIntent({ userInput, location, userId }) {
  try {
    const response = await apiPost('/router', {
      user_input: userInput,
      message: userInput,
      location: location || {},
      user_id: userId || 'anonymous',
    })
    const data = await response.json()
    const routed = normalizeRouterResult(data)
    if (routed) {
      console.log('[Router Bot] 响应:', routed)
      return { ...routed, source: 'coze' }
    }
    throw new Error('无法解析路由结果')
  } catch (e) {
    console.warn('[Router Bot] 降级本地路由:', e.message)
    return routeIntentLocal({ userInput })
  }
}

// ═══════════════════════════════════════════════════════════════════
// 情绪工作流
// ═══════════════════════════════════════════════════════════════════
export async function runEmotionWorkflow({ userText, location }) {
  console.log('[Emotion Workflow] 调用:', { userText, location })

  try {
    const response = await apiPost('/emotion', {
      user_text: userText,
      userText,
      location: location || {},
    })
    const data = await response.json()
    console.log('[Emotion Workflow] 响应:', data)

    return {
      plant_type: data.plant_type || 'flower',
      plant_color: data.plant_color || '#4488ff',
      plant_glow: data.plant_glow || 'rgba(68,136,255,0.64)',
      plant_intensity: data.plant_intensity || 0.6,
      echo_text: data.echo_text || '',
    }
  } catch (e) {
    console.error('[Emotion Workflow] 错误:', e)
    console.log('[Emotion Workflow] 使用 Mock 数据')
    return mockEmotionWorkflow({ userText, location })
  }
}

// ═══════════════════════════════════════════════════════════════════
// 美食工作流
// ═══════════════════════════════════════════════════════════════════
export async function runFoodWorkflow({ userText, originalReview, dishName, targetStyle = 'hupu' }) {
  const reviewText = userText ?? originalReview ?? ''
  console.log('[Food Workflow] 调用:', { dishName, userText: reviewText, targetStyle })

  try {
    const response = await apiPost('/food', {
      dish_name: dishName,
      dishName,
      original_review: reviewText,
      originalReview: reviewText,
      target_style: targetStyle,
      targetStyle,
    })
    const data = await response.json()
    console.log('[Food Workflow] 响应:', data)

    return {
      rewritten_text: data.rewritten_text || '',
      radar_data: data.radar_data || { price: 7, fullness: 7, queue: 7, shake: 7, risk: 7 },
      style_id: data.style_id || targetStyle,
    }
  } catch (e) {
    console.error('[Food Workflow] 错误:', e)
    console.log('[Food Workflow] 使用 Mock 数据')
    return mockFoodWorkflow(reviewText, dishName, targetStyle)
  }
}

// ═══════════════════════════════════════════════════════════════════
// Inner Bot 流式对话（SSE，失败降级 Mock 流式）
// ═══════════════════════════════════════════════════════════════════
export async function innerWorldStream({ userInput, location, userId, onChunk, onDone }) {
  try {
    const response = await apiPost('/inner/stream', {
      user_input: userInput,
      message: userInput,
      location: location || {},
      user_id: userId || 'anonymous',
    })

    const contentType = response.headers.get('content-type') || ''
    let text = ''

    if (contentType.includes('text/event-stream') && response.body) {
      text = await consumeSSE(response, onChunk)
    } else {
      const data = await response.json()
      text = extractAnswerText(data) || extractAnswerText(data?.data) || ''
      if (text) await simulateStream(text, onChunk)
    }

    if (!text.trim()) throw new Error('Inner Bot 返回空内容')

    console.log('[Inner Bot] 流式完成, 字数:', text.length)
    onDone?.()
    return text
  } catch (e) {
    console.warn('[Inner Bot] 降级 Mock 流式:', e.message)
    const result = await runEmotionWorkflow({ userText: userInput, location })
    const fallback = result.echo_text || '愿这株植物陪伴你度过这段时光...'
    await simulateStream(fallback, onChunk)
    onDone?.()
    return fallback
  }
}

// ═══════════════════════════════════════════════════════════════════
// Outer Bot（表世界结构化输出，供扩展使用）
// ═══════════════════════════════════════════════════════════════════
export async function runOuterBot({ dishName, originalReview, targetStyle = 'hupu', userId }) {
  try {
    const response = await apiPost('/outer', {
      dish_name: dishName,
      original_review: originalReview,
      target_style: targetStyle,
      user_id: userId || 'anonymous',
    })
    const data = await response.json()
    return {
      rewritten_text: data.rewritten_text || extractAnswerText(data),
      radar_data: data.radar_data,
      style_id: data.style_id || targetStyle,
    }
  } catch (e) {
    console.warn('[Outer Bot] 降级美食工作流:', e.message)
    return runFoodWorkflow({ userText: originalReview, dishName, targetStyle })
  }
}

// ═══════════════════════════════════════════════════════════════════
// Mock 数据
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// 情绪工作流 Mock 数据 - 里世界植物（按情绪分类）
// 包含学长学姐的时空回响语录
// ═══════════════════════════════════════════════════════════════════

// 情绪分类
const EMOTION_TAGS = {
  anxiety: '焦虑迷茫',
  sadness: '失落难过',
  exhaustion: '疲惫无力',
  confusion: '困惑迷茫',
  loneliness: '孤独寂寞',
  hope: '期待希望',
  peace: '平静释然'
}

// 时空回响语料库 - 学长学姐的匿名记录
const ECHO_RECORDS = {
  // 思源楼
  siyuan: [
    '那个学期我每天都坐在302，感觉代码是我的敌人。后来我毕业了，才知道那段时间是我最好的时光。',
    '那年夜半，我在台灯下把自己一点点读干。后来才发现，思源楼的灯从不熄灭，因为它知道有人需要。',
    '期末考试前夜，思源楼七楼的走廊坐满了人。我们互不相识，却共享着同一份焦虑。那一刻，我觉得我们是一体的。',
    '凌晨两点的思源楼，窗外是北京的夜色，窗内是一颗颗不安的心。我在草稿纸上写了一句话：一切都会过去的。',
    '为了保研名额，我把自己逼得很紧。有一天在思源楼天台透气时，看见一个学长也在那里。他说：四年后回头看，这些都是小事。',
  ],
  // 图书馆
  library: [
    '大三的我，对着借阅记录发呆了很久。我借了很多关于"未来"的书，一本都没看完。原来，答案不在书里。',
    '图书馆五楼的角落是我的秘密基地。那里有一盆快要枯死的绿萝，我每周给它浇水。后来它活了，我也活过来了。',
    '我在图书馆遇见一个人。我们没说过话，但我记得她每天坐在靠窗的位置。后来她毕业了，我再也没见过她。',
    '考研那年的冬天，图书馆暖气很足。我在笔记本上写：不管结果怎样，我都已经尽力了。写完，眼泪掉了下来。',
    '图书馆闭馆音乐响起时，我总是最后一个离开。不是因为勤奋，是因为不想回到空荡荡的宿舍。',
  ],
  // 操场
  playground: [
    '输掉比赛那天，我一个人绕着操场跑了六圈。跑完，什么都还在，但好像轻了一点。',
    '在操场表白被拒绝的那天晚上，我躺在草坪上看了很久的星星。后来发现，星星还在，我也不差。',
    '每个失眠的夜晚，我都会去操场跑几圈。汗水蒸发的时候，好像连同烦恼一起带走了。',
    '毕业那天，我们绕着操场走了很多圈。有人说：以后再也找不到这么大的操场了。其实，是再也回不去这样的日子了。',
    '失恋那天，北京下着小雨。我在操场淋了两个小时的雨。回去的路上，室友给我带了碗热汤面。',
  ],
  // 红果园
  hongguoyuan: [
    '刚入学时总是一个人吃饭。后来发现，那棵老树下每天都有人。原来，孤独的人并不孤独。',
    '红果园的老树下，有人刻过字。我找到了一个"加油"，后来成为我撑过低谷的力量。',
    '每年毕业季，都有人在那棵树下拍照。我曾许愿，希望明年我也能站在同一个位置。现在，我做到了。',
    '红果园的夜晚很安静。有一个学长告诉我，他在这里哭过很多次。我问他后来呢，他说：后来就好了。',
    '我在红果园老树下埋了一个时间胶囊。写着：四年后的我，你还好吗？今年，我打开了它。',
  ],
  // 嘉园宿舍
  jiayuan: [
    '深夜的嘉园走廊，每扇门后都是一个不同的宇宙。我站在走廊里，突然不知道该敲哪扇门。',
    '室友都回家了，我一个人留在宿舍过年。大年三十晚上，我们视频通话一起看春晚。原来，距离不是问题。',
    '嘉园的暖气很足，但有时候还是觉得冷。大概是心里冷吧。后来，我学会了给自己找事做。',
    '宿舍夜聊是我们宿舍的传统。那天晚上我们聊到凌晨四点，聊梦想、聊喜欢的人、聊以后要成为什么样的人。',
    '搬进嘉园的第一天，我觉得这里好小。四年后离开那天，我发现它装下了我所有的回忆。',
  ],
  // 学苑食堂
  xueyuan: [
    '学苑食堂的煎饼，是早八的救赎。阿姨每次都会多给我加个鸡蛋，她说：看你每天那么累，多吃点。',
    '有一段时间我天天吃学苑的麻辣烫。后来同学问我：你怎么天天吃这个？我说：因为那个窗口的姐姐会记得我喜欢什么。',
    '第一次在学校过生日，食堂阿姨给我加了个卤蛋。她说：以后每年这天，来找我，阿姨请你。',
  ],
  // 通用
  general: [
    '有人说，大学的意义不在于学到什么，而在于遇到什么人。我深以为然。',
    '四年很长，长到可以改变一个人。四年也很短，短到转眼就要说再见。',
    '那些当时觉得过不去的坎，现在回头看，都是风景。',
    '我们都在各自的轨道上努力着，孤独但不孤单。',
    '北京的风很大，但吹不散我们想要前进的心。',
  ]
}

// 随机获取一条时空回响
function getEcho(locationKey = null) {
  let pool = ECHO_RECORDS.general

  if (locationKey && ECHO_RECORDS[locationKey]) {
    pool = [...ECHO_RECORDS[locationKey], ...ECHO_RECORDS.general]
  }

  const record = pool[Math.floor(Math.random() * pool.length)]
  return `有人曾在这里写下："${record}"`
}

// 情绪植物数据 - 按情绪和植物类型组织
const MOCK_PLANTS = [
  // ═══════════════════════════════════════════════════════════════════
  // 【焦虑迷茫】
  // ═══════════════════════════════════════════════════════════════════
  {
    emotion: 'anxiety',
    plant_type: 'flower',
    plant_color: '#FFB7C5',
    plant_glow: '#FF69B4',
    name: '月光花',
    flower_language: '永远的爱与信任',
    echo_text: '月光花在深夜里悄然绽放，它知道黎明终会到来。你此刻的焦虑，不过是漫长黑夜里的一场梦。思源楼的灯光依然亮着，它见证过无数个深夜奋战的背影，也包括你。'
  },
  {
    emotion: 'anxiety',
    plant_type: 'flower',
    plant_color: '#E6E6FA',
    plant_glow: '#9370DB',
    name: '薰衣草',
    flower_language: '等待爱情，平静的心',
    echo_text: `薰衣草的香气漫过思源楼的走廊，它轻声说：那些让你辗转难眠的事，终会在某个清晨变得云淡风轻。${getEcho("siyuan")}`
  },
  {
    emotion: 'anxiety',
    plant_type: 'crystal',
    plant_color: '#7b2fff',
    plant_glow: '#9370DB',
    name: '紫晶簇',
    flower_language: '智慧与灵性',
    echo_text: `紫晶簇中封存着宇宙的记忆，无数人曾在这里仰望星空、寻找答案。${getEcho("library")}你并不孤独。`
  },
  {
    emotion: 'anxiety',
    plant_type: 'grass',
    plant_color: '#98FB98',
    plant_glow: '#00D68F',
    name: '忘忧草',
    flower_language: '忘却忧愁，隐藏的爱',
    echo_text: `忘忧草在图书馆的角落里静静生长。它说：不必急着找到所有答案，有些路，走着走着就清晰了。${getEcho("library")}`
  },
  {
    emotion: 'anxiety',
    plant_type: 'tree',
    plant_color: '#228B22',
    plant_glow: '#32CD32',
    name: '白杨',
    flower_language: '坚韧与高洁',
    echo_text: `白杨树在操场边静静伫立，风吹过时沙沙作响。${getEcho("playground")}有人说：跑着跑着，答案就出来了。`
  },
  {
    emotion: 'anxiety',
    plant_type: 'flower',
    plant_color: '#87CEEB',
    plant_glow: '#00BFFF',
    name: '蓝铃花',
    flower_language: '感恩与信任',
    echo_text: `蓝铃花在春雨中低垂着头，它懂得你的不安。${getEcho("siyuan")}但请相信：焦虑是成长的副产品，你正在变得更好。`
  },

  // ═══════════════════════════════════════════════════════════════════
  // 【失落难过】
  // ═══════════════════════════════════════════════════════════════════
  {
    emotion: 'sadness',
    plant_type: 'flower',
    plant_color: '#FF6B6B',
    plant_glow: '#FF4757',
    name: '彼岸花',
    flower_language: '永不再见的思念',
    echo_text: `彼岸花开在红果园的老树下，它见过太多眼泪。但它也知道，每一滴泪水落下，都会有一朵花在春天绽放。${getEcho("hongguoyuan")}`
  },
  {
    emotion: 'sadness',
    plant_type: 'flower',
    plant_color: '#FF69B4',
    plant_glow: '#FF1493',
    name: '曼珠沙华',
    flower_language: '悲伤的回忆',
    echo_text: `曼珠沙华的红色像凝固的晚霞。${getEcho("playground")}跑完，什么都还在，但好像轻了一点。`
  },
  {
    emotion: 'sadness',
    plant_type: 'tree',
    plant_color: '#2E8B57',
    plant_glow: '#3CB371',
    name: '银杏',
    flower_language: '坚韧与沉着',
    echo_text: `银杏叶在秋风中缓缓飘落，像一封封寄给未来的信。${getEcho("hongguoyuan")}那些你以为失去的，都化作了来年新芽的养分。`
  },
  {
    emotion: 'sadness',
    plant_type: 'mushroom',
    plant_color: '#B39DDB',
    plant_glow: '#9C27B0',
    name: '紫曜菇',
    flower_language: '神秘与守护',
    echo_text: `紫曜菇藏在童话世界的入口，它邀请你暂时放下现实的重量。${getEcho("jiayuan")}在这里，你可以只是你。`
  },
  {
    emotion: 'sadness',
    plant_type: 'grass',
    plant_color: '#90EE90',
    plant_glow: '#32CD32',
    name: '勿忘我',
    flower_language: '永恒的爱，勿忘',
    echo_text: `勿忘我在晨露中轻轻摇曳。${getEcho("library")}有人说：有些事，忘不了也没关系，就让它在那里吧。`
  },
  {
    emotion: 'sadness',
    plant_type: 'flower',
    plant_color: '#DDA0DD',
    plant_glow: '#BA55D3',
    name: '紫罗兰',
    flower_language: '永恒的美，质朴',
    echo_text: `紫罗兰在角落里静静绽放，它不争不抢，只是存在着。${getEcho("siyuan")}难过的时候，允许自己难过，这也是一种温柔。`
  },

  // ═══════════════════════════════════════════════════════════════════
  // 【疲惫无力】
  // ═══════════════════════════════════════════════════════════════════
  {
    emotion: 'exhaustion',
    plant_type: 'flower',
    plant_color: '#FFA07A',
    plant_glow: '#FF7F50',
    name: '向日葵',
    flower_language: '沉默的爱，忠诚',
    echo_text: `向日葵永远朝着光明，但它也会在夜晚低头休息。${getEcho("jiayuan")}它说：允许自己疲惫，你已经做得很好了。`
  },
  {
    emotion: 'exhaustion',
    plant_type: 'grass',
    plant_color: '#77DD77',
    plant_glow: '#50C878',
    name: '苔藓',
    flower_language: '深沉的爱，母爱',
    echo_text: `苔藓覆盖着古老的石头，它说：不必永远坚强。${getEcho("hongguoyuan")}有时候，安静地待着，也是一种力量。`
  },
  {
    emotion: 'exhaustion',
    plant_type: 'tree',
    plant_color: '#8FBC8F',
    plant_glow: '#66CDAA',
    name: '垂柳',
    flower_language: '依依不舍，恋旧',
    echo_text: `垂柳在嘉园旁轻轻摇曳，它懂得深夜走廊里每一盏灯的故事。${getEcho("jiayuan")}累了就歇一歇，明天的风会送你继续前行。`
  },
  {
    emotion: 'exhaustion',
    plant_type: 'mushroom',
    plant_color: '#FFDAB9',
    plant_glow: '#FFA07A',
    name: '云朵菇',
    flower_language: '轻盈与自由',
    echo_text: `云朵菇像一团柔软的棉絮，它说：你不必一直紧绷着。${getEcho("library")}允许自己飘一会儿，天不会塌下来。`
  },
  {
    emotion: 'exhaustion',
    plant_type: 'flower',
    plant_color: '#FFFACD',
    plant_glow: '#FFD700',
    name: '小雏菊',
    flower_language: '希望与纯洁',
    echo_text: `小雏菊在路边静静开放，不起眼但很温暖。${getEcho("xueyuan")}阿姨说：看你每天那么累，多吃点。这就是最简单的善意。`
  },
  {
    emotion: 'exhaustion',
    plant_type: 'crystal',
    plant_color: '#E0E0E0',
    plant_glow: '#B0C4DE',
    name: '月光石',
    flower_language: '柔和与宁静',
    echo_text: `月光石映照着柔和的光。${getEcho("jiayuan")}室友说：睡吧，明天的事情明天再说。那一刻，我觉得很安心。`
  },

  // ═══════════════════════════════════════════════════════════════════
  // 【困惑迷茫】
  // ═══════════════════════════════════════════════════════════════════
  {
    emotion: 'confusion',
    plant_type: 'crystal',
    plant_color: '#00CED1',
    plant_glow: '#40E0D0',
    name: '海蓝晶',
    flower_language: '沉静与智慧',
    echo_text: `海蓝晶散发着平静的力量。${getEcho("library")}后来发现——迷茫不是终点，而是寻找的起点。`
  },
  {
    emotion: 'confusion',
    plant_type: 'crystal',
    plant_color: '#87CEEB',
    plant_glow: '#00BFFF',
    name: '天使之泪',
    flower_language: '纯粹的悲伤',
    echo_text: `天使之泪滴落在思源楼的窗台。${getEcho("library")}原来，答案不在书里，答案在路上。`
  },
  {
    emotion: 'confusion',
    plant_type: 'flower',
    plant_color: '#DDA0DD',
    plant_glow: '#DA70D6',
    name: '紫藤萝',
    flower_language: '醉人的恋情，思念',
    echo_text: `紫藤萝缠绕在操场的围栏上。它说：看不清路的时候，就先迈出一步。${getEcho("playground")}答案往往在路上等着你。`
  },
  {
    emotion: 'confusion',
    plant_type: 'grass',
    plant_color: '#ADFF2F',
    plant_glow: '#7FFF00',
    name: '萤火星草',
    flower_language: '照亮黑暗的希望',
    echo_text: `萤火星草在黑暗中发出微光。${getEcho("siyuan")}有人问：我的未来在哪里？它答：就在你脚下的每一步里。`
  },
  {
    emotion: 'confusion',
    plant_type: 'tree',
    plant_color: '#006400',
    plant_glow: '#228B22',
    name: '罗汉松',
    flower_language: '长寿与吉祥',
    echo_text: `罗汉松在红果园静静伫立。${getEcho("hongguoyuan")}学长说：四年后回头看，这些都是小事。我现在信了。`
  },
  {
    emotion: 'confusion',
    plant_type: 'flower',
    plant_color: '#F0FFFF',
    plant_glow: '#E0FFFF',
    name: '风信子',
    flower_language: '重生的爱，忘记过去',
    echo_text: `风信子在春风中绽放。${getEcho("library")}有人说：我借了很多关于"未来"的书，一本都没看完。原来，书不能告诉我答案。`
  },

  // ═══════════════════════════════════════════════════════════════════
  // 【孤独寂寞】
  // ═══════════════════════════════════════════════════════════════════
  {
    emotion: 'loneliness',
    plant_type: 'flower',
    plant_color: '#F0F8FF',
    plant_glow: '#E6E6FA',
    name: '雪花莲',
    flower_language: '希望，新生',
    echo_text: `雪花莲在冬天的红果园绽放。${getEcho("hongguoyuan")}原来，孤独的人并不孤独。`
  },
  {
    emotion: 'loneliness',
    plant_type: 'tree',
    plant_color: '#228B22',
    plant_glow: '#32CD32',
    name: '梧桐',
    flower_language: '孤独与高洁',
    echo_text: `梧桐叶在秋风里沙沙作响。${getEcho("jiayuan")}每扇门后都有一个不同的宇宙，而你，也是其中一个。`
  },
  {
    emotion: 'loneliness',
    plant_type: 'mushroom',
    plant_color: '#E0FFFF',
    plant_glow: '#AFEEEE',
    name: '月光藜',
    flower_language: '陪伴与守护',
    echo_text: `月光藜在夜里发出幽蓝的光。${getEcho("siyuan")}你不是一个人。这个世界上，有很多人和你一样，在深夜里独自前行。`
  },
  {
    emotion: 'loneliness',
    plant_type: 'crystal',
    plant_color: '#FFD700',
    plant_glow: '#FFA500',
    name: '金曜石',
    flower_language: '勇气与力量',
    echo_text: `金曜石闪烁着温暖的光芒。${getEcho("jiayuan")}苏轼说：但愿人长久，千里共婵娟。即使相隔千里，也有人与你同看一轮月亮。`
  },
  {
    emotion: 'loneliness',
    plant_type: 'grass',
    plant_color: '#98FB98',
    plant_glow: '#90EE90',
    name: '四叶草',
    flower_language: '幸运与希望',
    echo_text: `四叶草在阳光下闪闪发光。${getEcho("playground")}毕业那天，我们绕着操场走了很多圈。原来，最珍贵的不是目的地，而是有人陪。`
  },
  {
    emotion: 'loneliness',
    plant_type: 'flower',
    plant_color: '#FFB6C1',
    plant_glow: '#FF69B4',
    name: '满天星',
    flower_language: '思念与陪伴',
    echo_text: `满天星点缀在草丛间，像散落的星光。${getEcho("library")}我在图书馆遇见一个人，我们没说过话，但我记得她。`
  },

  // ═══════════════════════════════════════════════════════════════════
  // 【期待希望】
  // ═══════════════════════════════════════════════════════════════════
  {
    emotion: 'hope',
    plant_type: 'flower',
    plant_color: '#A8E6CF',
    plant_glow: '#7BED9F',
    name: '雏菊',
    flower_language: '希望，纯洁的美',
    echo_text: `雏菊在春风中摇曳。${getEcho("hongguoyuan")}它说：每个冬天的句点都是春暖花开。那些你觉得过不去的坎，回头看，都是风景。`
  },
  {
    emotion: 'hope',
    plant_type: 'flower',
    plant_color: '#FFD700',
    plant_glow: '#FFA500',
    name: '迎春花',
    flower_language: '希望，青春',
    echo_text: `迎春花在料峭的春寒中绽放。${getEcho("playground")}竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。困境终会过去，春天终会到来。`
  },
  {
    emotion: 'hope',
    plant_type: 'crystal',
    plant_color: '#00FF7F',
    plant_glow: '#3CB371',
    name: '祖母绿',
    flower_language: '新生，复苏',
    echo_text: `祖母绿散发着生机勃勃的光芒。${getEcho("siyuan")}山重水复疑无路，柳暗花明又一村。转机，往往就在下一个转角。`
  },
  {
    emotion: 'hope',
    plant_type: 'grass',
    plant_color: '#7CFC00',
    plant_glow: '#32CD32',
    name: '幸运草',
    flower_language: '希望与幸运',
    echo_text: `幸运草在阳光下闪闪发光。${getEcho("hongguoyuan")}王维说：行到水穷处，坐看云起时。有时候，绝路也是另一条路的开始。`
  },
  {
    emotion: 'hope',
    plant_type: 'tree',
    plant_color: '#228B22',
    plant_glow: '#32CD32',
    name: '樱花',
    flower_language: '生命与希望',
    echo_text: `樱花在春天盛放，如云似霞。${getEcho("library")}考研那年，图书馆暖气很足。我在笔记本上写：不管结果怎样，我都已经尽力了。`
  },
  {
    emotion: 'hope',
    plant_type: 'mushroom',
    plant_color: '#FFE4B5',
    plant_glow: '#FFDAB9',
    name: '朝阳菇',
    flower_language: '温暖与新生',
    echo_text: `朝阳菇向着光的方向生长。${getEcho("siyuan")}每年毕业季，都有人在那棵树下拍照。我曾许愿，希望明年我也能站在同一个位置。现在，我做到了。`
  },

  // ═══════════════════════════════════════════════════════════════════
  // 【平静释然】
  // ═══════════════════════════════════════════════════════════════════
  {
    emotion: 'peace',
    plant_type: 'flower',
    plant_color: '#E0FFFF',
    plant_glow: '#AFEEEE',
    name: '睡莲',
    flower_language: '纯净的心，舒适',
    echo_text: `睡莲在平静的水面上轻轻漂浮。${getEcho("hongguoyuan")}此刻，你只需要呼吸。让思绪像云一样飘过，不追，不赶。`
  },
  {
    emotion: 'peace',
    plant_type: 'tree',
    plant_color: '#006400',
    plant_glow: '#228B22',
    name: '松柏',
    flower_language: '坚贞不渝，长寿',
    echo_text: `松柏在四季中常青。${getEcho("playground")}它说：任他风吹雨打，我自岿然不动。内心平静，便是最好的修行。`
  },
  {
    emotion: 'peace',
    plant_type: 'mushroom',
    plant_color: '#FFB347',
    plant_glow: '#FF8C00',
    name: '琥珀菌',
    flower_language: '时间与永恒',
    echo_text: `琥珀菌散发着温暖的光泽。${getEcho("jiayuan")}庄子说：不知周之梦为蝴蝶与，蝴蝶之梦为周与？此刻，你只需要存在。`
  },
  {
    emotion: 'peace',
    plant_type: 'crystal',
    plant_color: '#F5F5F5',
    plant_glow: '#E0E0E0',
    name: '月光石',
    flower_language: '柔和与宁静',
    echo_text: `月光石映照着柔和的月光。${getEcho("library")}加缪说：重要的不是治愈，而是带着病痛活下去。平静接纳，本身就是力量。`
  },
  {
    emotion: 'peace',
    plant_type: 'grass',
    plant_color: '#90EE90',
    plant_glow: '#98FB98',
    name: '薰衣草',
    flower_language: '宁静与和平',
    echo_text: `薰衣草的香气弥漫在空气中。${getEcho("siyuan")}夜半的台灯下，有人写下一句话：一切都会过去的。后来证明，确实如此。`
  },
  {
    emotion: 'peace',
    plant_type: 'flower',
    plant_color: '#FFFACD',
    plant_glow: '#FFE4B5',
    name: '郁金香',
    flower_language: '博爱与体贴',
    echo_text: `郁金香在春风中优雅绽放。${getEcho("xueyuan")}那碗热汤面的温度，至今还在。有些温暖，会一直留在心里。`
  },

  // ═══════════════════════════════════════════════════════════════════
  // 【通用植物】
  // ═══════════════════════════════════════════════════════════════════
  {
    emotion: 'neutral',
    plant_type: 'flower',
    plant_color: '#FF6347',
    plant_glow: '#FF4500',
    name: '火焰兰',
    flower_language: '热情与勇敢',
    echo_text: `火焰兰在心头燃烧，它知道你的疲惫，也相信你能重新站起来。${getEcho("general")}`
  },
  {
    emotion: 'neutral',
    plant_type: 'grass',
    plant_color: '#98FB98',
    plant_glow: '#00D68F',
    name: '青岩草',
    flower_language: '坚韧与顽强',
    echo_text: `青岩草在石缝中生长，它明白痛苦只是成长的养分。${getEcho("general")}`
  },
  {
    emotion: 'neutral',
    plant_type: 'tree',
    plant_color: '#DEB887',
    plant_glow: '#D2691E',
    name: '银叶树',
    flower_language: '智慧与长寿',
    echo_text: `银叶树伸展着枝桠，每一片叶子都是一句无声的安慰。${getEcho("general")}`
  },
  {
    emotion: 'neutral',
    plant_type: 'flower',
    plant_color: '#FFC0CB',
    plant_glow: '#FF69B4',
    name: '樱草',
    flower_language: '青春与纯真',
    echo_text: `樱草在晨光中绽放，每一片花瓣都写满了青春的名字。${getEcho("general")}`
  },
  {
    emotion: 'neutral',
    plant_type: 'crystal',
    plant_color: '#E6E6FA',
    plant_glow: '#DDA0DD',
    name: '紫水晶',
    flower_language: '灵性与智慧',
    echo_text: `紫水晶在月光下闪烁着神秘的光芒。${getEcho("general")}四年很长，长到可以改变一个人。四年也很短，短到转眼就要说再见。`
  },
  {
    emotion: 'neutral',
    plant_type: 'mushroom',
    plant_color: '#FFE4C4',
    plant_glow: '#FFDAB9',
    name: '糖霜菇',
    flower_language: '甜蜜与温馨',
    echo_text: `糖霜菇像一颗小小的糖果，藏在草丛间。${getEcho("xueyuan")}有些温暖，来自陌生人善意的举动。`
  },
]

// 按情绪获取植物
function getPlantsByEmotion(emotion) {
  return MOCK_PLANTS.filter(p => p.emotion === emotion || p.emotion === 'neutral')
}

// 获取随机植物
function getRandomPlant(emotion = null) {
  let candidates = emotion ? getPlantsByEmotion(emotion) : MOCK_PLANTS
  return candidates[Math.floor(Math.random() * candidates.length)]
}

// ═══════════════════════════════════════════════════════════════════
// 美食工作流 Mock 数据 - 12种风格 × 北京特色菜品
// ═══════════════════════════════════════════════════════════════════

// 风格定义
const FOOD_STYLES = {
  hupu: { name: '虎扑JR体', desc: '篮球大哥的口吻，体育比喻' },
  luxun: { name: '鲁迅体', desc: '批判现实主义，文言夹白话' },
  bingxin: { name: '冰心体', desc: '温婉细腻，自然意象' },
  lindaivyu: { name: '林黛玉体', desc: '多愁善感，清冷书卷气' },
  zhangailing: { name: '张爱玲体', desc: '清冷克制，洞察人心' },
  wangxiaobo: { name: '王小波体', desc: '理性幽默，论证式表达' },
  manbo: { name: '曼波体', desc: '节奏感强，口号式调侃' },
  erciyuan: { name: '二刺螈体', desc: '二次元语感，颜文字吐槽' },
  zhenhuan: { name: '甄嬛体', desc: '宫廷语言，优雅婉转' },
  sushi: { name: '苏轼体', desc: '豁达美食家，文白夹杂' },
  luban: { name: '鲁班手札体', desc: '工程笔记，条理清晰' },
  shuomingshu: { name: '说明书体', desc: '产品规格语言，冷静荒诞' },
}

// 北京交通大学食堂常见菜品
const BJTU_DISHES = [
  '红烧肉', '宫保鸡丁', '糖醋里脊', '麻辣香锅', '黄焖鸡', '酸菜鱼',
  '北京烤鸭', '京酱肉丝', '老北京炸酱面', '豆汁儿', '卤煮火烧',
  '西二旗包子', '学五煎饼', '思源肉夹馍', '图书馆咖啡', '操场烧烤',
  '红果园凉面', '二食堂包子', '学苑早餐', '嘉园盖饭'
]

// 按风格和菜品组织的点评数据
const MOCK_FOOD_STYLES = {
  // ═══════════════════════════════════════════════════════════════════
  // 风格一：虎扑JR体
  // ═══════════════════════════════════════════════════════════════════
  hupu: {
    红烧肉: { text: `实不相瞒老哥，今天这红烧肉直接把我打服了！\n那肥肉入口即化，詹姆斯看了都得点赞；瘦肉嫩得能掐出水，根本不像食堂水平。\n甜咸比例堪称教科书级别，我愿称之为「学五MVP」！\n唯一的缺点就是太下饭了，月底饭卡直接裸奔...\n@食堂阿姨：就这手艺，CBA球队都想来挖人！`, radar: { price: 4, fullness: 5, queue: 7, shake: 3, risk: 5 } },
    北京烤鸭: { text: `老哥们，这北京烤鸭是认真的吗？\n鸭皮烤得酥脆，卷上薄饼葱丝，这波操作直接梦回五道口！\n油脂处理得相当到位，不像某些食堂油得能炒菜。\n性价比在帝都食堂界绝对是状元级别，我不允许还有人不知道！\n就冲这烤鸭，我愿意在食堂蹲一学期！`, radar: { price: 5, fullness: 4, queue: 6, shake: 4, risk: 4 } },
    卤煮火烧: { text: `兄弟们，今天终于对学苑的卤煮下手了！\n这卤汁浓郁度堪比NBA总决赛的收视率，够劲！\n火烧吸满汤汁，大肠处理干净，豆泡比库里三分还准。\n就是排队有点季后赛的感觉，建议错峰。\n@想吃的兄弟：错过这村就没这店了，赶紧冲！`, radar: { price: 5, fullness: 5, queue: 8, shake: 6, risk: 7 } },
    default: { text: `老哥，今天这道菜属实让我眼前一亮！\n味道在线，分量实在，性价比在食堂里算是状元级别。\n火候控制得不错，调料比例也拿捏得很准。\n唯一的建议就是——趁人少的时候来，体验直接拉满！\n给个8分，不接受反驳！`, radar: { price: 4, fullness: 4, queue: 6, shake: 4, risk: 4 } }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 风格二：鲁迅体
  // ═══════════════════════════════════════════════════════════════════
  luxun: {
    红烧肉: { text: `我翻开这一盘红烧肉，竟满眼是油光。\n肥肉，又是肥肉——仿佛这世间的苦难，总是一层叠着一层。\n我便夹起一块，入口即化，这滋味，大约便是人生罢。\n队伍很长，我排在第三十七位，正如我们在秩序中总有其位。\n饭毕，碗底空空，胃里却似乎更满了——因为那油脂，终究是实实在在的。`, radar: { price: 5, fullness: 4, queue: 7, shake: 5, risk: 5 } },
    老北京炸酱面: { text: `北京的风，我是领教过的。\n今日在这食堂，却尝到了老北京的风味。\n面条劲道，炸酱浓郁，豆芽、黄瓜丝码放整齐——\n这大约便是胡同里的烟火气，竟跑到交大来了。\n我向来以为食堂的炸酱是敷衍的，今日始知我错了。\n吃完，只觉得四肢舒泰，恍如隔世。`, radar: { price: 3, fullness: 4, queue: 5, shake: 3, risk: 3 } },
    豆汁儿: { text: `北京的豆汁儿，是外地人的一道坎。\n我初尝时，眉头紧锁，以为是坏了。\n然而北方同学却甘之如饴，大约这便是地域的差异罢。\n酸中带甜，甜中有馊，这滋味，竟品出几分人生的复杂来。\n若是你还未尝过，便去试试罢——或者，从此不敢再来。`, radar: { price: 2, fullness: 3, queue: 4, shake: 8, risk: 6 } },
    default: { text: `食堂的菜，我向来是不敢恭维的。\n然而今日这一道，却让我停下了筷子。\n味道、卖相、份量，竟都挑不出大毛病来。\n我想，大约是厨师今日心情不错罢。\n又或者，是我今日太饿了，竟觉得什么都好吃。`, radar: { price: 4, fullness: 4, queue: 5, shake: 4, risk: 4 } }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 风格三：冰心体
  // ═══════════════════════════════════════════════════════════════════
  bingxin: {
    红烧肉: { text: `这一盘红烧肉，你端在手里，竟有些沉甸甸的。\n不是分量重，是那油光，像母亲炉边的记忆，太过饱满。\n肥瘦相间的纹理，多像你我的日子，有浓有淡。\n队伍很长，你站在那里，像等待一场约定。\n终于轮到你时，那一口软糯，你便懂了——等待，原来也是值得的。`, radar: { price: 5, fullness: 4, queue: 6, shake: 5, risk: 4 } },
    思源肉夹馍: { text: `清晨的思源楼，肉夹馍的香气飘得很远。\n那酥脆的外皮，是北方冬天的第一场雪。\n卤肉的汁水渗透进面饼，每一口都是温柔的问候。\n你若是在考试周遇见它，便会觉得——\n这世界，还有什么过不去的呢？`, radar: { price: 3, fullness: 3, queue: 5, shake: 6, risk: 3 } },
    学五煎饼: { text: `学五的煎饼，是交大清晨的第一缕阳光。\n薄脆在口中轻轻作响，像童年的风铃。\n鸡蛋的香气裹挟着葱花的清新，你便知道——\n新的一天，又开始了。\n妈妈若是知道你在学校吃这样好的早餐，一定会放心的。`, radar: { price: 3, fullness: 3, queue: 6, shake: 7, risk: 3 } },
    default: { text: `这道菜端上来的时候，热气腾腾的。\n你尝了一口，味道刚刚好，像春天里的第一场雨。\n不浓不淡，恰到好处。\n食堂的饭菜，常常让人失望，但今日这一份，却让人觉得温暖。\n我想，这便是食物最好的样子罢。`, radar: { price: 4, fullness: 4, queue: 5, shake: 4, risk: 3 } }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 风格四：林黛玉体
  // ═══════════════════════════════════════════════════════════════════
  lindaivyu: {
    红烧肉: { text: `这红烧肉一入口，油气便上了眉心，倒叫人心里一沉。\n分量又薄，似那春花未及盛放便已凋零。\n长长的队伍里，我站着，风也不语，只觉人心同这碗饭一般，总有些不称意的地方。\n罢了罢了，今日这顿饭，大约也是前世欠下的债罢。\n只盼着那厨子下回能多放两块肉，我这心里，也好过些。`, radar: { price: 6, fullness: 3, queue: 8, shake: 6, risk: 5 } },
    宫保鸡丁: { text: `这宫保鸡丁的滋味，竟叫我辗转难言。\n花生酥脆，鸡丁滑嫩，辣椒的香气缠绕不去——\n像那年的心事，说不清，道不明。\n我尝了一口，便搁下了筷子，不是不香，是太香了。\n太香的东西，总叫人想起一些不该想的事来。`, radar: { price: 5, fullness: 4, queue: 6, shake: 5, risk: 4 } },
    图书馆咖啡: { text: `图书馆的咖啡，苦得像我的心事。\n可是苦着苦着，竟也品出了几分回甘。\n就像那年冬天的自习，我一个人坐在角落，窗外的雪落了一地。\n咖啡凉了，心却暖了。\n原来，有些滋味，是要慢慢体会才能懂的。`, radar: { price: 6, fullness: 2, queue: 4, shake: 3, risk: 2 } },
    default: { text: `今日这道菜，端上来时，我瞧了半晌。\n颜色倒是好看的，只是不知道滋味如何。\n尝了一口，说不上好，也说不上坏。\n大约人生便是如此，不咸不淡地将就着过。\n只是心中未免有些惆怅——什么时候，能吃上一顿称心如意的饭呢？`, radar: { price: 5, fullness: 3, queue: 6, shake: 5, risk: 4 } }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 风格五：张爱玲体
  // ═══════════════════════════════════════════════════════════════════
  zhangailing: {
    红烧肉: { text: `这盘红烧肉油光太足，像一场过分热情的招呼。\n人还未落座，便已觉得有些受不住。\n分量薄得可怜，排队的时间却拖得很长——\n有些事情，总是反着来的。\n我终究没吃完，像是遇见了一个过于浓烈的故事，还没翻到最后一页，便已失了耐心。`, radar: { price: 6, fullness: 3, queue: 7, shake: 6, risk: 5 } },
    京酱肉丝: { text: `京酱肉丝的甜面酱，调得刚刚好。\n肉丝细嫩，葱丝清脆，豆皮裹住一切——\n像是成年人之间的默契，不多不少，刚刚够。\n我吃了一口，竟想起很多年前的夏天。\n有些味道，是会跟着人走的。`, radar: { price: 5, fullness: 4, queue: 5, shake: 4, risk: 4 } },
    老北京炸酱面: { text: `炸酱面的香气，是老北京的底色。\n酱油与肉末在热锅里相遇，滋啦一声，便是烟火气。\n面条在碗里躺着，浇上酱，拌一拌——\n像是一段旧时光，被小心翼翼地收藏起来。\n我吃得很慢，因为怕太快吃完，这滋味便散了。`, radar: { price: 4, fullness: 4, queue: 4, shake: 3, risk: 3 } },
    default: { text: `这道菜上来的时候，我已经不抱太大希望了。\n食堂的饭，总是失望比惊喜多。\n然而入口的瞬间，竟有些意外——\n味道还算过得去，至少不咸不淡。\n也许人生便是如此，不抱希望，反而能遇见一些小惊喜。`, radar: { price: 5, fullness: 4, queue: 5, shake: 4, risk: 4 } }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 风格六：王小波体
  // ═══════════════════════════════════════════════════════════════════
  wangxiaobo: {
    红烧肉: { text: `如果把这盘红烧肉当作实验样本，那么「油脂占比过高」是第一条结论。\n第二条：瘦肉比例不足。\n第三条：分量与等待时间呈负相关——等得越久，分量越少。\n我向来以为，食堂的饭菜是反智的，它证明了这一点。\n然而全宿舍都在吃，你不吃，似乎也不太对劲。\n这里面的逻辑，我到现在也没想通。`, radar: { price: 6, fullness: 3, queue: 8, shake: 6, risk: 5 } },
    黄焖鸡: { text: `黄焖鸡的正确吃法是：先把土豆吃完，再吃肉。\n这不是我的个人偏好，这是效率最优解。\n土豆吸满汤汁，口感绵密，论美味程度，其实远超鸡肉本身。\n食堂的土豆尤其出色，大约是因为量大，厨师不得不让它多炖一会儿。\n你看，有时候资源充足，反而能诞生意外之喜。`, radar: { price: 3, fullness: 5, queue: 5, shake: 4, risk: 3 } },
    操场烧烤: { text: `夏天的操场烧烤，是个社会学实验的好场所。\n你以为是来吃烧烤的，其实你是来社交的。\n羊肉串滋滋作响，啤酒瓶堆了一桌——\n你发现，在这种场合，吃什么不重要，和谁吃才重要。\n食堂就不一样了，食堂是孤独的。`, radar: { price: 6, fullness: 4, queue: 6, shake: 7, risk: 6 } },
    default: { text: `假设这是一道普通菜，那么我的评价是：普通。\n假设这是一道好菜，那么我的评价是：还行。\n假设这是一道难吃的菜，那么我的评价是：意料之中。\n综合以上三种假设，这道菜的评分应该是：看运气。\n结论：食堂的饭菜是薛定谔的饭，在你吃之前，它既好吃又难吃。`, radar: { price: 5, fullness: 4, queue: 5, shake: 5, risk: 4 } }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 风格七：曼波体
  // ═══════════════════════════════════════════════════════════════════
  manbo: {
    红烧肉: { text: `曼波曼波！今天的红烧肉太绝了！\n肥肉曼波，入口即化！瘦肉曼波，嫩到飞起！\n排队的人群也在曼波，时间在起舞！\n这味道，简直是食堂界的天花板！\n干饭人们，让我们一起摇摆，曼波曼波！`, radar: { price: 4, fullness: 5, queue: 7, shake: 4, risk: 5 } },
    麻辣香锅: { text: `曼波一下，麻是主舞！曼波两下，辣是和弦！\n配菜们在锅里蹦迪，土豆藕片虾滑全员集合！\n这节奏感，直接把我送走！\n吃完浑身冒汗，爽到飞起！\n交大最炫麻辣香锅，舍我其谁！`, radar: { price: 6, fullness: 5, queue: 8, shake: 8, risk: 8 } },
    西二旗包子: { text: `曼波！早起的动力来了！\n包子皮薄馅大，面粉在跳舞！\n肉馅鲜嫩多汁，咬一口汁水喷涌！\n这才是交大人正确的打开方式！\n曼波曼波，干饭人冲鸭！`, radar: { price: 3, fullness: 4, queue: 6, shake: 7, risk: 4 } },
    default: { text: `曼波曼波！今天的菜品太给力了！\n味道在舌尖跳舞，分量让人满足！\n食堂的师傅们，你们是最棒的！\n让我们一起为美食干杯，曼波曼波！\n明天继续冲！`, radar: { price: 4, fullness: 4, queue: 5, shake: 5, risk: 4 } }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 风格八：二刺螈体
  // ═══════════════════════════════════════════════════════════════════
  erciyuan: {
    红烧肉: { text: `今天的红烧肉是什么神仙设定啊！(⊙o⊙)\n油脂浓度严重超标，肥而不腻这个词就是为它发明的！\n瘦肉嫩到入口即化，这手感也太犯规了吧QAQ\n分量稍微有点少，但为了这口感我忍了！\n学五的隐藏SSR菜品，建议所有人都来刷一次！`, radar: { price: 5, fullness: 4, queue: 6, shake: 4, risk: 4 } },
    宫保鸡丁: { text: `宫保鸡丁返场了！这次直接爆杀！(≧▽≦)/\n花生酥脆到爆炸，鸡丁嫩滑度MAX！\n麻辣值刚刚好，不会太辣也不会没味道~\n下饭效果直接拉满，今天的高数课都不困了！\n强烈要求食堂把这个窗口升级成永久关卡！`, radar: { price: 4, fullness: 4, queue: 5, shake: 5, risk: 4 } },
    学苑早餐: { text: `学苑早餐是YYDS！(๑•̀ㅂ•́)و✧\n煎饼果子太绝了，薄脆酥到掉渣！\n鸡蛋火腿肠的标准配置，一个都不能少！\n早八人的续命神器，吃完满血复活！\n就是排队有点卷，建议早起的鸟儿有虫吃~`, radar: { price: 3, fullness: 4, queue: 7, shake: 8, risk: 4 } },
    default: { text: `这道菜有点东西啊！(°ー°〃)\n味道在线，分量也还行，没有特别踩雷~\n食堂能做出这个水平我已经很感动了！\n给个好评，下次还会回购的~\n希望食堂继续保持这个水准，不要摆烂啊！`, radar: { price: 4, fullness: 4, queue: 5, shake: 4, risk: 4 } }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 风格九：甄嬛体
  // ═══════════════════════════════════════════════════════════════════
  zhenhuan: {
    红烧肉: { text: `本宫尝了一口这红烧肉，倒也罢了——\n油脂丰腴，想来是御膳房偏爱厚味之故。\n只是这份例，着实薄了些，叫臣妾略感遗憾。\n等候之时，本宫瞧着这长长的队伍，\n忽然想起宫中候诏的那些日子——\n等待，本是一种修行。\n罢了，这红烧肉虽有不足，倒也不至于令人失望。`, radar: { price: 6, fullness: 3, queue: 8, shake: 6, risk: 5 } },
    京酱肉丝: { text: `臣妾今日尝了这京酱肉丝，竟品出几分旧时滋味。\n甜面酱调得恰到好处，肉丝滑嫩，葱丝清脆——\n这豆皮一卷，像是把整个胡同都包了进去。\n想来御膳房的师傅也是个懂行的，竟将这道家常菜做得如此精致。\n本宫心下甚慰，特赐一个"可"字。`, radar: { price: 5, fullness: 4, queue: 5, shake: 4, risk: 4 } },
    老北京炸酱面: { text: `这炸酱面的香气，竟让本宫想起了入宫前的日子。\n面条筋道，炸酱浓郁，豆芽、黄瓜码放整齐——\n虽非山珍海味，却有几分人间烟火气。\n本宫向来不喜奢华，这般朴素的面食，反倒合了臣妾的脾胃。\n今日这碗面，本宫用得很是舒心。`, radar: { price: 3, fullness: 4, queue: 4, shake: 3, risk: 3 } },
    default: { text: `本宫尝了这道菜，心中倒也无太多波澜。\n味道尚可，卖相亦算周全，只是并无特别惊艳之处。\n想来食堂的饭菜，大抵都是如此，不出错便是好的了。\n臣妾也不过多苛求，毕竟能填饱肚子，已是福气。\n这一餐，便这样用罢。`, radar: { price: 5, fullness: 4, queue: 5, shake: 4, risk: 4 } }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 风格十：苏轼体
  // ═══════════════════════════════════════════════════════════════════
  sushi: {
    红烧肉: { text: `余昔在黄州，无钱买肉，自煮猪肉，欣然称美。\n今日于交大食堂，得红烧肉一盘，油脂丰腴，\n较黄州故事，已不知好过几倍。\n分量虽薄，然食者之心贵在知足——\n况此间排队之苦，不过须臾；\n东坡当年流放之途，那才叫漫长。\n吃罢，心甚满足，作此小记。`, radar: { price: 5, fullness: 4, queue: 7, shake: 5, risk: 5 } },
    黄焖鸡: { text: `黄州有东坡肉，交大有黄焖鸡。\n一文一武，一雅一俗，皆是人间的滋味。\n土豆吸满汤汁，软糯如黄州的山芋；\n鸡肉炖得烂熟，香气四溢。\n人生到处知何似，应似飞鸿踏雪泥——\n泥上偶然留指爪，鸿飞那复计东西。\n吃完这碗黄焖鸡，豁然开朗。`, radar: { price: 3, fullness: 5, queue: 5, shake: 4, risk: 3 } },
    老北京炸酱面: { text: `北漂十年，最念这口炸酱面。\n面条如人生，要筋道才有嚼头；\n炸酱如世事，要浓郁才有滋味。\n葱丝豆芽皆是配角，却缺一不可。\n正所谓：人间有味是清欢。\n今日食堂这碗面，竟让我想起了汴京的旧梦。`, radar: { price: 3, fullness: 4, queue: 4, shake: 3, risk: 3 } },
    default: { text: `余游学于京城，尝遍食堂百味。\n今日这道菜，倒也无太多可说的。\n味道尚可，分量适中，不功不过。\n世间之事，大抵如此——\n惊为天人的少，味同嚼蜡的也不多。\n大多如这道菜，平平淡淡，才是真。`, radar: { price: 4, fullness: 4, queue: 5, shake: 4, risk: 4 } }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 风格十一：鲁班手札体
  // ═══════════════════════════════════════════════════════════════════
  luban: {
    红烧肉: { text: `【工序记录】该红烧肉炖煮时长约45分钟，火候控制合格。\n【材料评估】肥瘦比例约6:4，脂肪占比略高；瘦肉部分嫩度达标。\n【口感测试】入口即化程度：A级；油脂处理：A-级（略有油腻感）。\n【分量评估】实际分量约为主流标准的85%，性价比一般。\n【综合评价】工艺参数合格，建议优化瘦肉比例与出餐分量。\n【备注】卤汁浓郁度达标，可作为基准参照。`, radar: { price: 5, fullness: 4, queue: 7, shake: 5, risk: 5 } },
    宫保鸡丁: { text: `【工序记录】鸡丁切块均匀，约1.5cm³标准件。\n【火候评估】花生酥脆度达标，鸡丁嫩度：A级。\n【调味参数】辣椒与花椒比例约7:3，符合川菜基准。\n【效率评估】出餐时间稳定，约3分钟/份。\n【综合评价】该菜品工艺成熟度较高，推荐列入常规供应。`, radar: { price: 4, fullness: 4, queue: 5, shake: 5, risk: 4 } },
    黄焖鸡: { text: `【结构分析】土豆与鸡肉配比约3:2，符合标准工艺。\n【汤汁评估】浓稠度适中，挂汁效果良好。\n【米饭适配度】非常适合拌饭，汤汁利用率可达95%。\n【稳定性测试】连续三日出品稳定，工艺可控性强。\n【综合评价】该菜品为食堂高性价比选择，推荐指数：★★★★☆`, radar: { price: 3, fullness: 5, queue: 5, shake: 4, risk: 3 } },
    default: { text: `【外观检测】色泽正常，无明显异常。\n【分量测量】符合额定标准（±5%误差范围内）。\n【温度记录】出餐温度约65℃，符合热菜标准。\n【口感评估】各项指标均在可接受范围内。\n【综合结论】该菜品满足基本工艺要求，可正常供应。`, radar: { price: 4, fullness: 4, queue: 5, shake: 4, risk: 4 } }
  },

  // ═══════════════════════════════════════════════════════════════════
  // 风格十二：说明书体
  // ═══════════════════════════════════════════════════════════════════
  shuomingshu: {
    红烧肉: { text: `【产品名称】红烧肉（食堂专供版）\n【规格参数】重量：90±10g；脂肪占比：68%；精瘦肉含量：≤32%\n【外观特征】酱红色泽，肥瘦分层清晰\n【使用说明】建议搭配米饭（另售）以降低油腻感；用餐时间建议11:30-13:00\n【注意事项】\n1. 等待时长预计15-20分钟，请合理规划用餐时间\n2. 对肥肉敏感用户请谨慎评估\n3. 油脂含量较高，血脂异常者慎用\n【综合评价】基本满足热量摄入需求，性价比有待提升`, radar: { price: 5, fullness: 4, queue: 7, shake: 5, risk: 6 } },
    宫保鸡丁: { text: `【产品名称】宫保鸡丁（川味标准版）\n【规格参数】净重：120±15g；鸡肉含量：约55%；花生添加量：约15%\n【辣度标识】中辣（★☆☆☆☆）\n【使用说明】本产品适合配合主食食用以获得最佳口感\n【注意事项】\n1. 含有花生成分，对坚果过敏者禁用\n2. 花椒含量适中，首次食用建议观察适应性\n3. 儿童食用请监护人陪同评估\n【储存条件】仅限当日食用，不宜隔夜`, radar: { price: 4, fullness: 4, queue: 5, shake: 5, risk: 4 } },
    黄焖鸡: { text: `【产品名称】黄焖鸡（米饭伴侣版）\n【规格参数】总重：约350g；主料鸡肉：约150g；辅料土豆：约120g\n【汤汁浓度】标准浓度（适合拌饭）\n【使用说明】打开盖子后将米饭倒入容器内搅拌均匀即可\n【注意事项】\n1. 土豆炖煮充分，糖尿病患者请酌量\n2. 汤汁含盐量中等，高血压患者注意摄入量\n3. 建议在5分钟内食用完毕以保证最佳温度\n【保质期】当日当餐食用，不支持外带加热`, radar: { price: 3, fullness: 5, queue: 5, shake: 4, risk: 3 } },
    老北京炸酱面: { text: `【产品名称】老北京炸酱面（地道京味版）\n【规格参数】面条重量：200±20g；炸酱含量：约40g\n【配料清单】面条、炸酱、黄瓜丝、豆芽、葱花\n【使用说明】将炸酱与面条充分搅拌后食用；可根据个人口味添加醋或辣椒\n【注意事项】\n1. 面条现煮现售，不支持打包\n2. 炸酱含盐量较高，高血压患者建议减半使用\n3. 豆制品成分，肾病患者请遵医嘱\n【风味特征】酱香浓郁，咸甜适中，具有老北京特色风味`, radar: { price: 3, fullness: 4, queue: 4, shake: 3, risk: 3 } },
    default: { text: `【产品名称】食堂标准套餐\n【规格参数】重量：约300-400g（视具体菜品而定）\n【出品时间】约3-8分钟（高峰期可能延长）\n【温度范围】65-75℃（符合热食标准）\n【使用说明】按需取餐，适量取用，避免浪费\n【注意事项】\n1. 如发现菜品异常（异物、变质等），请立即停止食用并联系工作人员\n2. 对特定食材过敏者请在取餐前确认配料\n3. 餐后请将餐具送至回收处\n【质量声明】本产品符合食品安全国家标准GB 7718`, radar: { price: 4, fullness: 4, queue: 5, shake: 4, risk: 4 } }
  },
}

// 风格列表（用于随机选择）
const STYLE_KEYS = Object.keys(MOCK_FOOD_STYLES)

// ═══════════════════════════════════════════════════════════════════
// Mock 函数
// ═══════════════════════════════════════════════════════════════════

// 情绪关键词映射
const EMOTION_KEYWORDS = {
  anxiety: ['焦虑', '迷茫', '紧张', '害怕', '担心', '不安', '慌乱', '压力', '考试', '挂科'],
  sadness: ['难过', '伤心', '失落', '痛苦', '哭', '悲伤', '绝望', '沮丧', '灰心'],
  exhaustion: ['累', '疲惫', '无力', '困', '倦', '困倦', '精疲', '虚脱', '好累'],
  confusion: ['困惑', '迷茫', '不懂', '不知道', '怎么办', '选择', '方向', '未来'],
  loneliness: ['孤独', '寂寞', '一个人', '没人', '孤单', '独自', '没人懂'],
  hope: ['希望', '期待', '加油', '努力', '奋斗', '梦想', '信心', '相信'],
  peace: ['平静', '释然', '平静', '放下', '治愈', '放松', '舒缓', '安宁'],
}

// 根据用户输入判断情绪
function detectEmotion(userText) {
  if (!userText) return null

  const lowerText = userText.toLowerCase()

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return emotion
      }
    }
  }
  return null
}

function mockEmotionWorkflow({ userText, location }) {
  // 根据用户输入判断情绪
  const emotion = detectEmotion(userText)

  // 获取对应情绪的植物
  let selected = emotion ? getRandomPlant(emotion) : getRandomPlant()

  // 如果是中性情绪或无法判断，随机选择
  if (!selected) {
    selected = MOCK_PLANTS[Math.floor(Math.random() * MOCK_PLANTS.length)]
  }

  // 根据位置调整植物（校园场景加成）
  let locationBonus = ''
  if (location && location.name) {
    locationBonus = CAMPUS_EMOTION_LOCATION_MAP[location.name] || ''
  }

  // 组合最终回响
  const echo_text = locationBonus
    ? `${locationBonus} ${selected.echo_text}`
    : selected.echo_text

  return {
    plant_type: selected.plant_type,
    plant_color: selected.plant_color,
    plant_glow: selected.plant_glow,
    plant_intensity: 0.5 + Math.random() * 0.4,
    echo_text: echo_text,
    flower_name: selected.name,
    flower_language: selected.flower_language,
  }
}

function mockFoodWorkflow(userText, dishName, targetStyle = 'hupu') {
  // 匹配菜品或使用 default
  const styleData = MOCK_FOOD_STYLES[targetStyle] || MOCK_FOOD_STYLES.hupu

  // 尝试精确匹配
  let dishData = styleData[dishName]

  // 尝试模糊匹配
  if (!dishData) {
    for (const [key, data] of Object.entries(styleData)) {
      if (key !== 'default' && dishName && (
        dishName.includes(key) || key.includes(dishName)
      )) {
        dishData = data
        break
      }
    }
  }

  // 使用匹配到的数据或 default
  const result = dishData || styleData.default

  return {
    rewritten_text: result.text,
    radar_data: result.radar,
    style_id: targetStyle
  }
}

// 导出风格列表供前端使用
export const FOOD_STYLE_LIST = FOOD_STYLES

export const WORKFLOW_IDS = {
  emotion: '7649364360749531145',
  food: '7649361863989493769',
}
