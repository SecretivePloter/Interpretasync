// CRUD order — satu-satunya tempat query tabel orders.
import { supabase } from './supabase'
import { todayISO } from '../utils/orderStatus'

// Ambil semua order, terbaru di atas.
export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

// Ambil order milik satu interpreter (riwayat order di profil).
export async function fetchOrdersByInterpreter(interpreterId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('interpreter_id', interpreterId)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

// Buat order baru.
export async function createOrder(payload) {
  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

// Update order (termasuk perubahan status dari Kanban / dropdown inline).
export async function updateOrder(id, payload) {
  const { data, error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Ubah hanya status order (helper khusus drag-and-drop & dropdown).
export async function updateOrderStatus(id, status) {
  return updateOrder(id, { status })
}

// Hapus order.
export async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}

// Follow-up otomatis: order berstatus "invoice" yang estimasi jatuh temponya
// sudah lewat hari ini ditandai "overdue" (persist ke DB + kembalikan list terbaru).
export async function autoFlagOverdue(orders) {
  const today = todayISO()
  const stale = orders.filter(
    (o) =>
      o.status === 'invoice' &&
      o.estimated_payment_date &&
      o.estimated_payment_date < today,
  )
  if (stale.length === 0) return orders
  // Persist paralel; bila satu gagal, jangan blokir pemuatan data.
  await Promise.allSettled(
    stale.map((o) => updateOrder(o.id, { status: 'overdue' })),
  )
  const staleIds = new Set(stale.map((o) => o.id))
  return orders.map((o) =>
    staleIds.has(o.id) ? { ...o, status: 'overdue' } : o,
  )
}
