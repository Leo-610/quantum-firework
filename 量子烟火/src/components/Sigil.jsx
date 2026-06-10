import React from 'react'

export default function Sigil({ variant = 'inner', icon: Icon, size = 48 }) {
  return (
    <div
      className={`sigil sigil-${variant}`}
      style={{ '--sigil-size': `${size}px` }}
      aria-hidden="true"
    >
      <div className="sigil-ring sigil-ring--outer" />
      <div className="sigil-ring sigil-ring--mid" />
      <div className="sigil-orbit">
        <span className="sigil-dot" />
      </div>
      <div className="sigil-core">
        {Icon ? <Icon size={Math.round(size * 0.45)} /> : null}
      </div>
    </div>
  )
}
