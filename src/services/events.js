// CRUD jadwal/event — satu-satunya tempat query tabel events.
import { supabase } from './supabase'

// Ambil seluruh event (store kalender memfilter per minggu di sisi client).
export async function fetchAllEvents() {
  // Rangkaian harian dapat melampaui batas default 1000 baris PostgREST.
  const rows = new Map()
  const pageSize = 500
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from('events').select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw error
    for (const row of data ?? []) rows.set(row.id, row)
    if ((data?.length ?? 0) < pageSize) return [...rows.values()]
  }
}

// Ambil semua event dalam rentang tanggal [start, end] (inklusif).
export async function fetchEventsInRange(start, end) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('start_time', { ascending: true })
  if (error) throw error
  return data
}

// Ambil event milik satu interpreter mulai dari tanggal tertentu (untuk profil).
export async function fetchEventsByInterpreter(interpreterId, fromDate) {
  let query = supabase
    .from('events')
    .select('*')
    .eq('interpreter_id', interpreterId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
  if (fromDate) query = query.gte('date', fromDate)
  const { data, error } = await query
  if (error) throw error
  return data
}

// Buat event baru.
export async function createEvent(payload) {
  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

// Update event.
export async function updateEvent(id, payload) {
  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Hapus event.
export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}

// Satu request INSERT = satu transaksi PostgreSQL, tidak tersimpan sebagian.
export async function createRegularSeries(payload, dates) {
  const seriesId = crypto.randomUUID()
  const rows = dates.map(date => ({ ...payload, date, schedule_type: 'reguler', regular_series_id: seriesId }))
  const { data, error } = await supabase.from('events').insert(rows).select()
  if (error) throw error
  return data
}
