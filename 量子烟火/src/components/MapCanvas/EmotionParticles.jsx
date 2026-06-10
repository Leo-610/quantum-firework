import React, { useEffect, useRef, useMemo } from 'react'
import { useEmotionStore } from '../../store/emotionStore'
import { useWorldStore } from '../../store/worldStore'

/** 情绪粒子飘散动画 */
export default function EmotionParticles() {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const particlesRef = useRef([])
  const world = useWorldStore(s => s.world)
  const latestPlant = useEmotionStore(s => s.latestPlant)

  // 粒子颜色根据世界类型
  const colors = useMemo(() => ({
    inner: ['#0ff0fc', '#7b2fff', '#00ff88', '#ff6b9d'],
    outer: ['#ff6b35', '#ffa500', '#ffcc00', '#ff4444'],
  }), [])

  // 当有新的植物生成时，添加粒子
  useEffect(() => {
    if (!latestPlant) return
    
    const plantColor = latestPlant.plant_color || '#0ff0fc'
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    // 在画布中心添加一群粒子
    const centerX = rect.width / 2
    const centerY = rect.height * 0.6
    
    for (let i = 0; i < 30; i++) {
      particlesRef.current.push({
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        size: Math.random() * 4 + 2,
        color: plantColor,
        alpha: 1,
        life: 1,
        decay: 0.005 + Math.random() * 0.01,
      })
    }
  }, [latestPlant])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // 持续生成背景粒子
    let particleTimer
    if (world === 'inner') {
      particleTimer = setInterval(() => {
        if (particlesRef.current.length < 50) {
          particlesRef.current.push({
            x: Math.random() * canvas.width,
            y: canvas.height + 10,
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 1.5 - 0.5,
            size: Math.random() * 2 + 1,
            color: colors.inner[Math.floor(Math.random() * colors.inner.length)],
            alpha: 0.6,
            life: 1,
            decay: 0.003,
          })
        }
      }, 200)
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particlesRef.current = particlesRef.current.filter(p => {
        // 更新位置
        p.x += p.vx
        p.y += p.vy
        p.life -= p.decay
        p.alpha = p.life * 0.8
        
        // 绘制粒子
        if (p.alpha <= 0) return false
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fill()
        
        // 发光效果
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
        gradient.addColorStop(0, p.color + '40')
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.fill()
        
        return true
      })
      
      ctx.globalAlpha = 1
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', resize)
      if (particleTimer) clearInterval(particleTimer)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [world, colors])

  if (world !== 'inner') return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-20"
      style={{ opacity: 0.8 }}
    />
  )
}
