// Pengaturan aplikasi (app_settings) + upload file ke Supabase Storage.
import { supabase } from './supabase'

const AVATAR_BUCKET = 'ichikara_avatars'
const AVATAR_SIGNED_URL_TTL = 60 * 60
const avatarUrlCache = new Map()

// Kenali path storage baru dan URL publik lama yang sudah terlanjur tersimpan.
export function getAvatarStoragePath(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  const raw = value.trim()

  if (/^https?:\/\//i.test(raw)) {
    try {
      const pathname = new URL(raw).pathname
      const markers = [
        `/storage/v1/object/public/${AVATAR_BUCKET}/`,
        `/storage/v1/object/authenticated/${AVATAR_BUCKET}/`,
        `/storage/v1/object/sign/${AVATAR_BUCKET}/`,
      ]
      const marker = markers.find((candidate) => pathname.includes(candidate))
      return marker
        ? decodeURIComponent(pathname.slice(pathname.indexOf(marker) + marker.length))
        : null
    } catch {
      return null
    }
  }

  if (raw.startsWith(`${AVATAR_BUCKET}/`)) return raw.slice(AVATAR_BUCKET.length + 1)
  if (raw.startsWith('/') || raw.includes('://') || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return null
  return raw
}

// Bucket avatar bersifat private; URL singkat dibuat hanya untuk tampilan UI.
export async function resolveAvatarUrl(value, { forceRefresh = false } = {}) {
  const path = getAvatarStoragePath(value)
  if (!path) return value || ''

  const cached = avatarUrlCache.get(path)
  if (!forceRefresh && cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.promise
  }

  const promise = supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, AVATAR_SIGNED_URL_TTL)
    .then(({ data, error }) => {
      if (error) throw error
      if (!data?.signedUrl) throw new Error('URL foto tidak berhasil dibuat')
      avatarUrlCache.set(path, {
        promise: Promise.resolve(data.signedUrl),
        expiresAt: Date.now() + AVATAR_SIGNED_URL_TTL * 1000,
      })
      return data.signedUrl
    })
    .catch((error) => {
      avatarUrlCache.delete(path)
      throw error
    })

  avatarUrlCache.set(path, {
    promise,
    expiresAt: Date.now() + AVATAR_SIGNED_URL_TTL * 1000,
  })
  return promise
}

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

// Upload avatar interpreter -> simpan path private di kolom avatar_url.
export async function uploadAvatar(file) {
  const extension = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
  const fileName = `avatar-${crypto.randomUUID()}.${extension}`
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(fileName, file, {
      upsert: false,
      cacheControl: '3600',
      contentType: file.type || 'image/jpeg',
    })
  if (error) throw error
  return data.path || fileName
}

// Hapus objek baru bila penyimpanan profil gagal setelah upload.
export async function removeAvatar(path) {
  const storagePath = getAvatarStoragePath(path)
  if (!storagePath) return
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([storagePath])
  if (error) throw error
}
