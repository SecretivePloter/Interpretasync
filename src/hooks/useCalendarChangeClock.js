import { useEffect, useState } from 'react'
import { nextCalendarChangeBoundary } from '../utils/calendarChanges'

// Satu timer untuk seluruh grid/panel, bukan satu interval per chip.
export function useCalendarChangeClock(events) {
  const [tick, setTick] = useState(Date.now)
  const now = Math.max(tick, Date.now())
  useEffect(() => {
    const refresh = () => setTick(Date.now())
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  useEffect(() => {
    const current = Date.now()
    const next = nextCalendarChangeBoundary(events, current)
    if (next === null) return undefined
    const timer = window.setTimeout(() => setTick(Date.now()), Math.min(2_147_483_647, Math.max(1, next - current + 10)))
    return () => window.clearTimeout(timer)
  }, [events, tick])
  return now
}
