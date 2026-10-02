// Pengaturan aplikasi (app_settings) + upload file ke Supabase Storage.
import { supabase } from './supabase'

// Ambil semua setting sebagai objek { key: value }.
export async function fetchSettings() {
  const { data, error } = await supabase.from('app_settings').select('*')
  if (error) throw error
  return Object.fromEntries((data || []).map((r) => [r.key, r.value]))
}

// Simpan/perbarui satu setting (upsert berdasarkan key unik).
export async function saveSetting(key, value) {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw error
}

// Upload file ke bucket tertentu, kembalikan public URL.
export async function uploadFile(bucket, file, pathPrefix = '') {
  const ext = file.name.split('.').pop()
  const fileName = `${pathPrefix}${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: true, cacheControl: '3600' })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return data.publicUrl
}

// Upload avatar interpreter -> kembalikan URL (disimpan via updateInterpreter).
export async function uploadAvatar(file) {
  return uploadFile('avatars', file, 'avatar-')
}
