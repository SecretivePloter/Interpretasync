// Palet warna interpreter — dipakai di event kalender, badge, avatar.
// Setiap warna punya hex solid; varian transparan dihitung via withAlpha().

export const COLOR_PALETTE = [
  { key: 'blue', label: 'Biru', hex: '#4F8EF7' },
  { key: 'green', label: 'Hijau', hex: '#2ECC71' },
  { key: 'coral', label: 'Coral', hex: '#F2786F' },
  { key: 'purple', label: 'Ungu', hex: '#A78BFA' },
  { key: 'amber', label: 'Amber', hex: '#F39C12' },
  { key: 'teal', label: 'Teal', hex: '#1ABC9C' },
  { key: 'pink', label: 'Pink', hex: '#E991B8' },
  { key: 'red', label: 'Merah', hex: '#E74C3C' },
]

const COLOR_MAP = Object.fromEntries(COLOR_PALETTE.map((c) => [c.key, c]))

// Ambil objek warna berdasarkan color_key, fallback ke biru bila tidak dikenal.
export function getColor(key) {
  return COLOR_MAP[key] || COLOR_PALETTE[0]
}

// Kembalikan hex untuk color_key tertentu.
export function getColorHex(key) {
  return getColor(key).hex
}

// Tambahkan alpha (0-1) ke hex => string rgba untuk inline style.
export function withAlpha(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Warna aksen status (dipakai kolom Kanban & dropdown inline tabel).
// Invoice = cyan (sudah ditagih, menunggu bayar); Paid = hijau (lunas);
// Complete = slate (selesai/arsip); Overdue = merah (lewat jatuh tempo).
export const STATUS_COLORS = {
  quotation: '#D97706',
  waiting_for_approval: '#7C3AED',
  order: '#2563EB',
  invoice: '#0891B2',
  paid: '#16A34A',
  complete: '#64748B',
  overdue: '#DC2626',
}

// Spek visual badge/pill status: background, teks, border, + animasi pulse opsional.
// Semua badge: bold, uppercase, pill, padding 6px 14px, font 12px.
export const STATUS_BADGE = {
  quotation: { bg: '#B45309', text: '#FEF3C7', border: '#D97706' },
  waiting_for_approval: {
    bg: '#6D28D9',
    text: '#EDE9FE',
    border: '#7C3AED',
    anim: 'animate-glow-purple', // pulse subtle
  },
  order: { bg: '#1D4ED8', text: '#DBEAFE', border: '#2563EB' },
  invoice: { bg: '#155E75', text: '#CFFAFE', border: '#0891B2' },
  paid: { bg: '#166534', text: '#DCFCE7', border: '#16A34A' },
  complete: { bg: '#334155', text: '#E2E8F0', border: '#64748B' },
  overdue: {
    bg: '#991B1B',
    text: '#FEE2E2',
    border: '#DC2626',
    anim: 'animate-glow-red', // pulse
  },
}
