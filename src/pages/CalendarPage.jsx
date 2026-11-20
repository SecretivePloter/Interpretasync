// Halaman Kalender: navigasi minggu/bulan, filter interpreter, grid + CRUD jadwal.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import TodayDutyHighlights from '../components/calendar/TodayDutyHighlights'
import CalendarGrid from '../components/calendar/CalendarGrid'
import MonthGrid from '../components/calendar/MonthGrid'
import EventModal from '../components/calendar/EventModal'
import TimelineGrid from '../components/calendar/TimelineGrid'
import TimelineDutyHighlights from '../components/calendar/TimelineDutyHighlights'
import { timelineDays } from '../utils/timelineLayout'
import { useTodayDate } from '../hooks/useTodayDate'
import Skeleton from '../components/ui/Skeleton'
import { useCalendar } from '../hooks/useCalendar'
import { useFilteredEvents } from '../hooks/useFilter'
import { useInterpreterStore } from '../app/store/useInterpreterStore'
import { useEventStore } from '../app/store/useEventStore'
import { useOrderStore } from '../app/store/useOrderStore'
import { useFilterStore } from '../app/store/useFilterStore'
import { formatWeekRange, formatMonthYear, formatDateLong, toISODate, parseISO, isAllDayEvent } from '../utils/dateHelpers'

export default function CalendarPage() {
  const location = useLocation()
  const interpreters = useInterpreterStore((s) => s.interpreters)
  const events = useEventStore((s) => s.events)
  const eventsLoading = useEventStore((s) => s.loading)
  const eventsLoaded = useEventStore((s) => s.loaded)
  const orders = useOrderStore((s) => s.orders)
  const showOnly = useFilterStore((s) => s.showOnly)

  const [view, setView] = useState(() => {
    try { const saved = localStorage.getItem('ichikara-calendar-view'); return ['week', 'month', 'timeline'].includes(saved) ? saved : 'month' }
    catch { return 'month' }
  })
  useEffect(() => { try { localStorage.setItem('ichikara-calendar-view', view) } catch { /* Storage may be disabled. */ } }, [view])
  const today = useTodayDate()
  const [dutyDate, setDutyDate] = useState(today)
  const previousToday = useRef(today)
  useEffect(() => {
    const previous = previousToday.current
    setDutyDate(date => date === previous ? today : date)
    previousToday.current = today
  }, [today])

  const {
    current,
    setCurrent,
    weekDays,
    goPrev,
    goNext,
    goPrevMonth,
    goNextMonth,
    goToday,
    buildDayLayout,
  } = useCalendar()
  const timelineWeek = useMemo(() => timelineDays(current), [current])

  const filteredEvents = useFilteredEvents(events)
  useEffect(()=>{if(view==='month'&&!location.state?.filterInterpreter)useFilterStore.getState().showAll()},[view,location.state?.filterInterpreter])

  // Peta interpreter by id untuk lookup cepat di grid.
  const interpretersById = useMemo(
    () => Object.fromEntries(interpreters.map((i) => [i.id, i])),
    [interpreters],
  )

  // State modal: { open, event, prefill }.
  const [modal, setModal] = useState({ open: false, event: null, prefill: null })

  // Tangani sinyal dari sidebar (tombol + Tambah Jadwal) & profil (filter satu interpreter).
  useEffect(() => {
    const st = location.state
    if (st?.openNew) {
      setModal({ open: true, event: null, prefill: null })
    }
    if (st?.filterInterpreter && interpreters.length) {
      showOnly(st.filterInterpreter, interpreters.map((i) => i.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, interpreters.length])

  // Klik slot kosong (tampilan mingguan) -> modal baru dengan prefill tanggal & jam.
  const handleSlotClick = (day, start, end) => {
    setModal({ open: true, event: null, prefill: { date: toISODate(day), start_time: start, end_time: end } })
  }

  // Klik hari (tampilan bulanan) -> modal baru dengan prefill tanggal + jam default.
  const handleDayClick = (day) => {
    setModal({ open: true, event: null, prefill: { date: toISODate(day), start_time: '09:00', end_time: '10:00' } })
  }

  const handleEventClick = (event) =>
    setModal({ open: true, event, prefill: null })

  const handleTimelineCellClick = (day, group) => {
    const date = toISODate(day), example = group.events[0]
    const start_time = example?.start_time?.slice(0, 5) || '09:00'
    const end_time = example?.end_time?.slice(0, 5) || '10:00'
    setModal({ open: true, event: null, prefill: {
      date, company: group.company, title: example?.title || group.label,
      schedule_type: group.type, start_time, end_time,
      all_day: isAllDayEvent(start_time, end_time),
      // Clicking one cell creates one date, never an accidental month of jobs.
      end_date: date, weekdays: [day.getDay()],
    } })
  }
  const changeDutyDate = (date) => { setDutyDate(date); setCurrent(parseISO(date)) }

  const closeModal = () => setModal({ open: false, event: null, prefill: null })

  // Navigasi & label disesuaikan dengan tampilan aktif.
  const handlePrev = view === 'month' ? goPrevMonth : goPrev
  const handleNext = view === 'month' ? goNextMonth : goNext
  const subtitle = view === 'timeline' ? `${formatDateLong(timelineWeek[0])} – ${formatDateLong(timelineWeek[6])}` : view === 'week' ? formatWeekRange(current) : formatMonthYear(current)
  const todayLabel = view === 'month' ? 'Bulan Ini' : 'Minggu Ini'
  const prevLabel = view === 'month' ? 'Bulan sebelumnya' : 'Minggu sebelumnya'
  const nextLabel = view === 'month' ? 'Bulan depan' : 'Minggu depan'

  return (
    <>
      <PageHeader title={view === 'timeline' ? 'Timeline' : 'Kalender'} subtitle={subtitle}>
        {/* Toggle tampilan Mingguan / Bulanan
            Mobile: teks singkat (Mgg/Bln) + padding kecil agar muat 1 baris di header.
            Desktop (lg+): teks penuh + padding normal. */}
        {/* Toggle tampilan — mobile: px-xs + abbreviated text; desktop: px-md + full text */}
        <div className="flex rounded-lg overflow-hidden border border-outline-variant/30 shrink-0">
          <button
            type="button" aria-label="Mingguan" aria-pressed={view === 'week'}
            onClick={() => setView('week')}
            className={`px-xs lg:px-md py-[5px] text-[10px] lg:text-caption transition-colors ${
              view === 'week'
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-on-surface/5'
            }`}
          >
            <span className="lg:hidden">Mgg</span>
            <span className="hidden lg:inline">Mingguan</span>
          </button>
          <button
            type="button" aria-label="Bulanan" aria-pressed={view === 'month'}
            onClick={() => setView('month')}
            className={`px-xs lg:px-md py-[5px] text-[10px] lg:text-caption border-l border-outline-variant/30 transition-colors ${
              view === 'month'
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-on-surface/5'
            }`}
          >
            <span className="lg:hidden">Bln</span>
            <span className="hidden lg:inline">Bulanan</span>
          </button>
          <button type="button" aria-pressed={view === 'timeline'} onClick={() => setView('timeline')}
            className={`px-xs lg:px-md py-[5px] text-[10px] lg:text-caption border-l border-outline-variant/30 transition-colors ${view === 'timeline' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-on-surface/5'}`}>Timeline</button>
        </div>

        {/* Kontrol navigasi — mobile: px-xs + gap-xs; desktop: px-sm + gap-md */}
        <div className="flex items-center gap-xs lg:gap-md bg-surface-container rounded-full px-xs lg:px-sm py-xs border border-outline-variant/20">
          <button
            onClick={handlePrev}
            className="text-on-surface-variant hover:text-primary transition-colors p-1"
            aria-label={prevLabel}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToday}
            className="text-[11px] lg:text-h3 font-medium text-on-surface px-xs hover:text-primary transition-colors"
          >
            {todayLabel}
          </button>
          <button
            onClick={handleNext}
            className="text-on-surface-variant hover:text-primary transition-colors p-1"
            aria-label={nextLabel}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </PageHeader>

      {view === 'timeline' ? <TimelineDutyHighlights events={events} interpretersById={interpretersById} date={dutyDate} onDateChange={changeDutyDate} onEventClick={handleEventClick} /> :
        <TodayDutyHighlights events={events} interpretersById={interpretersById} compact={view==='month'} />}

      {/* Loading awal -> skeleton */}
      {!eventsLoaded && eventsLoading ? (
        <div className="flex-1 p-xl flex flex-col gap-md">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : view === 'timeline' ? <TimelineGrid days={timelineWeek} events={filteredEvents} interpretersById={interpretersById} orders={orders}
          onDayClick={handleDayClick} onCellClick={handleTimelineCellClick} onEventClick={handleEventClick} filtered={filteredEvents.length < events.length} /> : view === 'week' ? (
        <CalendarGrid
          weekDays={weekDays}
          events={filteredEvents}
          interpretersById={interpretersById}
          buildDayLayout={buildDayLayout}
          onSlotClick={handleSlotClick}
          onEventClick={handleEventClick}
        />
      ) : (
        <MonthGrid
          currentDate={current}
          events={filteredEvents}
          totalEvents={events.length}
          interpretersById={interpretersById}
          onDayClick={handleDayClick}
          onEventClick={handleEventClick}
        />
      )}

      <EventModal
        open={modal.open}
        onClose={closeModal}
        event={modal.event}
        prefill={modal.prefill}
        interpreters={interpreters}
        orders={orders}
      />
    </>
  )
}
