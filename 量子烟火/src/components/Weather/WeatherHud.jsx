import React, { useEffect, useMemo } from 'react'
import { ChevronDown, Cloud, CloudFog, CloudRain, CloudSnow, Sun } from 'lucide-react'
import { useWeatherStore } from '../../store/weatherStore'
import { WEATHER_THEMES } from '../../constants/weatherThemes'
import { usesLightHaze } from '../../constants/weatherThemes'
import WeatherPicker from './WeatherPicker'
import SnowflakeIcon from './SnowflakeIcon'

function pickIcon(theme, weatherText = '') {
  if (theme === 'clear') return Sun
  if (theme === 'rain') return CloudRain
  if (theme === 'snow') return CloudSnow
  if (theme === 'fog') return CloudFog
  if (/雨/.test(weatherText)) return CloudRain
  if (/雪/.test(weatherText)) return CloudSnow
  return Cloud
}

/** 顶部实况天气 HUD（点击打开设置） */
export default function WeatherHud({ compact = false, mobileBar = false, mobileChip = false, isInner = true }) {
  const live = useWeatherStore(s => s.live)
  const status = useWeatherStore(s => s.status)
  const theme = useWeatherStore(s => s.theme)
  const source = useWeatherStore(s => s.source)
  const effectsEnabled = useWeatherStore(s => s.effectsEnabled)
  const pickerOpen = useWeatherStore(s => s.pickerOpen)
  const setPickerOpen = useWeatherStore(s => s.setPickerOpen)
  const loadWeather = useWeatherStore(s => s.loadWeather)

  useEffect(() => {
    if (status === 'idle' || status === 'error') {
      loadWeather()
    }
  }, [status, loadWeather])

  const mobileMode = mobileBar || mobileChip

  if (status === 'loading' && !live) {
    return (
      <div
        className={`weather-hud weather-hud--loading ${compact ? 'weather-hud--compact' : ''} ${mobileBar ? 'weather-hud--mobile-bar' : ''} ${mobileChip ? 'weather-hud--mobile-chip is-loading' : ''}`}
        aria-live="polite"
      >
        <span className="weather-hud__shimmer" />
        <span className="weather-hud__text">{mobileChip ? '天气' : '同步海淀天气…'}</span>
      </div>
    )
  }

  if (!live) {
    return (
      <div className={`weather-hud-wrap ${mobileMode ? 'weather-hud-wrap--mobile' : ''} ${mobileChip ? 'weather-hud-wrap--mobile-chip' : ''}`}>
        <button
          type="button"
          className={`weather-hud weather-hud--btn weather-hud--error ${mobileBar ? 'weather-hud--mobile-bar' : ''} ${mobileChip ? 'weather-hud--mobile-chip' : ''}`}
          onClick={() => loadWeather()}
          aria-haspopup="dialog"
          aria-label="加载海淀天气"
        >
          <Cloud size={mobileChip ? 16 : 14} className="weather-hud__icon" aria-hidden="true" />
          <span className="weather-hud__text">{mobileChip ? '天气' : '点击加载海淀天气'}</span>
          <ChevronDown size={12} className="weather-hud__chev" aria-hidden="true" />
        </button>
        <WeatherPicker compact={compact || mobileMode} isInner={isInner} />
      </div>
    )
  }

  const Icon = pickIcon(theme, live.weather)
  const modeLabel = source === 'live'
    ? '实况'
    : source === 'url'
      ? '演示'
      : '自选'
  const themeLabel = WEATHER_THEMES[theme]?.label || live.weather

  return (
    <div className={`weather-hud-wrap ${compact ? 'weather-hud-wrap--compact' : ''} ${mobileMode ? 'weather-hud-wrap--mobile' : ''} ${mobileChip ? 'weather-hud-wrap--mobile-chip' : ''}`}>
      <button
        type="button"
        className={`weather-hud weather-hud--btn weather-hud--${theme} ${compact ? 'weather-hud--compact' : ''} ${mobileBar ? 'weather-hud--mobile-bar' : ''} ${mobileChip ? 'weather-hud--mobile-chip' : ''} ${pickerOpen ? 'is-open' : ''}`}
        title={`${live.city} · ${live.weather} · ${modeLabel}${effectsEnabled ? '' : ' · 特效关'} · 点击设置`}
        onClick={() => setPickerOpen(!pickerOpen)}
        aria-expanded={pickerOpen}
        aria-haspopup="dialog"
        aria-label={`天气 ${live.weather} ${live.temperature}度，点击设置`}
      >
        <Icon size={mobileChip ? 16 : mobileBar ? 16 : compact ? 13 : 14} className="weather-hud__icon" aria-hidden="true" />
        <span className="weather-hud__text">
          {mobileChip ? (
            <>
              <span className="weather-hud__chip-main">{live.weather}</span>
              <span className="weather-hud__chip-temp">{live.temperature}°</span>
            </>
          ) : mobileBar ? (
            <>
              <span className="weather-hud__primary">{live.weather} {live.temperature}°</span>
              <span className="weather-hud__secondary">海淀 · {themeLabel}氛围 · {modeLabel}</span>
            </>
          ) : compact ? (
            <>
              {live.weather} {live.temperature}°
            </>
          ) : (
            <>
              {live.city} · {live.weather} {live.temperature}°C
              {live.windDirection && (
                <span className="weather-hud__sub"> · {live.windDirection}风 {live.windPower}级</span>
              )}
            </>
          )}
        </span>
        {!mobileBar && !mobileChip && <span className="weather-hud__mode">{modeLabel}</span>}
        {!effectsEnabled && !mobileChip && <span className="weather-hud__off">FX关</span>}
        <ChevronDown size={mobileChip ? 12 : mobileBar ? 14 : 12} className="weather-hud__chev" aria-hidden="true" />
      </button>
      <WeatherPicker compact={compact || mobileMode} isInner={isInner} />
    </div>
  )
}

/** 全屏天气粒子 / 氛围层 */
export function WeatherAtmosphere({ theme = 'clear', effectsEnabled = true, fxBoost = false }) {
  const boost = fxBoost

  const snowflakes = useMemo(
    () => Array.from({ length: boost ? 44 : 36 }, (_, i) => {
      const isLarge = i % 5 === 0
      return {
        id: i,
        left: `${(i * 13.1 + (i % 7) * 8.7) % 100}%`,
        delay: `${(i % 11) * 0.25}s`,
        duration: `${3.8 + (i % 8) * 0.55}s`,
        size: isLarge ? 32 + (i % 3) * 6 : 20 + (i % 4) * 4,
        opacity: isLarge ? 0.82 + (i % 3) * 0.06 : 0.62 + (i % 4) * 0.08,
        drift: 8 + (i % 6) * 4,
        spin: (i % 2 === 0 ? 1 : -1) * (90 + (i % 4) * 45),
        large: isLarge,
      }
    }),
    [boost],
  )

  const rainLines = useMemo(
    () => Array.from({ length: boost ? 56 : 40 }, (_, i) => ({
      id: i,
      left: `${(i * 7.3 + (i % 11) * 3.1) % 100}%`,
      delay: `${(i % 9) * 0.06}s`,
      duration: `${0.45 + (i % 5) * 0.1}s`,
      height: 14 + (i % 4) * 8,
    })),
    [boost],
  )

  const cloudPuffs = useMemo(
    () => Array.from({ length: boost ? 10 : 7 }, (_, i) => ({
      id: i,
      left: `${(i * 19 + 5) % 92}%`,
      top: `${(i % 4) * 4 + 2}%`,
      width: 180 + (i % 5) * 70,
      height: 56 + (i % 4) * 24,
      delay: `${(i % 6) * 1.4}s`,
      duration: `${22 + (i % 4) * 6}s`,
    })),
    [boost],
  )

  if (!effectsEnabled) return null
  if (theme === 'clear') return null

  return (
    <div className={`weather-fx weather-fx--${theme} ${boost ? 'weather-fx--boost' : ''}`} aria-hidden="true">
      {theme === 'rain' && (
        <div className="weather-fx__rain">
          {rainLines.map(line => (
            <span
              key={line.id}
              className="weather-fx__rain-line"
              style={{
                left: line.left,
                animationDelay: line.delay,
                animationDuration: line.duration,
                height: line.height,
              }}
            />
          ))}
        </div>
      )}

      {theme === 'snow' && (
        <div className="weather-fx__snow">
          {snowflakes.map(flake => (
            <span
              key={flake.id}
              className={`weather-fx__snowflake ${flake.large ? 'weather-fx__snowflake--large' : ''}`}
              style={{
                left: flake.left,
                opacity: flake.opacity,
                animationDelay: flake.delay,
                animationDuration: flake.duration,
                '--snow-drift': `${flake.drift}px`,
                '--snow-spin': `${flake.spin}deg`,
              }}
            >
              <SnowflakeIcon size={flake.size} />
            </span>
          ))}
        </div>
      )}

      {usesLightHaze(theme) && (
        <>
          <div className="weather-fx__clouds">
            {cloudPuffs.map(cloud => (
              <span
                key={cloud.id}
                className="weather-fx__cloud"
                style={{
                  left: cloud.left,
                  top: cloud.top,
                  width: cloud.width,
                  height: cloud.height,
                  animationDelay: cloud.delay,
                  animationDuration: cloud.duration,
                }}
              />
            ))}
          </div>
          <div className={`weather-fx__haze weather-fx__haze--${theme}`} />
        </>
      )}

      {theme === 'fog' && (
        <>
          <div className="weather-fx__mist weather-fx__mist--fog" />
          <div className="weather-fx__fog-wisps">
            {Array.from({ length: boost ? 5 : 3 }, (_, i) => (
              <span
                key={i}
                className="weather-fx__fog-wisp"
                style={{
                  left: `${15 + i * 18}%`,
                  animationDelay: `${i * 2.2}s`,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
