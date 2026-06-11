import { useEffect, useState } from 'react'

const PHASES = [
  { progress: 10, label: '量子场同步中…' },
  { progress: 28, label: '加载北交大 3D 校园地图…' },
  { progress: 52, label: '唤醒 Coze 里表世界智能体…' },
  { progress: 74, label: '校准思源楼 · 图书馆 · 心理中心坐标…' },
  { progress: 92, label: '点燃量子烟火，即将进入…' },
  { progress: 100, label: '点火就绪 · 欢迎进入' },
]

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function waitForAMap(timeout = 12000) {
  if (typeof window !== 'undefined' && window.AMap) {
    return Promise.resolve(true)
  }
  return new Promise((resolve) => {
    const start = Date.now()
    const tick = () => {
      if (window.AMap) {
        resolve(true)
        return
      }
      if (Date.now() - start >= timeout) {
        resolve(false)
        return
      }
      requestAnimationFrame(tick)
    }
    tick()
  })
}

/** 应用启动引导：等待 AMap + 最短展示时长，供启动屏使用 */
export function useAppBoot() {
  const [complete, setComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(PHASES[0].label)

  useEffect(() => {
    let cancelled = false
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    async function boot() {
      const minDuration = reduced ? 500 : 3200
      const started = Date.now()

      const step = (index) => {
        if (cancelled) return
        const p = PHASES[index]
        setProgress(p.progress)
        setPhase(p.label)
      }

      step(0)
      await sleep(reduced ? 80 : 520)

      step(1)
      await waitForAMap(reduced ? 2000 : 8000)

      step(2)
      await sleep(reduced ? 80 : 680)

      if (document.fonts?.ready) {
        try {
          await Promise.race([document.fonts.ready, sleep(1500)])
        } catch {
          /* ignore */
        }
      }

      step(3)
      await sleep(reduced ? 80 : 720)

      const elapsed = Date.now() - started
      if (elapsed < minDuration) {
        await sleep(minDuration - elapsed)
      }

      step(4)
      await sleep(reduced ? 120 : 480)

      if (!cancelled) {
        document.getElementById('qf-inline-splash')?.remove()
        setComplete(true)
      }
    }

    boot()
    return () => { cancelled = true }
  }, [])

  return { complete, progress, phase }
}
