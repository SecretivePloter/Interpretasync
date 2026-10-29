// Public, read-only calendar source for the TV display. Reuses the same
// calendar header, interpreter filters, and month grid as /kalender.
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import FilterBar from '../components/filter/FilterBar'
import MonthGrid from '../components/calendar/MonthGrid'
import Skeleton from '../components/ui/Skeleton'
import { useFilteredEvents } from '../hooks/useFilter'
import { supabase } from '../services/supabase'
import { formatMonthYear, getMonthGrid, toISODate, shiftMonth } from '../utils/dateHelpers'

export default function PublicDisplayCalendar() {
  const [current, setCurrent] = useState(() => new Date())
  const [interpreters, setInterpreters] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const queryDate = toISODate(current)
  const shownEvents = useFilteredEvents(events)
  const interpretersById = useMemo(() => Object.fromEntries(interpreters.map((i) => [i.id, i])), [interpreters])

  useEffect(() => {
    let live = true
    const days = getMonthGrid(current)
    const from = toISODate(days[0])
    const to = toISODate(days[41])
    setLoading(true)
    setError('')
    Promise.all([
      supabase.rpc('public_display_interpreters'),
      supabase.rpc('public_display_calendar', { p_from: from, p_to: to }),
    ]).then(([people, schedules]) => {
      if (!live) return
      if (people.error) throw people.error
      if (schedules.error) throw schedules.error
      setInterpreters(people.data ?? [])
      setEvents(schedules.data ?? [])
    }).catch(() => {
      if (live) setError('Kalender display tidak dapat dimuat.')
    }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [queryDate, refreshKey])

  useEffect(() => {
    const timer = window.setInterval(() => setRefreshKey((key) => key + 1), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return <main className="h-screen w-screen flex flex-col overflow-hidden bg-background text-on-background">
    <PageHeader title="Kalender" subtitle={formatMonthYear(current)}>
      <div className="flex rounded-lg overflow-hidden border border-outline-variant/30 shrink-0">
        <button onClick={() => {}} className="px-xs lg:px-md py-[5px] text-[10px] lg:text-caption transition-colors text-on-surface-variant hover:bg-on-surface/5"><span className="lg:hidden">Mgg</span><span className="hidden lg:inline">Mingguan</span></button>
        <button className="px-xs lg:px-md py-[5px] text-[10px] lg:text-caption border-l border-outline-variant/30 transition-colors bg-primary text-on-primary"><span className="lg:hidden">Bln</span><span className="hidden lg:inline">Bulanan</span></button>
      </div>
      <div className="flex items-center gap-xs lg:gap-md bg-surface-container rounded-full px-xs lg:px-sm py-xs border border-outline-variant/20">
        <button onClick={() => setCurrent((date) => shiftMonth(date, -1))} className="text-on-surface-variant p-1" aria-label="Bulan sebelumnya"><ChevronLeft size={16} /></button>
        <button onClick={() => setCurrent(new Date())} className="text-[11px] lg:text-h3 font-medium text-on-surface px-xs">Bulan Ini</button>
        <button onClick={() => setCurrent((date) => shiftMonth(date, 1))} className="text-on-surface-variant p-1" aria-label="Bulan depan"><ChevronRight size={16} /></button>
      </div>
    </PageHeader>
    <FilterBar interpreters={interpreters} />
    {loading ? <div className="flex-1 p-xl flex flex-col gap-md">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      : error ? <div className="grid flex-1 place-items-center text-on-surface-variant">{error}</div>
        : <MonthGrid currentDate={current} events={shownEvents} interpretersById={interpretersById} onDayClick={() => {}} onEventClick={() => {}} />}
  </main>
}
