// Halaman Inventaris: katalog barang, transaksi masuk/keluar, riwayat maintenance.
import { useMemo, useState, useEffect } from 'react'
import {
  Package, Plus, Search, ArrowUpCircle, ArrowDownCircle,
  Wrench, Trash2, Pencil, AlertTriangle, TrendingDown, ShoppingCart,
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ItemModal from '../components/inventory/ItemModal'
import TransactionModal from '../components/inventory/TransactionModal'
import MaintenanceModal from '../components/inventory/MaintenanceModal'
import { useInventoryStore } from '../app/store/useInventoryStore'
import { toast } from '../app/store/useToastStore'
import { INVENTORY_KATEGORI } from '../utils/constants'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const TABS = ['Katalog', 'Transaksi', 'Maintenance']

const TIPE_LABEL = { aset: 'Aset', supplies: 'Supplies', properti: 'Properti' }
const TIPE_COLOR = {
  aset:     'bg-primary-container/60 text-primary',
  supplies: 'bg-secondary-container/60 text-secondary',
  properti: 'bg-tertiary-container/60 text-tertiary',
}

// Warna badge kategori — rotasi dari palet token
const KATEGORI_COLOR = [
  'bg-primary-container/40 text-primary',
  'bg-secondary-container/40 text-secondary',
  'bg-tertiary-container/40 text-tertiary',
  'bg-error/10 text-error',
]
const kategoriColor = (nama) => {
  const idx = INVENTORY_KATEGORI.findIndex((k) => k.nama === nama)
  return KATEGORI_COLOR[idx % KATEGORI_COLOR.length] || 'bg-surface-variant text-on-surface-variant'
}

function formatRp(n) {
  if (!n) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatTgl(s) {
  if (!s) return '—'
  try { return format(new Date(s), 'd MMM yyyy', { locale: localeId }) } catch { return s }
}

export default function InventarisPage() {
  const { items, transactions, maintenance, loading, loaded, load } = useInventoryStore()
  const removeItem = useInventoryStore((s) => s.removeItem)
  const removeTransaction = useInventoryStore((s) => s.removeTransaction)
  const removeMaintenance = useInventoryStore((s) => s.removeMaintenance)

  const [tab, setTab] = useState('Katalog')
  const [search, setSearch] = useState('')
  const [tipeFilter, setTipeFilter] = useState('')
  const [kategoriFilter, setKategoriFilter] = useState('')

  // Modals
  const [itemModal, setItemModal] = useState({ open: false, item: null })
  const [trxModal, setTrxModal] = useState({ open: false, itemId: null })
  const [mtnModal, setMtnModal] = useState({ open: false, record: null, itemId: null })
  const [confirmDel, setConfirmDel] = useState({ open: false, label: '', onConfirm: null })

  useEffect(() => { if (!loaded) load() }, [loaded, load])

  // ─── Reorder list ─────────────────────────────────────────────────────────
  const reorderItems = useMemo(
    () => items.filter((x) => x.stok_minimum > 0 && x.stok_saat_ini <= x.stok_minimum),
    [items],
  )

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: items.length,
    stokRendah: reorderItems.length,
    perluMaintenance: (() => {
      // Item aset yang belum pernah maintenance atau terakhir maintenance > 6 bulan
      const asetIds = new Set(items.filter((x) => x.tipe === 'aset').map((x) => x.id))
      const lastMtn = {}
      maintenance.forEach((m) => { if (!lastMtn[m.item_id] || m.tanggal > lastMtn[m.item_id]) lastMtn[m.item_id] = m.tanggal })
      return [...asetIds].filter((id) => {
        if (!lastMtn[id]) return true
        return (Date.now() - new Date(lastMtn[id])) / 86400000 > 180
      }).length
    })(),
  }), [items, maintenance, reorderItems])

  // ─── Filtered lists ───────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((x) => {
      if (tipeFilter && x.tipe !== tipeFilter) return false
      if (kategoriFilter && x.kategori !== kategoriFilter) return false
      if (q && !`${x.kode} ${x.nama} ${x.kategori || ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, search, tipeFilter, kategoriFilter])

  const filteredTrx = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions.filter((x) => {
      if (!q) return true
      return `${x.item?.kode || ''} ${x.item?.nama || ''} ${x.keterangan || ''}`.toLowerCase().includes(q)
    })
  }, [transactions, search])

  const filteredMtn = useMemo(() => {
    const q = search.trim().toLowerCase()
    return maintenance.filter((x) => {
      if (!q) return true
      return `${x.item?.kode || ''} ${x.item?.nama || ''} ${x.tipe_maintenance || ''} ${x.teknisi || ''}`.toLowerCase().includes(q)
    })
  }, [maintenance, search])

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const confirmDelete = (label, fn) =>
    setConfirmDel({ open: true, label, onConfirm: fn })

  const handleDeleteItem = (item) =>
    confirmDelete(`barang "${item.nama}"`, async () => {
      try { await removeItem(item.id); toast.success('Barang dihapus') }
      catch (e) { toast.error(e.message || 'Gagal menghapus') }
    })

  const handleDeleteTrx = (trx) =>
    confirmDelete('transaksi ini (stok akan dikembalikan)', async () => {
      try { await removeTransaction(trx.id); toast.success('Transaksi dihapus') }
      catch (e) { toast.error(e.message || 'Gagal menghapus') }
    })

  const handleDeleteMtn = (m) =>
    confirmDelete('catatan maintenance ini', async () => {
      try { await removeMaintenance(m.id); toast.success('Catatan dihapus') }
      catch (e) { toast.error(e.message || 'Gagal menghapus') }
    })

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-lg p-md lg:p-xl min-h-full">
      <PageHeader title="Inventaris" subtitle="Katalog barang, stok, dan perawatan peralatan">
        <Button onClick={() => setItemModal({ open: true, item: null })}>
          <Plus size={16} /> Tambah Barang
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-md">
        <StatCard icon={<Package size={20} />} label="Total Barang" value={stats.total} color="text-primary" />
        <StatCard icon={<TrendingDown size={20} />} label="Perlu Reorder" value={stats.stokRendah}
          color={stats.stokRendah > 0 ? 'text-warning' : 'text-on-surface-variant'} />
        <StatCard icon={<Wrench size={20} />} label="Perlu Maintenance" value={stats.perluMaintenance}
          color={stats.perluMaintenance > 0 ? 'text-error' : 'text-on-surface-variant'} />
      </div>

      {/* Reorder Alert Panel */}
      {reorderItems.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-lg py-md flex flex-col gap-sm">
          <div className="flex items-center gap-sm text-warning font-h3 text-h3">
            <ShoppingCart size={16} />
            <span>Perlu Reorder ({reorderItems.length} barang)</span>
          </div>
          <div className="flex flex-wrap gap-sm">
            {reorderItems.map((x) => (
              <div key={x.id}
                className="flex items-center gap-sm bg-surface-container rounded-lg px-md py-xs border border-warning/20 text-body font-body"
              >
                <span className="text-on-surface-variant font-mono text-xs">{x.kode}</span>
                <span className="text-on-surface">{x.nama}</span>
                <span className="text-warning font-medium text-xs">
                  {x.stok_saat_ini}/{x.stok_minimum} {x.satuan}
                </span>
                <button
                  onClick={() => setTrxModal({ open: true, itemId: x.id })}
                  className="text-xs text-primary hover:underline"
                  title="Catat stok masuk"
                >
                  + Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-surface-container rounded-xl border border-outline-variant/10 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-outline-variant/10">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch('') }}
              className={`px-lg py-md font-h3 text-h3 transition-colors ${
                tab === t
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5'
              }`}
            >
              {t}
              {t === 'Katalog' && stats.stokRendah > 0 && (
                <span className="ml-xs text-xs bg-warning/20 text-warning px-xs py-[1px] rounded-full">
                  {stats.stokRendah}
                </span>
              )}
            </button>
          ))}

          <div className="flex items-center gap-sm ml-auto px-md">
            {tab === 'Transaksi' && (
              <Button variant="secondary" onClick={() => setTrxModal({ open: true, itemId: null })}>
                <Plus size={14} /> Catat Transaksi
              </Button>
            )}
            {tab === 'Maintenance' && (
              <Button variant="secondary" onClick={() => setMtnModal({ open: true, record: null, itemId: null })}>
                <Plus size={14} /> Catat Maintenance
              </Button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-sm px-md py-sm border-b border-outline-variant/10 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'Katalog' ? 'Cari kode / nama barang…' : 'Cari…'}
              className="w-full pl-8 pr-md py-sm bg-surface-container-low border border-outline-variant/20 rounded-lg text-body font-body text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {tab === 'Katalog' && (
            <>
              <select
                value={kategoriFilter}
                onChange={(e) => setKategoriFilter(e.target.value)}
                className="bg-surface-container-low border border-outline-variant/20 rounded-lg px-md py-sm text-body font-body text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Semua Kategori</option>
                {INVENTORY_KATEGORI.map((k) => (
                  <option key={k.nama} value={k.nama}>{k.nama}</option>
                ))}
              </select>
              <select
                value={tipeFilter}
                onChange={(e) => setTipeFilter(e.target.value)}
                className="bg-surface-container-low border border-outline-variant/20 rounded-lg px-md py-sm text-body font-body text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Semua Tipe</option>
                <option value="aset">Aset</option>
                <option value="supplies">Supplies</option>
                <option value="properti">Properti</option>
              </select>
            </>
          )}
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          {loading && !loaded ? (
            <div className="p-xl"><Skeleton className="h-40" /></div>
          ) : (
            <>
              {tab === 'Katalog' && (
                <KatalogTab
                  items={filteredItems}
                  onEdit={(x) => setItemModal({ open: true, item: x })}
                  onDelete={handleDeleteItem}
                  onTrx={(id) => setTrxModal({ open: true, itemId: id })}
                  onMtn={(id) => setMtnModal({ open: true, record: null, itemId: id })}
                />
              )}
              {tab === 'Transaksi' && (
                <TransaksiTab items={filteredTrx} onDelete={handleDeleteTrx} />
              )}
              {tab === 'Maintenance' && (
                <MaintenanceTab
                  records={filteredMtn}
                  onEdit={(m) => setMtnModal({ open: true, record: m, itemId: null })}
                  onDelete={handleDeleteMtn}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <ItemModal
        open={itemModal.open}
        item={itemModal.item}
        onClose={() => setItemModal({ open: false, item: null })}
      />
      <TransactionModal
        open={trxModal.open}
        defaultItemId={trxModal.itemId}
        onClose={() => setTrxModal({ open: false, itemId: null })}
      />
      <MaintenanceModal
        open={mtnModal.open}
        record={mtnModal.record}
        defaultItemId={mtnModal.itemId}
        onClose={() => setMtnModal({ open: false, record: null, itemId: null })}
      />
      <ConfirmDialog
        open={confirmDel.open}
        title="Konfirmasi Hapus"
        message={`Yakin ingin menghapus ${confirmDel.label}?`}
        onConfirm={() => { confirmDel.onConfirm?.(); setConfirmDel({ open: false }) }}
        onClose={() => setConfirmDel({ open: false })}
      />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/10 p-md flex items-center gap-md">
      <div className={`${color} opacity-80`}>{icon}</div>
      <div>
        <p className="text-label-tag font-label-tag text-on-surface-variant uppercase tracking-wide">{label}</p>
        <p className={`font-h1 text-h1 ${color}`}>{value}</p>
      </div>
    </div>
  )
}

function KatalogTab({ items, onEdit, onDelete, onTrx, onMtn }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Belum ada barang"
        description="Tambah barang pertama untuk mulai tracking inventaris."
      />
    )
  }
  return (
    <table className="w-full text-body font-body">
      <thead>
        <tr className="border-b border-outline-variant/10 text-on-surface-variant text-label-tag font-label-tag uppercase tracking-wider">
          <Th>Kode</Th>
          <Th>Nama Barang</Th>
          <Th>Kategori</Th>
          <Th>Tipe</Th>
          <Th className="text-right">Stok</Th>
          <Th className="text-right">Min</Th>
          <Th>Lokasi</Th>
          <Th></Th>
        </tr>
      </thead>
      <tbody>
        {items.map((x) => {
          const needsReorder = x.stok_minimum > 0 && x.stok_saat_ini <= x.stok_minimum
          return (
            <tr key={x.id} className={`border-b border-outline-variant/5 hover:bg-on-surface/[0.02] transition-colors ${needsReorder ? 'bg-warning/[0.03]' : ''}`}>
              <Td className="font-mono text-xs text-on-surface-variant">{x.kode}</Td>
              <Td>
                <span className="text-on-surface font-medium">{x.nama}</span>
                {needsReorder && (
                  <span className="ml-sm inline-flex items-center gap-xs text-warning text-xs">
                    <AlertTriangle size={11} /> Reorder
                  </span>
                )}
              </Td>
              <Td>
                {x.kategori ? (
                  <span className={`text-xs px-sm py-[2px] rounded-full ${kategoriColor(x.kategori)}`}>
                    {x.kategori}
                  </span>
                ) : (
                  <span className="text-on-surface-variant/40 text-xs">—</span>
                )}
              </Td>
              <Td>
                <span className={`text-xs px-sm py-[2px] rounded-full ${TIPE_COLOR[x.tipe] || ''}`}>
                  {TIPE_LABEL[x.tipe] || x.tipe}
                </span>
              </Td>
              <Td className={`text-right font-medium ${needsReorder ? 'text-warning' : 'text-on-surface'}`}>
                {x.stok_saat_ini} <span className="text-on-surface-variant font-normal text-xs">{x.satuan}</span>
              </Td>
              <Td className="text-right text-on-surface-variant">{x.stok_minimum || '—'}</Td>
              <Td className="text-on-surface-variant text-xs">{x.lokasi || '—'}</Td>
              <Td>
                <div className="flex items-center gap-xs justify-end">
                  <ActionBtn title="Catat Transaksi" onClick={() => onTrx(x.id)}>
                    <ArrowUpCircle size={14} />
                  </ActionBtn>
                  {x.tipe === 'aset' && (
                    <ActionBtn title="Catat Maintenance" onClick={() => onMtn(x.id)}>
                      <Wrench size={14} />
                    </ActionBtn>
                  )}
                  <ActionBtn title="Edit" onClick={() => onEdit(x)}>
                    <Pencil size={14} />
                  </ActionBtn>
                  <ActionBtn title="Hapus" onClick={() => onDelete(x)} danger>
                    <Trash2 size={14} />
                  </ActionBtn>
                </div>
              </Td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function TransaksiTab({ items, onDelete }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ArrowUpCircle}
        title="Belum ada transaksi"
        description="Catat transaksi masuk atau keluar untuk mulai tracking pergerakan stok."
      />
    )
  }
  return (
    <table className="w-full text-body font-body">
      <thead>
        <tr className="border-b border-outline-variant/10 text-on-surface-variant text-label-tag font-label-tag uppercase tracking-wider">
          <Th>Tanggal</Th>
          <Th>Barang</Th>
          <Th>Tipe</Th>
          <Th className="text-right">Jumlah</Th>
          <Th>Keterangan</Th>
          <Th></Th>
        </tr>
      </thead>
      <tbody>
        {items.map((x) => (
          <tr key={x.id} className="border-b border-outline-variant/5 hover:bg-on-surface/[0.02] transition-colors">
            <Td className="text-on-surface-variant text-xs whitespace-nowrap">{formatTgl(x.tanggal)}</Td>
            <Td>
              <span className="text-on-surface">{x.item?.nama || '—'}</span>
              <span className="ml-xs text-on-surface-variant font-mono text-xs">{x.item?.kode}</span>
            </Td>
            <Td>
              <span className={`inline-flex items-center gap-xs text-xs px-sm py-[2px] rounded-full font-medium ${
                x.tipe === 'masuk' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
              }`}>
                {x.tipe === 'masuk' ? <ArrowUpCircle size={11} /> : <ArrowDownCircle size={11} />}
                {x.tipe === 'masuk' ? 'Masuk' : 'Keluar'}
              </span>
            </Td>
            <Td className="text-right font-medium text-on-surface">
              {x.jumlah} <span className="text-on-surface-variant font-normal text-xs">{x.item?.satuan}</span>
            </Td>
            <Td className="text-on-surface-variant text-xs">{x.keterangan || '—'}</Td>
            <Td>
              <ActionBtn title="Hapus" onClick={() => onDelete(x)} danger>
                <Trash2 size={14} />
              </ActionBtn>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function MaintenanceTab({ records, onEdit, onDelete }) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="Belum ada catatan maintenance"
        description="Catat riwayat servis atau perbaikan untuk setiap peralatan."
      />
    )
  }
  return (
    <table className="w-full text-body font-body">
      <thead>
        <tr className="border-b border-outline-variant/10 text-on-surface-variant text-label-tag font-label-tag uppercase tracking-wider">
          <Th>Tanggal</Th>
          <Th>Peralatan</Th>
          <Th>Tipe</Th>
          <Th>Deskripsi</Th>
          <Th className="text-right">Biaya</Th>
          <Th>Teknisi</Th>
          <Th></Th>
        </tr>
      </thead>
      <tbody>
        {records.map((m) => (
          <tr key={m.id} className="border-b border-outline-variant/5 hover:bg-on-surface/[0.02] transition-colors">
            <Td className="text-on-surface-variant text-xs whitespace-nowrap">{formatTgl(m.tanggal)}</Td>
            <Td>
              <span className="text-on-surface">{m.item?.nama || '—'}</span>
              <span className="ml-xs text-on-surface-variant font-mono text-xs">{m.item?.kode}</span>
            </Td>
            <Td>
              <span className="text-xs px-sm py-[2px] rounded-full bg-primary-container/40 text-primary">
                {m.tipe_maintenance || '—'}
              </span>
            </Td>
            <Td className="text-on-surface-variant text-xs max-w-[200px] truncate">{m.deskripsi || '—'}</Td>
            <Td className="text-right text-on-surface text-xs">{formatRp(m.biaya)}</Td>
            <Td className="text-on-surface-variant text-xs">{m.teknisi || '—'}</Td>
            <Td>
              <div className="flex items-center gap-xs justify-end">
                <ActionBtn title="Edit" onClick={() => onEdit(m)}>
                  <Pencil size={14} />
                </ActionBtn>
                <ActionBtn title="Hapus" onClick={() => onDelete(m)} danger>
                  <Trash2 size={14} />
                </ActionBtn>
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Th({ children, className = '' }) {
  return <th className={`px-md py-sm text-left ${className}`}>{children}</th>
}
function Td({ children, className = '' }) {
  return <td className={`px-md py-sm align-middle ${className}`}>{children}</td>
}
function ActionBtn({ children, onClick, title, danger = false }) {
  return (
    <button onClick={onClick} title={title}
      className={`p-[6px] rounded-lg transition-colors ${
        danger
          ? 'text-on-surface-variant hover:text-error hover:bg-error/10'
          : 'text-on-surface-variant hover:text-primary hover:bg-primary/10'
      }`}
    >
      {children}
    </button>
  )
}
