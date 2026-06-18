import { useEffect, useRef, useCallback } from 'react'
import {
  BJTU_LANDMARKS,
  initAMap,
  addLandmarkMarkers,
  addEmotionPillar,
  addHeatmapLayer,
  flyTo,
  enableCoordPicker,
  setWorldStyle,
  applyWeatherToMap,
  WORLD_STYLES,
} from '../api/amap'
import { useWorldStore } from '../store/worldStore'
import { useEmotionStore } from '../store/emotionStore'
import { useWeatherStore } from '../store/weatherStore'
import { useIsMobile } from './useMediaQuery'

/** 地图初始化与地标管理 Hook */
export function useMap(containerId) {
  const mapRef = useRef(null)
  const buildingsRef = useRef(null)
  const markersRef = useRef([])
  const heatmapRef = useRef(null)
  const pillarsRef = useRef([])
  const coordPickerOffRef = useRef(null)

  const setMapInstance = useWorldStore(s => s.setMapInstance)
  const setSelectedLandmark = useWorldStore(s => s.setSelectedLandmark)
  const world = useWorldStore(s => s.world)
  const heatmapData = useEmotionStore(s => s.heatmapData)
  const weatherTheme = useWeatherStore(s => s.theme)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (mapRef.current) return

    initAMap(containerId)
      .then(({ map, buildings }) => {
        mapRef.current = map
        buildingsRef.current = buildings
        setMapInstance(map)

        // 使用硬编码坐标添加标记
        const addMarkers = (landmarks) => {
          // 清除旧标记
          markersRef.current.forEach(({ marker, label }) => {
            map.remove(marker)
            map.remove(label)
          })
          markersRef.current = addLandmarkMarkers(map, landmarks, (landmark) => {
            setSelectedLandmark(landmark)
            flyTo(map, { lng: landmark.lng, lat: landmark.lat })
          })
        }

        // 直接使用硬编码坐标渲染
        addMarkers(BJTU_LANDMARKS)
        console.log('✅ 使用硬编码地标坐标')

        // 开发模式：挂载坐标拾取工具到 window
        window.__qf_enableCoordPicker = () => {
          if (coordPickerOffRef.current) {
            coordPickerOffRef.current()
            coordPickerOffRef.current = null
            console.log('🗺️ 坐标拾取模式已关闭')
          } else {
            coordPickerOffRef.current = enableCoordPicker(map)
          }
        }
        console.log('💡 提示：在控制台输入 window.__qf_enableCoordPicker() 开启坐标拾取工具')
      })
      .catch(err => {
        console.warn('地图初始化失败（Key 未配置或网络问题）:', err.message)
      })

    return () => {
      coordPickerOffRef.current?.()
      mapRef.current?.destroy()
      mapRef.current = null
      buildingsRef.current = null
    }
  }, [containerId])

  // 世界切换 → 销毁旧 Buildings、重建新的，更新 buildingsRef
  useEffect(() => {
    if (!mapRef.current || !buildingsRef.current) return
    buildingsRef.current = setWorldStyle(mapRef.current, buildingsRef.current, world)
  }, [world])

  // 实况天气 → 地图 pitch 微调（移动端跳过）
  useEffect(() => {
    if (!mapRef.current || isMobile) return
    applyWeatherToMap(mapRef.current, weatherTheme, { isMobile })
  }, [weatherTheme, isMobile])

  // 热力图数据更新
  useEffect(() => {
    if (!mapRef.current || heatmapData.length === 0) return
    if (heatmapRef.current) {
      heatmapRef.current.setDataSet({ data: heatmapData, max: 10 })
    } else {
      heatmapRef.current = addHeatmapLayer(mapRef.current, heatmapData)
    }
  }, [heatmapData])

  // 种植情绪植物光柱
  const plantEmotion = useCallback(({ lng, lat, color }) => {
    if (!mapRef.current) return
    const elements = addEmotionPillar(mapRef.current, { lng, lat, color })
    pillarsRef.current.push(...elements)
    flyTo(mapRef.current, { lng, lat, zoom: 18.5, pitch: 65 })
  }, [])

  return { mapRef, buildingsRef, plantEmotion }
}
