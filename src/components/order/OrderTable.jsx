// Tabel order: sortable per kolom, pagination 20/halaman,
// ubah status inline (dropdown), detail (edit), dan hapus dengan konfirmasi.
import { useState, useMemo } from 'react'
import { ArrowUpDown, Pencil, Trash2, ChevronLeft, ChevronRight, ExternalLink, MessageCircle } from 'lucide-react'
import Avatar from '../ui/Avatar'
import ConfirmDialog from '../ui/ConfirmDialog'
import { STATUS_BADGE } from '../../utils/colors'
import { ORDER_STATUSES, PAGE_SIZE } from '../../utils/constants'
import { formatRupiah, formatDateShort } from '../../utils/dateHelpers'
import { computeStatusPatch } from '../../utils/orderStatus'
import { waLink } from '../../utils/whatsapp'
import { useOrderStore } from '../../app/store/useOrderStore'
import { toast } from '../../app/store/useToastStore'

const COLUMNS = [
  { key: 'no', label: 'No', sortable: false },
  { key: 'interpreter', label: 'Interpreter', sortable: true },
  { key: 'client_name', label: 'Klien', sortable: true },
  { key: 'quotation_number', label: 'No. Quotation', sortable: true },
  { key: 'date', label: 'Tanggal', sortable: true },
  { key: 'duration_hours', label: 'Durasi', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'fee_estimate', label: 'Fee', sortable: true },
  { key: 'invoice', label: 'Invoice', sortable: false },
  { key: 'aksi', label: 'Aksi', sortable: false },
]

export default function OrderTable({ orders, interpretersById, onEdit }) {
  const editOrder = useOrderStore((s) => s.edit)
  const removeOrder = useOrderStore((s) => s.remove)

  const [sort, setSort] = useState({ key: 'date', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [delTarget, setDelTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Urutkan order sesuai kolom aktif.
  const sorted = useMemo(() => {
    const arr = [...orders]
    arr.sort((a, b) => {
      let va, vb
      if (sort.key === 'interpreter') {
        va = interpretersById[a.interpreter_id]?.name || ''
        vb = interpretersById[b.interpreter_id]?.name || ''
      } else {
        va = a[sort.key]
        vb = b[sort.key]
      }
      if (va == null) va = ''
      if (vb == null) vb = ''
      if (typeof va === 'number' && typeof vb === 'number') {
        return sort.dir === 'asc' ? va - vb : vb - va
      }
      return sort.dir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    })
    return arr
  }, [orders, sort, interpretersById])

  // Potong untuk halaman aktif.
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const pageRows = sorted.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)

  const toggleSort = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    )

  // Ubah status via dropdown inline (+ efek samping: estimasi jatuh tempo / tanggal bayar).
  const handleStatus = async (order, status) => {
    if (order.status === status) return
    const patch = computeStatusPatch(order, status)
    try {
      useOrderStore.getState().applyUpdate({ ...order, ...patch })
      await editOrder(order.id, patch)
      toast.success('Status order berubah')
    } catch (err) {
      useOrderStore.getState().applyUpdate(order)
      toast.error('Gagal mengubah status')
      console.error(err)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await removeOrder(delTarget.id)
      toast.success('Order dihapus')
      setDelTarget(null)
    } catch (err) {
      toast.error('Gagal menghapus order')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-surface-container border border-outline-variant/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`px-lg py-md font-label-tag text-label-tag text-on-surface-variant uppercase tracking-wider ${
                      col.key === 'fee_estimate' ? 'text-right' : ''
                    } ${col.key === 'aksi' || col.key === 'invoice' ? 'text-center' : ''}`}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-xs hover:text-on-surface transition-colors"
                      >
                        {col.label}
                        <ArrowUpDown size={12} className={sort.key === col.key ? 'text-primary' : 'opacity-40'} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {pageRows.map((order, idx) => {
                const it = interpretersById[order.interpreter_id]
                return (
                  <tr key={order.id} className="hover:bg-on-surface/5 transition-colors">
                    <td className="px-lg py-md font-body text-body text-on-surface-variant">
                      {(pageClamped - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <Avatar name={it?.name} colorKey={it?.color_key} avatarUrl={it?.avatar_url} size="sm" />
                        <span className="font-body text-body font-semibold text-on-surface whitespace-nowrap">
                          {it?.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-lg py-md font-body text-body text-on-surface whitespace-nowrap">
                      {order.client_name}
                    </td>
                    <td className="px-lg py-md font-body text-body text-on-surface-variant whitespace-nowrap">
                      {order.quotation_number || '—'}
                    </td>
                    <td className="px-lg py-md font-body text-body text-on-surface-variant whitespace-nowrap">
                      {formatDateShort(order.date)}
                    </td>
                    <td className="px-lg py-md font-body text-body text-on-surface-variant">
                      {order.duration_hours ? `${order.duration_hours} jam` : '—'}
                    </td>
                    <td className="px-lg py-md">
                      {(() => {
                        const sb = STATUS_BADGE[order.status] || STATUS_BADGE.quotation
                        return (
                          <select
                            value={order.status}
                            onChange={(e) => handleStatus(order, e.target.value)}
                            title="Ubah status"
                            className={`appearance-none border rounded-full uppercase cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                              sb.anim || ''
                            }`}
                            style={{
                              backgroundColor: sb.bg,
                              color: sb.text,
                              borderColor: sb.border,
                              borderWidth: '1px',
                              padding: '6px 14px',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option
                                key={s.key}
                                value={s.key}
                                className="bg-surface-container text-on-surface"
                              >
                                {s.label}
                              </option>
                            ))}
                          </select>
                        )
                      })()}
                    </td>
                    <td className="px-lg py-md font-body text-body text-on-surface text-right whitespace-nowrap">
                      {formatRupiah(order.fee_estimate)}
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex items-center justify-center">
                        {order.invoice_link ? (
                          <a
                            href={order.invoice_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka invoice di tab baru"
                            className="text-on-surface-variant hover:text-primary transition-colors"
                          >
                            <ExternalLink size={18} />
                          </a>
                        ) : (
                          <span className="text-on-surface-variant/30">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex items-center justify-center gap-md">
                        {order.whatsapp && (
                          <a
                            href={waLink(order.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Follow up via WhatsApp"
                            className="text-on-surface-variant hover:text-[#25D366] transition-colors"
                          >
                            <MessageCircle size={18} />
                          </a>
                        )}
                        <button
                          onClick={() => onEdit(order)}
                          className="text-on-surface-variant hover:text-primary transition-colors"
                          title="Detail / Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => setDelTarget(order)}
                          className="text-on-surface-variant hover:text-error transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-lg py-md bg-surface-container-high/30 border-t border-outline-variant/10 flex items-center justify-between">
          <p className="font-caption text-caption text-on-surface-variant">
            Menampilkan {pageRows.length} dari {sorted.length} order
          </p>
          <div className="flex items-center gap-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pageClamped <= 1}
              className="w-8 h-8 rounded flex items-center justify-center border border-outline-variant/20 text-on-surface-variant hover:bg-on-surface/5 disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-label-tag text-label-tag text-on-surface px-sm">
              {pageClamped} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageClamped >= totalPages}
              className="w-8 h-8 rounded flex items-center justify-center border border-outline-variant/20 text-on-surface-variant hover:bg-on-surface/5 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(delTarget)}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Order"
        message={`Yakin ingin menghapus order "${delTarget?.client_name}"?`}
      />
    </>
  )
}
