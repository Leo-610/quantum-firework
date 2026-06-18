import React, { useEffect, useId, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  DEFAULT_MUSIC_TRACK_ID,
  getMusicTrack,
  MUSIC_LIBRARY,
} from '../../constants/musicLibrary'

const STORAGE_TRACK = 'qf-music-track-id'
const STORAGE_VOLUME = 'qf-music-volume'
const STORAGE_LOOP = 'qf-music-loop'
const STORAGE_OPEN = 'qf-music-panel-open'

function readStoredTrackId() {
  if (typeof window === 'undefined') return DEFAULT_MUSIC_TRACK_ID
  const stored = localStorage.getItem(STORAGE_TRACK)
  if (stored && getMusicTrack(stored)) return stored
  return DEFAULT_MUSIC_TRACK_ID
}

function readStoredVolume() {
  if (typeof window === 'undefined') return 0.45
  const raw = localStorage.getItem(STORAGE_VOLUME)
  const n = raw ? Number.parseFloat(raw) : 0.45
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.45
}

function readStoredLoop() {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(STORAGE_LOOP) !== '0'
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** 右下角音乐播放器（与 shiji SiteMusicPlayer 行为一致） */
export default function SiteMusicPlayer({ isMobile = false }) {
  const panelId = useId()
  const audioRef = useRef(null)
  const playAfterLoadRef = useRef(false)
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [trackId, setTrackId] = useState(DEFAULT_MUSIC_TRACK_ID)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.45)
  const [loop, setLoop] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(false)

  const track = getMusicTrack(trackId) ?? MUSIC_LIBRARY[0]

  useEffect(() => {
    setTrackId(readStoredTrackId())
    setVolume(readStoredVolume())
    setLoop(readStoredLoop())
    setOpen(localStorage.getItem(STORAGE_OPEN) === '1')
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_TRACK, trackId)
  }, [mounted, trackId])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_VOLUME, String(volume))
    if (audioRef.current) audioRef.current.volume = volume
  }, [mounted, volume])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_LOOP, loop ? '1' : '0')
    if (audioRef.current) audioRef.current.loop = loop
  }, [mounted, loop])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_OPEN, open ? '1' : '0')
  }, [mounted, open])

  useEffect(() => {
    if (!mounted || !track) return
    const audio = audioRef.current
    if (!audio) return

    const shouldPlay = playAfterLoadRef.current
    playAfterLoadRef.current = false

    setLoading(true)
    setCurrentTime(0)
    setDuration(0)
    audio.src = track.src
    audio.volume = volume
    audio.loop = loop

    const onCanPlay = () => {
      setLoading(false)
      setDuration(audio.duration || 0)
      if (shouldPlay) {
        audio.play().catch(() => setPlaying(false))
      }
      audio.removeEventListener('canplay', onCanPlay)
    }

    audio.addEventListener('canplay', onCanPlay)
    audio.load()

    return () => audio.removeEventListener('canplay', onCanPlay)
  }, [mounted, trackId, track])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !track) return

    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }

    try {
      await audio.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  const selectTrack = (id) => {
    if (id === trackId || !getMusicTrack(id)) return
    playAfterLoadRef.current = playing
    if (audioRef.current) audioRef.current.pause()
    setPlaying(false)
    setTrackId(id)
  }

  const onSeek = (value) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) return
    audio.currentTime = value
    setCurrentTime(value)
  }

  if (!mounted || !track || MUSIC_LIBRARY.length === 0) return null

  const muted = volume === 0
  const fabPlaying = playing && !open

  return (
    <div
      className={`site-music-player ${isMobile ? 'site-music-player--mobile' : ''} ${open ? 'site-music-player--open' : ''}`}
      aria-live="polite"
    >
      {open && (
        <div id={panelId} className="site-music-panel hud-glass">
          <div className="site-music-panel__head">
            <div className="min-w-0">
              <p className="site-music-panel__label">站内曲库</p>
              <p className="site-music-panel__title">{track.title}</p>
              <p className="site-music-panel__artist">{track.artist}</p>
            </div>
            <button
              type="button"
              className="site-music-icon-btn"
              aria-label="收起音乐面板"
              onClick={() => setOpen(false)}
            >
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="site-music-panel__seek-wrap">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={e => onSeek(Number(e.target.value))}
              className="site-music-seek"
              aria-label="播放进度"
              disabled={!duration}
            />
            <div className="site-music-panel__time">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="site-music-panel__controls">
            <button
              type="button"
              className="site-music-play-btn"
              aria-label={playing ? '暂停' : '播放'}
              onClick={() => togglePlay()}
              disabled={loading}
            >
              {playing ? <Pause size={16} /> : <Play size={16} className="site-music-play-icon" />}
            </button>

            <button
              type="button"
              className={`site-music-icon-btn ${loop ? 'is-active' : ''}`}
              aria-label={loop ? '循环播放已开启' : '循环播放已关闭'}
              aria-pressed={loop}
              onClick={() => setLoop(v => !v)}
            >
              <Repeat size={14} />
            </button>

            <div className="site-music-panel__volume">
              <button
                type="button"
                className="site-music-icon-btn"
                aria-label={muted ? '取消静音' : '静音'}
                onClick={() => setVolume(v => (v === 0 ? 0.45 : 0))}
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="site-music-volume"
                aria-label="音量"
              />
            </div>
          </div>

          <div className="site-music-panel__list">
            <p className="site-music-panel__list-label">
              <ListMusic size={12} /> 自选曲目
            </p>
            <ul className="site-music-panel__tracks">
              {MUSIC_LIBRARY.map(item => {
                const active = item.id === trackId
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectTrack(item.id)}
                      className={`site-music-track ${active ? 'is-active' : ''}`}
                      aria-current={active ? 'true' : undefined}
                    >
                      <span className="site-music-track__title">{item.title}</span>
                      <span className="site-music-track__meta">
                        {item.mood ? `${item.mood} · ` : ''}{item.artist}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`site-music-fab ${fabPlaying ? 'site-music-fab--playing' : ''} ${open ? 'site-music-fab--open' : ''}`}
        aria-label={open ? '收起音乐播放器' : '打开音乐播放器'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(v => !v)}
      >
        {open ? (
          <ChevronUp size={20} className="text-theme-primary" aria-hidden />
        ) : (
          <img
            src="/music/music-icon.png"
            alt=""
            width={48}
            height={48}
            className={`site-music-fab-icon ${fabPlaying ? 'site-music-fab-icon--playing' : ''}`}
            draggable={false}
          />
        )}
      </button>

      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration || 0)}
        onEnded={() => {
          if (!loop) setPlaying(false)
        }}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
    </div>
  )
}
