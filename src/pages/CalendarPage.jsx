// Halaman Kalender: navigasi minggu/bulan, filter interpreter, grid + CRUD jadwal.
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import FilterBar from '../components/filter/FilterBar'
import CalendarGrid from '../components/calendar/CalendarGrid'
import MonthGrid from '../components/calendar/MonthGrid'
import EventModal from '../components/calendar/EventModal'
import Skeleton from '../components/ui/Skeleton'
import { useCalendar } from '../hooks/useCalendar'
import { useFilteredEvents } from '../hooks/useFilter'
import { useInterpreterStore } from '../app/store/useInterpreterStore'
import { useEventStore } from '../app/store/useEventStore'
import { useOrderStore } from '../app/store/useOrderStore'
import { useFilterStore } from '../app/store/useFilterStore'
import { formatWeekRange, formatMonthYear, toISODate } from '../utils/dateHelpers'

export default function CalendarPage() {
  const location = useLocation()
  const interpreters = useInterpreterStore((s) => s.interpreters)
  const events = useEventStore((s) => s.events)
  const eventsLoading = useEventStore((s) => s.loading)
  const eventsLoaded = useEventStore((s) => s.loaded)
  const orders = useOrderStore((s) => s.orders)
  const showOnly = useFilterStore((s) => s.showOnly)

  // 'week' | 'month'
  const [view, setView] = useState('week')

  const {
    current,
    weekDays,
    goPrev,
    goNext,
    goPrevMonth,
    goNextMonth,
    goToday,
    buildDayLayout,
  } = useCalendar()

  const filteredEvents = useFilteredEvents(events)

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

  const closeModal = () => setModal({ open: false, event: null, prefill: null })

  // Navigasi & label disesuaikan dengan tampilan aktif.
  const handlePrev = view === 'week' ? goPrev : goPrevMonth
  const handleNext = view === 'week' ? goNext : goNextMonth
  const subtitle = view === 'week' ? formatWeekRange(current) : formatMonthYear(current)
  const todayLabel = view === 'week' ? 'Minggu Ini' : 'Bulan Ini'
  const prevLabel = view === 'week' ? 'Minggu sebelumnya' : 'Bulan sebelumnya'
  const nextLabel = view === 'week' ? 'Minggu depan' : 'Bulan depan'

  return (
    <>
      <PageHeader title="Kalender" subtitle={subtitle}>
        {/* Toggle tampilan Mingguan / Bulanan
            Mobile: teks singkat (Mgg/Bln) + padding kecil agar muat 1 baris di header.
            Desktop (lg+): teks penuh + padding normal. */}
        {/* Toggle tampilan — mobile: px-xs + abbreviated text; desktop: px-md + full text */}
        <div className="flex rounded-lg overflow-hidden border border-outline-variant/30 shrink-0">
          <button
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

      <FilterBar interpreters={interpreters} />

      {/* Loading awal -> skeleton */}
      {!eventsLoaded && eventsLoading ? (
        <div className="flex-1 p-xl flex flex-col gap-md">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : view === 'week' ? (
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
