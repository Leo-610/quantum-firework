import React, { useMemo } from 'react'
import { Cloud, CloudFog, CloudRain, CloudSnow, Sun } from 'lucide-react'
import { useWeatherStore } from '../../store/weatherStore'
import { usesLightHaze } from '../../constants/weatherThemes'
import { isForcedWeatherLive } from '../../utils/weatherOverride'

function pickIcon(theme, weatherText = '') {
  if (theme === 'clear') return Sun
  if (theme === 'rain') return CloudRain
  if (theme === 'snow') return CloudSnow
  if (theme === 'fog') return CloudFog
  if (/雨/.test(weatherText)) return CloudRain
  if (/雪/.test(weatherText)) return CloudSnow
  return Cloud
}

/** 顶部实况天气 HUD */
export default function WeatherHud({ compact = false }) {
  const live = useWeatherStore(s => s.live)
  const status = useWeatherStore(s => s.status)
  const theme = useWeatherStore(s => s.theme)

  if (status === 'loading') {
    return (
      <div className={`weather-hud weather-hud--loading ${compact ? 'weather-hud--compact' : ''}`} aria-live="polite">
        <span className="weather-hud__shimmer" />
        <span className="weather-hud__text">同步海淀天气…</span>
      </div>
    )
  }

  if (!live) return null

  const Icon = pickIcon(theme, live.weather)
  const isDemo = isForcedWeatherLive(live)

  return (
    <div
      className={`weather-hud weather-hud--${theme} ${compact ? 'weather-hud--compact' : ''}`}
      title={`${live.city} · ${live.weather}${isDemo ? ' · 演示模式' : ''} · 更新 ${live.reportTime || ''}`}
    >
      <Icon size={compact ? 13 : 14} className="weather-hud__icon" aria-hidden="true" />
      <span className="weather-hud__text">
        {compact ? (
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
    </div>
  )
}

/** 全屏天气粒子 / 氛围层 */
export function WeatherAtmosphere({ theme = 'clear' }) {
  const snowflakes = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: `${(i * 17 + (i % 5) * 11) % 100}%`,
      delay: `${(i % 7) * 0.35}s`,
      duration: `${4.5 + (i % 6) * 0.7}s`,
      size: 2 + (i % 3),
      opacity: 0.2 + (i % 4) * 0.08,
    })),
    [],
  )

  const rainLines = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: `${(i * 13) % 100}%`,
      delay: `${(i % 9) * 0.08}s`,
      duration: `${0.55 + (i % 5) * 0.12}s`,
      height: 10 + (i % 3) * 5,
    })),
    [],
  )

  if (theme === 'clear') return null

  return (
    <div className={`weather-fx weather-fx--${theme}`} aria-hidden="true">
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
              className="weather-fx__snowflake"
              style={{
                left: flake.left,
                width: flake.size,
                height: flake.size,
                opacity: flake.opacity,
                animationDelay: flake.delay,
                animationDuration: flake.duration,
              }}
            />
          ))}
        </div>
      )}

      {usesLightHaze(theme) && (
        <div className={`weather-fx__haze weather-fx__haze--${theme}`} />
      )}

      {theme === 'fog' && (
        <div className="weather-fx__mist weather-fx__mist--fog" />
      )}
    </div>
  )
}
