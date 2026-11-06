import test from 'node:test'
import assert from 'node:assert/strict'
import {availability,averageRating,feeTotal,restrictionApplies,buildTrackRecord} from '../src/utils/interpreterDatabase.js'
const person={id:'p1',status:'aktif'}
test('fee uses agreed units, explicit overtime and deductions, without calendar placeholders',()=>{
 assert.equal(feeTotal({quantity:2,rate:1200000,overtime_hours:1.5,overtime_rate:100000,extras:250000,deductions:50000}),2750000)
 assert.equal(feeTotal({quantity:1.5,rate:0.1}),0.15)
})
test('availability treats adjacent appointments as free, overlapping appointments as booked',()=>{
 const events=[{interpreter_id:'p1',date:'2026-11-06',start_time:'08:00:00',end_time:'12:00:00'}]
 assert.equal(availability(person,events,[],'2026-11-06','12:00','17:00'),'Tidak ada jadwal')
 assert.equal(availability(person,events,[],'2026-11-06','11:59','17:00'),'Ada tugas')
 assert.equal(availability(person,events,[],'2026-11-07','08:00','17:00'),'Tidak ada jadwal')
})
test('confirmed leave and inactive status take priority over empty calendars',()=>{
 const blocks=[{interpreter_id:'p1',start_date:'2026-11-06',end_date:'2026-11-07'}]
 assert.equal(availability(person,[],blocks,'2026-11-07'),'Tidak tersedia')
 assert.equal(availability({...person,status:'nonaktif'},[],[],'2026-11-06'),'Nonaktif')
})
test('unrated experiences do not reduce average ratings',()=>{
 assert.equal(averageRating([{rating:null},{rating:4},{rating:5}]),4.5)
 assert.equal(averageRating([{rating:null}]),null)
})
test('blacklist applies globally or only to its named company',()=>{
 assert.equal(restrictionApplies({company:''},'KAO'),true)
 assert.equal(restrictionApplies({company:'TMMIN'},'PT. TMMIN KRW#3'),true)
 assert.equal(restrictionApplies({company:'TMMIN'},'KAO'),false)
 assert.equal(restrictionApplies({company:'TMMIN'},''),false)
})
test('track record omits future and cancelled work and avoids duplicate completed event',()=>{
 const events=[{id:'past',date:'2026-11-01',title:'Old job'},{id:'cancelled',date:'2026-11-02'},{id:'future',date:'2026-12-01'}]
 const experiences=[{id:'done',event_id:'past',status:'completed',end_date:'2026-11-01',project:'Done job'},{id:'cancel',event_id:'cancelled',status:'cancelled'}]
 const result=buildTrackRecord(events,experiences,'2026-11-06')
 assert.equal(result.length,1)
 assert.equal(result[0].title,'Done job')
 assert.equal(result[0].completed,true)
})
