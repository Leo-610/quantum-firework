import React from 'react'

/** 六角雪花 SVG（非圆点） */
export default function SnowflakeIcon({ size = 16, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.35" strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="4.2" y1="4.2" x2="19.8" y2="19.8" />
        <line x1="19.8" y1="4.2" x2="4.2" y2="19.8" />
        <line x1="12" y1="6" x2="9" y2="8.5" />
        <line x1="12" y1="6" x2="15" y2="8.5" />
        <line x1="12" y1="18" x2="9" y2="15.5" />
        <line x1="12" y1="18" x2="15" y2="15.5" />
        <line x1="6" y1="12" x2="8.5" y2="9" />
        <line x1="6" y1="12" x2="8.5" y2="15" />
        <line x1="18" y1="12" x2="15.5" y2="9" />
        <line x1="18" y1="12" x2="15.5" y2="15" />
      </g>
    </svg>
  )
}
