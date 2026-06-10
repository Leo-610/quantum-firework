import React, { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Atom, Flame, ArrowLeftRight } from 'lucide-react'
import { useWorldStore } from '../../store/worldStore'

function playTransitionSound(toWorld) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    const now = ctx.currentTime
    if (toWorld === 'outer') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.linearRampToValueAtTime(440, now + 0.35)
    } else {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.linearRampToValueAtTime(220, now + 0.35)
    }
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.linearRampToValueAtTime(0, now + 0.4)
    osc.start(now)
    osc.stop(now + 0.4)
    osc.onended = () => ctx.close()
  } catch {
    // 静默失败
  }
}

/** 表里世界切换按钮与动画 */
export default function WorldSwitch({ compact = false, inPanel = false }) {
  const { world, isSwitching, toggleWorld } = useWorldStore()
  const isInner = world === 'inner'

  const handleToggle = useCallback(() => {
    playTransitionSound(isInner ? 'outer' : 'inner')
    toggleWorld()
  }, [isInner, toggleWorld])

  if (compact) {
    return (
      <div className={`flex flex-col items-center gap-1 ${inPanel ? 'py-1' : ''}`}>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono transition-all duration-500 ${isInner ? 'neon-text-cyan' : 'text-cyan-400/30'}`}>
            里
          </span>
          <motion.button
            onClick={handleToggle}
            disabled={isSwitching}
            whileTap={{ scale: 0.94 }}
            className="rotor-switch rotor-switch--compact hud-glass min-h-[44px] min-w-[44px]"
            style={{
              '--rotor-color': isInner ? '#0ff0fc' : '#ff6b35',
              '--rotor-glow': isInner ? 'rgba(15,240,252,0.35)' : 'rgba(255,107,53,0.35)',
            }}
            aria-label="切换里表世界"
          >
            <AnimatePresence mode="wait">
              {isSwitching ? (
                <motion.div key="sw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="quantum-loader" style={{ width: 14, height: 14 }} />
                </motion.div>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                  {isInner ? <Atom size={14} /> : <Flame size={14} />}
                  <ArrowLeftRight size={11} className="opacity-50" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <span className={`text-[10px] font-mono transition-all duration-500 ${!isInner ? 'neon-text-orange' : 'text-orange-400/30'}`}>
            表
          </span>
        </div>
        {!inPanel && (
          <p className="text-[9px] font-mono opacity-40" style={{ color: isInner ? '#0ff0fc' : '#ff6b35' }}>
            {isInner ? '量子共鸣' : '虎扑烟火'}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <span className={`text-xs font-mono transition-all duration-500 ${isInner ? 'neon-text-cyan' : 'text-cyan-400/30'}`}>
          里·量子
        </span>

        <motion.button
          onClick={handleToggle}
          disabled={isSwitching}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rotor-switch hud-glass"
          style={{
            '--rotor-color': isInner ? '#0ff0fc' : '#ff6b35',
            '--rotor-glow': isInner ? 'rgba(15,240,252,0.35)' : 'rgba(255,107,53,0.35)',
          }}
        >
          <div className="rotor-halo" />
          <div className="rotor-ring rotor-ring--outer" />
          <div className="rotor-ring rotor-ring--inner" />
          <div className="rotor-orbit">
            <span className="rotor-particle" />
            <span className="rotor-particle rotor-particle--trail" />
          </div>

          <AnimatePresence mode="wait">
            {isSwitching ? (
              <motion.div
                key="switching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="quantum-loader" style={{ width: 16, height: 16 }} />
                <span className="text-xs font-mono text-white/60">跃迁中...</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rotor-core"
              >
                <span className="text-base">
                  {isInner ? <Atom size={16} /> : <Flame size={16} />}
                </span>
                <span
                  className="text-xs font-bold font-display tracking-wider"
                  style={{ color: isInner ? '#0ff0fc' : '#ff6b35' }}
                >
                  {isInner ? '里世界' : '表世界'}
                </span>
                <span className="text-xs opacity-50 font-mono">
                  <ArrowLeftRight size={12} />
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <span className={`text-xs font-mono transition-all duration-500 ${!isInner ? 'neon-text-orange' : 'text-orange-400/30'}`}>
          表·烟火
        </span>
      </div>

      <motion.p
        key={world}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[10px] font-mono text-center"
        style={{ color: isInner ? 'rgba(15,240,252,0.4)' : 'rgba(255,107,53,0.4)' }}
      >
        {isInner ? '情感共鸣 · 王阳明心学 · 时空感通' : '虎扑神评 · 文豪文体 · 五维战力'}
      </motion.p>
    </div>
  )
}
