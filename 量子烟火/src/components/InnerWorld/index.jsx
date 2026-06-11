import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, MessageCircle, Send, Landmark, BookOpen, Laptop, Activity, Home, Leaf, Atom, Clock, ChevronDown, Download } from 'lucide-react'
import { useEmotionStore } from '../../store/emotionStore'
import { useWorldStore } from '../../store/worldStore'
import { useCozeChat } from '../../hooks/useCozeChat'
import { runEmotionWorkflow } from '../../api/coze'
import { BJTU_LANDMARKS } from '../../api/amap'
import Sigil from '../Sigil'
import EchoCard from './EchoCard'
import PlantEffect from './PlantEffect'
import PsychDisclaimer from './PsychDisclaimer'

const LOCATIONS = [
  { id: 'siyuan',  name: '思源楼',     Icon: Landmark },
  { id: 'library', name: '图书馆',     Icon: BookOpen },
  { id: 'lab',     name: '实验室',     Icon: Laptop },
  { id: 'field',   name: '操场',       Icon: Activity },
  { id: 'dorm',    name: '宿舍',       Icon: Home },
  { id: 'garden',  name: '红果园',     Icon: Leaf },
]

function getLiveCoords(id) {
  const found = BJTU_LANDMARKS.find(lm => lm.id === id)
  if (found) return { lng: found.lng, lat: found.lat }
  return null
}

/** 里世界主面板 */
export default function InnerWorldPanel({ isMobile = false }) {
  const [input, setInput] = useState('')
  const [selectedLoc, setSelectedLoc] = useState('siyuan')
  const [showPlant, setShowPlant] = useState(false)
  const [plantData, setPlantData] = useState(null)
  const [error, setError] = useState(null)

  const { aiResponse, isProcessing, latestEcho } = useEmotionStore()
  const { userId } = useWorldStore()
  const { sendMessage } = useCozeChat()
  const addPlant = useEmotionStore(s => s.addPlant)
  const setLatestEcho = useEmotionStore(s => s.setLatestEcho)

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return
    setError(null)

    const loc = getLiveCoords(selectedLoc)
    const locName = LOCATIONS.find(l => l.id === selectedLoc)?.name || '校园'
    if (!loc) return

    // 1. 流式 AI 回应
    sendMessage({
      userInput: input,
      location: { ...loc, name: locName },
      userId: userId || 'anonymous',
    })

    // 2. 情绪工作流（植物 + 回响）
    try {
      const result = await runEmotionWorkflow({
        userText: input,
        location: { ...loc, name: locName },
      })

      const newPlant = {
        lng: loc.lng,
        lat: loc.lat,
        plantType: result.plant_type,
        color: result.plant_color,
        glow: result.plant_glow,
        echoText: result.echo_text,
      }

      addPlant(newPlant)
      setPlantData(newPlant)
      setLatestEcho(result.echo_text)
      setShowPlant(true)

      // 地图光柱
      window.__qf_plantEmotion?.({
        lng: loc.lng,
        lat: loc.lat,
        color: result.plant_color,
        glow: result.plant_glow,
      })
    } catch (e) {
      console.error('情绪工作流错误:', e)
      setError('感通失败，出了一点小问题 — 稍候再试试？')
    }

    setInput('')
  }

  return (
    <div className={`flex flex-col gap-3 sm:gap-4 ${isMobile ? 'p-3' : 'p-4'}`}>
      {/* 标题区 */}
      <div className="flex flex-col items-center gap-2 pt-1 sm:pt-2">
        <Sigil variant="inner" icon={Atom} size={isMobile ? 44 : 52} />
        <div className="text-center">
          <h2 className="font-display text-lg font-bold neon-text-cyan tracking-widest">
            里 · 世 · 界
          </h2>
          <p className="text-xs text-cyan-400/50 mt-1 font-mono">INNER WORLD · 量子共鸣</p>
        </div>
      </div>

      <PsychDisclaimer />

      {/* 位置选择 */}
      <div>
        <p className="text-xs text-cyan-400/60 mb-2 font-mono inline-flex items-center gap-1">
          <MapPin size={12} /> 当前位置
        </p>
        <div className={`grid gap-1.5 ${isMobile ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {LOCATIONS.map(loc => (
            <button
              key={loc.id}
              onClick={() => setSelectedLoc(loc.id)}
              className={`
                transition-all duration-300 font-mono touch-target
                ${isMobile
                  ? `mobile-loc-chip ${selectedLoc === loc.id ? 'is-active' : ''}`
                  : `text-xs py-1.5 px-2 rounded ${
                      selectedLoc === loc.id
                        ? 'bg-cyan-400/15 border border-cyan-400/60 text-cyan-300 shadow-[0_0_8px_rgba(15,240,252,0.3)]'
                        : 'bg-cyan-400/04 border border-cyan-400/15 text-cyan-400/50 hover:border-cyan-400/30'
                    }`
                }
              `}
            >
              <span className="inline-flex items-center gap-1">
                <loc.Icon size={12} /> {loc.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 输入区 */}
      <div>
        <p className="text-xs text-cyan-400/60 mb-2 font-mono inline-flex items-center gap-1">
          <MessageCircle size={12} /> 今天的你，怎么了
        </p>
        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); setError(null) }}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }}
          placeholder={isMobile
            ? '跑不出代码、绩点内耗、深夜 emo… 任何倾诉，这里都接住。'
            : "跑不出代码、绩点内耗、深夜 emo...\n任何倾诉，这里都接住。（Ctrl+Enter 发送）"}
          rows={isMobile ? 3 : 4}
          className="cyber-input rarity-field w-full rounded-lg p-3 text-sm resize-none leading-relaxed"
        />
      </div>

      {/* 发送按钮 */}
      <button
        onClick={handleSubmit}
        disabled={isProcessing || !input.trim()}
        className={`
          btn-cyber w-full py-3 text-sm tracking-wider transition-all touch-target
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="quantum-loader inline-block scale-50" />
            感通中...
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-2">
            <Send size={14} /> 种下此刻，感通时空
          </span>
        )}
      </button>

      {/* 错误提示 */}
      {error && (
        <p className="text-xs text-red-400/80 text-center font-mono px-2">⚠️ {error}</p>
      )}

      {/* AI 回应区（流式） */}
      <AnimatePresence>
        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-inner p-4 rounded-xl"
          >
            <p className="text-xs neon-text-cyan mb-2 font-mono">◈ 量子回应</p>
            <p className="text-sm text-cyan-100/80 leading-relaxed whitespace-pre-wrap">
              {aiResponse}
              {isProcessing && <span className="inline-block w-1.5 h-4 bg-cyan-400 ml-0.5 animate-pulse align-middle" />}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 情绪植物卡片 */}
      <AnimatePresence>
        {showPlant && plantData && (
          <PlantEffect
            plantData={plantData}
            onClose={() => setShowPlant(false)}
          />
        )}
      </AnimatePresence>

      {/* 时空回响 */}
      <AnimatePresence>
        {latestEcho && (
          <EchoCard
            text={latestEcho}
            onClose={() => setLatestEcho(null)}
          />
        )}
      </AnimatePresence>

      {/* 历史植物数量 */}
      <HistoryStats />

      {/* 情绪历史时间轴 */}
      <EmotionHistory />
    </div>
  )
}

function HistoryStats() {
  const plants = useEmotionStore(s => s.plants)
  if (plants.length === 0) {
    return (
      <div className="glass-inner p-4 rounded-xl text-center border border-cyan-400/10">
        <p className="text-xs text-cyan-400/40 font-mono leading-relaxed">
          还没有情绪落地<br />
          <span className="text-cyan-400/60">选一个地点，说说今天</span>
        </p>
      </div>
    )
  }

  return (
    <div className="glass-inner p-3 rounded-xl text-center">
      <p className="text-xs text-cyan-400/50 font-mono">
        你在红果园共种下了
        <span className="neon-text-cyan text-base mx-2 font-bold">{plants.length}</span>
        株情绪植物
      </p>
    </div>
  )
}

/** 情绪历史时间轴 — 折叠展开，最多显示最近 10 条 */
function EmotionHistory() {
  const plants = useEmotionStore(s => s.plants)
  const [open, setOpen] = useState(false)
  const [exportInfo, setExportInfo] = useState(null)

  if (plants.length === 0) return null

  const recent = [...plants].reverse().slice(0, 10)

  const plantEmoji = (type) => {
    const map = { flower: '🌸', tree: '🌲', grass: '🌿', star: '⭐', crystal: '💎' }
    return map[type] ?? '🌱'
  }

  const formatTime = (iso) => {
    const d = new Date(iso)
    const mo = d.getMonth() + 1
    const da = d.getDate()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${mo}/${da} ${hh}:${mm}`
  }

  const labelType = (type) => {
    const map = {
      crystal: '水晶草',
      flower: '蓝色花',
      star: '星光草',
      grass: '迷雾藤',
      tree: '赤焰树',
    }
    return map[type] || type || '未知'
  }

  const buildTopTypes = (list) => {
    const counts = list.reduce((acc, p) => {
      const key = p.plantType || '未知'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => `${labelType(type)}×${count}`)
  }

  const handleExport = () => {
    if (plants.length === 0) return
    const payload = {
      exportedAt: new Date().toISOString(),
      count: plants.length,
      plants,
    }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const fileName = `quantum-fireworks-emotions-${Date.now()}.json`
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)

    const last = plants[plants.length - 1]
    setExportInfo({
      fileName,
      sizeKb: (blob.size / 1024).toFixed(1),
      count: plants.length,
      latestTime: last?.timestamp ? formatTime(last.timestamp) : '未知',
      topTypes: buildTopTypes(plants),
    })
  }

  return (
    <div className="glass-inner rounded-xl overflow-hidden">
      <div className="w-full flex items-center justify-between px-4 py-3 text-xs font-mono text-cyan-400/60">
        <button
          onClick={() => setOpen(v => !v)}
          className="inline-flex items-center gap-1.5 hover:text-cyan-400/90 transition-colors"
        >
          <Clock size={12} /> 情绪历史 · {plants.length} 条
          <ChevronDown
            size={14}
            className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          onClick={handleExport}
          disabled={plants.length === 0}
          className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md border transition-colors
            ${plants.length === 0
              ? 'border-cyan-400/10 text-cyan-400/20 cursor-not-allowed'
              : 'border-cyan-400/20 text-cyan-300/70 hover:text-cyan-200'
            }
          `}
          title="导出情绪记录 JSON"
        >
          <Download size={12} /> 导出
        </button>
      </div>

      {exportInfo && (
        <div className="px-4 pb-3">
          <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/04 p-3">
            <div className="text-[10px] font-mono text-cyan-400/70">已导出 JSON · {exportInfo.sizeKb} KB</div>
            <div className="text-xs text-cyan-100/80 mt-1 truncate">{exportInfo.fileName}</div>
            <div className="text-[10px] text-cyan-400/50 mt-1">
              最新记录：{exportInfo.latestTime} · Top：{exportInfo.topTypes.join(' / ')}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 flex flex-col gap-2">
              {recent.map((plant, i) => (
                <div key={plant.id ?? i} className="flex items-start gap-2 border-l-2 border-cyan-400/20 pl-3">
                  <span className="text-base leading-none mt-0.5">{plantEmoji(plant.plantType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-cyan-400/40 font-mono">{formatTime(plant.timestamp)}</p>
                    {plant.echoText && (
                      <p className="text-xs text-cyan-100/60 leading-relaxed truncate">
                        {plant.echoText.slice(0, 40)}{plant.echoText.length > 40 ? '…' : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
