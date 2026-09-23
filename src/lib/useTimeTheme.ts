'use client'

import { useEffect, useState } from 'react'
import { getCurrentTheme, type Theme } from './utils'

export function useTimeTheme() {
  const [theme, setTheme] = useState<Theme | null>(null)
  useEffect(() => {
    const refresh = () => {
      const next = getCurrentTheme()
      setTheme(current => current?.id === next.id ? current : next)
    }
    refresh()
    const timer = window.setInterval(refresh, 30000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return theme
}
