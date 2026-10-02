// Semua logika autentikasi terpusat di sini (tidak ada di komponen).
import { supabase } from './supabase'
import { LOGIN_EMAIL_DOMAIN } from '../utils/constants'
export { fetchUserRole } from './inventory'

// Ubah input username menjadi email. Jika sudah berupa email, pakai apa adanya;
// jika hanya username, tambahkan domain default (mis. "admin" -> "admin@ichikara.co.id").
function toEmail(username) {
  const u = (username || '').trim()
  return u.includes('@') ? u : `${u}@${LOGIN_EMAIL_DOMAIN}`
}

// Login dengan username/email + password pada project operasional tunggal.
export async function login(username, password) {
  const email = toEmail(username)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error('Username atau password salah')
  }
  return data.user
}

// Logout dari project operasional.
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Ambil session yang sedang aktif (null bila belum login).
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Subscribe perubahan status auth; kembalikan fungsi unsubscribe.
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => data.subscription.unsubscribe()
}
