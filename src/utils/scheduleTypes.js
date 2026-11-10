import { UNASSIGNED_INTERPRETER_ID } from './unassignedInterpreter.js'

export const isRegularSchedule = (event) => event.schedule_type === 'reguler'
export const scheduleTypeLabel = (event) => isRegularSchedule(event) ? 'Reguler' : 'Project'
export const regularColor = { bg: 'var(--schedule-regular-bg)', foreground: 'var(--schedule-regular-fg)', edge: 'var(--schedule-regular-edge)' }
export const scheduleColor = (event, interpreterColor) => isRegularSchedule(event) ? regularColor : interpreterColor
export const scheduleVisible = (event, hiddenIds, showRegular = true) =>
  !hiddenIds.includes(event.interpreter_id) && (showRegular || !isRegularSchedule(event))

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null
}

export function regularScheduleDates(from, to, weekdays) {
  const start = parseDate(from), end = parseDate(to)
  if (!start || !end || end < start) throw new Error('Rentang tanggal Reguler tidak valid.')
  if ((end - start) / 86400000 >= 366) throw new Error('Satu rangkaian dibatasi maksimal 366 hari kalender.')
  const allowed = new Set(weekdays)
  if (!allowed.size || [...allowed].some(day => !Number.isInteger(day) || day < 0 || day > 6))
    throw new Error('Pilih minimal satu hari kerja yang valid.')
  const dates = []
  for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    if (allowed.has(date.getUTCDay())) dates.push(date.toISOString().slice(0, 10))
  }
  if (!dates.length) throw new Error('Tidak ada hari kerja pada rentang tanggal ini.')
  return dates
}

export function monthEnd(date) {
  const value = parseDate(date)
  if (!value) return date
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
}

function seconds(time) {
  const [h, m, s = 0] = String(time || '').split(':').map(Number)
  return h * 3600 + m * 60 + s
}

// Filter tampilan tidak digunakan untuk pemeriksaan benturan.
export function regularScheduleConflicts(existing, candidates, excludeId = null) {
  return existing.filter(other => other.id !== excludeId && candidates.some(candidate =>
    candidate.interpreter_id && candidate.interpreter_id !== UNASSIGNED_INTERPRETER_ID &&
    other.interpreter_id === candidate.interpreter_id && other.date === candidate.date &&
    (isRegularSchedule(candidate) || isRegularSchedule(other)) &&
    seconds(candidate.start_time) < seconds(other.end_time) && seconds(candidate.end_time) > seconds(other.start_time),
  ))
}

export function scheduleSaveError(error) {
  if (error?.code === '23P01') return 'Interpreter sudah memiliki jadwal yang bertabrakan dengan Reguler pada tanggal dan jam tersebut. Periksa kembali jadwalnya.'
  if (error?.code === '23505' && String(error.message).includes('events_regular_series_date')) return 'Tanggal tersebut sudah ada dalam rangkaian Reguler ini.'
  return 'Gagal menyimpan jadwal. Silakan coba lagi.'
}
