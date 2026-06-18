import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { Menu, X, Sparkles, ChevronDown, Atom, Flame } from 'lucide-react'
import { AppIconMark } from './components/BrandAssets'
import MapCanvas from './components/MapCanvas'
import HeritageStoryCard from './components/MapCanvas/HeritageStoryCard'
import CounselingCard from './components/MapCanvas/CounselingCard'
import WorldSwitch from './components/WorldSwitch'
import InnerWorldPanel from './components/InnerWorld'
import OuterWorldPanel from './components/OuterWorld'
import { useWorldStore } from './store/worldStore'
import { useEmotionStore } from './store/emotionStore'
import { useIsMobile } from './hooks/useMediaQuery'

import { useAppBoot } from './hooks/useAppBoot'
import SplashScreen from './components/SplashScreen'
import WeatherHud, { WeatherAtmosphere } from './components/Weather/WeatherHud'
import MobileWeatherQuickPanel from './components/Weather/MobileWeatherQuickPanel'
import { useWeatherStore } from './store/weatherStore'

export default function App() {
  const { world, isPanelOpen, setPanelOpen, userId, setUserId, mapInstance, selectedLandmark } = useWorldStore()
  const loadPlantsToHeatmap = useEmotionStore(s => s.loadPlantsToHeatmap)
  const isMobile = useIsMobile()
  const { complete: bootComplete, progress, phase } = useAppBoot()
  const isInner = world === 'inner'
  const weatherTheme = useWeatherStore(s => s.theme)
  const weatherSource = useWeatherStore(s => s.source)
  const effectsEnabled = useWeatherStore(s => s.effectsEnabled)
  const loadWeather = useWeatherStore(s => s.loadWeather)
  const weatherBoost = weatherSource === 'manual' || weatherSource === 'url'

  useEffect(() => {
    if (!userId) {
      setUserId(uuidv4())
    }
    loadPlantsToHeatmap()
  }, [])

  useEffect(() => {
    if (!bootComplete) return
    loadWeather()
  }, [bootComplete, loadWeather])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isMobile) return
      if (e.key === 'Escape') {
        setPanelOpen(false)
      }
      if (e.key.toLowerCase() === 'm') {
        setPanelOpen(open => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setPanelOpen, isMobile])

  useEffect(() => {
    if (!mapInstance) return
    mapInstance.setStatus({
      scrollWheel: !isPanelOpen,
      touchZoom: !isPanelOpen,
      doubleClickZoom: !isPanelOpen,
    })
  }, [mapInstance, isPanelOpen])

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.content = isInner ? '#060c18' : '#140600'
    }
  }, [isInner])

  const panelMotion = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { x: -320, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -320, opacity: 0 } }

  return (
    <>
    <div
      className={`relative w-full h-screen overflow-hidden world-shell world-transition ${isInner ? 'world-inner' : 'world-outer'} ${bootComplete ? '' : 'pointer-events-none'}`}
      data-weather={weatherTheme}
      data-weather-forced={weatherBoost ? 'true' : 'false'}
      data-weather-effects={effectsEnabled ? 'true' : 'false'}
      aria-hidden={!bootComplete}
    >
      <MapCanvas />

      {/* 地图地标信息卡：置于 App 层，避免被底部 CTA 遮挡 */}
      <div className="landmark-overlays" aria-live="polite">
        <HeritageStoryCard />
        <CounselingCard />
      </div>

      <div className="world-atmosphere" aria-hidden="true" />
      <WeatherAtmosphere
        theme={weatherTheme}
        effectsEnabled={effectsEnabled}
        fxBoost={weatherBoost}
        isMobile={isMobile}
      />

      {/* 移动端：顶部精简栏 */}
      {isMobile ? (
        <div className="mobile-top-bar absolute top-0 left-0 right-0 z-[60] flex flex-col gap-2 px-3 pt-safe">
          <div className="mobile-top-bar__row pointer-events-auto">
            <div className="mobile-top-bar__brand hud-glass">
              <AppIconMark size={28} />
              <span className="mobile-top-bar__title text-theme-primary">
                量子烟火
              </span>
            </div>
            <WeatherHud mobileChip isInner={isInner} />
            <button
              onClick={() => setPanelOpen(!isPanelOpen)}
              aria-label={isPanelOpen ? '收起面板' : '展开面板'}
              className={`
                mobile-top-bar__menu hud-glass touch-target
                ${isInner
                  ? 'text-cyan-400/80 border border-cyan-400/20'
                  : 'text-orange-400/80 border border-orange-400/20'
                }
              `}
            >
              {isPanelOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      ) : (
        <>
          <WorldSwitch />
          <div className="absolute top-4 left-4 z-50 desktop-only">
            <div className="hud-glass flex flex-col gap-2 px-3 py-2 rounded-xl">
              <div className="flex items-center gap-2.5">
                <AppIconMark size={36} />
                <div>
                  <p className="text-sm font-bold font-display" style={{ color: isInner ? '#0ff0fc' : '#ff6b35' }}>
                    量子烟火
                  </p>
                  <p className="text-[10px] font-mono opacity-40">北京交通大学</p>
                </div>
              </div>
              <WeatherHud isInner={isInner} />
            </div>
          </div>
          <div className="absolute top-4 right-4 z-50 desktop-only">
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
        </>
      )}

      {/* 移动端：世界切换浮条（地图可见时） */}
      {isMobile && !isPanelOpen && (
        <div className="absolute top-safe-offset left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <WorldSwitch compact />
          </div>
        </div>
      )}

      {/* 移动端：面板遮罩（点击关闭） */}
      <AnimatePresence>
        {isMobile && isPanelOpen && (
          <motion.button
            type="button"
            aria-label="关闭面板"
            className="mobile-backdrop border-0 p-0 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setPanelOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 面板：桌面侧栏 / 移动底部抽屉 */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            key={world}
            {...panelMotion}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className={`z-40 flex flex-col panel-shell ${isMobile ? 'panel-shell--mobile' : 'panel-shell--fixed absolute left-0 top-0 bottom-0'}`}
          >
            {isMobile && (
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="mobile-sheet-handle flex flex-col items-center pt-2 pb-1 w-full shrink-0"
                aria-label="收起面板"
              >
                <span className="mobile-sheet-grab" />
                <ChevronDown size={16} className="opacity-40 mt-0.5" />
              </button>
            )}

            {isMobile && (
              <div className="px-3 pb-3 shrink-0 border-b border-white/5">
                <MobileWeatherQuickPanel isInner={isInner} />
              </div>
            )}

            {isMobile && (
              <div className="px-3 pb-2 shrink-0 border-b border-white/5">
                <WorldSwitch compact inPanel />
              </div>
            )}

            <div
              className="absolute inset-0"
              style={{
                background: isInner
                  ? 'linear-gradient(160deg, rgba(6,12,26,0.98) 0%, rgba(6,10,20,0.92) 55%, rgba(4,8,14,0.9) 100%)'
                  : 'linear-gradient(160deg, rgba(22,10,2,0.98) 0%, rgba(18,7,0,0.92) 55%, rgba(12,4,0,0.9) 100%)',
                borderRight: isMobile ? 'none' : `1px solid ${isInner ? 'rgba(15,240,252,0.18)' : 'rgba(255,107,53,0.2)'}`,
                borderTop: isMobile ? `1px solid ${isInner ? 'rgba(15,240,252,0.18)' : 'rgba(255,107,53,0.2)'}` : 'none',
                boxShadow: isInner
                  ? '0 0 40px rgba(15,240,252,0.08), inset -1px 0 0 rgba(255,255,255,0.04)'
                  : '0 0 40px rgba(255,107,53,0.08), inset -1px 0 0 rgba(255,255,255,0.03)',
                backdropFilter: 'blur(22px) saturate(1.1)',
                pointerEvents: 'none',
                borderRadius: isMobile ? '16px 16px 0 0' : 0,
              }}
            />

            <div className={`panel-scroll flex-1 min-h-0 ${isMobile ? 'pt-2 pb-safe' : 'pt-20 pb-10'} px-0.5`}>
              <AnimatePresence mode="wait">
                {isInner ? (
                  <motion.div
                    key="inner"
                    initial={{ opacity: 0, x: isMobile ? 0 : -20, y: isMobile ? 12 : 0 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: isMobile ? 0 : 20, y: isMobile ? -8 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <InnerWorldPanel isMobile={isMobile} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="outer"
                    initial={{ opacity: 0, x: isMobile ? 0 : 20, y: isMobile ? 12 : 0 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: isMobile ? 0 : -20, y: isMobile ? -8 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <OuterWorldPanel isMobile={isMobile} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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

      {/* 面板关闭时的入口 */}
      <AnimatePresence>
        {!isPanelOpen && !selectedLandmark && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className={`absolute z-40 ${isMobile ? 'left-3 right-3 bottom-safe' : 'left-4 bottom-8'}`}
          >
            <button
              onClick={() => setPanelOpen(true)}
              className={`
                w-full flex flex-col items-start gap-1 px-4 py-3 rounded-xl transition-all duration-300
                ${isMobile ? 'min-h-[52px] items-center text-center mobile-cta-btn' : ''}
                ${isInner
                  ? 'glass-inner hover:shadow-[0_0_20px_rgba(15,240,252,0.2)]'
                  : 'glass-outer hover:shadow-[0_0_20px_rgba(255,107,53,0.2)]'
                }
              `}
            >
              <p className="text-xs font-bold inline-flex items-center gap-1 text-theme-primary">
                <Sparkles size={14} />
                {isInner ? '进入里世界' : '进入表世界'}
              </p>
              <p className={`text-[11px] opacity-55 text-theme-body ${isMobile ? 'text-center' : ''}`}>
                {isInner ? '倾诉 · 种植情绪 · 时空感通' : '吐槽 · 文豪改写 · 战力雷达'}
              </p>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {(!isMobile || isPanelOpen) && (
        <div className={`absolute z-40 pointer-events-none ${isMobile ? 'bottom-1 left-3 opacity-25' : 'bottom-2 right-4 opacity-20'}`}>
          <p className="text-[10px] font-mono text-theme-primary">
            {isMobile ? 'BJTU · QF' : `Quantum Fireworks · BJTU · ${new Date().getFullYear()}`}
          </p>
        </div>
      )}

      <ParticleLayer world={world} isMobile={isMobile} />
    </div>

    <AnimatePresence>
      {!bootComplete && (
        <SplashScreen progress={progress} phase={phase} />
      )}
    </AnimatePresence>
    </>
  )
}

function ParticleLayer({ world, isMobile }) {
  const isInner = world === 'inner'
  const count = isMobile ? (isInner ? 10 : 6) : (isInner ? 20 : 12)
  const particles = Array.from({ length: count }, (_, i) => i)

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
            boxShadow: isInner ? '0 0 4px #0ff0fc' : '0 0 6px #ff6b35',
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
