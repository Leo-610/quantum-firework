import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { Atom, Flame, Menu, X, Sparkles } from 'lucide-react'
import MapCanvas from './components/MapCanvas'
import WorldSwitch from './components/WorldSwitch'
import InnerWorldPanel from './components/InnerWorld'
import OuterWorldPanel from './components/OuterWorld'
import { useWorldStore } from './store/worldStore'
import { useEmotionStore } from './store/emotionStore'

export default function App() {
  const { world, isPanelOpen, setPanelOpen, userId, setUserId, mapInstance } = useWorldStore()
  const loadPlantsToHeatmap = useEmotionStore(s => s.loadPlantsToHeatmap)

  // 初始化用户 ID
  useEffect(() => {
    if (!userId) {
      setUserId(uuidv4())
    }
    loadPlantsToHeatmap()
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPanelOpen(false)
      }
      if (e.key.toLowerCase() === 'm') {
        setPanelOpen(open => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setPanelOpen])

  useEffect(() => {
    if (!mapInstance) return
    mapInstance.setStatus({
      scrollWheel: !isPanelOpen,
      touchZoom: !isPanelOpen,
      doubleClickZoom: !isPanelOpen,
    })
  }, [mapInstance, isPanelOpen])

  const isInner = world === 'inner'


  return (
    <div
      className={`relative w-full h-screen overflow-hidden world-shell world-transition ${isInner ? 'world-inner' : 'world-outer'}`}
    >
      {/* ── 地图层（全屏底图） ── */}
      <MapCanvas />

      {/* ── 世界氛围层 ── */}
      <div className="world-atmosphere" aria-hidden="true" />

      {/* ── 顶部世界切换 ── */}
      <WorldSwitch />

      {/* ── 顶部 Logo ── */}
      <div className="absolute top-4 left-4 z-50">
        <div className="hud-glass flex items-center gap-2 px-3 py-2 rounded-xl">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{
              background: isInner ? 'rgba(15,240,252,0.1)' : 'rgba(255,107,53,0.12)',
              border: `1px solid ${isInner ? 'rgba(15,240,252,0.3)' : 'rgba(255,107,53,0.35)'}`,
            }}
          >
            {isInner ? <Atom size={16} /> : <Flame size={16} />}
          </div>
          <div>
            <p className="text-sm font-bold font-display" style={{ color: isInner ? '#0ff0fc' : '#ff6b35' }}>
              量子烟火
            </p>
            <p className="text-[10px] font-mono opacity-40">北京交通大学</p>
          </div>
        </div>
      </div>

      {/* ── 右上角快捷提示 ── */}
      <div className="absolute top-4 right-4 z-50">
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => setPanelOpen(!isPanelOpen)}
            className={`
              hud-glass px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-300
              ${isInner
                ? 'bg-cyan-400/08 border border-cyan-400/20 text-cyan-400/70 hover:border-cyan-400/50'
                : 'bg-orange-400/08 border border-orange-400/20 text-orange-400/70 hover:border-orange-400/50'
              }
            `}
          >
            <span className="inline-flex items-center gap-1">
              {isPanelOpen ? <X size={14} /> : <Menu size={14} />}
              {isPanelOpen ? '收起' : '展开'}
            </span>
          </button>
          <div
            className={`
              hud-glass px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wide
              ${isInner
                ? 'text-cyan-300/70 border border-cyan-400/15'
                : 'text-orange-300/70 border border-orange-400/15'
              }
            `}
          >
            按 <span className="font-bold">M</span> 切换面板 · <span className="font-bold">Esc</span> 回到地图
          </div>
        </div>
      </div>

      {/* ── 侧边面板 ── */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            key={world}
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute left-0 top-0 bottom-0 z-40 flex flex-col panel-shell panel-shell--fixed"
          >
            {/* 面板背景 */}
            <div
              className="absolute inset-0"
              style={{
                background: isInner
                  ? 'linear-gradient(160deg, rgba(6,12,26,0.98) 0%, rgba(6,10,20,0.92) 55%, rgba(4,8,14,0.9) 100%)'
                  : 'linear-gradient(160deg, rgba(22,10,2,0.98) 0%, rgba(18,7,0,0.92) 55%, rgba(12,4,0,0.9) 100%)',
                borderRight: `1px solid ${isInner ? 'rgba(15,240,252,0.18)' : 'rgba(255,107,53,0.2)'}`,
                boxShadow: isInner
                  ? '0 0 40px rgba(15,240,252,0.08), inset -1px 0 0 rgba(255,255,255,0.04)'
                  : '0 0 40px rgba(255,107,53,0.08), inset -1px 0 0 rgba(255,255,255,0.03)',
                backdropFilter: 'blur(22px) saturate(1.1)',
                pointerEvents: 'none',
              }}
            />

            {/* 面板内容 */}
            <div className="panel-scroll flex-1 min-h-0 pt-20 pb-10 px-0.5">
              <AnimatePresence mode="wait">
                {isInner ? (
                  <motion.div
                    key="inner"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <InnerWorldPanel />
                  </motion.div>
                ) : (
                  <motion.div
                    key="outer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <OuterWorldPanel />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 底部装饰线 */}
            <div
              className="absolute left-4 right-4 bottom-2 h-px pointer-events-none"
              style={{
                background: isInner
                  ? 'linear-gradient(to right, transparent, rgba(15,240,252,0.3), transparent)'
                  : 'linear-gradient(to right, transparent, rgba(255,107,53,0.3), transparent)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 默认展开提示（面板关闭时） ── */}
      <AnimatePresence>
        {!isPanelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-4 bottom-8 z-40"
          >
            <button
              onClick={() => setPanelOpen(true)}
              className={`
                flex flex-col items-start gap-1 px-4 py-3 rounded-xl transition-all duration-300
                ${isInner
                  ? 'glass-inner hover:shadow-[0_0_20px_rgba(15,240,252,0.2)]'
                  : 'glass-outer hover:shadow-[0_0_20px_rgba(255,107,53,0.2)]'
                }
              `}
            >
              <p className="text-xs font-bold inline-flex items-center gap-1" style={{ color: isInner ? '#0ff0fc' : '#ff6b35' }}>
                <Sparkles size={14} />
                {isInner ? '进入里世界' : '进入表世界'}
              </p>
              <p className="text-[11px] opacity-50" style={{ color: isInner ? '#c8e6f5' : '#fff3e0' }}>
                {isInner ? '倾诉 · 种植情绪 · 时空感通' : '吐槽 · 文豪改写 · 战力雷达'}
              </p>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 底部状态栏 ── */}
      <div className="absolute bottom-2 right-4 z-40">
        <p className="text-[10px] font-mono opacity-20" style={{ color: isInner ? '#0ff0fc' : '#ff6b35' }}>
          Quantum Fireworks · BJTU · {new Date().getFullYear()}
        </p>
      </div>

      {/* ── 粒子效果层 ── */}
      <ParticleLayer world={world} />

    </div>
  )
}

/** 环境粒子效果 */
function ParticleLayer({ world }) {
  const isInner = world === 'inner'
  const particles = Array.from({ length: isInner ? 20 : 12 }, (_, i) => i)

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {particles.map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: isInner ? 2 : 4,
            height: isInner ? 2 : 4,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: isInner
              ? `rgba(15,240,252,${0.3 + Math.random() * 0.5})`
              : `rgba(255,107,53,${0.4 + Math.random() * 0.5})`,
            boxShadow: isInner
              ? '0 0 4px #0ff0fc'
              : '0 0 6px #ff6b35',
          }}
          animate={isInner ? {
            y: [0, -30, 0],
            opacity: [0.3, 1, 0.3],
          } : {
            y: [0, -80],
            x: [(Math.random() - 0.5) * 40],
            opacity: [1, 0],
            scale: [1, 0],
          }}
          transition={{
            duration: isInner ? 3 + Math.random() * 4 : 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}
