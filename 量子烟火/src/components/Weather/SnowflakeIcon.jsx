import React from 'react'

const SNOWFLAKE_SRC = '/weather/snowflake-soft.png'

/** 真实雪花贴图（抠图 + 柔化） */
export default function SnowflakeIcon({ size = 16, className = '' }) {
  return (
    <img
      className={`weather-fx__snowflake-img ${className}`.trim()}
      src={SNOWFLAKE_SRC}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
    />
  )
}
