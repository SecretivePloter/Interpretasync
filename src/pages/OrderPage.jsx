// Halaman Order Tracking: toggle Tabel/Kanban, filter, insight, CRUD order.
import { useMemo, useState } from 'react'
import { Table2, LayoutGrid, Plus, Search, ClipboardList, FileSpreadsheet } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import OrderTable from '../components/order/OrderTable'
import OrderKanban from '../components/order/OrderKanban'
import OrderInsights from '../components/order/OrderInsights'
import OrderModal from '../components/order/OrderModal'
import { useOrderStore } from '../app/store/useOrderStore'
import { useInterpreterStore } from '../app/store/useInterpreterStore'
import { toast } from '../app/store/useToastStore'
import { ORDER_STATUSES } from '../utils/constants'
import { exportOrdersToExcel } from '../utils/exportOrders'

export default function OrderPage() {
  const orders = useOrderStore((s) => s.orders)
  const loading = useOrderStore((s) => s.loading)
  const loaded = useOrderStore((s) => s.loaded)
  const interpreters = useInterpreterStore((s) => s.interpreters)

  const [view, setView] = useState('table') // 'table' | 'kanban'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [interpreterFilter, setInterpreterFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [modal, setModal] = useState({ open: false, order: null })

  const interpretersById = useMemo(
    () => Object.fromEntries(interpreters.map((i) => [i.id, i])),
    [interpreters],
  )

  // Terapkan semua filter (nama interpreter, status, rentang tanggal).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      const it = interpretersById[o.interpreter_id]
      if (q) {
        const hay = `${it?.name || ''} ${o.client_name}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (interpreterFilter && o.interpreter_id !== interpreterFilter) return false
      if (statusFilter && o.status !== statusFilter) return false
      if (dateFrom && o.date < dateFrom) return false
      if (dateTo && o.date > dateTo) return false
      return true
    })
  }, [orders, search, statusFilter, interpreterFilter, dateFrom, dateTo, interpretersById])

  const openNew = () => setModal({ open: true, order: null })
  const openEdit = (order) => setModal({ open: true, order })
  const closeModal = () => setModal({ open: false, order: null })

  // Ekspor data order yang sedang tampil (mengikuti filter) ke Excel.
  const handleExport = () => {
    if (filtered.length === 0) return toast.error('Tidak ada data untuk diekspor')
    try {
      exportOrdersToExcel(filtered, interpretersById)
      toast.success(`${filtered.length} order diekspor ke Excel`)
    } catch (err) {
      toast.error('Gagal mengekspor ke Excel')
      console.error(err)
    }
  }

  return (
    <>
      <PageHeader title="Order Tracking" subtitle="Pantau status order interpreter">
        {/* Toggle tampilan */}
        <div className="flex bg-surface-container-high p-xs rounded-lg border border-outline-variant/10">
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-sm px-md py-xs rounded-md font-h3 text-h3 transition-all ${
              view === 'table'
                ? 'bg-primary text-on-primary-container'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Table2 size={18} /> Tabel
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-sm px-md py-xs rounded-md font-h3 text-h3 transition-all ${
              view === 'kanban'
                ? 'bg-primary text-on-primary-container'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <LayoutGrid size={18} /> Kanban
          </button>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          <FileSpreadsheet size={18} /> Export Excel
        </Button>
        <Button onClick={openNew}>
          <Plus size={18} /> Tambah Order
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-md lg:p-xl">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-md mb-lg lg:mb-xl bg-surface-container p-md rounded-xl border border-outline-variant/10">
          <div className="flex-1 min-w-[200px] flex items-center gap-sm px-md py-sm rounded-lg bg-surface-container-low border border-outline-variant/10">
            <Search size={18} className="text-on-surface-variant" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari klien / interpreter…"
              className="bg-transparent border-none focus:outline-none text-body font-body w-full text-on-surface placeholder:text-on-surface-variant/60"
            />
          </div>
          <Select
            value={interpreterFilter}
            onChange={(e) => setInterpreterFilter(e.target.value)}
            className="min-w-[160px]"
          >
            <option value="">Semua Interpreter</option>
            {interpreters.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-w-[140px]"
          >
            <option value="">Semua Status</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
          <div className="flex items-center gap-xs">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/10 rounded-lg px-sm py-sm text-body font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-on-surface-variant">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/10 rounded-lg px-sm py-sm text-body font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Insight */}
        {loaded && orders.length > 0 && <OrderInsights orders={filtered} />}

        {/* Konten */}
        {!loaded && loading ? (
          <div className="flex flex-col gap-md">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Belum ada order"
            description={
              orders.length === 0
                ? 'Tambahkan order pertama Anda untuk mulai melacak status.'
                : 'Tidak ada order yang cocok dengan filter saat ini.'
            }
            action={
              orders.length === 0 ? (
                <Button onClick={openNew}>
                  <Plus size={18} /> Tambah Order
                </Button>
              ) : null
            }
          />
        ) : view === 'table' ? (
          <OrderTable
            orders={filtered}
            interpretersById={interpretersById}
            onEdit={openEdit}
          />
        ) : (
          <OrderKanban
            orders={filtered}
            interpretersById={interpretersById}
            onEdit={openEdit}
          />
        )}
      </div>

      <OrderModal
        open={modal.open}
        onClose={closeModal}
        order={modal.order}
        interpreters={interpreters}
      />
    </>
  )
}
