import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, MapPin, BookOpen } from 'lucide-react'
import { useWorldStore } from '../../store/worldStore'

/** 校园历史地标故事卡 */
export default function HeritageStoryCard() {
  const landmark = useWorldStore(s => s.selectedLandmark)
  const setSelectedLandmark = useWorldStore(s => s.setSelectedLandmark)

  if (!landmark || landmark.type !== 'heritage') return null

  const story = landmark.story || {}
  const tags = landmark.tags || []
  const accent = landmark.accentColor || '#f7d27d'

  return (
    <AnimatePresence>
      <motion.div
        key={landmark.id}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.3 }}
        className="heritage-card-wrap"
        style={{ '--heritage-accent': accent }}
      >
        <div className="heritage-card">
          <button
            onClick={() => setSelectedLandmark(null)}
            className="heritage-close"
            aria-label="关闭"
          >
            <X size={14} />
          </button>

          <div className="heritage-header">
            <div className="heritage-dot" />
            <div>
              <p className="heritage-title">{landmark.name}</p>
              {story.title && <p className="heritage-subtitle">{story.title}</p>}
            </div>
          </div>

          <div className="heritage-body">
            {story.summary && <p className="heritage-text">{story.summary}</p>}
            {story.relation && (
              <p className="heritage-text">
                <span className="heritage-label"><MapPin size={12} /> 北交渊源</span>
                {story.relation}
              </p>
            )}
            {story.legacy && (
              <p className="heritage-text">
                <span className="heritage-label"><BookOpen size={12} /> 精神传承</span>
                {story.legacy}
              </p>
            )}
          </div>

          {tags.length > 0 && (
            <div className="heritage-tags">
              {tags.map(tag => (
                <span key={tag} className="heritage-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
