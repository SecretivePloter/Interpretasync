import { useMemo } from 'react'
import { CalendarDays, Clock3, RotateCcw, UsersRound } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { useFilterControls } from '../../hooks/useFilter'
import { formatDateLong, toISODate, trimTime, isAllDayEvent } from '../../utils/dateHelpers'
import { getColorHex, withAlpha } from '../../utils/colors'

function getEventTime(event) {
  if (isAllDayEvent(event.start_time, event.end_time)) return 'Seharian'
  const start = trimTime(event.start_time)
  const end = trimTime(event.end_time)
  return start && end ? `${start}–${end}` : 'Waktu belum diatur'
}

export default function TodayDutyHighlights({ events, interpretersById }) {
  const today = new Date()
  const todayIso = toISODate(today)
  const todayEvents = useMemo(
    () => events.filter((event) => event.date === todayIso),
    [events, todayIso],
  )
  const { toggle, showAll, isVisible, allVisible } = useFilterControls()

  const duties = useMemo(() => {
    const grouped = new Map()

    todayEvents.forEach((event) => {
      const key = event.interpreter_id || 'unassigned'
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key).push(event)
    })

    return [...grouped.entries()]
      .map(([key, assignedEvents]) => ({
        key,
        interpreter: key === 'unassigned' ? null : interpretersById[key],
        events: assignedEvents.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')),
      }))
      .sort((a, b) => {
        if (!a.interpreter) return 1
        if (!b.interpreter) return -1
        return a.interpreter.name.localeCompare(b.interpreter.name, 'id')
      })
  }, [todayEvents, interpretersById])

  const interpreterCount = duties.filter((duty) => duty.interpreter).length

  return (
    <section
      aria-labelledby="today-duty-heading"
      className="shrink-0 border-b border-outline-variant/15 bg-surface-container-low px-md py-md lg:px-xl"
    >
      <div className="mb-sm flex flex-wrap items-center justify-between gap-x-md gap-y-xs">
        <div className="flex min-w-0 items-center gap-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays size={16} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="today-duty-heading" className="font-h3 text-h3 text-on-surface">
              Bertugas hari ini
            </h2>
            <p className="font-caption text-caption text-on-surface-variant">
              {formatDateLong(today)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-sm">
          <span className="inline-flex items-center gap-xs rounded-full border border-outline-variant/25 bg-surface px-sm py-xs font-caption text-caption text-on-surface-variant">
            <UsersRound size={13} aria-hidden="true" />
            {interpreterCount} interpreter · {todayEvents.length} jadwal
          </span>
          {!allVisible && (
            <button
              type="button"
              onClick={showAll}
              className="inline-flex items-center gap-xs rounded-full px-sm py-xs font-caption text-caption text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Tampilkan semua
            </button>
          )}
        </div>
      </div>

      {duties.length === 0 ? (
        <div className="flex min-h-14 items-center rounded-xl border border-dashed border-outline-variant/35 bg-surface/60 px-md font-body text-body text-on-surface-variant">
          Belum ada jadwal interpreter untuk hari ini.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-sm">
          {duties.map(({ key, interpreter, events: assignedEvents }) => {
            const color = getColorHex(interpreter?.color_key)
            const visible = interpreter ? isVisible(interpreter.id) : true
            const firstEvent = assignedEvents[0]
            const detail = `${firstEvent.title || 'Jadwal'} · ${getEventTime(firstEvent)}`
            const title = [interpreter?.name || 'Belum ditentukan', detail]
              .concat(assignedEvents.length > 1 ? [`${assignedEvents.length} jadwal hari ini`] : [])
              .join(' | ')

            const content = (
              <>
                {interpreter ? (
                  <Avatar
                    name={interpreter.name}
                    colorKey={interpreter.color_key}
                    avatarUrl={interpreter.avatar_url}
                    size="sm"
                    className="!h-9 !w-9"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container text-on-surface-variant">
                    <UsersRound size={16} aria-hidden="true" />
                  </span>
                )}

                <span className="min-w-0 flex-1 text-left">
                  <span className="flex min-w-0 items-center gap-xs">
                    <span className="truncate font-medium text-body text-on-surface">
                      {interpreter?.name || 'Belum ditentukan'}
                    </span>
                    {assignedEvents.length > 1 && (
                      <span className="shrink-0 rounded-full bg-surface-container-high px-[6px] py-[1px] text-[10px] font-medium text-on-surface-variant">
                        {assignedEvents.length} jadwal
                      </span>
                    )}
                  </span>
                  <span className="mt-[2px] flex min-w-0 items-center gap-1 text-[11px] leading-4 text-on-surface-variant">
                    <Clock3 size={11} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">{detail}</span>
                  </span>
                </span>
              </>
            )

            const cardClass = `flex min-h-[58px] min-w-0 items-center gap-sm rounded-xl border border-outline-variant/20 bg-surface px-sm py-xs text-left shadow-sm transition-colors ${
              interpreter
                ? 'cursor-pointer hover:border-outline-variant/50 hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                : ''
            } ${!visible ? 'opacity-45' : ''}`

            return interpreter ? (
              <button
                key={key}
                type="button"
                onClick={() => toggle(interpreter.id)}
                title={`${visible ? 'Sembunyikan' : 'Tampilkan'} jadwal ${title}`}
                aria-pressed={visible}
                className={cardClass}
                style={{ borderLeft: `3px solid ${withAlpha(color, visible ? 0.85 : 0.35)}` }}
              >
                {content}
              </button>
            ) : (
              <div
                key={key}
                title={title}
                className={cardClass}
                style={{ borderLeft: '3px solid rgb(var(--c-outline-variant))' }}
              >
                {content}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
