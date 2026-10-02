// Panel kanan profil: tab Jadwal Mendatang & Riwayat Order.
import { useState } from 'react'
import { Clock, MapPin, Building2, CalendarX2, Inbox, Sun } from 'lucide-react'
import StatusBadge from '../order/StatusBadge'
import EmptyState from '../ui/EmptyState'
import { formatDateLong, formatDateShort, trimTime, formatRupiah, isAllDayEvent } from '../../utils/dateHelpers'

const TABS = [
  { key: 'schedule', label: 'Jadwal Mendatang' },
  { key: 'orders', label: 'Riwayat Order' },
]

export default function ProfileSchedule({ upcoming, orders }) {
  const [tab, setTab] = useState('schedule')

  return (
    <div className="bg-surface-container border border-outline-variant/10 rounded-xl p-xl flex flex-col gap-lg">
      {/* Tab header */}
      <div className="flex gap-lg border-b border-outline-variant/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-sm font-h3 text-h3 transition-colors border-b-2 -mb-[1px] ${
              tab === t.key
                ? 'text-primary border-primary'
                : 'text-on-surface-variant border-transparent hover:text-on-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Jadwal mendatang (14 hari) */}
      {tab === 'schedule' &&
        (upcoming.length === 0 ? (
          <EmptyState icon={CalendarX2} title="Tidak ada jadwal" description="Belum ada jadwal dalam 14 hari ke depan." />
        ) : (
          <div className="flex flex-col gap-md">
            {upcoming.map((ev) => (
              <div
                key={ev.id}
                className="p-md rounded-lg bg-surface-container-high border border-outline-variant/10 flex gap-md items-start"
              >
                <div className="bg-primary/15 text-primary p-sm rounded-lg flex flex-col items-center min-w-[52px]">
                  <span className="font-label-tag text-label-tag font-bold uppercase">
                    {formatDateShort(ev.date).split(' ')[1]}
                  </span>
                  <span className="font-h1 text-h1 leading-none">
                    {formatDateShort(ev.date).split(' ')[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-h3 text-h3 text-on-surface">{ev.title}</h4>
                  <div className="flex items-center gap-sm text-on-surface-variant mt-xs">
                    {isAllDayEvent(ev.start_time, ev.end_time) ? (
                      <>
                        <Sun size={14} />
                        <span className="font-caption text-caption">Seharian</span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} />
                        <span className="font-caption text-caption">
                          {trimTime(ev.start_time)} - {trimTime(ev.end_time)}
                        </span>
                      </>
                    )}
                  </div>
                  {ev.company && (
                    <div className="flex items-center gap-sm text-on-surface-variant">
                      <Building2 size={14} />
                      <span className="font-caption text-caption">{ev.company}</span>
                    </div>
                  )}
                  {ev.location && (
                    <div className="flex items-center gap-sm text-on-surface-variant">
                      <MapPin size={14} />
                      <span className="font-caption text-caption">{ev.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

      {/* Riwayat order */}
      {tab === 'orders' &&
        (orders.length === 0 ? (
          <EmptyState icon={Inbox} title="Belum ada order" description="Interpreter ini belum memiliki order." />
        ) : (
          <div className="flex flex-col divide-y divide-outline-variant/10">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-md gap-md">
                <div>
                  <h4 className="font-h3 text-h3 text-on-surface">{o.client_name}</h4>
                  <span className="font-caption text-caption text-on-surface-variant">
                    {formatDateLong(o.date)}
                    {o.duration_hours ? ` • ${o.duration_hours} jam` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-md">
                  <span className="font-body text-body text-on-surface whitespace-nowrap">
                    {formatRupiah(o.fee_estimate)}
                  </span>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}
