import React from 'react'
import { motion } from 'framer-motion'
import { Wind, Flower2, Waves, Sun, Sparkles, Sprout, X } from 'lucide-react'

const PLANT_ICONS = {
  '仙人掌': Sprout,
  '蒲公英': Wind,
  '合欢':   Flower2,
  '深海水草': Waves,
  '向日葵': Sun,
  '满天星': Sparkles,
  '莲':     Flower2,
}

const PLANT_RARITY = {
  '仙人掌': 'rarity-common',
  '蒲公英': 'rarity-common',
  '合欢': 'rarity-rare',
  '深海水草': 'rarity-epic',
  '向日葵': 'rarity-rare',
  '满天星': 'rarity-epic',
  '莲': 'rarity-legendary',
}

/** 情绪植物种下效果卡片 */
export default function PlantEffect({ plantData, onClose }) {
  const Icon = PLANT_ICONS[plantData.plantType] || Sprout
  const rarityClass = PLANT_RARITY[plantData.plantType] || 'rarity-common'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative rounded-xl p-4 overflow-hidden rarity-frame rarity-frame--inner ${rarityClass}`}
      style={{
        background: `radial-gradient(ellipse at center, ${plantData.glow || 'rgba(15,240,252,0.1)'} 0%, rgba(5,10,24,0.9) 70%)`,
        border: `1px solid ${plantData.color || '#0ff0fc'}40`,
        boxShadow: `0 0 30px ${plantData.glow || 'rgba(15,240,252,0.2)'}`,
        '--ritual-color': plantData.color || '#0ff0fc',
      }}
    >
      <div className="ritual-ring" aria-hidden="true" />

      {/* 关闭 */}
      <button
        onClick={onClose}
        className="absolute top-2 right-3 text-cyan-400/40 hover:text-cyan-400"
      >
        <X size={16} />
      </button>

      {/* 植物动画 */}
      <div className="relative text-center mb-3">
        <motion.div
          initial={{ scale: 0.7, opacity: 0.6 }}
          animate={{ scale: 1.15, opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="ritual-seed"
          style={{ borderColor: plantData.color || '#0ff0fc' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            filter: [
              `drop-shadow(0 0 8px ${plantData.color})`,
              `drop-shadow(0 0 20px ${plantData.color})`,
              `drop-shadow(0 0 8px ${plantData.color})`,
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-5xl inline-block plant-pillar"
        >
          <Icon size={44} />
        </motion.div>
      </div>

      <div className="text-center">
        <p className="text-xs font-mono mb-1" style={{ color: plantData.color }}>
          ✦ 已在地图上种下
        </p>
        <p className="text-sm font-bold text-white">
          「{plantData.plantType}」
        </p>
        <p className="text-xs text-cyan-400/50 mt-1">
          代表你此刻的心境，永存于红果园
        </p>
      </div>

      {/* 呼吸光效背景 */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${plantData.glow || 'rgba(15,240,252,0.1)'} 0%, transparent 70%)`,
        }}
      />
    </motion.div>
  )
}
