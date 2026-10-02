// Kartu order untuk tampilan Kanban — draggable via dnd-kit.
import { useDraggable } from '@dnd-kit/core'
import { Pencil, Calendar, User, ExternalLink, Clock, CheckCircle2, MessageCircle } from 'lucide-react'
import { getColorHex, withAlpha, STATUS_COLORS } from '../../utils/colors'
import { formatRupiah, formatDateShort } from '../../utils/dateHelpers'
import { waLink } from '../../utils/whatsapp'

export default function OrderCard({ order, interpreter, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: order.id })

  const hex = getColorHex(interpreter?.color_key)
  const style = {
    borderLeft: `3px solid ${hex}`,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-surface-container-high border border-outline-variant/10 rounded-xl p-md flex flex-col gap-sm cursor-grab active:cursor-grabbing hover:border-outline-variant/30 transition-colors touch-none"
    >
      <div className="flex items-start justify-between gap-sm">
        <span className="font-h3 text-h3 text-on-surface leading-tight">
          {order.client_name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(order)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-on-surface-variant hover:text-primary transition-colors shrink-0"
          aria-label="Edit order"
        >
          <Pencil size={16} />
        </button>
      </div>

      <div className="flex items-center gap-sm text-on-surface-variant">
        <User size={14} style={{ color: hex }} />
        <span className="font-caption text-caption">{interpreter?.name || '—'}</span>
      </div>

      <div className="flex items-center gap-sm text-on-surface-variant">
        <Calendar size={14} />
        <span className="font-caption text-caption">
          {formatDateShort(order.date)}
          {order.duration_hours ? ` • ${order.duration_hours} jam` : ''}
        </span>
      </div>

      {/* Estimasi jatuh tempo (invoice/overdue) */}
      {(order.status === 'invoice' || order.status === 'overdue') &&
        order.estimated_payment_date && (
          <div
            className="flex items-center gap-sm font-caption text-caption"
            style={{ color: STATUS_COLORS[order.status] }}
          >
            <Clock size={14} />
            <span>Jatuh tempo {formatDateShort(order.estimated_payment_date)}</span>
          </div>
        )}

      {/* Tanggal dibayar (paid/complete) */}
      {(order.status === 'paid' || order.status === 'complete') &&
        order.paid_date && (
          <div
            className="flex items-center gap-sm font-caption text-caption"
            style={{ color: STATUS_COLORS[order.status] }}
          >
            <CheckCircle2 size={14} />
            <span>Dibayar {formatDateShort(order.paid_date)}</span>
          </div>
        )}

      <div className="flex items-center justify-between gap-sm mt-xs flex-wrap">
        <div
          className="font-h3 text-h3"
          style={{ color: hex, backgroundColor: withAlpha(hex, 0.08), borderRadius: 6, padding: '2px 8px' }}
        >
          {formatRupiah(order.fee_estimate)}
        </div>

        <div className="flex items-center gap-xs flex-wrap">
          {order.whatsapp && (
            <a
              href={waLink(order.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              title="Follow up via WhatsApp"
              className="inline-flex items-center gap-xs px-sm py-xs rounded-md text-white transition-opacity hover:opacity-90 font-label-tag text-label-tag shrink-0"
              style={{ backgroundColor: '#25D366' }}
            >
              <MessageCircle size={13} /> Follow Up
            </a>
          )}
          {order.invoice_link && (
            <a
              href={order.invoice_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              title="Buka invoice di tab baru"
              className="inline-flex items-center gap-xs px-sm py-xs rounded-md border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors font-label-tag text-label-tag shrink-0"
            >
              <ExternalLink size={13} /> Buka Invoice
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
