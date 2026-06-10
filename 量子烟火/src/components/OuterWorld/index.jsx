import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Utensils, MessageSquareText, Sparkles, Flame, Copy, Check } from 'lucide-react'
import { runFoodWorkflow } from '../../api/coze'
import { BJTU_LANDMARKS, flyTo } from '../../api/amap'
import { useWorldStore } from '../../store/worldStore'
import RadarChart from './RadarChart'
import StyleRewriter from './StyleRewriter'
import Sigil from '../Sigil'

const CANTEENS = [
  { id: 'canteen_xuehuo', name: '学活食堂', Icon: Building2, desc: '校区中部，品种丰富' },
  { id: 'canteen_hgyfood', name: '红果园餐厅', Icon: Building2, desc: '红果园区，环境舒适' },
  { id: 'canteen_4', name: '四食堂', Icon: Building2, desc: '嘉园附近，学生公寓旁' },
]

/** 表世界主面板 */
export default function OuterWorldPanel({ isMobile = false }) {
  const [selectedCanteen, setSelectedCanteen] = useState(CANTEENS[0].id)
  const [dishName, setDishName] = useState('')
  const [review, setReview] = useState('')
  const [style, setStyle] = useState('hupu')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])
  const mapInstance = useWorldStore(s => s.mapInstance)

  useEffect(() => {
    if (!mapInstance) return
    const target = BJTU_LANDMARKS.find(lm => lm.id === selectedCanteen)
    if (!target) return
    flyTo(mapInstance, { lng: target.lng, lat: target.lat, zoom: 18.2, pitch: 55 })
  }, [mapInstance, selectedCanteen])

  const textRarityClass = text => {
    const len = text?.length || 0
    if (len >= 180) return 'rarity-legendary'
    if (len >= 120) return 'rarity-epic'
    if (len >= 60) return 'rarity-rare'
    return 'rarity-common'
  }

  const radarRarityClass = data => {
    if (!data) return 'rarity-common'
    const values = [data.price, data.fullness, data.queue, data.shake, data.risk]
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    if (avg >= 8.5) return 'rarity-legendary'
    if (avg >= 7.2) return 'rarity-epic'
    if (avg >= 5.5) return 'rarity-rare'
    return 'rarity-common'
  }

  const handleSubmit = async () => {
    if (!review.trim() || isLoading) return
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const data = await runFoodWorkflow({
        dishName: dishName || '今日特供',
        userText: review,
        targetStyle: style,
      })
      setResult(data)
    } catch (e) {
      console.error('美食工作流错误:', e)
      setError('文豪出走神了，稍候再试试？')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex flex-col gap-3 sm:gap-4 ${isMobile ? 'p-3' : 'p-4'}`}>
      {/* 标题 */}
      <div className="flex flex-col items-center gap-2 pt-1 sm:pt-2">
        <Sigil variant="outer" icon={Flame} size={isMobile ? 44 : 52} />
        <div className="text-center">
          <h2 className="font-display text-lg font-bold neon-text-orange tracking-widest">
            表 · 世 · 界
          </h2>
          <p className="text-xs text-orange-400/50 mt-1 font-mono">OUTER WORLD · 虎扑烟火</p>
        </div>
      </div>

      {/* 食堂选择 */}
      <div>
        <p className="text-xs text-orange-400/60 mb-2 font-mono inline-flex items-center gap-1">
          <Building2 size={12} /> 选择食堂
        </p>
        <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'}`}>
          {CANTEENS.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCanteen(c.id)}
              className={`
                flex-1 text-xs py-2 px-2 rounded transition-all duration-300
                ${selectedCanteen === c.id
                  ? 'bg-orange-500/15 border border-orange-400/60 text-orange-300 shadow-[0_0_8px_rgba(255,107,53,0.3)]'
                  : 'bg-orange-500/04 border border-orange-400/15 text-orange-400/50 hover:border-orange-400/30'
                }
              `}
            >
              <div className="text-lg">
                <c.Icon size={18} />
              </div>
              <div className="font-mono mt-0.5">{c.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 菜品名称 */}
      <div>
        <p className="text-xs text-orange-400/60 mb-2 font-mono inline-flex items-center gap-1">
          <Utensils size={12} /> 菜品名称（选填）
        </p>
        <input
          value={dishName}
          onChange={e => setDishName(e.target.value)}
          placeholder="例：红烧肉、麻婆豆腐..."
          className="ember-input rarity-field w-full rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* 吐槽输入 */}
      <div>
        <p className="text-xs text-orange-400/60 mb-2 font-mono inline-flex items-center gap-1">
          <MessageSquareText size={12} /> 你的吐槽（越真实越好）
        </p>
        <textarea
          value={review}
          onChange={e => { setReview(e.target.value); setError(null) }}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }}
          placeholder={isMobile
            ? '全是肥肉、排队太久、分量少得可怜… 什么都能吐槽！'
            : "全是肥肉、排队太久、分量少得可怜...\n什么都能吐槽！（Ctrl+Enter 发送）"}
          rows={isMobile ? 3 : 3}
          className="ember-input rarity-field w-full rounded-lg p-3 text-sm resize-none leading-relaxed"
        />
      </div>

      {/* 文体选择 */}
      <StyleRewriter selected={style} onSelect={setStyle} isMobile={isMobile} />

      {/* 提交 */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !review.trim()}
        className={`
          btn-ember w-full py-3.5 text-sm tracking-wider transition-all touch-target
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
            文豪正在创作...
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-2">
            <Sparkles size={14} /> 一键文豪化 · 生成战力图
          </span>
        )}
      </button>

      {/* 错误提示 */}
      {error && (
        <p className="text-xs text-red-400/80 text-center font-mono px-2">⚠️ {error}</p>
      )}

      {/* 结果区 */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {/* 改写结果 */}
            <div className={`glass-outer rounded-xl p-4 rarity-frame ${textRarityClass(result.rewritten_text)}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs neon-text-orange font-mono">
                  ❆ {STYLE_LABELS[style]}版 · 已出炉
                </p>
                <button
                  onClick={() => handleCopy(result.rewritten_text)}
                  className="flex items-center gap-1 text-[10px] font-mono text-orange-400/50 hover:text-orange-300 transition-colors"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <p className="text-sm text-orange-100/85 leading-relaxed">
                {result.rewritten_text}
              </p>
            </div>

            {/* 五维雷达图 */}
            {result.radar_data && (
              <RadarChart
                data={result.radar_data}
                title={dishName || '今日特供'}
                rarityClass={radarRarityClass(result.radar_data)}
                isMobile={isMobile}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const STYLE_LABELS = {
  hupu:    '虎扑JR',
  luxun:   '鲁迅',
  bingxin: '冰心',
  daiyu:   '黛玉',
  zhangailing: '张爱玲',
  wangxiaobo:  '王小波',
  manbo:   '曼波',
  erciyuan: '二刺螈',
  zhen:    '甄嬛',
  sushi:   '苏轼',
  luban:   '鲁班手札',
  manual:  '说明书',
}
