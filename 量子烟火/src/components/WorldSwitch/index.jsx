import React, { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Atom, Flame, ArrowLeftRight } from 'lucide-react'
import { useWorldStore } from '../../store/worldStore'

/**
 * 量子跃迁音效（Web Audio API 生成，无需音频文件）
 * inner→outer：上扬音调（烟火展开）
 * outer→inner：下沉音调（量子内收）
 */
function playTransitionSound(toWorld) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    const now = ctx.currentTime
    if (toWorld === 'outer') {
      // 上扬：220Hz → 440Hz，暨琥风格
      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.linearRampToValueAtTime(440, now + 0.35)
    } else {
      // 下沉：440Hz → 220Hz，量子风格
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
    // 浏览器不支持或用户未交互时静默失败
  }
}

/** 表里世界切换按钮与动画 */
export default function WorldSwitch() {
  const { world, isSwitching, toggleWorld } = useWorldStore()
  const isInner = world === 'inner'

  const handleToggle = useCallback(() => {
    playTransitionSound(isInner ? 'outer' : 'inner')
    toggleWorld()
  }, [isInner, toggleWorld])

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {/* 世界标签 */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-mono transition-all duration-500 ${isInner ? 'neon-text-cyan' : 'text-cyan-400/30'}`}>
          里·量子
        </span>

        {/* 切换按钮 */}
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

      {/* 副标题提示 */}
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
