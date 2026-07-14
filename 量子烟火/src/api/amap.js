// ═══════════════════════════════════
// 高德地图 API 封装 v2 - 校园地标定位
// ═══════════════════════════════════

import { CAMPUS_LANDMARKS, CAMPUS_MAP } from '../config/campus/index.js'

export { CAMPUS_LANDMARKS, CAMPUS_LANDMARKS as BJTU_LANDMARKS } from '../config/campus/index.js'

/**
 * 使用 searchNearBy 在校园 800m 范围内精确定位
 * 每个地标支持多个候选关键词，依次 fallback
 */
/** 使用硬编码坐标，移除 POI 搜索 */

/**
 * 模块级 Buildings 缓存 — SPA 生命周期内只创建两个实例，切换时做 add/remove
 * key: 'outer' | 'inner', value: AMap.Buildings 实例
 */
const _buildingsCache = {}

/** 初始化高德地图 */
export function initAMap(containerId) {
  return new Promise((resolve, reject) => {
    if (typeof AMap === 'undefined') {
      reject(new Error('高德地图 API 未加载'))
      return
    }

    const map = new AMap.Map(containerId, {
      viewMode: '3D',
      pitch: CAMPUS_MAP.pitch,
      rotation: CAMPUS_MAP.rotation,
      zoom: CAMPUS_MAP.zoom,
      center: CAMPUS_MAP.center,
      mapStyle: 'amap://styles/dark',
      showLabel: true,
      labelzIndex: 130,
      features: ['bg', 'road', 'building', 'point'],
    })

    // 预创建两个世界的 Buildings 实例，后续切换只做 add/remove
    _buildingsCache['outer'] = createBuildings('outer')
    _buildingsCache['inner'] = createBuildings('inner')
    map.add(_buildingsCache['outer'])

    map.on('complete', () => resolve({ map, buildings: _buildingsCache['outer'] }))
    map.on('error', (e) => reject(e))
  })
}

/** 外/内世界对应的建筑色调与地图底图
 *  wallColor/roofColor 格式：[r, g, b, a]，r/g/b 为 0-255 整数，a 为 0-1
 *  （参考高德官方示例：wallColor: [255, 0, 0, 1]）
 */
export const WORLD_STYLES = {
  outer: {
    mapStyle: 'amap://styles/dark',
    // 暖琥珀橙 — 与外世界 #ff6b35 主色呼应，rgba 字符串格式无歧义
    wallColor: 'rgba(160, 65, 8, 0.92)',
    roofColor: 'rgba(210, 90, 12, 0.95)',
  },
  inner: {
    mapStyle: 'amap://styles/darkblue',
    // 冷青蓝 — 与内世界 #0ff0fc 主色呼应
    wallColor: 'rgba(8, 65, 170, 0.92)',
    roofColor: 'rgba(10, 90, 220, 0.95)',
  },
}

/** 创建 Buildings 图层（统一入口，保证参数格式正确） */
export function createBuildings(world) {
  const style = WORLD_STYLES[world] ?? WORLD_STYLES.outer
  const buildings = new AMap.Buildings({
    zooms: [15, 22],
    zIndex: 10,
    merge: false,
    sort: true,
    wallColor: style.wallColor,
    roofColor: style.roofColor,
  })
  return buildings
}

/**
 * 根据当前世界切换地图底图 + 建筑配色
 * setStyle 在底图切换后会失效，所以销毁旧图层、重建新图层
 * @param {AMap.Map} map
 * @param {AMap.Buildings} oldBuildings
 * @param {'outer'|'inner'} world
 * @returns {AMap.Buildings} 新的 Buildings 实例
 */
export function setWorldStyle(map, oldBuildings, world) {
  const style = WORLD_STYLES[world] ?? WORLD_STYLES.outer
  map.setMapStyle(style.mapStyle)

  // 移除旧图层（不销毁，留在缓存备用）
  if (oldBuildings) {
    map.remove(oldBuildings)
  }

  // 从缓存取出对应世界的 Buildings，不存在才新建
  const buildings = _buildingsCache[world] ?? createBuildings(world)
  _buildingsCache[world] = buildings
  map.add(buildings)
  return buildings
}

/** 添加地标标记（POI 坐标更新后调用） */
export function addLandmarkMarkers(map, landmarks, onMarkerClick) {
  const markers = []

  for (const lm of landmarks) {
    const isCanteen = lm.type === 'canteen'
    const isOutdoor = lm.type === 'outdoor'
    const isHeritage = lm.type === 'heritage'
    const isCounseling = lm.type === 'counseling'

    const color = isCounseling ? '#6ee7b7'
      : isHeritage ? '#f7d27d'
      : (isCanteen ? '#ff6b35' : '#0ff0fc')
    const colorDim = isCounseling ? '#34d399'
      : isHeritage ? '#ffb84a'
      : (isCanteen ? '#f5a623' : '#7b2fff')
    const size = isCounseling ? 38 : (isHeritage ? 36 : (isCanteen ? 40 : 32))

    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="${color}18" stroke="${color}" stroke-width="1.2"/>
        <circle cx="20" cy="20" r="10" fill="${color}30" stroke="${colorDim}" stroke-width="0.8"/>
        <circle cx="20" cy="20" r="5"  fill="${color}" opacity="0.95"/>
        ${isCanteen ? `<circle cx="20" cy="20" r="14" fill="none" stroke="${color}" stroke-width="0.5" stroke-dasharray="3 2" opacity="0.5"/>` : ''}
        ${isHeritage ? `<circle cx="20" cy="20" r="15" fill="none" stroke="${color}" stroke-width="0.6" stroke-dasharray="2 3" opacity="0.6"/>` : ''}
        ${isCounseling ? `<path d="M20 14c-3 0-5.5 2.2-5.5 5 0 4 5.5 9 5.5 9s5.5-5 5.5-9c0-2.8-2.5-5-5.5-5z" fill="${color}" opacity="0.85"/>` : ''}
      </svg>
    `

    const icon = new AMap.Icon({
      size: new AMap.Size(size, size),
      image: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent))),
      imageOffset: new AMap.Pixel(0, 0),
    })

    const marker = new AMap.Marker({
      position: [lm.lng, lm.lat],
      icon,
      offset: new AMap.Pixel(-size / 2, -size / 2),
      zIndex: isCounseling ? 175 : (isHeritage ? 170 : (isCanteen ? 160 : 130)),
      extData: lm,
      title: lm.name,
    })

    // 标签
    const label = new AMap.Text({
      text: lm.name,
      position: [lm.lng, lm.lat],
      offset: new AMap.Pixel(0, -(size / 2 + 4)),
      style: {
        'background-color': 'transparent',
        'border': 'none',
        'color': isCounseling ? '#6ee7b7' : (isHeritage ? '#f7d27d' : (isCanteen ? '#ff6b35' : '#0ff0fc')),
        'font-size': '11px',
        'font-family': 'JetBrains Mono, monospace',
        'text-shadow': `0 0 6px ${isCounseling ? '#6ee7b7' : (isHeritage ? '#f7d27d' : (isCanteen ? '#ff6b35' : '#0ff0fc'))}`,
        'white-space': 'nowrap',
      },
      zIndex: isCounseling ? 176 : (isHeritage ? 171 : (isCanteen ? 161 : 131)),
    })

    marker.on('click', () => onMarkerClick?.(lm))
    map.add(marker)
    map.add(label)
    markers.push({ marker, label, data: lm })
  }

  return markers
}

/**
 * 开启坐标拾取模式（开发/校准用）
 * 点击地图在控制台打印经纬度，并在地图上显示浮窗
 */
export function enableCoordPicker(map) {
  let infoWindow = null

  const handler = (e) => {
    const { lng, lat } = e.lnglat
    const coordText = `lng: ${lng.toFixed(6)}, lat: ${lat.toFixed(6)}`
    console.log(`📍 坐标拾取: [${lng.toFixed(6)}, ${lat.toFixed(6)}]`)

    if (infoWindow) infoWindow.close()

    infoWindow = new AMap.InfoWindow({
      content: `
        <div style="
          background: rgba(5,10,24,0.95);
          border: 1px solid #0ff0fc40;
          color: #0ff0fc;
          padding: 8px 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          border-radius: 6px;
          white-space: nowrap;
        ">
          📍 ${coordText}
        </div>
      `,
      offset: new AMap.Pixel(0, -10),
    })
    infoWindow.open(map, e.lnglat)
  }

  map.on('click', handler)
  console.log('🗺️ 坐标拾取模式已开启，点击地图获取精确坐标')
  return () => map.off('click', handler)
}

/** 在指定坐标添加情绪光柱 */
export function addEmotionPillar(map, { lng, lat, color = '#0ff0fc' }) {
  const elements = []

  ;[80, 50, 25].forEach((radius, i) => {
    const ring = new AMap.CircleMarker({
      center: [lng, lat],
      radius: radius - i * 4,
      strokeColor: color,
      strokeWeight: 1 - i * 0.2,
      strokeOpacity: 0.5 - i * 0.1,
      fillColor: color,
      fillOpacity: 0.03 + i * 0.02,
      zIndex: 20 + i,
    })
    map.add(ring)
    elements.push(ring)
  })

  const center = new AMap.CircleMarker({
    center: [lng, lat],
    radius: 8,
    strokeColor: color,
    strokeWeight: 2,
    strokeOpacity: 1,
    fillColor: color,
    fillOpacity: 0.85,
    zIndex: 25,
  })
  map.add(center)
  elements.push(center)

  return elements
}

/** 添加情绪热力图图层 */
export function addHeatmapLayer(map, data) {
  const heatmap = new AMap.HeatMap(map, {
    radius: 60,
    opacity: [0, 0.8],
    gradient: {
      0.25: '#0ff0fc',
      0.55: '#7b2fff',
      0.85: '#ff2d78',
      1.0: '#ffffff',
    },
  })
  heatmap.setDataSet({
    data: data.map(d => ({ lng: d.lng, lat: d.lat, count: d.count })),
    max: 10,
  })
  return heatmap
}

/** 平滑飞行到指定坐标 */
export function flyTo(map, { lng, lat, zoom = 18, pitch = 62 }) {
  map.setZoomAndCenter(zoom, [lng, lat], false, 800)
  map.setPitch(pitch, false, 600)
}

/** 实况天气 → 地图视角微调（pitch，避免大改 mapStyle 与双世界冲突） */
export const WEATHER_MAP_TWEAK = {
  clear: { pitchDelta: 1 },
  cloudy: { pitchDelta: 0 },
  overcast: { pitchDelta: 0 },
  rain: { pitchDelta: -2 },
  snow: { pitchDelta: -1 },
  fog: { pitchDelta: -3 },
}

export function applyWeatherToMap(map, theme = 'clear', { isMobile = false } = {}) {
  if (!map) return
  const tweak = WEATHER_MAP_TWEAK[theme] ?? WEATHER_MAP_TWEAK.clear
  const basePitch = isMobile ? 42 : 55
  const pitch = Math.max(28, Math.min(62, basePitch + tweak.pitchDelta))
  map.setPitch(pitch, false, 450)
}
