import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'

/** 时空回响卡片 */
export default function EchoCard({ text, onClose }) {
  const rarityClass = getEchoRarity(text)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`relative glass-inner rounded-xl p-4 rarity-frame ${rarityClass}`}
      style={{
        borderColor: 'rgba(123,47,255,0.4)',
        boxShadow: '0 0 20px rgba(123,47,255,0.15)',
        '--ritual-color': 'rgba(123,47,255,0.8)',
      }}
    >
      <div className="ritual-ring" aria-hidden="true" />

      <button
        onClick={onClose}
        className="absolute top-2 right-3 text-purple-400/40 hover:text-purple-400"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3">
        {/* 回响图标 */}
        <div className="flex-shrink-0 mt-0.5">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-2xl"
          >
            <Sparkles size={22} />
          </motion.div>
        </div>

        <div className="echo-scroll">
          <p className="text-xs font-mono neon-text-purple mb-2">
            ◈ 时空回响 · 跨越时间的感通
          </p>
          <p className="text-sm text-purple-100/80 leading-relaxed italic">
            "{text}"
          </p>
        </div>
      </div>

      {/* 时间线装饰 */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent" />
        <span className="text-[10px] font-mono text-purple-400/40">来自过去 · 赠予现在</span>
        <div className="flex-1 h-px bg-gradient-to-l from-purple-500/50 to-transparent" />
      </div>
    </motion.div>
  )
}

function getEchoRarity(text) {
  const len = text?.length || 0
  if (len >= 90) return 'rarity-legendary'
  if (len >= 60) return 'rarity-epic'
  if (len >= 30) return 'rarity-rare'
  return 'rarity-common'
}
