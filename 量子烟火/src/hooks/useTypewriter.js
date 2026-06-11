import { useEffect, useState } from 'react'

/**
 * 打字机效果：文本变更时逐字显示
 * @param {string} text
 * @param {{ speed?: number, delay?: number, enabled?: boolean }} options
 */
export function useTypewriter(text, { speed = 32, delay = 0, enabled = true } = {}) {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    if (!enabled) {
      setDisplay(text)
      return undefined
    }

    setDisplay('')
    let index = 0
    let intervalId = null

    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        index += 1
        setDisplay(text.slice(0, index))
        if (index >= text.length) {
          clearInterval(intervalId)
        }
      }, speed)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [text, speed, delay, enabled])

  return display
}
