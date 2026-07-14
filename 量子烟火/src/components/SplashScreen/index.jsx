import React, { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  APP_ICON,
  LOGO_HORIZONTAL,
  CAMPUS_BADGE_WHITE,
  CAMPUS_WORDMARK_LIGHT,
  VOLCENGINE_LOGO_LIGHT,
} from '../BrandAssets'
import { campus } from '../../config/campus'
import { useTypewriter } from '../../hooks/useTypewriter'

const BURST_COUNT = 24

function CampusBrand({ blend = 0 }) {
  return (
    <motion.div
      className="splash-bjtu"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6 }}
    >
      <div
        className="splash-bjtu-badge-wrap splash-bjtu-badge-wrap--dark"
        style={{
          boxShadow: `0 0 28px color-mix(in srgb, #0ff0fc ${70 - blend * 35}%, #ff6b35 ${blend * 35}%)`,
        }}
      >
        <motion.img
          src={CAMPUS_BADGE_WHITE}
          alt={`${campus.name}校徽`}
          className="splash-bjtu-badge"
          animate={{ rotate: [0, 2, -2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="splash-bjtu-badge-ring" aria-hidden="true" />
      </div>
      <img
        src={CAMPUS_WORDMARK_LIGHT}
        alt={`${campus.name} ${campus.englishName}`}
        className="splash-bjtu-wordmark"
      />
    </motion.div>
  )
}

function SplashSponsor() {
  return (
    <motion.div
      className="splash-sponsor"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.5 }}
    >
      <p className="splash-sponsor-label">首届「火山杯」AI 应用创新大赛</p>
      <div className="splash-sponsor-row">
        <span className="splash-sponsor-coze">Powered by 扣子编程</span>
        <span className="splash-sponsor-sep" aria-hidden="true">×</span>
        <img
          src={VOLCENGINE_LOGO_LIGHT}
          alt="火山引擎"
          className="splash-sponsor-volc"
        />
      </div>
    </motion.div>
  )
}

/** 量子烟火 · 启动屏 */
export default function SplashScreen({ progress = 0, phase = '初始化…' }) {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const typedPhase = useTypewriter(phase, {
    speed: reducedMotion ? 0 : 36,
    enabled: !reducedMotion,
  })

  const burst = useMemo(
    () => Array.from({ length: BURST_COUNT }, (_, i) => ({
      id: i,
      angle: (360 / BURST_COUNT) * i,
      dist: 80 + Math.random() * 120,
      delay: Math.random() * 0.15,
      size: 3 + Math.random() * 5,
    })),
    [],
  )

  const showBurst = progress >= 92
  const blend = Math.min(1, Math.max(0, (progress - 55) / 45))
  const showSkeleton = progress < 88

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="量子烟火正在加载"
      className="splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="splash-grid" aria-hidden="true" />
      <div className="splash-scanline" aria-hidden="true" />

      <CampusBrand blend={blend} />

      <div className="splash-rings" aria-hidden="true">
        <motion.div
          className="splash-ring splash-ring--cyan"
          animate={{ rotate: 360, scale: [1, 1.06, 1] }}
          transition={{ rotate: { duration: 18, repeat: Infinity, ease: 'linear' }, scale: { duration: 3, repeat: Infinity } }}
        />
        <motion.div
          className="splash-ring splash-ring--orange"
          style={{ opacity: 0.35 + blend * 0.65 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="splash-center">
        <motion.div
          className="splash-app-icon-wrap"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src={APP_ICON}
            alt=""
            className="splash-app-icon"
            animate={{
              scale: [1, 1.04, 1],
              filter: [
                'drop-shadow(0 0 20px rgba(15,240,252,0.45))',
                `drop-shadow(0 0 28px rgba(255,107,53,${0.25 + blend * 0.35}))`,
                'drop-shadow(0 0 20px rgba(15,240,252,0.45))',
              ],
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        <motion.img
          src={LOGO_HORIZONTAL}
          alt="量子烟火 Quantum Fireworks"
          className="splash-logo-horizontal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.65 }}
        />

        <motion.p
          className="splash-tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          里世界 · 量子共鸣 &nbsp;|&nbsp; 表世界 · 虎扑烟火
        </motion.p>

        {showSkeleton && (
          <div className="splash-skeleton" aria-hidden="true">
            <span className="splash-skeleton__bar splash-skeleton__bar--wide" />
            <span className="splash-skeleton__bar splash-skeleton__bar--mid" />
            <span className="splash-skeleton__bar splash-skeleton__bar--short" />
          </div>
        )}
      </div>

      <div className="splash-progress-wrap">
        <div className={`splash-progress-track ${progress < 8 ? 'is-loading' : ''}`}>
          <motion.div
            className="splash-progress-bar"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, #0ff0fc, color-mix(in srgb, #7b2fff 50%, #ff6b35 ${blend * 100}%))`,
              boxShadow: `0 0 16px color-mix(in srgb, #0ff0fc ${100 - blend * 50}%, #ff6b35 ${blend * 50}%)`,
            }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          />
        </div>
        <div className="splash-progress-meta">
          <span className="splash-phase" aria-label={phase}>
            {reducedMotion ? phase : typedPhase}
            {!reducedMotion && typedPhase.length < phase.length && (
              <span className="splash-type-cursor" aria-hidden="true">▍</span>
            )}
          </span>
          <span className="splash-percent font-mono">{Math.round(progress)}%</span>
        </div>
      </div>

      <SplashSponsor />

      {showBurst && (
        <div className="splash-burst" aria-hidden="true">
          {burst.map(p => (
            <motion.span
              key={p.id}
              className="splash-burst-dot"
              style={{
                width: p.size,
                height: p.size,
                background: p.id % 2 ? '#ff6b35' : '#0ff0fc',
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((p.angle * Math.PI) / 180) * p.dist,
                y: Math.sin((p.angle * Math.PI) / 180) * p.dist,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 0.9, delay: p.delay, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

export { CAMPUS_BADGE_WHITE, CampusBrand }
