// Store tema aplikasi (light/dark). Default 'dark'.
// Preferensi disimpan ke localStorage agar tidak reset saat refresh.
// Penerapan class '.dark' ke <html> dikelola di sini (bukan di komponen).
import { create } from 'zustand'

const STORAGE_KEY = 'ichikara-theme'

// Baca preferensi tersimpan; fallback ke 'dark' bila kosong/invalid.
function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : 'dark'
  } catch {
    return 'dark'
  }
}

// Terapkan/lepas class 'dark' pada elemen <html>.
function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useThemeStore = create((set, get) => ({
  theme: readStored(),

  // Ganti tema -> simpan ke localStorage + terapkan ke DOM.
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* localStorage tidak tersedia — abaikan */
    }
    applyTheme(next)
    set({ theme: next })
  },
}))

// Sinkronkan class DOM dengan tema awal saat modul dimuat.
applyTheme(useThemeStore.getState().theme)
