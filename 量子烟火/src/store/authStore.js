import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  fetchProfile,
  updateProfile,
  migrateLocalPlants,
} from '../api/userData'
import { useEmotionStore } from './emotionStore'
import { useWorldStore } from './worldStore'

/** Auth + 个人资料（Supabase） */
export const useAuthStore = create((set, get) => ({
  ready: !isSupabaseConfigured,
  configured: isSupabaseConfigured,
  session: null,
  user: null,
  profile: null,
  authOpen: false,
  authMode: 'login', // login | register | profile
  busy: false,
  error: null,

  setAuthOpen: (open, mode) => set({
    authOpen: open,
    ...(mode ? { authMode: mode } : {}),
    error: null,
  }),

  setAuthMode: (mode) => set({ authMode: mode, error: null }),

  init: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ ready: true, configured: false })
      return () => {}
    }

    const { data: { session } } = await supabase.auth.getSession()
    await get()._applySession(session)
    set({ ready: true, configured: true })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      await get()._applySession(nextSession)
    })
    return () => subscription.unsubscribe()
  },

  _applySession: async (session) => {
    const user = session?.user || null
    set({ session, user, error: null })

    if (user) {
      useWorldStore.getState().setUserId(user.id)
      try {
        const profile = await fetchProfile(user.id)
        set({ profile })
        const localPlants = useEmotionStore.getState().plants
        const merged = await migrateLocalPlants(user.id, localPlants)
        useEmotionStore.getState().replacePlants(merged)
      } catch (err) {
        console.warn('[auth] profile/plants sync', err.message)
      }
    } else {
      set({ profile: null })
    }
  },

  signUp: async ({ email, password, displayName }) => {
    if (!supabase) return { error: '未配置 Supabase' }
    set({ busy: true, error: null })
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName?.trim() || email.split('@')[0],
          campus_id: import.meta.env.VITE_CAMPUS || 'bjtu',
        },
      },
    })
    set({ busy: false })
    if (error) {
      set({ error: error.message })
      return { error: error.message }
    }
    // 邮箱确认关闭时直接有 session
    if (data.session) {
      set({ authOpen: false })
    } else {
      set({ error: null, authMode: 'login' })
    }
    return { data, needsConfirm: !data.session }
  },

  signIn: async ({ email, password }) => {
    if (!supabase) return { error: '未配置 Supabase' }
    set({ busy: true, error: null })
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    set({ busy: false })
    if (error) {
      set({ error: error.message })
      return { error: error.message }
    }
    set({ authOpen: false })
    return { ok: true }
  },

  signOut: async () => {
    if (!supabase) return
    set({ busy: true, error: null })
    await supabase.auth.signOut()
    set({ busy: false, authOpen: false, profile: null })
  },

  saveProfile: async ({ displayName }) => {
    const user = get().user
    if (!user) return { error: '未登录' }
    set({ busy: true, error: null })
    try {
      const profile = await updateProfile(user.id, {
        display_name: displayName.trim(),
      })
      set({ profile, busy: false, authOpen: false })
      return { profile }
    } catch (err) {
      set({ busy: false, error: err.message })
      return { error: err.message }
    }
  },
}))
