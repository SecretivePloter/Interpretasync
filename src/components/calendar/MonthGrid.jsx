// Grid kalender bulanan: 6 baris × 7 kolom, event ditampilkan sebagai chip per hari.
// Klik hari kosong -> buat event. Klik chip -> edit event.
import { useMemo } from 'react'
import { getMonthGrid, isSameDay, isSameMonth, toISODate } from '../../utils/dateHelpers'
import { getColorHex } from '../../utils/colors'
import { DAY_LABELS } from '../../utils/constants'

const MAX_CHIPS = 3

export default function MonthGrid({
  currentDate,
  events,
  interpretersById,
  onDayClick,
  onEventClick,
}) {
  const days = useMemo(() => getMonthGrid(currentDate), [currentDate])
  const now = new Date()

  // Kelompokkan event berdasarkan tanggal ISO untuk lookup O(1).
  const eventsByDate = useMemo(() => {
    const map = {}
    events.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    })
    return map
  }, [events])

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header nama hari */}
      <div className="grid grid-cols-7 border-b border-outline-variant/20 shrink-0 bg-background/95 backdrop-blur-md">
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className={`py-[5px] text-center font-caption text-caption ${
              i === 0 ? 'text-error' : 'text-on-surface-variant'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grid sel — 6 baris setinggi sama membagi sisa viewport */}
      <div
        className="flex-1 overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: 'repeat(6, minmax(0, 1fr))',
        }}
      >
        {days.map((day, idx) => {
          const iso = toISODate(day)
          const isToday = isSameDay(day, now)
          const inMonth = isSameMonth(day, currentDate)
          const dayEvents = eventsByDate[iso] || []
          const visible = dayEvents.slice(0, MAX_CHIPS)
          const overflow = dayEvents.length - MAX_CHIPS
          const isSun = idx % 7 === 0

          return (
            <div
              key={idx}
              onClick={() => onDayClick(day)}
              className={`border-b border-r border-outline-variant/10 p-1 cursor-pointer
                hover:bg-on-surface/[0.02] transition-colors overflow-hidden flex flex-col
                ${isToday ? 'bg-primary/5' : ''}
                ${!inMonth ? 'opacity-35' : ''}`}
            >
              {/* Angka tanggal */}
              <div
                className={`text-[11px] font-medium w-[20px] h-[20px] flex items-center justify-center
                  rounded-full shrink-0 mb-[2px] ${
                    isToday
                      ? 'bg-primary text-on-primary-container font-bold'
                      : isSun
                        ? 'text-error'
                        : 'text-on-surface'
                  }`}
              >
                {day.getDate()}
              </div>

              {/* Chip event */}
              <div className="flex flex-col gap-[2px] min-h-0 overflow-hidden">
                {visible.map((ev) => {
                  const interp = interpretersById[ev.interpreter_id]
                  const hex = getColorHex(interp?.color_key)
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(ev)
                      }}
                      className="flex items-center gap-[3px] px-1 py-[1px] rounded
                        text-[10px] leading-tight cursor-pointer hover:opacity-75 shrink-0"
                      style={{ backgroundColor: hex + '28', color: hex }}
                      title={`${interp?.name || ''} — ${ev.title}`}
                    >
                      <span
                        className="w-[5px] h-[5px] rounded-full shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="truncate">{ev.title}</span>
                    </div>
                  )
                })}
                {overflow > 0 && (
                  <div className="text-[9px] text-on-surface-variant opacity-60 pl-1 shrink-0">
                    +{overflow} lagi
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
