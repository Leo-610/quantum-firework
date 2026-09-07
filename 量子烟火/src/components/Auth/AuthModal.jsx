import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LogIn, UserPlus, User, X, LogOut, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { campus } from '../../config/campus'

/** 注册 / 登录 / 个人资料面板 */
export default function AuthModal({ isInner = true }) {
  const authOpen = useAuthStore(s => s.authOpen)
  const authMode = useAuthStore(s => s.authMode)
  const busy = useAuthStore(s => s.busy)
  const error = useAuthStore(s => s.error)
  const configured = useAuthStore(s => s.configured)
  const user = useAuthStore(s => s.user)
  const profile = useAuthStore(s => s.profile)
  const setAuthOpen = useAuthStore(s => s.setAuthOpen)
  const setAuthMode = useAuthStore(s => s.setAuthMode)
  const signIn = useAuthStore(s => s.signIn)
  const signUp = useAuthStore(s => s.signUp)
  const signOut = useAuthStore(s => s.signOut)
  const saveProfile = useAuthStore(s => s.saveProfile)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [hint, setHint] = useState('')

  useEffect(() => {
    if (!authOpen) return
    setHint('')
    setPassword('')
    if (authMode === 'profile' && profile) {
      setDisplayName(profile.display_name || '')
    }
  }, [authOpen, authMode, profile])

  if (!authOpen) return null

  const accent = isInner ? 'cyan' : 'orange'
  const title = authMode === 'register'
    ? '创建账号'
    : authMode === 'profile'
      ? '个人资料'
      : '登录'

  const onSubmit = async (e) => {
    e.preventDefault()
    setHint('')
    if (authMode === 'profile') {
      const res = await saveProfile({ displayName })
      if (res.error) return
      setHint('已保存')
      return
    }
    if (authMode === 'register') {
      const res = await signUp({ email, password, displayName })
      if (res.error) return
      if (res.needsConfirm) {
        setHint('注册成功。若开启了邮箱确认，请查收邮件后再登录。')
        setAuthMode('login')
      }
      return
    }
    await signIn({ email, password })
  }

  const modal = (
    <AnimatePresence>
      <motion.div
        className="auth-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setAuthOpen(false)}
      >
        <motion.div
          className={`auth-modal auth-modal--${accent}`}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="auth-modal__head">
            <span className="auth-modal__title">
              {authMode === 'register' ? <UserPlus size={14} /> : authMode === 'profile' ? <User size={14} /> : <LogIn size={14} />}
              {title}
            </span>
            <button type="button" className="auth-modal__close" onClick={() => setAuthOpen(false)} aria-label="关闭">
              <X size={14} />
            </button>
          </div>

          {!configured && (
            <p className="auth-modal__hint">
              未配置 Supabase。请在环境变量中设置 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。
            </p>
          )}

          {configured && (
            <form className="auth-modal__form" onSubmit={onSubmit}>
              {authMode !== 'profile' && (
                <>
                  <label className="auth-modal__field">
                    <span>邮箱</span>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </label>
                  <label className="auth-modal__field">
                    <span>密码</span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="至少 6 位"
                    />
                  </label>
                </>
              )}

              {(authMode === 'register' || authMode === 'profile') && (
                <label className="auth-modal__field">
                  <span>昵称</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="燕园行者"
                    maxLength={32}
                  />
                </label>
              )}

              {authMode === 'profile' && (
                <p className="auth-modal__meta">
                  {user?.email}
                  <br />
                  校园 · {campus.shortName}
                </p>
              )}

              {error && <p className="auth-modal__error">{error}</p>}
              {hint && <p className="auth-modal__hint">{hint}</p>}

              <button type="submit" className="auth-modal__submit" disabled={busy || !configured}>
                {busy ? <Loader2 size={14} className="auth-modal__spin" /> : null}
                {authMode === 'register' ? '注册' : authMode === 'profile' ? '保存' : '登录'}
              </button>
            </form>
          )}

          {configured && authMode !== 'profile' && (
            <div className="auth-modal__switch">
              {authMode === 'login' ? (
                <button type="button" onClick={() => setAuthMode('register')}>
                  没有账号？去注册
                </button>
              ) : (
                <button type="button" onClick={() => setAuthMode('login')}>
                  已有账号？去登录
                </button>
              )}
            </div>
          )}

          {configured && authMode === 'profile' && (
            <button type="button" className="auth-modal__logout" onClick={signOut} disabled={busy}>
              <LogOut size={13} /> 退出登录
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}

/** 顶栏账号入口 */
export function AuthButton({ isInner = true, compact = false }) {
  const ready = useAuthStore(s => s.ready)
  const user = useAuthStore(s => s.user)
  const profile = useAuthStore(s => s.profile)
  const setAuthOpen = useAuthStore(s => s.setAuthOpen)

  if (!ready) return null

  const label = user
    ? (profile?.display_name || user.email?.split('@')[0] || '账号')
    : '登录'

  return (
    <button
      type="button"
      className={`auth-entry touch-target ${compact ? 'auth-entry--compact' : ''}`}
      onClick={() => setAuthOpen(true, user ? 'profile' : 'login')}
      aria-label={user ? '打开个人资料' : '登录或注册'}
      style={{ color: isInner ? 'rgba(15,240,252,0.85)' : 'rgba(255,107,53,0.9)' }}
    >
      {user ? <User size={compact ? 14 : 13} /> : <LogIn size={compact ? 14 : 13} />}
      <span>{label}</span>
    </button>
  )
}
