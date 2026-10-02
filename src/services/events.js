// CRUD jadwal/event — satu-satunya tempat query tabel events.
import { supabase } from './supabase'

// Ambil seluruh event (store kalender memfilter per minggu di sisi client).
export async function fetchAllEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
  if (error) throw error
  return data
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
