export const units = { day: 'Hari / full day', half_day: 'Half day', hour: 'Jam', month: 'Bulan', session: 'Sesi', event: 'Event' }
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
export const money = (amount, currency = 'IDR') => new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(amount || 0))
export function feeTotal(fee) {
  const number = key => Number(fee[key] || 0)
  return Math.round((number('quantity') * number('rate') + number('overtime_hours') * number('overtime_rate') + number('extras') - number('deductions')) * 100) / 100
}
export function availability(interpreter, events, blocks, date, start = '00:00', end = '23:59') {
  if (interpreter.status !== 'aktif') return 'Nonaktif'
  if (blocks.some(b => b.interpreter_id === interpreter.id && b.start_date <= date && b.end_date >= date)) return 'Tidak tersedia'
  if (events.some(e => e.interpreter_id === interpreter.id && e.date === date && e.start_time.slice(0,5) < end && e.end_time.slice(0,5) > start)) return 'Ada tugas'
  return 'Tidak ada jadwal'
}
export function averageRating(experiences) {
  const rated = experiences.filter(e => Number(e.rating) > 0)
  return rated.length ? rated.reduce((sum,e) => sum + Number(e.rating),0) / rated.length : null
}
