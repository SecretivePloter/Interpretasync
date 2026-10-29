// Grid kalender bulanan: 6 baris × 7 kolom, event ditampilkan sebagai chip per hari.
// Klik hari kosong -> buat event. Klik chip -> edit event.
import { useMemo } from 'react'
import { getMonthGrid, isSameDay, isSameMonth, toISODate } from '../../utils/dateHelpers'
import { getColorHex } from '../../utils/colors'
import { DAY_LABELS } from '../../utils/constants'
import Avatar from '../ui/Avatar'

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
    <div className="flex-1 min-h-0 overflow-auto bg-background">
      <div className="min-w-[760px]">
      {/* Header nama hari */}
      <div className="sticky top-0 z-20 grid grid-cols-7 border-b border-outline-variant/20 shrink-0 bg-background/95 backdrop-blur-md">
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

      {/* Grid visual-management: setiap event tetap tampak, tanpa ringkasan
          tersembunyi. Baris bertambah tinggi saat hari tersebut padat. */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: 'repeat(6, minmax(132px, auto))',
        }}
      >
        {days.map((day, idx) => {
          const iso = toISODate(day)
          const isToday = isSameDay(day, now)
          const inMonth = isSameMonth(day, currentDate)
          const dayEvents = eventsByDate[iso] || []
          const isSun = idx % 7 === 0

          return (
            <div
              key={idx}
              onClick={() => onDayClick(day)}
              className={`border-b border-r border-outline-variant/10 p-1 cursor-pointer
                hover:bg-on-surface/[0.02] transition-colors flex flex-col
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
                {dayEvents.map((ev) => {
                  const interp = interpretersById[ev.interpreter_id]
                  const hex = getColorHex(interp?.color_key)
                  const scheduleLabel = interp?.name
                    ? `${ev.title} - ${interp.name}`
                    : ev.title
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
                      title={scheduleLabel}
                    >
                      {interp?.name ? (
                        <Avatar
                          name={interp.name}
                          colorKey={interp.color_key}
                          avatarUrl={interp.avatar_url}
                          size="xs"
                          className="!w-[14px] !h-[14px] !text-[6px]"
                        />
                      ) : (
                        <span
                          className="w-[5px] h-[5px] rounded-full shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                      )}
                      <span className="truncate min-w-0">{scheduleLabel}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}
