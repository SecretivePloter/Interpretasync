// Store global modul Inventaris.
import { create } from 'zustand'
import {
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  fetchTransactions,
  createTransaction,
  deleteTransaction,
  fetchMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from '../../services/inventory'

export const useInventoryStore = create((set, get) => ({
  items: [],
  transactions: [],
  maintenance: [],
  loading: false,
  loaded: false,

  load: async () => {
    set({ loading: true })
    try {
      const [items, transactions, maintenance] = await Promise.all([
        fetchItems(),
        fetchTransactions(),
        fetchMaintenance(),
      ])
      set({ items, transactions, maintenance, loaded: true })
    } finally {
      set({ loading: false })
    }
  },

  // ─── Items ─────────────────────────────────────────────────────────────────

  addItem: async (payload) => {
    const item = await createItem(payload)
    set((s) => ({ items: [...s.items, item].sort((a, b) => a.nama.localeCompare(b.nama)) }))
    return item
  },

  editItem: async (id, payload) => {
    const item = await updateItem(id, payload)
    set((s) => ({ items: s.items.map((x) => (x.id === id ? item : x)) }))
    return item
  },

  removeItem: async (id) => {
    await deleteItem(id)
    set((s) => ({
      items: s.items.filter((x) => x.id !== id),
      transactions: s.transactions.filter((x) => x.item_id !== id),
      maintenance: s.maintenance.filter((x) => x.item_id !== id),
    }))
  },

  // Sinkronisasi stok lokal setelah transaksi (hindari reload penuh).
  _patchStok: (itemId, delta) =>
    set((s) => ({
      items: s.items.map((x) =>
        x.id === itemId
          ? { ...x, stok_saat_ini: Math.max(0, x.stok_saat_ini + delta) }
          : x,
      ),
    })),

  // ─── Transaksi ──────────────────────────────────────────────────────────────

  addTransaction: async (payload) => {
    const trx = await createTransaction(payload)
    set((s) => ({ transactions: [trx, ...s.transactions] }))
    const delta = payload.tipe === 'masuk' ? payload.jumlah : -payload.jumlah
    get()._patchStok(payload.item_id, delta)
    return trx
  },

  removeTransaction: async (id) => {
    const trx = get().transactions.find((x) => x.id === id)
    await deleteTransaction(id)
    set((s) => ({ transactions: s.transactions.filter((x) => x.id !== id) }))
    if (trx) {
      const delta = trx.tipe === 'masuk' ? -trx.jumlah : trx.jumlah
      get()._patchStok(trx.item_id, delta)
    }
  },

  // ─── Maintenance ────────────────────────────────────────────────────────────

  addMaintenance: async (payload) => {
    const m = await createMaintenance(payload)
    set((s) => ({ maintenance: [m, ...s.maintenance] }))
    return m
  },

  editMaintenance: async (id, payload) => {
    const m = await updateMaintenance(id, payload)
    set((s) => ({ maintenance: s.maintenance.map((x) => (x.id === id ? m : x)) }))
    return m
  },

  removeMaintenance: async (id) => {
    await deleteMaintenance(id)
    set((s) => ({ maintenance: s.maintenance.filter((x) => x.id !== id) }))
  },
}))
