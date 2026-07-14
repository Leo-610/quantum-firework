import bjtu from './bjtu.js'
import pku from './pku.js'

const REGISTRY = { bjtu, pku }

const raw = import.meta.env.VITE_CAMPUS || 'bjtu'
export const CAMPUS_ID = REGISTRY[raw] ? raw : 'bjtu'
export const campus = REGISTRY[CAMPUS_ID]

export const CAMPUS_LANDMARKS = campus.landmarks
export const CAMPUS_MAP = campus.map
export const CAMPUS_INNER_LOCATIONS = campus.innerLocations
export const CAMPUS_CANTEENS = campus.canteens
export const CAMPUS_EMOTION_LOCATION_MAP = campus.emotionLocationMap

/** @deprecated 使用 CAMPUS_LANDMARKS */
export const BJTU_LANDMARKS = CAMPUS_LANDMARKS

export function getLandmarkById(id) {
  return campus.landmarks.find(lm => lm.id === id)
}

export function getLiveCoords(locationId) {
  const loc = campus.innerLocations.find(item => item.id === locationId)
  if (!loc) return null
  if (loc.gardenAlias) {
    const alias = getLandmarkById(loc.gardenAlias)
    if (alias) return { lng: alias.lng, lat: alias.lat }
  }
  const found = getLandmarkById(locationId)
  if (found) return { lng: found.lng, lat: found.lat }
  return null
}

export function getCounselingCenter() {
  return campus.landmarks.find(lm => lm.type === 'counseling')
}
