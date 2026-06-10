import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { motion } from 'framer-motion'
import { Gauge, Info } from 'lucide-react'

const INDICATORS = [
  { name: '性价比',    max: 10 },
  { name: '抗饿度',   max: 10 },
  { name: '排队难度', max: 10 },
  { name: '阿姨手抖', max: 10 },
  { name: '踩雷率',   max: 10 },
]

/** 五维战力雷达图 */
export default function RadarChart({ data, title, rarityClass = 'rarity-rare' }) {
  const chartRef = useRef(null)
  const instanceRef = useRef(null)

  const values = [
    data.price,
    data.fullness,
    data.queue,
    data.shake,
    data.risk,
  ]

  useEffect(() => {
    if (!chartRef.current) return

    if (instanceRef.current) {
      instanceRef.current.dispose()
    }

    const chart = echarts.init(chartRef.current, null, { renderer: 'canvas' })
    instanceRef.current = chart

    chart.setOption({
      backgroundColor: 'transparent',
      radar: {
        shape: 'polygon',
        indicator: INDICATORS,
        radius: '68%',
        center: ['50%', '54%'],
        splitNumber: 4,
        axisName: {
          color: 'rgba(245,166,35,0.8)',
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
        },
        splitLine: {
          lineStyle: { color: 'rgba(255,107,53,0.15)', width: 1 },
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(255,107,53,0.03)', 'rgba(255,107,53,0.06)', 'rgba(255,107,53,0.09)', 'rgba(255,107,53,0.12)'],
          },
        },
        axisLine: {
          lineStyle: { color: 'rgba(255,107,53,0.2)' },
        },
      },
      series: [{
        type: 'radar',
        data: [{
          value: values,
          name: title,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#ff6b35' },
          lineStyle: {
            color: '#ff6b35',
            width: 2,
            shadowColor: 'rgba(255,107,53,0.6)',
            shadowBlur: 8,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245,166,35,0.35)' },
              { offset: 1, color: 'rgba(255,107,53,0.1)' },
            ]),
          },
        }],
        animation: true,
        animationDuration: 1000,
        animationEasing: 'elasticOut',
      }],
    })

    return () => chart.dispose()
  }, [data, title])

  const total = values.reduce((a, b) => a + b, 0)
  const avg = (total / values.length).toFixed(1)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-outer rounded-xl p-4 rarity-frame ${rarityClass}`}
      style={{
        borderColor: 'rgba(255,107,53,0.3)',
        boxShadow: '0 0 20px rgba(255,107,53,0.1)',
      }}
    >
      {/* 标题 */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-mono neon-text-orange inline-flex items-center gap-1">
            <Gauge size={12} /> 五维战力图
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm font-bold text-orange-200">{title}</p>
            <div className="relative group hover-tip">
              <Info size={12} className="text-orange-300/60" />
              <div className="hover-tip-panel">
                <div className="hover-tip-title">指标说明</div>
                <div className="hover-tip-item">性价比：同价位体验</div>
                <div className="hover-tip-item">抗饿度：饱腹持久</div>
                <div className="hover-tip-item">排队难度：越低分越高</div>
                <div className="hover-tip-item">阿姨手抖：出餐稳定性</div>
                <div className="hover-tip-item">踩雷率：越低分越高</div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-orange-400/50 font-mono">综合评分</p>
          <p className="text-2xl font-bold neon-text-gold font-display">{avg}</p>
        </div>
      </div>

      {/* 图表 */}
      <div ref={chartRef} className="w-full" style={{ height: 200 }} />

      {/* 分项数值 */}
      <div className="grid grid-cols-5 gap-1 mt-2">
        {INDICATORS.map((ind, i) => (
          <div key={i} className="text-center">
            <div
              className="text-sm font-bold font-mono"
              style={{ color: getScoreColor(values[i]) }}
            >
              {values[i]}
            </div>
            <div className="text-[10px] text-orange-400/40 leading-tight mt-0.5">
              {ind.name}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function getScoreColor(score) {
  if (score >= 8) return '#00ff88'
  if (score >= 6) return '#f5a623'
  if (score >= 4) return '#ff6b35'
  return '#ff2d2d'
}
