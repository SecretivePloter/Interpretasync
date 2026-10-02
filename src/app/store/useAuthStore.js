// Store role user yang sedang login. Dipopulasi App.jsx setelah session diperoleh.
// Dipakai Sidebar (filter menu) dan RequireRole (guard route).
import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  role: null, // 'manajemen' | 'operator' | null (null = belum dimuat)
  setRole: (role) => set({ role }),
  clearRole: () => set({ role: null }),
}))
