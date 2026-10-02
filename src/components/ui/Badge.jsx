// Badge berbasis warna hex (status order, dll). Memakai inline style untuk
// warna dinamis dengan latar transparan.
import { withAlpha } from '../../utils/colors'

export default function Badge({ color = '#8c909e', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-md py-xs rounded-full font-label-tag text-label-tag uppercase border ${className}`}
      style={{
        color,
        backgroundColor: withAlpha(color, 0.12),
        borderColor: withAlpha(color, 0.25),
      }}
    >
      {children}
    </span>
  )
}
