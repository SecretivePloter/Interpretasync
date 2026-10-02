// Ekspor data order ke file Excel (.xlsx) menggunakan SheetJS (xlsx).
// Dipanggil saat tombol "Export Excel" diklik sehingga selalu memakai data terbaru.
import * as XLSX from 'xlsx'
import { ORDER_STATUSES } from './constants'
import { todayISO } from './orderStatus'

const STATUS_LABELS = Object.fromEntries(ORDER_STATUSES.map((s) => [s.key, s.label]))

// Bangun workbook dari daftar order + peta interpreter, lalu unduh sebagai .xlsx.
export function exportOrdersToExcel(orders, interpretersById = {}) {
  const rows = orders.map((o, i) => ({
    No: i + 1,
    'Tanggal Order': o.date || '',
    'Klien / Perusahaan': o.client_name || '',
    Interpreter: interpretersById[o.interpreter_id]?.name || '',
    'No. Quotation': o.quotation_number || '',
    Status: STATUS_LABELS[o.status] || o.status || '',
    'Fee (Rp)': Number(o.fee_estimate) || 0,
    'Estimasi Jatuh Tempo': o.estimated_payment_date || '',
    'Tanggal Dibayar': o.paid_date || '',
    'No. WhatsApp': o.whatsapp || '',
    'Durasi (jam)': o.duration_hours ?? '',
    'Link Invoice': o.invoice_link || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  // Lebar kolom agar mudah dibaca.
  worksheet['!cols'] = [
    { wch: 5 }, // No
    { wch: 14 }, // Tanggal Order
    { wch: 26 }, // Klien
    { wch: 20 }, // Interpreter
    { wch: 16 }, // No. Quotation
    { wch: 20 }, // Status
    { wch: 16 }, // Fee
    { wch: 18 }, // Estimasi Jatuh Tempo
    { wch: 16 }, // Tanggal Dibayar
    { wch: 16 }, // No. WhatsApp
    { wch: 12 }, // Durasi
    { wch: 40 }, // Link Invoice
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
  XLSX.writeFile(workbook, `ichikara-orders-${todayISO()}.xlsx`)
}
