// Store pengaturan aplikasi (timezone, currency).
import { create } from 'zustand'
import { fetchSettings, saveSetting } from '../../services/settings'

export const useSettingsStore = create((set, get) => ({
  settings: { timezone: 'GMT+7', currency: 'IDR' },
  loaded: false,

  // Muat setting dari Supabase (merge dengan default).
  load: async () => {
    try {
      const data = await fetchSettings()
      set((s) => ({ settings: { ...s.settings, ...data }, loaded: true }))
    } catch {
      set({ loaded: true })
    }
  },

  // Simpan satu setting + perbarui state lokal.
  set: async (key, value) => {
    await saveSetting(key, value)
    set((s) => ({ settings: { ...s.settings, [key]: value } }))
  },

  get: (key) => get().settings[key],
}))
