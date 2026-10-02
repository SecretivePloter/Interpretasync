// Store global event/jadwal. Semua event dimuat, kalender memfilter per minggu.
import { create } from 'zustand'
import {
  fetchAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../../services/events'

export const useEventStore = create((set) => ({
  events: [],
  loading: false,
  loaded: false,

  // Muat semua event.
  load: async () => {
    set({ loading: true })
    try {
      const data = await fetchAllEvents()
      set({ events: data, loaded: true })
    } finally {
      set({ loading: false })
    }
  },

  add: async (payload) => createEvent(payload),
  edit: async (id, payload) => updateEvent(id, payload),
  remove: async (id) => deleteEvent(id),

  // Handler realtime.
  applyInsert: (row) => set((s) => ({ events: [...s.events, row] })),
  applyUpdate: (row) =>
    set((s) => ({ events: s.events.map((e) => (e.id === row.id ? row : e)) })),
  applyDelete: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
}))
