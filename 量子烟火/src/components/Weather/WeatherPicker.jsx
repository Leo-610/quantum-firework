import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  RefreshCw,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'
import { WEATHER_THEME_KEYS, WEATHER_THEMES } from '../../constants/weatherThemes'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { useWeatherStore } from '../../store/weatherStore'

const THEME_ICONS = {
  clear: Sun,
  cloudy: CloudSun,
  overcast: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  fog: CloudFog,
}

function WeatherPickerPanel({
  effectsEnabled,
  setEffectsEnabled,
  theme,
  source,
  setManualTheme,
  resetToLiveWeather,
  setPickerOpen,
}) {
  return (
    <>
      <div className="weather-picker__head">
        <span className="weather-picker__title">
          <Sparkles size={13} /> 天气氛围
        </span>
        <button
          type="button"
          className="weather-picker__close"
          onClick={() => setPickerOpen(false)}
          aria-label="关闭"
        >
          <X size={14} />
        </button>
      </div>

      <label className="weather-picker__toggle">
        <span>粒子与氛围特效</span>
        <button
          type="button"
          role="switch"
          aria-checked={effectsEnabled}
          className={`weather-picker__switch ${effectsEnabled ? 'is-on' : ''}`}
          onClick={() => setEffectsEnabled(!effectsEnabled)}
        >
          <span className="weather-picker__switch-knob" />
        </button>
      </label>

      <p className="weather-picker__hint">
        {effectsEnabled ? '选择天气模式，即时预览 campus 氛围' : '特效已关闭，仅保留 HUD 文案'}
      </p>

      <div className="weather-picker__grid">
        {WEATHER_THEME_KEYS.map(key => {
          const meta = WEATHER_THEMES[key]
          const Icon = THEME_ICONS[key] || Cloud
          const active = theme === key && source !== 'live'
          return (
            <button
              key={key}
              type="button"
              disabled={!effectsEnabled}
              className={`weather-picker__chip ${active ? 'is-active' : ''}`}
              onClick={() => setManualTheme(key)}
            >
              <Icon size={14} />
              <span>{meta.label}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className="weather-picker__live"
        onClick={() => {
          resetToLiveWeather()
          setPickerOpen(false)
        }}
      >
        <RefreshCw size={13} />
        恢复海淀实况
        {source === 'live' && <span className="weather-picker__live-badge">当前</span>}
      </button>

      {source === 'url' && (
        <p className="weather-picker__url-note">URL 参数 ?weather= 优先生效</p>
      )}
    </>
  )
}

/** 天气特效与模式选择面板 */
export default function WeatherPicker({ compact = false, isInner = true }) {
  const isMobile = useIsMobile()
  const pickerOpen = useWeatherStore(s => s.pickerOpen)
  const setPickerOpen = useWeatherStore(s => s.setPickerOpen)
  const theme = useWeatherStore(s => s.theme)
  const source = useWeatherStore(s => s.source)
  const effectsEnabled = useWeatherStore(s => s.effectsEnabled)
  const setEffectsEnabled = useWeatherStore(s => s.setEffectsEnabled)
  const setManualTheme = useWeatherStore(s => s.setManualTheme)
  const resetToLiveWeather = useWeatherStore(s => s.resetToLiveWeather)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!pickerOpen || isMobile) return
    const onPointerDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPickerOpen(false)
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [pickerOpen, setPickerOpen, isMobile])

  useEffect(() => {
    if (!pickerOpen || !isMobile) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [pickerOpen, isMobile, setPickerOpen])

  const accent = isInner ? '#0ff0fc' : '#ff6b35'
  const border = isInner ? 'rgba(15,240,252,0.25)' : 'rgba(255,107,53,0.25)'

  const panelProps = {
    effectsEnabled,
    setEffectsEnabled,
    theme,
    source,
    setManualTheme,
    resetToLiveWeather,
    setPickerOpen,
  }

  const pickerStyle = { '--weather-picker-accent': accent, '--weather-picker-border': border }

  const desktopPanel = (
    <AnimatePresence>
      {pickerOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: compact ? -6 : 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: compact ? -4 : 4, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className={`weather-picker ${compact ? 'weather-picker--compact' : ''}`}
          style={pickerStyle}
          role="dialog"
          aria-label="天气特效设置"
        >
          <WeatherPickerPanel {...panelProps} />
        </motion.div>
      )}
    </AnimatePresence>
  )

  const mobileSheet = (
    <AnimatePresence>
      {pickerOpen && (
        <>
          <motion.button
            type="button"
            className="weather-picker-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-label="关闭天气设置"
            onClick={() => setPickerOpen(false)}
          />
          <motion.div
            ref={panelRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="weather-picker weather-picker--mobile"
            style={pickerStyle}
            role="dialog"
            aria-label="天气特效设置"
          >
            <div className="weather-picker__handle" aria-hidden="true" />
            <WeatherPickerPanel {...panelProps} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  if (isMobile) {
    return typeof document !== 'undefined'
      ? createPortal(mobileSheet, document.body)
      : null
  }

  return desktopPanel
}
