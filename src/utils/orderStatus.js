// Logika efek-samping perubahan status order (estimasi jatuh tempo & tanggal bayar).
// Dipakai di tabel, kanban, dan modal agar perilaku konsisten di semua entry point.
import { addDays, format, parseISO } from 'date-fns'
import { PAYMENT_TERM_DAYS, PAID_STATUSES } from './constants'

// 'yyyy-MM-dd' hari ini (zona waktu lokal).
export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

// Hitung patch tambahan saat status order berubah ke `newStatus`:
// - Masuk ke "invoice" tanpa estimasi jatuh tempo -> isi otomatis (tanggal order + termin).
// - Masuk ke "paid"/"complete" tanpa tanggal bayar  -> stempel tanggal hari ini.
// Mengembalikan objek berisi { status, ...field tambahan }.
export function computeStatusPatch(order, newStatus) {
  const patch = { status: newStatus }
  const now = new Date()

  if (newStatus === 'invoice' && !order.estimated_payment_date) {
    const base = order.date ? parseISO(order.date) : now
    let due = addDays(base, PAYMENT_TERM_DAYS)
    // Bila order sudah lewat sehingga jatuh tempo di masa lalu, geser ke hari ini + termin.
    if (due < now) due = addDays(now, PAYMENT_TERM_DAYS)
    patch.estimated_payment_date = format(due, 'yyyy-MM-dd')
  }

  if (PAID_STATUSES.includes(newStatus) && !order.paid_date) {
    patch.paid_date = todayISO()
  }

  return patch
}
