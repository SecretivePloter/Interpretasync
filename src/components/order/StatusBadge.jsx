// Badge status order — solid, bold, pill, dengan border & pulse untuk status tertentu.
import { STATUS_BADGE } from '../../utils/colors'
import { ORDER_STATUSES } from '../../utils/constants'

const LABELS = Object.fromEntries(ORDER_STATUSES.map((s) => [s.key, s.label]))

export default function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.quotation
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full uppercase tracking-wide border whitespace-nowrap ${
        s.anim || ''
      }`}
      style={{
        backgroundColor: s.bg,
        color: s.text,
        borderColor: s.border,
        borderWidth: '1px',
        padding: '6px 14px',
        fontSize: '12px',
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {LABELS[status] || status}
    </span>
  )
}
