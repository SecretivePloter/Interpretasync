// Store global order. Memuat semua order; filter/pagination di komponen.
import { create } from 'zustand'
import {
  fetchOrders,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  autoFlagOverdue,
} from '../../services/orders'

export const useOrderStore = create((set) => ({
  orders: [],
  loading: false,
  loaded: false,

  // Muat semua order + jalankan follow-up otomatis (invoice lewat tempo -> overdue).
  load: async () => {
    set({ loading: true })
    try {
      const data = await fetchOrders()
      const synced = await autoFlagOverdue(data)
      set({ orders: synced, loaded: true })
    } finally {
      set({ loading: false })
    }
  },

  add: async (payload) => createOrder(payload),
  edit: async (id, payload) => updateOrder(id, payload),
  changeStatus: async (id, status) => updateOrderStatus(id, status),
  remove: async (id) => deleteOrder(id),

  // Handler realtime.
  applyInsert: (row) => set((s) => ({ orders: [row, ...s.orders] })),
  applyUpdate: (row) =>
    set((s) => ({ orders: s.orders.map((o) => (o.id === row.id ? row : o)) })),
  applyDelete: (id) =>
    set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),
}))
