// CRUD interpreter — satu-satunya tempat query tabel interpreters.
import { supabase } from './supabase'

// Ambil semua interpreter, urut nama.
export async function fetchInterpreters() {
  const { data, error } = await supabase
    .from('interpreters')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

// Ambil satu interpreter berdasarkan id.
export async function fetchInterpreterById(id) {
  const { data, error } = await supabase
    .from('interpreters')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Buat interpreter baru.
export async function createInterpreter(payload) {
  const { data, error } = await supabase
    .from('interpreters')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

// Update interpreter.
export async function updateInterpreter(id, payload) {
  const { data, error } = await supabase
    .from('interpreters')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Hapus interpreter (cascade ke events & orders via FK).
export async function deleteInterpreter(id) {
  const { error } = await supabase.from('interpreters').delete().eq('id', id)
  if (error) throw error
}
