// Store notifikasi toast global. Komponen memanggil toast.success/error/info.
import { create } from 'zustand'

let counter = 0

export const useToastStore = create((set) => ({
  toasts: [],

  // Tambah toast; otomatis hilang setelah `duration` ms.
  push: (message, type = 'info', duration = 3000) => {
    const id = ++counter
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }
  },

  // Hapus toast manual (klik tombol close).
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Helper ringkas agar pemanggilan enak dibaca.
export const toast = {
  success: (msg) => useToastStore.getState().push(msg, 'success'),
  error: (msg) => useToastStore.getState().push(msg, 'error'),
  info: (msg) => useToastStore.getState().push(msg, 'info'),
}
