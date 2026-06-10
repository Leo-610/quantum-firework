import { useEffect, useState } from 'react'

/** 匹配 CSS 媒体查询，默认断点与 Tailwind sm 对齐 */
export function useMediaQuery(query = '(max-width: 640px)') {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 640px)')
}
