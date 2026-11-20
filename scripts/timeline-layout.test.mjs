import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTimelineLayout, timelineDate, timelineDays, timelineEventAt, timelineGroup } from '../src/utils/timelineLayout.js'

const dates = timelineDays(new Date(2026, 10, 20)).map(timelineDate)
const event = (id, date, extra = {}) => ({ id, date, interpreter_id: 'a', title: 'Audit', company: 'SHP', start_time: '08:00', end_time: '17:00', schedule_type: 'project', ...extra })
const allRuns = groups => groups.flatMap(g => g.runs)

test('timeline weeks start Monday, cross month/year correctly and do not mutate anchor', () => {
  const current = new Date(2027, 0, 1, 15)
  assert.deepEqual(timelineDays(current).map(timelineDate), ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03'])
  assert.equal(current.getHours(), 15)
  assert.equal(dates[0], '2026-11-16')
})

test('legacy company fallback preserves title without guessing; known orders supply client', () => {
  assert.equal(timelineGroup({ title: 'Full Day TMMIN KRW#3' }).label, 'Full Day TMMIN KRW#3')
  assert.equal(timelineGroup({ title: 'Full Day TMMIN KRW#3' }).company, '')
  assert.equal(timelineGroup({ order_id: 'o', title: 'Audit' }, { o: { client_name: 'KAO' } }).company, 'KAO')
  assert.equal(timelineGroup({ company: ' SHP ', schedule_type: 'reguler' }).label, 'SHP')
  assert.notEqual(timelineGroup({ company: 'SHP', schedule_type: 'reguler' }).key, timelineGroup({ company: 'SHP' }).key)
})

test('consecutive identical daily records merge visually; record identities remain editable', () => {
  const input = [event('a', dates[0]), event('b', dates[1]), event('outside', '2026-12-01')]
  const before = JSON.stringify(input)
  const groups = buildTimelineLayout(input, dates)
  assert.equal(groups.length, 1)
  assert.equal(groups[0].runs.length, 1)
  const run = groups[0].runs[0]
  assert.equal(timelineEventAt(run, 0).id, 'a')
  assert.equal(timelineEventAt(run, 0.99).id, 'b')
  assert.equal(timelineEventAt(run, 1).id, 'b')
  assert.equal(timelineEventAt(run, -1).id, 'a')
  assert.equal(JSON.stringify(input), before)
})

test('missing dates and changed interpreter, time, title or location split a strip', () => {
  for (const change of [{ interpreter_id: 'b' }, { start_time: '09:00' }, { title: 'Meeting' }, { location: 'Online' }]) {
    assert.equal(allRuns(buildTimelineLayout([event('a', dates[0]), event('b', dates[1], change)], dates)).length, 2)
  }
  const runs = allRuns(buildTimelineLayout([event('a', dates[0]), event('b', dates[2])], dates))
  assert.equal(runs.length, 2)
})

test('all jobs on a date survive in separate lanes, including duplicates and different times', () => {
  const jobs = [event('a', dates[0]), event('b', dates[0]), event('c', dates[0], { start_time: '18:00', end_time: '20:00' }), event('d', dates[1])]
  const [group] = buildTimelineLayout(jobs, dates)
  assert.equal(group.lanes, 3)
  assert.equal(group.runs.reduce((n, run) => n + run.events.length, 0), 4)
  for (let index = 0; index < dates.length; index++) {
    const occupied = group.runs.filter(run => run.start <= index && run.end >= index).map(run => run.lane)
    assert.equal(new Set(occupied).size, occupied.length)
  }
})

test('regular replacement shares a lane while preserving the original date assignments', () => {
  const rows = [event('a', dates[0]), event('b', dates[1], { interpreter_id: 'b' }), event('c', dates[2])]
    .map(e => ({ ...e, schedule_type: 'reguler', regular_series_id: 'series' }))
  const [group] = buildTimelineLayout(rows, dates)
  assert.equal(group.lanes, 1)
  assert.equal(group.runs.length, 3)
  assert.equal(group.runs[1].events[0].id, 'b')
})

test('input order does not change layout, empty weeks stay empty', () => {
  const rows = [event('a', dates[0]), event('b', dates[1]), event('c', dates[0], { interpreter_id: 'b' })]
  assert.deepEqual(buildTimelineLayout(rows, dates), buildTimelineLayout([...rows].reverse(), dates))
  assert.deepEqual(buildTimelineLayout(rows, ['2026-12-01']), [])
})
