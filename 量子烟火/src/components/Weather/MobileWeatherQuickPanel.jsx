import React from 'react'
import { Cloud, CloudFog, CloudRain, CloudSnow, CloudSun, Settings2, Sun } from 'lucide-react'
import { WEATHER_THEME_KEYS, WEATHER_THEMES } from '../../constants/weatherThemes'
import { useWeatherStore } from '../../store/weatherStore'

const THEME_ICONS = {
  clear: Sun,
  cloudy: CloudSun,
  overcast: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  fog: CloudFog,
}

/** 移动端抽屉内：天气快捷入口 */
export default function MobileWeatherQuickPanel({ isInner = true }) {
  const live = useWeatherStore(s => s.live)
  const theme = useWeatherStore(s => s.theme)
  const source = useWeatherStore(s => s.source)
  const effectsEnabled = useWeatherStore(s => s.effectsEnabled)
  const setManualTheme = useWeatherStore(s => s.setManualTheme)
  const setPickerOpen = useWeatherStore(s => s.setPickerOpen)

  const modeLabel = source === 'live' ? '海淀实况' : source === 'url' ? '演示模式' : '自选模式'
  const accent = isInner ? 'rgba(69, 232, 245, 0.85)' : 'rgba(255, 133, 85, 0.9)'

  return (
    <div
      className="mobile-weather-panel"
      style={{ '--mobile-weather-accent': accent }}
    >
      <div className="mobile-weather-panel__head">
        <div>
          <p className="mobile-weather-panel__label">Campus 天气氛围</p>
          <p className="mobile-weather-panel__live">
            {live
              ? `${live.weather} ${live.temperature}° · ${modeLabel}`
              : '点击同步海淀天气'}
            {!effectsEnabled && ' · 特效关'}
          </p>
        </div>
        <button
          type="button"
          className="mobile-weather-panel__settings touch-target"
          onClick={() => setPickerOpen(true)}
          aria-label="打开天气设置"
        >
          <Settings2 size={18} />
        </button>
      </div>

      <div className="mobile-weather-panel__grid">
        {WEATHER_THEME_KEYS.map(key => {
          const meta = WEATHER_THEMES[key]
          const Icon = THEME_ICONS[key] || Cloud
          const active = theme === key && source !== 'live'
          return (
            <button
              key={key}
              type="button"
              disabled={!effectsEnabled}
              className={`mobile-weather-panel__chip ${active ? 'is-active' : ''}`}
              onClick={() => setManualTheme(key)}
            >
              <Icon size={16} />
              <span>{meta.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
