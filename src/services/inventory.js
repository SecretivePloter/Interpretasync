// Semua query Supabase untuk modul Inventaris.
import { supabase } from './supabase'

// ─── Katalog Barang ──────────────────────────────────────────────────────────

export async function fetchItems() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('nama')
  if (error) throw error
  return data
}

export async function createItem(payload) {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateItem(id, payload) {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteItem(id) {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id)
  if (error) throw error
}

// ─── Transaksi (masuk / keluar) ──────────────────────────────────────────────

export async function fetchTransactions() {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select('*, item:inventory_items(id, kode, nama, satuan)')
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Catat transaksi + update stok otomatis di inventory_items.
export async function createTransaction(payload) {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .insert(payload)
    .select('*, item:inventory_items(id, kode, nama, satuan)')
    .single()
  if (error) throw error

  // Hitung delta stok
  const delta = payload.tipe === 'masuk' ? payload.jumlah : -payload.jumlah

  // Ambil stok saat ini lalu update (RPC increment untuk menghindari race)
  const { error: updErr } = await supabase.rpc('increment_stok', {
    p_item_id: payload.item_id,
    p_delta: delta,
  })
  if (updErr) {
    // Fallback: baca → tulis
    const { data: item } = await supabase
      .from('inventory_items')
      .select('stok_saat_ini')
      .eq('id', payload.item_id)
      .single()
    const newStok = Math.max(0, (item?.stok_saat_ini ?? 0) + delta)
    await supabase
      .from('inventory_items')
      .update({ stok_saat_ini: newStok })
      .eq('id', payload.item_id)
  }

  return data
}

export async function deleteTransaction(id) {
  // Ambil transaksi dulu untuk reverse stok
  const { data: trx } = await supabase
    .from('inventory_transactions')
    .select('item_id, tipe, jumlah')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('inventory_transactions')
    .delete()
    .eq('id', id)
  if (error) throw error

  if (trx) {
    // Reverse delta
    const delta = trx.tipe === 'masuk' ? -trx.jumlah : trx.jumlah
    const { error: updErr } = await supabase.rpc('increment_stok', {
      p_item_id: trx.item_id,
      p_delta: delta,
    })
    if (updErr) {
      const { data: item } = await supabase
        .from('inventory_items')
        .select('stok_saat_ini')
        .eq('id', trx.item_id)
        .single()
      const newStok = Math.max(0, (item?.stok_saat_ini ?? 0) + delta)
      await supabase
        .from('inventory_items')
        .update({ stok_saat_ini: newStok })
        .eq('id', trx.item_id)
    }
  }
}

// ─── Maintenance ─────────────────────────────────────────────────────────────

export async function fetchMaintenance() {
  const { data, error } = await supabase
    .from('inventory_maintenance')
    .select('*, item:inventory_items(id, kode, nama)')
    .order('tanggal', { ascending: false })
  if (error) throw error
  return data
}

export async function createMaintenance(payload) {
  const { data, error } = await supabase
    .from('inventory_maintenance')
    .insert(payload)
    .select('*, item:inventory_items(id, kode, nama)')
    .single()
  if (error) throw error
  return data
}

export async function updateMaintenance(id, payload) {
  const { data, error } = await supabase
    .from('inventory_maintenance')
    .update(payload)
    .eq('id', id)
    .select('*, item:inventory_items(id, kode, nama)')
    .single()
  if (error) throw error
  return data
}

export async function deleteMaintenance(id) {
  const { error } = await supabase
    .from('inventory_maintenance')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Role helper ─────────────────────────────────────────────────────────────

export async function fetchUserRole(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  // Akun yang belum dipetakan tidak boleh otomatis menjadi manajemen.
  return data?.role ?? 'operator'
}
