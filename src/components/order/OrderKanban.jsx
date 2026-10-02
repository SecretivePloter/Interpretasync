// Tampilan Kanban: 3 kolom (Quotation/Order/Invoice).
// Drag kartu antar kolom -> ubah status order (realtime sync).
import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core'
import OrderCard from './OrderCard'
import { KANBAN_COLUMNS, ORDER_STATUSES } from '../../utils/constants'
import { STATUS_COLORS, withAlpha } from '../../utils/colors'
import { computeStatusPatch } from '../../utils/orderStatus'
import { useOrderStore } from '../../app/store/useOrderStore'
import { toast } from '../../app/store/useToastStore'

// Label status untuk pesan toast.
const STATUS_LABELS = Object.fromEntries(ORDER_STATUSES.map((s) => [s.key, s.label]))

// Kolom yang bisa menerima drop.
function Column({ col, orders, interpretersById, onEdit }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key })
  const color = STATUS_COLORS[col.key]

  return (
    <div className="flex-1 min-w-[260px] flex flex-col gap-md">
      <div
        className="flex items-center justify-between px-md py-sm rounded-lg border"
        style={{ backgroundColor: withAlpha(color, 0.1), borderColor: withAlpha(color, 0.25) }}
      >
        <span className="font-h3 text-h3 uppercase tracking-wide" style={{ color }}>
          {col.label}
        </span>
        <span className="font-label-tag text-label-tag" style={{ color }}>
          {orders.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-md min-h-[120px] p-sm rounded-xl border border-dashed transition-colors ${
          isOver ? 'border-primary/50 bg-primary/5' : 'border-outline-variant/10'
        }`}
      >
        {orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            interpreter={interpretersById[o.interpreter_id]}
            onEdit={onEdit}
          />
        ))}
        {orders.length === 0 && (
          <div className="text-center py-lg text-caption text-on-surface-variant">
            Tidak ada order
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrderKanban({ orders, interpretersById, onEdit }) {
  const editOrder = useOrderStore((s) => s.edit)
  const [activeId, setActiveId] = useState(null)

  // Butuh sedikit pergerakan sebelum drag aktif (agar klik tombol edit tetap jalan).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const activeOrder = orders.find((o) => o.id === activeId)

  // Saat drop di kolom lain, ubah status.
  const handleDragEnd = async (event) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const order = orders.find((o) => o.id === active.id)
    const newStatus = over.id
    if (!order || order.status === newStatus) return

    // Optimistic update lewat store + persist (+ efek samping tanggal pembayaran).
    const patch = computeStatusPatch(order, newStatus)
    try {
      useOrderStore.getState().applyUpdate({ ...order, ...patch })
      await editOrder(order.id, patch)
      toast.success(`Status order diubah ke ${STATUS_LABELS[newStatus] || newStatus}`)
    } catch (err) {
      useOrderStore.getState().applyUpdate(order) // rollback
      toast.error('Gagal mengubah status')
      console.error(err)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-lg overflow-x-auto pb-md">
        {KANBAN_COLUMNS.map((col) => (
          <Column
            key={col.key}
            col={col}
            orders={orders.filter((o) => o.status === col.key)}
            interpretersById={interpretersById}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* Bayangan kartu saat di-drag */}
      <DragOverlay>
        {activeOrder ? (
          <OrderCard
            order={activeOrder}
            interpreter={interpretersById[activeOrder.interpreter_id]}
            onEdit={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
