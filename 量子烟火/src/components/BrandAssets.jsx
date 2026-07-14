/** 品牌静态资源（随 VITE_CAMPUS 切换） */
import { campus } from '../config/campus/index.js'

export const APP_ICON = '/app-icon.png'
export const LOGO_HORIZONTAL = '/logo-horizontal.png'
export const CAMPUS_BADGE = campus.assets.badge
export const CAMPUS_BADGE_WHITE = campus.assets.badgeWhite
export const CAMPUS_WORDMARK = campus.assets.wordmark
export const CAMPUS_WORDMARK_LIGHT = campus.assets.wordmarkLight
export const VOLCENGINE_LOGO = '/volcengine-logo.png'
export const VOLCENGINE_LOGO_LIGHT = '/volcengine-logo-light.png'

/** @deprecated 兼容旧引用 */
export const BJTU_BADGE = CAMPUS_BADGE
export const BJTU_BADGE_WHITE = CAMPUS_BADGE_WHITE
export const BJTU_WORDMARK = CAMPUS_WORDMARK
export const BJTU_WORDMARK_LIGHT = CAMPUS_WORDMARK_LIGHT

/** 应用图标（圆角方形） */
export function AppIconMark({ size = 32, className = '' }) {
  return (
    <img
      src={APP_ICON}
      alt="量子烟火"
      width={size}
      height={size}
      className={`rounded-lg object-cover ${className}`}
      style={{ boxShadow: '0 0 12px rgba(15,240,252,0.25)' }}
    />
  )
}

/** 横版 Logo */
export function LogoHorizontal({ className = '', style = {} }) {
  return (
    <img
      src={LOGO_HORIZONTAL}
      alt={`量子烟火 Quantum Fireworks · ${campus.englishShort}`}
      className={`object-contain ${className}`}
      style={style}
    />
  )
}
