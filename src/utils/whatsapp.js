// Helper nomor WhatsApp untuk fitur "Follow Up via WhatsApp" pada order.

// Bersihkan input menjadi digit saja (buang +, spasi, tanda hubung, dll).
export function sanitizeWhatsapp(value) {
  return (value || '').replace(/\D/g, '')
}

// Bangun URL wa.me dari nomor; kosong bila tidak ada digit.
export function waLink(number) {
  const n = sanitizeWhatsapp(number)
  return n ? `https://wa.me/${n}` : ''
}
