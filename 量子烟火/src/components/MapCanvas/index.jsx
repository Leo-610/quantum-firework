import React, { useEffect, useRef, useState } from 'react'
import { useMap } from '../../hooks/useMapMarker'
import { useWorldStore } from '../../store/worldStore'
import { useEmotionStore } from '../../store/emotionStore'
import { campus, CAMPUS_LANDMARKS } from '../../config/campus'
import EmotionParticles from './EmotionParticles'
import BJTULights from './BJTULights'


/** 高德 3D 地图容器 */
export default function MapCanvas() {
  const containerRef = useRef(null)
  const world = useWorldStore(s => s.world)
  const { mapRef, buildingsRef, plantEmotion } = useMap('amap-container')
  const [mapReady, setMapReady] = useState(false)

  // 将 plantEmotion 挂载到 window 供其他组件调用
  useEffect(() => {
    window.__qf_plantEmotion = plantEmotion
  }, [plantEmotion])

  // 检测地图是否加载完成
  useEffect(() => {
    const checkMap = setInterval(() => {
      if (mapRef.current) {
        setMapReady(true)
        clearInterval(checkMap)
      }
    }, 100)
    return () => clearInterval(checkMap)
  }, [mapRef])

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      {/* 地图容器 */}
      <div
        id="amap-container"
        ref={containerRef}
        className="w-full h-full"
        style={{ background: world === 'inner' ? '#050a18' : '#100500' }}
      />

      {/* BJTU 点阵灯光效果 */}
      {mapReady && (
        <BJTULights mapContainer={containerRef.current} mapCanvasText={campus.mapCanvasText} />
      )}

      {/* 地图加载占位（AMap 未配置时显示） */}
      <MapFallback world={world} />

      {/* 领域能量圈 */}
      <div
        key={world}
        className="domain-ring"
        style={{
          '--domain-color': world === 'inner' ? 'rgba(15,240,252,0.45)' : 'rgba(255,107,53,0.45)',
          '--domain-glow': world === 'inner' ? 'rgba(15,240,252,0.25)' : 'rgba(255,107,53,0.25)',
        }}
      />

      {/* 世界色调叠加层 */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: world === 'inner'
            ? 'linear-gradient(to top, rgba(5,10,24,0.4) 0%, transparent 60%)'
            : 'linear-gradient(to top, rgba(16,5,0,0.5) 0%, transparent 60%)',
        }}
      />

      {/* 扫描线 */}
      {world === 'inner' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(15,240,252,0.015) 2px, rgba(15,240,252,0.015) 4px)',
          }}
        />
      )}

      {/* 情绪粒子飘散效果 */}
      <EmotionParticles />
    </div>
  )
}

/** AMap Key 未配置时的占位背景 */
function MapFallback({ world }) {
  const hasAMap = typeof AMap !== 'undefined'
  if (hasAMap) return null

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{
        background: world === 'inner'
          ? 'radial-gradient(ellipse at center, #0a1628 0%, #050a18 100%)'
          : 'radial-gradient(ellipse at center, #1a0800 0%, #100500 100%)',
      }}
    >
      {/* 模拟网格 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: world === 'inner'
            ? `linear-gradient(rgba(15,240,252,0.04) 1px, transparent 1px),
               linear-gradient(90deg, rgba(15,240,252,0.04) 1px, transparent 1px)`
            : `linear-gradient(rgba(255,107,53,0.04) 1px, transparent 1px),
               linear-gradient(90deg, rgba(255,107,53,0.04) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          perspective: '800px',
          transform: 'rotateX(30deg)',
          transformOrigin: 'center 70%',
        }}
      />

      {/* 模拟建筑物 */}
      <MockBuildings world={world} />

      <div className="relative z-10 text-center">
        <p className={`text-xs font-mono opacity-30 ${world === 'inner' ? 'text-cyan-400' : 'text-orange-400'}`}>
          配置高德地图 Key 以显示{campus.shortName} 3D 地图
        </p>
      </div>
    </div>
  )
}

/** 模拟建筑物（地图未加载时）- 带夜间灯光效果 */
function MockBuildings({ world }) {
  const color = world === 'inner' ? '#0ff0fc' : '#ff6b35'
  const glowColor = world === 'inner' ? 'rgba(15,240,252,' : 'rgba(255,107,53,'
  
  const landmarkLabels = CAMPUS_LANDMARKS
    .filter(lm => ['academic', 'canteen', 'dorm', 'outdoor'].includes(lm.type))
    .slice(0, 5)

  const buildings = landmarkLabels.map((lm, i) => ({
    x: `${18 + i * 14}%`,
    h: `${80 + (i % 3) * 30}px`,
    w: `${50 + (i % 2) * 20}px`,
    label: lm.name,
    lights: 4 + (i % 4),
  }))

  return (
    <div className="absolute bottom-[30%] left-0 right-0 flex items-end justify-around px-16 gap-3">
      {buildings.map((b, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-mono opacity-40" style={{ color }}>
            {b.label}
          </span>
          <div
            className="relative building-with-lights"
            style={{
              width: b.w,
              height: b.h,
              '--building-color': color,
              '--glow-color': glowColor,
            }}
          >
            {/* 建筑主体 */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${color}25, ${color}08)`,
                border: `1px solid ${color}30`,
                borderBottom: 'none',
                boxShadow: `0 0 20px ${glowColor}0.1)`,
              }}
            />
            
            {/* 发光窗户 - 闪烁动画 */}
            <div className="absolute inset-1 overflow-hidden">
              {Array.from({ length: b.lights }).map((_, li) => (
                <div
                  key={li}
                  className="absolute w-[8px] h-[10px] rounded-sm window-glow"
                  style={{
                    left: `${10 + (li % 3) * 14}px`,
                    top: `${8 + Math.floor(li / 3) * 18}px`,
                    animationDelay: `${li * 0.3}s`,
                    '--glow-opacity': 0.3 + Math.random() * 0.5,
                  }}
                />
              ))}
            </div>

            {/* 顶部发光边缘 */}
            <div
              className="absolute -top-[2px] left-0 right-0 h-[2px]"
              style={{
                background: color,
                boxShadow: `0 0 12px ${color}, 0 0 20px ${glowColor}0.5)`,
              }}
            />
            
            {/* 建筑物发光描边 */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                border: `1px solid ${color}40`,
                boxShadow: `inset 0 0 10px ${glowColor}0.1), 0 0 5px ${color}20`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
