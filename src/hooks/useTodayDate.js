import { useEffect, useState } from 'react'
import { timelineDate } from '../utils/timelineLayout'

export function useTodayDate() {
  const [today, setToday] = useState(() => timelineDate(new Date()))
  useEffect(() => {
    let timer
    const refresh = () => {
      window.clearTimeout(timer)
      const now = new Date()
      setToday(timelineDate(now))
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = window.setTimeout(refresh, midnight - now + 100)
    }
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return today
}
