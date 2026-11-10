import test from 'node:test'
import assert from 'node:assert/strict'
import { CALENDAR_CHANGE_WINDOW_MS as DAY, isRecentCalendarChange as recent, calendarChangeDescription as describe, nextCalendarChangeBoundary as next } from '../src/utils/calendarChanges.js'
const now = Date.parse('2026-11-10T03:00:00Z')
const at = n => new Date(n).toISOString()
test('24h window includes creation, excludes exact expiry and future', () => {
  assert.equal(recent({calendar_changed_at:at(now)}, now), true)
  assert.equal(recent({calendar_changed_at:at(now-DAY+1)}, now), true)
  assert.equal(recent({calendar_changed_at:at(now-DAY)}, now), false)
  assert.equal(recent({calendar_changed_at:at(now+1)}, now), false)
})
test('legacy creation is a baseline; updated_at alone never creates a star', () => {
  assert.equal(recent({created_at:at(now-1000), updated_at:at(now)},now),true)
  assert.equal(recent({created_at:at(now-2*DAY), updated_at:at(now)},now),false)
  assert.equal(recent({updated_at:at(now)},now),false)
  assert.equal(recent({calendar_changed_at:at(now-2*DAY),created_at:at(now)},now),false)
})
test('invalid timestamps and missing metadata do not produce a badge', () => {
  for (const value of [null, '', 'invalid']) assert.equal(recent({calendar_changed_at:value},now),false)
})
test('tooltip translates allowed field names, never displays arbitrary values', () => {
  const d=describe({calendar_changed_at:at(now),calendar_change_fields:['interpreter_id','date','notes','private-value','date']})
  assert.match(d,/interpreter, tanggal/)
  assert.match(d,/WIB/)
  assert.doesNotMatch(d,/private-value|notes/)
  assert.match(describe({created_at:at(now)}),/Jadwal baru/)
  assert.match(describe({calendar_changed_at:at(now),calendar_change_fields:['created']}),/Jadwal baru/)
})
test('clock chooses nearest expiry and stops when nothing can change', () => {
  const e=[{calendar_changed_at:at(now-DAY+1000)},{calendar_changed_at:at(now-2000)}]
  assert.equal(next(e,now),now+1000)
  assert.equal(next(e,now+1000),now-2000+DAY)
  assert.equal(next(e,now+DAY),null)
  assert.equal(next([{calendar_changed_at:at(now+1000)}],now),now+1000)
})
