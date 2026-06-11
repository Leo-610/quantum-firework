/** 品牌静态资源路径 */
export const APP_ICON = '/app-icon.png'
export const LOGO_HORIZONTAL = '/logo-horizontal.png'
export const BJTU_BADGE = '/bjtu-badge.png'
export const BJTU_BADGE_WHITE = '/bjtu-badge-white.png'
export const BJTU_WORDMARK = '/bjtu-wordmark.png'
export const BJTU_WORDMARK_LIGHT = '/bjtu-wordmark-light.png'

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
      alt="量子烟火 Quantum Fireworks · BJTU"
      className={`object-contain ${className}`}
      style={style}
    />
  )
}
