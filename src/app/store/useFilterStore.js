// Store filter kalender: interpreter mana yang disembunyikan.
// Pakai middleware persist agar state bertahan saat ganti minggu & reload
// (akses localStorage tetap di store, bukan di komponen).
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useFilterStore = create(
  persist(
    (set, get) => ({
      // Daftar interpreter_id yang sedang disembunyikan dari grid.
      hiddenIds: [],

      // Toggle tampil/sembunyi satu interpreter.
      toggle: (id) =>
        set((s) => ({
          hiddenIds: s.hiddenIds.includes(id)
            ? s.hiddenIds.filter((x) => x !== id)
            : [...s.hiddenIds, id],
        })),

      // Tampilkan semua (reset filter).
      showAll: () => set({ hiddenIds: [] }),

      // Tampilkan HANYA satu interpreter (dipakai dari tombol "Lihat Semua Jadwal").
      showOnly: (id, allIds) =>
        set({ hiddenIds: allIds.filter((x) => x !== id) }),

      // Cek apakah interpreter sedang terlihat.
      isVisible: (id) => !get().hiddenIds.includes(id),
    }),
    { name: 'ichikara-calendar-filter' },
  ),
)
