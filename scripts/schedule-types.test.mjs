import test from 'node:test'
import assert from 'node:assert/strict'
import {regularScheduleDates, monthEnd, regularScheduleConflicts as conflicts, scheduleVisible, scheduleColor, regularColor, scheduleSaveError} from '../src/utils/scheduleTypes.js'
import {UNASSIGNED_INTERPRETER_ID as placeholder} from '../src/utils/unassignedInterpreter.js'
import {availability} from '../src/utils/interpreterDatabase.js'
const project={id:'p',interpreter_id:'person',date:'2026-11-02',start_time:'09:00:00',end_time:'12:00:00'}
const regular={...project,id:'r',schedule_type:'reguler'}
test('November workdays, weekends and leap-year dates are deterministic',()=>{
 const dates=regularScheduleDates('2026-11-01','2026-11-30',[1,2,3,4,5])
 assert.equal(dates.length,21); assert.equal(dates[0],'2026-11-02'); assert.equal(dates.at(-1),'2026-11-30')
 assert.deepEqual(regularScheduleDates('2026-11-07','2026-11-08',[0,6]),['2026-11-07','2026-11-08'])
 assert.equal(monthEnd('2028-02-01'),'2028-02-29')
 assert.deepEqual(regularScheduleDates('2026-11-02','2026-11-02',[1,1]),['2026-11-02'])
})
test('reject invalid, empty, reversed and excessively long recurrence',()=>{
 for(const args of [['2026-02-30','2026-03-01',[1]],['2026-11-03','2026-11-02',[1]],['2026-11-02','2026-11-03',[]],['2026-11-02','2026-11-03',[7]],['2026-11-07','2026-11-08',[1]],['2026-01-01','2027-01-02',[1]]])assert.throws(()=>regularScheduleDates(...args))
})
test('both directions project/regular and regular/regular block; legacy project pairs remain allowed',()=>{
 assert.equal(conflicts([project],[regular]).length,1)
 assert.equal(conflicts([regular],[project]).length,1)
 assert.equal(conflicts([regular],[{...regular,id:'another'}]).length,1)
 assert.equal(conflicts([project],[{...project,id:'another'}]).length,0)
})
test('adjacent boundaries, self-edit, other person/date and placeholders do not conflict',()=>{
 assert.equal(conflicts([regular],[{...project,start_time:'12:00',end_time:'14:00'}]).length,0)
 assert.equal(conflicts([regular],[{...project,start_time:'11:59:59',end_time:'14:00'}]).length,1)
 assert.equal(conflicts([regular],[regular],'r').length,0)
 assert.equal(conflicts([regular],[{...project,interpreter_id:'other'}]).length,0)
 assert.equal(conflicts([regular],[{...project,date:'2026-11-03'}]).length,0)
 assert.equal(conflicts([{...regular,interpreter_id:placeholder}],[{...project,interpreter_id:placeholder}]).length,0)
})
test('multi-date request reports conflicts, regardless of display filter',()=>{
 const candidates=['2026-11-02','2026-11-03'].map(date=>({...project,date,schedule_type:'reguler'}))
 assert.equal(conflicts([project],candidates).length,1)
 assert.equal(scheduleVisible(regular,[],false),false)
 assert.equal(conflicts([regular],[project]).length,1)
 assert.equal(availability({id:'person',status:'aktif'},[regular],[],'2026-11-02','09:00','10:00'),'Ada tugas')
})
test('regular palette ignores interpreter and filters preserve project visibility',()=>{
 const color={bg:'#123456',foreground:'#ffffff'}
 assert.deepEqual(scheduleColor(regular,color),regularColor)
 assert.equal(scheduleColor(project,color),color)
 assert.equal(scheduleVisible(project,[],false),true)
 assert.equal(scheduleVisible(regular,[],true),true)
 assert.equal(scheduleVisible(regular,['person'],true),false)
})
test('database constraint errors are translated without leaking raw details',()=>{
 const result=scheduleSaveError({code:'23P01',details:'PRIVATE CLIENT DATA'})
 assert.match(result,/bertabrakan/);assert.doesNotMatch(result,/PRIVATE/)
})
