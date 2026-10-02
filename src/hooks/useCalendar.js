// Logika navigasi minggu + penataan event ke posisi grid (termasuk overlap).
import { useState, useMemo } from 'react'
import {
  getWeekDays,
  toISODate,
  shiftWeek,
  shiftMonth,
  timeToMinutes,
  isSameDay,
} from '../utils/dateHelpers'
import { CALENDAR_START_HOUR, HOUR_HEIGHT } from '../utils/constants'

// Bagi event yang saling tumpang tindih dalam satu hari menjadi kolom-kolom,
// agar tampil berdampingan (lebih sempit) — bukan saling menimpa.
function layoutDay(dayEvents) {
  // Urut berdasarkan waktu mulai.
  const sorted = [...dayEvents].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time),
  )
  // Bentuk cluster event yang overlap, lalu bagi kolom di tiap cluster.
  const result = []
  let cluster = []
  let clusterEnd = -1

  const flush = () => {
    // Tentukan kolom untuk tiap event di cluster (greedy).
    const columns = [] // tiap kolom = waktu selesai terakhir
    cluster.forEach((ev) => {
      const start = timeToMinutes(ev.start_time)
      let placed = false
      for (let c = 0; c < columns.length; c++) {
        if (start >= columns[c]) {
          ev._col = c
          columns[c] = timeToMinutes(ev.end_time)
          placed = true
          break
        }
      }
      if (!placed) {
        ev._col = columns.length
        columns.push(timeToMinutes(ev.end_time))
      }
    })
    const total = columns.length
    cluster.forEach((ev) => {
      ev._cols = total
      result.push(ev)
    })
    cluster = []
    clusterEnd = -1
  }

  sorted.forEach((ev) => {
    const start = timeToMinutes(ev.start_time)
    if (cluster.length && start >= clusterEnd) flush()
    cluster.push(ev)
    clusterEnd = Math.max(clusterEnd, timeToMinutes(ev.end_time))
  })
  if (cluster.length) flush()
  return result
}

// Hitung posisi absolut (top/height) sebuah event dalam px relatif grid.
export function eventPosition(ev) {
  const startMin = timeToMinutes(ev.start_time)
  const endMin = timeToMinutes(ev.end_time)
  const top =
    ((startMin - CALENDAR_START_HOUR * 60) / 60) * HOUR_HEIGHT
  const height = Math.max(24, ((endMin - startMin) / 60) * HOUR_HEIGHT - 4)
  return { top, height }
}

export function useCalendar(initialDate = new Date()) {
  const [current, setCurrent] = useState(initialDate)

  const weekDays = useMemo(() => getWeekDays(current), [current])

  // Susun event per hari + layout overlap.
  const buildDayLayout = (events, day) => {
    const iso = toISODate(day)
    const dayEvents = events.filter((e) => e.date === iso)
    return layoutDay(dayEvents)
  }

  return {
    current,
    weekDays,
    goPrev: () => setCurrent((d) => shiftWeek(d, -1)),
    goNext: () => setCurrent((d) => shiftWeek(d, 1)),
    goPrevMonth: () => setCurrent((d) => shiftMonth(d, -1)),
    goNextMonth: () => setCurrent((d) => shiftMonth(d, 1)),
    goToday: () => setCurrent(new Date()),
    buildDayLayout,
    isToday: (day) => isSameDay(day, new Date()),
  }
}
