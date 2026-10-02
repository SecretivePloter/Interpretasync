// Store global interpreter (data + aksi). Komponen tidak query Supabase langsung.
import { create } from 'zustand'
import {
  fetchInterpreters,
  createInterpreter,
  updateInterpreter,
  deleteInterpreter,
} from '../../services/interpreters'

export const useInterpreterStore = create((set, get) => ({
  interpreters: [],
  loading: false,
  loaded: false,

  // Muat semua interpreter dari Supabase.
  load: async () => {
    set({ loading: true })
    try {
      const data = await fetchInterpreters()
      set({ interpreters: data, loaded: true })
    } finally {
      set({ loading: false })
    }
  },

  // Cari interpreter dari state berdasarkan id.
  getById: (id) => get().interpreters.find((i) => i.id === id),

  // Aksi CRUD (UI memanggil ini; realtime menyinkronkan state lewat apply*).
  add: async (payload) => createInterpreter(payload),
  edit: async (id, payload) => updateInterpreter(id, payload),
  remove: async (id) => deleteInterpreter(id),

  // Handler realtime — jaga state tetap terurut by name.
  applyInsert: (row) =>
    set((s) => ({
      interpreters: [...s.interpreters, row].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    })),
  applyUpdate: (row) =>
    set((s) => ({
      interpreters: s.interpreters.map((i) => (i.id === row.id ? row : i)),
    })),
  applyDelete: (id) =>
    set((s) => ({ interpreters: s.interpreters.filter((i) => i.id !== id) })),
}))
