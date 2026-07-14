import React, { useState } from 'react'
import { AlertTriangle, HeartHandshake, Phone, MapPin, ChevronDown } from 'lucide-react'
import { PSYCH_DISCLAIMER } from '../../constants/disclaimers'
import { getCounselingCenter } from '../../config/campus'
import { useWorldStore } from '../../store/worldStore'
import { flyTo } from '../../api/amap'

/** 里世界心理合规免责与求助入口 */
export default function PsychDisclaimer() {
  const [open, setOpen] = useState(false)
  const mapInstance = useWorldStore(s => s.mapInstance)
  const setSelectedLandmark = useWorldStore(s => s.setSelectedLandmark)
  const counselingCenter = getCounselingCenter()

  const setPanelOpen = useWorldStore(s => s.setPanelOpen)

  const showOnMap = () => {
    if (!counselingCenter) return
    setPanelOpen(false)
    setSelectedLandmark(counselingCenter)
    if (mapInstance) {
      flyTo(mapInstance, {
        lng: counselingCenter.lng,
        lat: counselingCenter.lat,
        zoom: 18.2,
        pitch: 58,
      })
    }
  }

  if (!counselingCenter) return null

  const { info } = counselingCenter

  return (
    <div className="psych-disclaimer">
      <div className="psych-disclaimer__banner">
        <AlertTriangle size={14} className="shrink-0 text-amber-300/90" aria-hidden="true" />
        <p className="psych-disclaimer__summary">{PSYCH_DISCLAIMER.summary}</p>
      </div>

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="psych-disclaimer__toggle touch-target"
        aria-expanded={open}
      >
        <HeartHandshake size={13} />
        <span>专业心理咨询 · 校内免费</span>
        <ChevronDown size={14} className={`psych-disclaimer__chevron ${open ? 'is-open' : ''}`} />
      </button>

      {open && (
        <div className="psych-disclaimer__panel">
          <p className="psych-disclaimer__org">{info.org}</p>
          {info.building && (
            <p className="psych-disclaimer__text psych-disclaimer__building">{info.building}</p>
          )}
          <p className="psych-disclaimer__text">{info.service}</p>
          <p className="psych-disclaimer__text">{info.audience}</p>

          <ul className="psych-disclaimer__list">
            {PSYCH_DISCLAIMER.bullets.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="psych-disclaimer__contacts">
            <a href={`tel:${info.studentPhone}`} className="psych-disclaimer__phone touch-target">
              <Phone size={12} />
              <span>
                <strong>{info.studentPhoneLabel}</strong>
                <br />
                {info.studentPhone}
              </span>
            </a>
            <a href={`tel:${info.staffPhone}`} className="psych-disclaimer__phone touch-target">
              <Phone size={12} />
              <span>
                <strong>{info.staffPhoneLabel}</strong>
                <br />
                {info.staffPhone}
              </span>
            </a>
          </div>

          <p className="psych-disclaimer__address">
            <MapPin size={12} />
            {info.address}
          </p>

          <button type="button" onClick={showOnMap} className="psych-disclaimer__map-btn touch-target">
            <MapPin size={13} />
            在地图上查看心理中心位置
          </button>
        </div>
      )}
    </div>
  )
}
