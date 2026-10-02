// Baris statistik profil (dihitung nyata dari events & orders interpreter).
import { CalendarCheck, Clock, AlertCircle, Wallet } from 'lucide-react'
import { formatRupiah } from '../../utils/dateHelpers'

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div
      className="bg-surface-container border border-outline-variant/10 rounded-xl p-lg flex flex-col gap-xs"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="flex items-center gap-sm text-on-surface-variant">
        <Icon size={18} />
        <span className="font-label-tag text-label-tag uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-h1 text-h1 text-on-surface">{value}</span>
    </div>
  )
}

export default function ProfileStats({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
      <StatCard icon={CalendarCheck} label="Sesi Bulan Ini" value={stats.sessions} accent="#acc7ff" />
      <StatCard icon={Clock} label="Total Jam" value={`${stats.hours} jam`} accent="#4eddbb" />
      <StatCard icon={AlertCircle} label="Order Pending" value={stats.pending} accent="#ffb4ab" />
      <StatCard icon={Wallet} label="Fee Bulan Ini" value={formatRupiah(stats.fee)} accent="#cfbdff" />
    </div>
  )
}
