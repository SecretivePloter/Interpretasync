export const CALENDAR_CHANGE_WINDOW_MS = 24 * 60 * 60 * 1000

const LABELS = {
  schedule_type: 'tipe jadwal',
  title: 'pekerjaan', date: 'tanggal', start_time: 'jam mulai', end_time: 'jam selesai',
  interpreter_id: 'interpreter', company: 'perusahaan', location: 'lokasi', order_id: 'Job Order',
}

export function calendarChangeTime(event) {
  const value = event.calendar_changed_at ?? event.created_at
  if (!value) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

export function isRecentCalendarChange(event, now = Date.now()) {
  const timestamp = calendarChangeTime(event)
  return timestamp !== null && now >= timestamp && now < timestamp + CALENDAR_CHANGE_WINDOW_MS
}

export function nextCalendarChangeBoundary(events, now) {
  let next = Infinity
  for (const event of events) {
    const timestamp = calendarChangeTime(event)
    if (timestamp === null) continue
    const boundary = timestamp > now ? timestamp : timestamp + CALENDAR_CHANGE_WINDOW_MS
    if (boundary > now) next = Math.min(next, boundary)
  }
  return Number.isFinite(next) ? next : null
}

export function calendarChangeDescription(event) {
  const timestamp = calendarChangeTime(event)
  if (timestamp === null) return ''
  const fields = Array.isArray(event.calendar_change_fields) ? event.calendar_change_fields : []
  const labels = [...new Set(fields.map((key) => LABELS[key]).filter(Boolean))]
  const created = !event.calendar_changed_at || fields.includes('created')
  const description = created ? 'Jadwal baru' : labels.length ? `Diperbarui: ${labels.join(', ')}` : 'Informasi jadwal diperbarui'
  const time = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta',
  }).format(timestamp)
  return `${description} · ${time} WIB · Penanda aktif selama 24 jam`
}
