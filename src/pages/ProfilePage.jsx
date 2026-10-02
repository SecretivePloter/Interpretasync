// Halaman detail profil interpreter: panel kiri (identitas) + kanan (statistik & tab).
import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserX } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  addDays,
  isWithinInterval,
  parseISO,
} from 'date-fns'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ProfileCard from '../components/profile/ProfileCard'
import ProfileStats from '../components/profile/ProfileStats'
import ProfileSchedule from '../components/profile/ProfileSchedule'
import BookingDensity from '../components/profile/BookingDensity'
import InterpreterModal from '../components/profile/InterpreterModal'
import { useInterpreterStore } from '../app/store/useInterpreterStore'
import { useEventStore } from '../app/store/useEventStore'
import { useOrderStore } from '../app/store/useOrderStore'
import { durationHours, toISODate } from '../utils/dateHelpers'
import { PAID_STATUSES } from '../utils/constants'

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const interpreter = useInterpreterStore((s) => s.getById(id))
  const events = useEventStore((s) => s.events)
  const orders = useOrderStore((s) => s.orders)
  const [editOpen, setEditOpen] = useState(false)

  // Event & order milik interpreter ini.
  const myEvents = useMemo(
    () => events.filter((e) => e.interpreter_id === id),
    [events, id],
  )
  const myOrders = useMemo(
    () => orders.filter((o) => o.interpreter_id === id),
    [orders, id],
  )

  // Statistik bulan berjalan + jadwal mendatang 14 hari.
  const { stats, upcoming } = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const today = toISODate(now)
    const in14 = toISODate(addDays(now, 14))

    let sessions = 0
    let hours = 0
    myEvents.forEach((e) => {
      const d = parseISO(e.date)
      if (isWithinInterval(d, { start: monthStart, end: monthEnd })) {
        sessions += 1
        hours += durationHours(e.start_time, e.end_time)
      }
    })

    let fee = 0
    let pending = 0
    myOrders.forEach((o) => {
      const d = parseISO(o.date)
      if (isWithinInterval(d, { start: monthStart, end: monthEnd })) {
        fee += Number(o.fee_estimate) || 0
      }
      // "Pending" = order yang belum lunas (selain Paid/Complete).
      if (!PAID_STATUSES.includes(o.status)) pending += 1
    })

    const upcoming = myEvents
      .filter((e) => e.date >= today && e.date <= in14)
      .sort((a, b) =>
        a.date === b.date
          ? a.start_time.localeCompare(b.start_time)
          : a.date.localeCompare(b.date),
      )

    return {
      stats: { sessions, hours: Math.round(hours * 10) / 10, pending, fee },
      upcoming,
    }
  }, [myEvents, myOrders])

  // Interpreter tidak ditemukan (mis. sudah dihapus / id salah).
  if (!interpreter) {
    return (
      <>
        <PageHeader title="Profil Interpreter" />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={UserX}
            title="Interpreter tidak ditemukan"
            description="Data mungkin telah dihapus atau tautan tidak valid."
            action={
              <Button onClick={() => navigate('/profil')}>
                <ArrowLeft size={18} /> Kembali ke Daftar
              </Button>
            }
          />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Profil Interpreter" subtitle={interpreter.name}>
        <Button variant="ghost" onClick={() => navigate('/profil')}>
          <ArrowLeft size={18} /> Daftar
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-xl">
        <div className="flex flex-col lg:flex-row gap-xl">
          {/* Panel kiri */}
          <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-lg">
            <ProfileCard interpreter={interpreter} onEdit={() => setEditOpen(true)} />
            <BookingDensity events={myEvents} colorKey={interpreter.color_key} />
          </div>

          {/* Panel kanan */}
          <div className="flex-1 flex flex-col gap-lg">
            <ProfileStats stats={stats} />
            <ProfileSchedule upcoming={upcoming} orders={myOrders} />
          </div>
        </div>
      </div>

      <InterpreterModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        interpreter={interpreter}
      />
    </>
  )
}
