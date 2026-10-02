// Heatmap kepadatan jadwal bulan berjalan (dihitung dari events interpreter).
import { useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { getColorHex, withAlpha } from '../../utils/colors'

export default function BookingDensity({ events, colorKey }) {
  const hex = getColorHex(colorKey)
  const now = new Date()

  // Hitung jumlah event per tanggal pada bulan ini.
  const { cells, monthLabel } = useMemo(() => {
    const start = startOfMonth(now)
    const end = endOfMonth(now)
    const days = eachDayOfInterval({ start, end })
    const counts = {}
    events.forEach((e) => {
      counts[e.date] = (counts[e.date] || 0) + 1
    })
    const max = Math.max(1, ...Object.values(counts))

    // Padding awal agar kolom selaras hari (Minggu=0).
    const pad = getDay(start)
    const cells = [
      ...Array.from({ length: pad }, () => null),
      ...days.map((d) => {
        const key = format(d, 'yyyy-MM-dd')
        const c = counts[key] || 0
        return { key, count: c, intensity: c / max, day: d.getDate() }
      }),
    ]
    return { cells, monthLabel: format(now, 'MMMM yyyy', { locale: localeId }) }
  }, [events]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-surface-container border border-outline-variant/10 rounded-xl p-lg">
      <div className="flex justify-between items-center mb-md">
        <h3 className="font-h3 text-h3 text-on-surface">Kepadatan Jadwal</h3>
        <span className="font-caption text-caption text-on-surface-variant capitalize">{monthLabel}</span>
      </div>
      <div className="grid grid-cols-7 gap-xs">
        {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-on-surface-variant opacity-60">
            {d}
          </div>
        ))}
        {cells.map((cell, i) =>
          cell === null ? (
            <div key={i} />
          ) : (
            <div
              key={i}
              title={`${cell.day}: ${cell.count} jadwal`}
              className="aspect-square rounded-sm flex items-center justify-center text-[9px]"
              style={{
                backgroundColor:
                  cell.count === 0 ? withAlpha('#8c909e', 0.08) : withAlpha(hex, 0.25 + cell.intensity * 0.6),
                color: cell.count === 0 ? '#8c909e' : '#fff',
              }}
            >
              {cell.day}
            </div>
          ),
        )}
      </div>
    </div>
  )
}
