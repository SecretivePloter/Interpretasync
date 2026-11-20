import { useEffect, useMemo, useState } from 'react'
import Avatar from '../ui/Avatar'
import { formatDateLong, parseISO, trimTime } from '../../utils/dateHelpers'
import { isUnassignedInterpreter } from '../../utils/unassignedInterpreter'
import { buildCalendarColors, unassignedColor } from '../../utils/calendarColors'
import { useTodayDate } from '../../hooks/useTodayDate'

export default function TimelineDutyHighlights({ events, interpretersById, date, onDateChange, onEventClick }) {
  const today = useTodayDate()
  const [expanded, setExpanded] = useState(false)
  useEffect(() => setExpanded(false), [date])
  const tomorrow = parseISO(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  const colors = useMemo(() => buildCalendarColors(interpretersById), [interpretersById])
  const duties = useMemo(() => {
    const groups = new Map()
    for (const event of events.filter(e => e.date === date)) {
      const interpreter = interpretersById[event.interpreter_id]
      const unassigned = isUnassignedInterpreter(event, interpreter)
      const key = unassigned ? event.id : event.interpreter_id
      if (!groups.has(key)) groups.set(key, { key, interpreter, unassigned, events: [] })
      groups.get(key).events.push(event)
    }
    return [...groups.values()].map(d => ({ ...d, events: d.events.sort((a, b) => a.start_time.localeCompare(b.start_time)) }))
      .sort((a, b) => Number(b.unassigned) - Number(a.unassigned) || (a.interpreter?.name || '').localeCompare(b.interpreter?.name || '', 'id'))
  }, [events, date, interpretersById])
  const assigned = duties.filter(d => !d.unassigned).length
  const gaps = duties.filter(d => d.unassigned).length
  return <section className="timeline-duty" aria-label="Interpreter pada tanggal pilihan">
    <div className="timeline-duty-header">
      <div><h2>{date === today ? 'Bertugas hari ini' : date === tomorrowIso ? 'Bertugas besok' : 'Bertugas pada tanggal pilihan'}</h2>
        <p aria-live="polite">{formatDateLong(date)} · {assigned} interpreter{gaps > 0 && ` · ${gaps} belum ditentukan`}
          {duties.length > 6 && <button type="button" className="timeline-duty-expand" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'Ringkas' : `Lihat semua (${duties.length})`}</button>}</p></div>
      <div className="timeline-date-controls">
        <button type="button" aria-pressed={date === today} onClick={() => onDateChange(today)}>Hari ini</button>
        <button type="button" aria-pressed={date === tomorrowIso} onClick={() => onDateChange(tomorrowIso)}>Besok</button>
        <input aria-label="Tanggal highlight" type="date" value={date} onChange={e => { if (e.target.value) onDateChange(e.target.value) }} />
      </div>
    </div>
    {duties.length === 0 ? <p className="timeline-duty-empty">Tidak ada jadwal pada tanggal ini.</p> :
      <div className={`timeline-duty-list ${expanded ? 'timeline-duty-expanded' : ''}`} aria-label={expanded ? 'Daftar interpreter, gulir untuk melihat seluruhnya' : 'Daftar interpreter'}>{(expanded ? duties : duties.slice(0, 6)).map(({ key, interpreter, unassigned, events: assignedEvents }) => {
        const event = assignedEvents[0], color = colors[interpreter?.id] || unassignedColor
        return <button key={key} type="button" className={`timeline-duty-card ${unassigned ? 'timeline-duty-unassigned' : ''}`}
          onClick={() => onEventClick(event)} aria-label={`Edit ${unassigned ? 'jadwal belum ditentukan' : interpreter?.name || 'interpreter'}, ${event.title}, ${date}`}
          title={assignedEvents.map(e => `${e.title} · ${trimTime(e.start_time)}–${trimTime(e.end_time)}`).join('\n')}
          style={{ borderLeftColor: unassigned ? undefined : color.bg }}>
          <Avatar name={unassigned ? '?' : interpreter?.name || '?'} avatarUrl={unassigned ? null : interpreter?.avatar_url} colorKey={interpreter?.color_key} size="sm" className="!h-7 !w-7 shrink-0" />
          <span className="min-w-0"><strong>{unassigned ? 'Belum ditentukan' : interpreter?.name || 'Interpreter'}</strong>
            <small>{event.company || event.title} · {trimTime(event.start_time)}–{trimTime(event.end_time)}{assignedEvents.length > 1 && ` · +${assignedEvents.length - 1}`}</small></span>
        </button>
      })}</div>}
  </section>
}
