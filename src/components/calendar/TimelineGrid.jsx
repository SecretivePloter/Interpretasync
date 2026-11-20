import { useMemo } from 'react'
import { ArrowLeftRight, Star } from 'lucide-react'
import { buildTimelineLayout, timelineDate, timelineEventAt } from '../../utils/timelineLayout'
import { buildCalendarColors, unassignedColor } from '../../utils/calendarColors'
import { calendarChangeTime, isRecentCalendarChange } from '../../utils/calendarChanges'
import { isUnassignedInterpreter } from '../../utils/unassignedInterpreter'
import { scheduleColor } from '../../utils/scheduleTypes'
import { formatDateLong, trimTime } from '../../utils/dateHelpers'
import { useTodayDate } from '../../hooks/useTodayDate'
import { useCalendarChangeClock } from '../../hooks/useCalendarChangeClock'
import RecentChangeIndicator from './RecentChangeIndicator'
import UnassignedIndicator from './UnassignedIndicator'
import ScheduleTypeToggle from './ScheduleTypeToggle'
import { useFilterStore } from '../../app/store/useFilterStore'
import './timeline.css'

export default function TimelineGrid({ days, events, interpretersById, orders, onDayClick, onCellClick, onEventClick, filtered = false }) {
  const today = useTodayDate(), now = useCalendarChangeClock(events)
  const dates = useMemo(() => days.map(timelineDate), [days])
  const ordersById = useMemo(() => Object.fromEntries(orders.map(o => [o.id, o])), [orders])
  const groups = useMemo(() => buildTimelineLayout(events, dates, interpretersById, ordersById), [events, dates, interpretersById, ordersById])
  const colors = useMemo(() => buildCalendarColors(interpretersById), [interpretersById])
  const resetFilters = () => { useFilterStore.getState().showAll(); useFilterStore.getState().setShowRegular(true) }
  let row = 2
  return <section className="timeline-view" aria-label="Timeline kalender">
    <div className="timeline-scroll">
      <div className="timeline-grid">
        <div className="timeline-corner">Perusahaan <ArrowLeftRight size={13} className="timeline-scroll-hint" aria-label="Geser untuk melihat tanggal lain" /></div>
        {days.map((day, index) => <button key={dates[index]} type="button" className={`timeline-date ${dates[index] === today ? 'timeline-today' : ''}`} style={{ gridColumn: index + 2 }}
          onClick={() => onDayClick(day)} aria-label={`Tambah jadwal ${dates[index]}`}>
          <small>{['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][day.getDay()]}</small><span>{day.getDate()}</span>
        </button>)}
        {groups.map(group => {
          const startRow = row
          row += group.lanes
          return <div key={group.key} className="timeline-group">
            <div className="timeline-row-label" style={{ gridRow: `${startRow} / span ${group.lanes}` }} title={group.label}><strong>{group.label}</strong><small>{group.type === 'reguler' ? 'Reguler' : 'Project'}</small></div>
            {Array.from({ length: group.lanes }, (_, lane) => days.map((day, index) => <button key={`${lane}:${dates[index]}`} type="button"
              className={`timeline-cell ${[0, 6].includes(day.getDay()) ? 'timeline-weekend' : ''} ${dates[index] === today ? 'timeline-today' : ''}`}
              style={{ gridRow: startRow + lane, gridColumn: index + 2 }} onClick={() => onCellClick(day, group)}
              aria-label={`Tambah jadwal ${group.label}, ${dates[index]}, ${group.type}`}><span aria-hidden="true">+</span></button>))}
            {group.runs.map(run => {
              const event = run.events[0], interpreter = interpretersById[event.interpreter_id]
              const unassigned = isUnassignedInterpreter(event, interpreter)
              const urgent = unassigned && run.events.some(e => e.date === today)
              const color = scheduleColor(event, colors[event.interpreter_id] || unassignedColor)
              const recent = run.events.filter(e => isRecentCalendarChange(e, now))
              const latest = recent.reduce((last, e) => (calendarChangeTime(e) ?? 0) > (calendarChangeTime(last) ?? 0) ? e : last, recent[0] || event)
              const name = unassigned ? 'Belum ditentukan' : interpreter?.name || 'Interpreter'
              return <button key={run.key} type="button" className={`timeline-bar ${unassigned ? 'timeline-unassigned' : ''}`} data-timeline-event={event.id} data-schedule-type={group.type}
                style={{ gridRow: startRow + run.lane, gridColumn: `${run.start + 2} / span ${run.end - run.start + 1}`, background: color.bg, color: color.foreground }}
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const fraction = e.detail === 0 ? 0 : (e.clientX - rect.left) / rect.width
                  onEventClick(timelineEventAt(run, fraction))
                }} aria-label={`Edit ${group.label}, ${name}, ${formatDateLong(event.date)}${run.events.length > 1 ? ` sampai ${formatDateLong(run.events.at(-1).date)}` : ''}`}
                title={run.events.map(e => `${formatDateLong(e.date)} · ${name} · ${e.title} · ${trimTime(e.start_time)}–${trimTime(e.end_time)}`).join('\n')}>
                {urgent ? <span className="timeline-urgent" role="img" aria-label="Mendesak: jadwal hari ini belum ada interpreter" title="Mendesak: jadwal hari ini belum ada interpreter">!</span> : <UnassignedIndicator event={event} interpreter={interpreter} />}
                <RecentChangeIndicator event={latest} now={now} />
                <span className="timeline-bar-text">{name}{group.type === 'project' && ` · ${event.title}`}</span>
              </button>
            })}
          </div>
        })}
      </div>
      {groups.length === 0 && <p className="timeline-empty">{filtered ? 'Tidak ada jadwal yang cocok dengan filter.' : 'Belum ada jadwal minggu ini.'}</p>}
    </div>
    <div className="timeline-legend">
      <span><i className="timeline-key-regular" />Reguler</span><span><i className="timeline-key-project" />Project</span>
      <span><i className="timeline-key-unassigned" />Belum ditentukan</span><span><Star size={12} className="text-amber-500" />Baru</span><span><b className="timeline-urgent">!</b>Mendesak</span>
      <details><summary>Arti</summary><p>Reguler berwarna abu-abu. Project memakai warna interpreter. Bintang: perubahan penting dalam 24 jam. Mendesak: jadwal hari ini belum memiliki interpreter. Klik kotak kosong atau tanggal untuk menambah jadwal; klik strip untuk mengedit tanggal yang dipilih. Pergantian pada rangkaian Reguler hanya mengubah jadwal tanggal tersebut.</p></details>
      <ScheduleTypeToggle />{filtered && <button type="button" onClick={resetFilters}>Tampilkan semua</button>}
    </div>
  </section>
}
