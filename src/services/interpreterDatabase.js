import { supabase } from './supabase'

export async function listRecords(table, interpreterId) {
  const rows = []
  for (let offset = 0; ; offset += 500) {
    let query = supabase.from(table).select('*').order('created_at', { ascending: false }).order('id').range(offset, offset + 499)
    if (interpreterId) query = query.eq('interpreter_id', interpreterId)
    const { data, error } = await query
    if (error) throw error
    rows.push(...data)
    if (data.length < 500) return rows
  }
}

export async function saveRecord(table, record) {
  const { data, error } = await supabase.from(table).upsert(record).select().single()
  if (error) throw error
  return data
}

export async function deleteRecord(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}
