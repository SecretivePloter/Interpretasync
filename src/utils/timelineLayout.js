import { isRegularSchedule } from './scheduleTypes.js'

export function timelineDays(current) {
  const start = new Date(current.getFullYear(), current.getMonth(), current.getDate())
  start.setDate(start.getDate() - (start.getDay() + 6) % 7)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

export function timelineDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function timelineEventAt(run, fraction = 0) {
  const index = Math.floor(Math.max(0, Math.min(0.999999, fraction)) * run.events.length)
  return run.events[index]
}

// No company is guessed from abbreviations in titles. Legacy titles remain intact.
export function timelineGroup(event, ordersById = {}) {
  const company = event.company?.trim() || ordersById[event.order_id]?.client_name?.trim() || ''
  const label = company || event.title?.trim() || 'Tanpa perusahaan'
  const type = isRegularSchedule(event) ? 'reguler' : 'project'
  return { key: JSON.stringify([type, label.toLocaleLowerCase('id-ID')]), label, company, type }
}

function signature(event) {
  return JSON.stringify([event.interpreter_id, event.title, event.start_time, event.end_time,
    event.location, event.order_id, event.regular_series_id, event.schedule_type || 'project'])
}

// One lane can contain one strip per date. Multiple jobs on the same date get
// separate lanes even if their times do not overlap. Original records stay intact.
export function buildTimelineLayout(events, dates, interpretersById = {}, ordersById = {}) {
  const indices = new Map(dates.map((date, index) => [date, index]))
  const groups = new Map()
  for (const event of events) {
    if (!indices.has(event.date)) continue
    const group = timelineGroup(event, ordersById)
    if (!groups.has(group.key)) groups.set(group.key, { ...group, events: [], runs: [] })
    groups.get(group.key).events.push(event)
  }
  const result = [...groups.values()].sort((a, b) =>
    Number(a.type === 'project') - Number(b.type === 'project') || a.label.localeCompare(b.label, 'id'))
  for (const group of result) {
    const bySignature = new Map()
    const sorted = [...group.events].sort((a, b) => a.date.localeCompare(b.date) ||
      (a.start_time || '').localeCompare(b.start_time || '') ||
      (interpretersById[a.interpreter_id]?.name || '').localeCompare(interpretersById[b.interpreter_id]?.name || '', 'id') || String(a.id).localeCompare(String(b.id)))
    group.events = sorted
    for (const event of sorted) {
      const index = indices.get(event.date), key = signature(event)
      const chains = bySignature.get(key) || []
      const previous = chains.find(run => run.end === index - 1)
      if (previous) { previous.end = index; previous.events.push(event) }
      else { const run = { key: event.id, start: index, end: index, events: [event], signature: key }; chains.push(run); group.runs.push(run) }
      bySignature.set(key, chains)
    }
    group.runs.sort((a, b) => a.start - b.start || b.end - a.end || a.signature.localeCompare(b.signature))
    const laneEnds = [], preferred = new Map()
    for (const run of group.runs) {
      const identity = run.events[0].regular_series_id || run.signature
      const prior = preferred.get(identity)
      let lane = prior !== undefined && laneEnds[prior] < run.start ? prior : laneEnds.findIndex(end => end < run.start)
      if (lane === -1) lane = laneEnds.length
      laneEnds[lane] = run.end
      run.lane = lane
      preferred.set(identity, lane)
    }
    group.lanes = Math.max(1, laneEnds.length)
  }
  return result
}
