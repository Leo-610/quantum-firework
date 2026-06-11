import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Phone, MapPin, HeartHandshake } from 'lucide-react'
import { useWorldStore } from '../../store/worldStore'
import { PSYCH_DISCLAIMER } from '../../constants/disclaimers'

/** 心理素质教育中心地图信息卡 */
export default function CounselingCard() {
  const landmark = useWorldStore(s => s.selectedLandmark)
  const setSelectedLandmark = useWorldStore(s => s.setSelectedLandmark)

  if (!landmark || landmark.type !== 'counseling') return null

  const info = landmark.info || {}
  const accent = landmark.accentColor || '#6ee7b7'

  return (
    <AnimatePresence>
      <motion.div
        key={landmark.id}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.3 }}
        className="counseling-card-wrap"
        style={{ '--counseling-accent': accent }}
      >
        <div className="counseling-card">
          <button
            onClick={() => setSelectedLandmark(null)}
            className="counseling-close"
            aria-label="关闭"
          >
            <X size={14} />
          </button>

          <div className="counseling-header">
            <HeartHandshake size={18} className="counseling-icon" />
            <div>
              <p className="counseling-title">{landmark.name}</p>
              <p className="counseling-subtitle">{info.org}</p>
            </div>
          </div>

          <p className="counseling-note">{PSYCH_DISCLAIMER.summary}</p>

          <div className="counseling-body">
            <p>{info.service}</p>
            <p className="counseling-muted">{info.audience}</p>
          </div>

          <div className="counseling-phones">
            <a href={`tel:${info.studentPhone}`} className="counseling-phone">
              <Phone size={13} />
              <span>
                <strong>{info.studentPhoneLabel}</strong>
                {info.studentPhone}
              </span>
            </a>
            <a href={`tel:${info.staffPhone}`} className="counseling-phone">
              <Phone size={13} />
              <span>
                <strong>{info.staffPhoneLabel}</strong>
                {info.staffPhone}
              </span>
            </a>
          </div>

          <p className="counseling-address">
            <MapPin size={12} />
            {info.address}
          </p>

          {(landmark.tags || []).length > 0 && (
            <div className="counseling-tags">
              {landmark.tags.map(tag => (
                <span key={tag} className="counseling-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
