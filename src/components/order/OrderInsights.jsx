// Ringkasan order yang dihitung nyata dari data:
// distribusi status + total terbayar/belum terbayar (untuk pemantauan keuangan).
import { useMemo } from 'react'
import { BarChart3, Wallet, AlertCircle } from 'lucide-react'
import { STATUS_COLORS, withAlpha } from '../../utils/colors'
import { ORDER_STATUSES, PAID_STATUSES, UNPAID_STATUSES } from '../../utils/constants'
import { formatRupiah } from '../../utils/dateHelpers'

export default function OrderInsights({ orders }) {
  // Hitung jumlah per status + total fee terbayar/belum terbayar.
  const stats = useMemo(() => {
    const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s.key, 0]))
    let paid = 0
    let unpaid = 0
    let pipeline = 0
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1
      const fee = Number(o.fee_estimate) || 0
      pipeline += fee
      if (PAID_STATUSES.includes(o.status)) paid += fee
      else if (UNPAID_STATUSES.includes(o.status)) unpaid += fee
    })
    const max = Math.max(1, ...Object.values(counts))
    return { counts, paid, unpaid, pipeline, max }
  }, [orders])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-xl">
      {/* Distribusi status */}
      <div className="lg:col-span-2 bg-surface-container border border-outline-variant/10 rounded-xl p-lg">
        <h3 className="font-h3 text-h3 text-on-surface mb-lg flex items-center gap-sm">
          <BarChart3 size={18} className="text-primary" />
          Distribusi Status
        </h3>
        <div className="flex items-end gap-md h-32 px-sm">
          {ORDER_STATUSES.map((s) => {
            const count = stats.counts[s.key] || 0
            const color = STATUS_COLORS[s.key]
            const heightPct = (count / stats.max) * 100
            return (
              <div key={s.key} className="flex-1 flex flex-col items-center justify-end h-full gap-sm">
                <span className="font-label-tag text-label-tag" style={{ color }}>
                  {count}
                </span>
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${Math.max(4, heightPct)}%`,
                    backgroundColor: withAlpha(color, 0.25),
                    borderTop: `2px solid ${color}`,
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-sm px-sm gap-md">
          {ORDER_STATUSES.map((s) => (
            <span key={s.key} className="flex-1 text-center text-[11px] leading-tight text-on-surface-variant">
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Ringkasan keuangan: terbayar vs belum terbayar */}
      <div className="flex flex-col gap-lg">
        <div className="flex-1 bg-surface-container border border-outline-variant/10 rounded-xl p-lg flex flex-col justify-center items-center text-center gap-xs">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20">
            <Wallet size={22} className="text-secondary" />
          </div>
          <h3 className="font-h3 text-h3 text-on-surface">Total Terbayar</h3>
          <p className="font-h1 text-h1 text-secondary">{formatRupiah(stats.paid)}</p>
          <p className="font-caption text-caption text-on-surface-variant">Paid + Complete</p>
        </div>
        <div className="flex-1 bg-surface-container border border-outline-variant/10 rounded-xl p-lg flex flex-col justify-center items-center text-center gap-xs">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center border border-error/20">
            <AlertCircle size={22} className="text-error" />
          </div>
          <h3 className="font-h3 text-h3 text-on-surface">Belum Terbayar</h3>
          <p className="font-h1 text-h1 text-error">{formatRupiah(stats.unpaid)}</p>
          <p className="font-caption text-caption text-on-surface-variant">
            Waiting + Invoice + Overdue
          </p>
        </div>
      </div>
    </div>
  )
}
