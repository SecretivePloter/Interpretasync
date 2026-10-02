// Grid kalender mingguan: gutter waktu + 7 kolom hari.
// Klik slot kosong -> buat event (pre-fill jam dari posisi klik).
// Klik event -> edit. Garis merah menandai waktu sekarang.
import { useMemo } from 'react'
import {
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  HOUR_HEIGHT,
  DAY_LABELS,
} from '../../utils/constants'
import { toISODate, minutesToTime, isSameDay } from '../../utils/dateHelpers'
import { eventPosition } from '../../hooks/useCalendar'
import EventBlock from './EventBlock'

const TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR
const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT

export default function CalendarGrid({
  weekDays,
  events,
  interpretersById,
  buildDayLayout,
  onSlotClick,
  onEventClick,
}) {
  // Daftar jam untuk label & garis (06:00 .. 21:00).
  const hours = useMemo(
    () =>
      Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => CALENDAR_START_HOUR + i),
    [],
  )

  const now = new Date()

  // Hitung jam dari posisi klik (snap 30 menit), relatif terhadap HOUR_HEIGHT.
  const handleColumnClick = (e, day) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const clickMin = (y / HOUR_HEIGHT) * 60
    const snapped = Math.round(clickMin / 30) * 30
    const startMin = CALENDAR_START_HOUR * 60 + snapped
    onSlotClick(day, minutesToTime(startMin), minutesToTime(startMin + 60))
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      {/* Header hari (sticky). min-w agar kolom punya lebar minimum -> scroll
          horizontal di layar sempit (HP); di desktop ikut penuh. */}
      <div className="sticky top-0 z-20 flex min-w-[640px] lg:min-w-0 bg-background/95 backdrop-blur-md border-b border-outline-variant/20">
        <div className="w-[60px] shrink-0 border-r border-outline-variant/10" />
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((day, i) => {
            const today = isSameDay(day, now)
            const isSunday = i === 0
            return (
              <div
                key={i}
                className={`flex flex-col items-center justify-center py-[5px] ${
                  today ? 'bg-primary/5' : ''
                }`}
              >
                <span
                  className={`text-caption font-caption ${
                    today
                      ? 'text-primary font-bold'
                      : isSunday
                        ? 'text-error'
                        : 'text-on-surface-variant'
                  }`}
                >
                  {DAY_LABELS[i]}
                </span>
                <span
                  className={`font-h3 text-h3 ${
                    today
                      ? 'bg-primary text-on-primary-container px-2 rounded-full'
                      : isSunday
                        ? 'text-error'
                        : 'text-on-surface'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Body grid. min-w sama dengan header agar keduanya scroll horizontal seragam. */}
      <div className="flex min-w-[640px] lg:min-w-0" style={{ height: GRID_HEIGHT }}>
        {/* Gutter waktu */}
        <div className="w-[60px] shrink-0 relative">
          {hours.map((h) => (
            <div
              key={h}
              className="absolute right-2 -translate-y-1/2 font-caption text-on-surface-variant opacity-60 text-[11px]"
              style={{ top: (h - CALENDAR_START_HOUR) * HOUR_HEIGHT }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Kolom hari */}
        <div className="flex-1 grid grid-cols-7 relative">
          {weekDays.map((day, dayIdx) => {
            const today = isSameDay(day, now)
            const dayEvents = buildDayLayout(events, day)
            return (
              <div
                key={dayIdx}
                onClick={(e) => handleColumnClick(e, day)}
                className={`relative border-r border-outline-variant/10 cursor-pointer ${
                  today ? 'bg-primary/5' : ''
                }`}
              >
                {/* Garis jam penuh */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-outline-variant/[0.13]"
                    style={{ top: (h - CALENDAR_START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}
                {/* Garis setengah jam (dashed, lebih samar) */}
                {hours.slice(0, -1).map((h) => (
                  <div
                    key={`hh-${h}`}
                    className="absolute left-0 right-0 border-t border-dashed border-outline-variant/[0.06]"
                    style={{ top: (h - CALENDAR_START_HOUR + 0.5) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Event */}
                {dayEvents.map((ev) => {
                  const pos = eventPosition(ev)
                  const cols = ev._cols || 1
                  const col = ev._col || 0
                  const widthPct = 100 / cols
                  return (
                    <EventBlock
                      key={ev.id}
                      event={ev}
                      interpreter={interpretersById[ev.interpreter_id]}
                      compact={cols > 1}
                      height={pos.height}
                      onClick={onEventClick}
                      style={{
                        top: pos.top,
                        height: pos.height,
                        left: `calc(${col * widthPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                      }}
                    />
                  )
                })}
              </div>
            )
          })}

        </div>
      </div>
    </div>
  )
}
