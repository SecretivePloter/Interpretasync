// Helper tanggal & format, dibangun di atas date-fns.
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  addDays,
  addWeeks,
  addMonths,
  format,
  isSameDay,
  parseISO,
  differenceInMinutes,
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ALL_DAY_START, ALL_DAY_END } from './constants'

// Minggu dimulai hari Minggu (weekStartsOn: 0) sesuai header MIN..SAB.
const WEEK_OPTS = { weekStartsOn: 0 }

// Kembalikan array 7 tanggal (Date) untuk minggu yang memuat `date`.
export function getWeekDays(date) {
  const start = startOfWeek(date, WEEK_OPTS)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

// Rentang minggu untuk query (string ISO yyyy-MM-dd).
export function getWeekRange(date) {
  return {
    start: format(startOfWeek(date, WEEK_OPTS), 'yyyy-MM-dd'),
    end: format(endOfWeek(date, WEEK_OPTS), 'yyyy-MM-dd'),
  }
}

// Geser minggu maju/mundur.
export function shiftWeek(date, amount) {
  return addWeeks(date, amount)
}

// Geser bulan maju/mundur.
export function shiftMonth(date, amount) {
  return addMonths(date, amount)
}

// Format header bulan: "Juni 2026".
export function formatMonthYear(date) {
  return format(date, 'MMMM yyyy', { locale: localeId })
}

// Array 42 tanggal (6 baris × 7 kolom) untuk grid kalender bulanan.
// Baris pertama dimulai dari Minggu pada minggu yang memuat tanggal 1.
export function getMonthGrid(date) {
  const start = startOfWeek(startOfMonth(date), WEEK_OPTS)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

// Apakah dua Date berada di bulan & tahun yang sama.
export function isSameMonth(date, ref) {
  return (
    date.getFullYear() === ref.getFullYear() &&
    date.getMonth() === ref.getMonth()
  )
}

// Format header rentang: "12 – 18 Mei 2024".
export function formatWeekRange(date) {
  const start = startOfWeek(date, WEEK_OPTS)
  const end = endOfWeek(date, WEEK_OPTS)
  const sameMonth = start.getMonth() === end.getMonth()
  if (sameMonth) {
    return `${format(start, 'd')} – ${format(end, 'd MMMM yyyy', { locale: localeId })}`
  }
  return `${format(start, 'd MMM', { locale: localeId })} – ${format(end, 'd MMM yyyy', { locale: localeId })}`
}

// Format tanggal Indonesia, mis. "4 Juni 2026".
export function formatDateLong(date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'd MMMM yyyy', { locale: localeId })
}

// Format pendek "4 Jun".
export function formatDateShort(date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'd MMM', { locale: localeId })
}

// Konversi Date -> 'yyyy-MM-dd' untuk kolom date Supabase.
export function toISODate(date) {
  return format(date, 'yyyy-MM-dd')
}

export { isSameDay, parseISO, format }

// Konversi "HH:mm" atau "HH:mm:ss" -> total menit dari 00:00.
export function timeToMinutes(time) {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Potong "HH:mm:ss" menjadi "HH:mm".
export function trimTime(time) {
  if (!time) return ''
  return time.slice(0, 5)
}

// Deteksi event "Seharian": jam mulai/selesai sama dengan rentang penuh kalender.
// Tanpa kolom DB — murni diturunkan dari start_time & end_time.
export function isAllDayEvent(start, end) {
  return trimTime(start) === ALL_DAY_START && trimTime(end) === ALL_DAY_END
}

// Konversi total menit dari 00:00 -> "HH:mm" (dibatasi 00:00–23:59).
export function minutesToTime(mins) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, mins))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Durasi jam (desimal) antara dua "HH:mm".
export function durationHours(start, end) {
  const mins = timeToMinutes(end) - timeToMinutes(start)
  return Math.max(0, mins / 60)
}

// Selisih menit dua waktu.
export function diffMinutes(start, end) {
  return timeToMinutes(end) - timeToMinutes(start)
}

export { differenceInMinutes }

// Format Rupiah: 500000 -> "Rp 500.000".
export function formatRupiah(value) {
  const n = Number(value) || 0
  return 'Rp ' + n.toLocaleString('id-ID')
}

// Inisial dari nama: "Budi Santoso" -> "BS".
export function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
