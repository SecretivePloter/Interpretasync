// Blok event di grid kalender. Posisi (top/left/width/height) diberikan via `style`.
// Warna mengikuti interpreter; hover memunculkan tooltip detail.
import { getColorHex, withAlpha } from '../../utils/colors'
import { trimTime, isAllDayEvent } from '../../utils/dateHelpers'
import { MapPin, Clock, StickyNote, Building2, Sun } from 'lucide-react'

export default function EventBlock({ event, interpreter, style, onClick, compact, height = 60 }) {
  const hex = getColorHex(interpreter?.color_key)
  const allDay = isAllDayEvent(event.start_time, event.end_time)
  const time = allDay
    ? 'Seharian'
    : `${trimTime(event.start_time)} - ${trimTime(event.end_time)}`

  // Tampilkan detail sesuai tinggi blok: jam saat >=50px, meta (lokasi/PT) saat >=70px.
  const showTime = !compact && height >= 50
  const showMeta = !compact && height >= 70

  return (
    <div
      className="absolute rounded-lg px-2 py-[3px] z-10 cursor-pointer transition-transform hover:scale-[1.02] hover:z-30 group overflow-visible"
      style={{
        ...style,
        backgroundColor: withAlpha(hex, 0.18),
        borderLeft: `3px solid ${hex}`,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(event)
      }}
    >
      <div
        className="font-label-tag text-label-tag line-clamp-1"
        style={{ color: hex }}
      >
        {interpreter?.name || '—'}
      </div>
      <div className="font-caption text-caption text-on-surface line-clamp-1 leading-tight">
        {event.title}
      </div>
      {showTime && (
        <div className="flex items-center gap-[3px] text-[10px] text-on-surface-variant mt-[1px] line-clamp-1">
          {allDay && <Sun size={10} className="shrink-0" />}
          <span className="truncate">{time}</span>
        </div>
      )}
      {showMeta && (
        <>
          {/* Lokasi & perusahaan tampil hanya bila terisi */}
          {event.company && (
            <div className="flex items-center gap-[3px] text-[10px] text-on-surface-variant mt-[1px] line-clamp-1">
              <Building2 size={10} className="shrink-0" />
              <span className="truncate">{event.company}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-[3px] text-[10px] text-on-surface-variant mt-[1px] line-clamp-1">
              <MapPin size={10} className="shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </>
      )}

      {/* Tooltip detail saat hover */}
      <div className="pointer-events-none absolute left-full top-0 ml-2 w-56 hidden group-hover:block z-50">
        <div className="bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-2xl p-md flex flex-col gap-sm">
          <div className="flex items-center gap-sm">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: hex }}
            />
            <span className="font-h3 text-h3 text-on-surface leading-tight">
              {event.title}
            </span>
          </div>
          <div className="flex items-center gap-sm text-on-surface-variant">
            {allDay ? <Sun size={14} /> : <Clock size={14} />}
            <span className="font-caption text-caption">{time}</span>
          </div>
          {event.company && (
            <div className="flex items-center gap-sm text-on-surface-variant">
              <Building2 size={14} />
              <span className="font-caption text-caption">{event.company}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-sm text-on-surface-variant">
              <MapPin size={14} />
              <span className="font-caption text-caption">{event.location}</span>
            </div>
          )}
          {event.notes && (
            <div className="flex items-start gap-sm text-on-surface-variant">
              <StickyNote size={14} className="mt-[2px] shrink-0" />
              <span className="font-caption text-caption">{event.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
