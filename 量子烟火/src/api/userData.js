import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { campus } from '../config/campus'

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase 未配置：请设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY')
  }
  return supabase
}

export async function fetchProfile(userId) {
  const client = requireClient()
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(userId, patch) {
  const client = requireClient()
  const { data, error } = await client
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function fetchEmotionPlants(userId) {
  const client = requireClient()
  const { data, error } = await client
    .from('emotion_plants')
    .select('*')
    .eq('user_id', userId)
    .order('planted_at', { ascending: true })
  if (error) throw error
  return (data || []).map(rowToPlant)
}

export async function insertEmotionPlant(userId, plant) {
  const client = requireClient()
  const payload = {
    user_id: userId,
    campus_id: campus.id,
    lat: plant.lat,
    lng: plant.lng,
    plant_type: plant.plantType || plant.plant_type || null,
    color: plant.color || null,
    glow: plant.glow || null,
    echo_text: plant.echoText || plant.echo_text || null,
    location_name: plant.locationName || plant.location_name || null,
    local_id: plant.localId != null ? String(plant.localId) : (plant.id != null ? String(plant.id) : null),
    planted_at: plant.timestamp || plant.planted_at || new Date().toISOString(),
  }
  const { data, error } = await client
    .from('emotion_plants')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw error
  return rowToPlant(data)
}

/** 登录后把本地植物上传到云端（按 local_id 去重） */
export async function migrateLocalPlants(userId, localPlants = []) {
  if (!localPlants.length) return fetchEmotionPlants(userId)
  const remote = await fetchEmotionPlants(userId)
  const remoteLocalIds = new Set(remote.map(p => p.localId).filter(Boolean))
  const toUpload = localPlants.filter(p => {
    const lid = p.localId != null ? String(p.localId) : (p.id != null ? String(p.id) : null)
    return lid && !remoteLocalIds.has(lid)
  })
  for (const plant of toUpload) {
    try {
      await insertEmotionPlant(userId, plant)
    } catch (err) {
      console.warn('[plants] migrate skip', err.message)
    }
  }
  return fetchEmotionPlants(userId)
}

export async function insertFoodLog(userId, log) {
  const client = requireClient()
  const payload = {
    user_id: userId,
    campus_id: campus.id,
    dish_name: log.dishName || null,
    review_text: log.reviewText || null,
    style_id: log.styleId || null,
    rewritten_text: log.rewrittenText || null,
    radar_data: log.radarData || null,
    canteen_id: log.canteenId || null,
  }
  const { data, error } = await client
    .from('food_logs')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function fetchFoodLogs(userId, { limit = 20 } = {}) {
  const client = requireClient()
  const { data, error } = await client
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

function rowToPlant(row) {
  return {
    id: row.id,
    localId: row.local_id,
    lat: row.lat,
    lng: row.lng,
    plantType: row.plant_type,
    color: row.color,
    glow: row.glow,
    echoText: row.echo_text,
    locationName: row.location_name,
    timestamp: row.planted_at || row.created_at,
    campusId: row.campus_id,
  }
}
