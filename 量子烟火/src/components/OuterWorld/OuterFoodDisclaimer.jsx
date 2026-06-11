import React, { useState } from 'react'
import { AlertTriangle, Utensils, ChevronDown, Gauge } from 'lucide-react'
import { FOOD_DISCLAIMER, RADAR_DISCLAIMER } from '../../constants/disclaimers'

/** 表世界吐槽与文豪改写免责说明 */
export default function OuterFoodDisclaimer() {
  const [open, setOpen] = useState(false)

  return (
    <div className="outer-disclaimer">
      <div className="outer-disclaimer__banner">
        <AlertTriangle size={14} className="shrink-0 text-amber-300/90" aria-hidden="true" />
        <p className="outer-disclaimer__summary">{FOOD_DISCLAIMER.summary}</p>
      </div>

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="outer-disclaimer__toggle touch-target"
        aria-expanded={open}
      >
        <Utensils size={13} />
        <span>吐槽与改写 · 使用须知</span>
        <ChevronDown size={14} className={`outer-disclaimer__chevron ${open ? 'is-open' : ''}`} />
      </button>

      {open && (
        <ul className="outer-disclaimer__list">
          {FOOD_DISCLAIMER.bullets.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** 结果卡片内简短提示 */
export function FoodResultNotice() {
  return (
    <p className="outer-disclaimer__inline">
      AI 生成内容 · 娱乐表达 · 不代表官方评价
    </p>
  )
}

/** 雷达图数据免责 */
export function RadarDataNotice() {
  return (
    <div className="radar-disclaimer">
      <p className="radar-disclaimer__title">
        <Gauge size={11} className="inline mr-1 opacity-70" aria-hidden="true" />
        {RADAR_DISCLAIMER.title}
      </p>
      <p className="radar-disclaimer__summary">{RADAR_DISCLAIMER.summary}</p>
      <ul className="radar-disclaimer__list">
        {RADAR_DISCLAIMER.bullets.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
