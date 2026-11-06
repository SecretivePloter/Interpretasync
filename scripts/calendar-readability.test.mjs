import test from 'node:test'
import assert from 'node:assert/strict'
import {buildCalendarColors,calendarSwatch,luminance} from '../src/utils/calendarColors.js'
import {compactMonthLayout} from '../src/utils/monthLayout.js'
test('48 interpreter colors remain distinct and text contrast exceeds WCAG AA',()=>{
 const colors=Array.from({length:48},(_,i)=>calendarSwatch(i))
 assert.equal(new Set(colors.map(c=>c.bg)).size,48)
 for(const c of colors){const a=luminance(c.bg),b=luminance(c.foreground);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`${c.bg} contrast`)}
})
test('color mapping is independent of incoming interpreter object order',()=>{
 const a={id:'a'},b={id:'b'},c={id:'c'}
 assert.deepEqual(buildCalendarColors({a,b,c}),buildCalendarColors({c,b,a}))
 assert.notEqual(buildCalendarColors({a,b,c}).a.bg,buildCalendarColors({a,b,c}).b.bg)
})
test('compact month adapts all weeks to available height without hidden events',()=>{
 const counts=[8,8,8,7,0]
 const layout=compactMonthLayout(counts,766)
 assert.ok(layout.rows.reduce((s,h)=>s+h,0)+28<=766.01)
 counts.forEach((count,i)=>assert.ok(layout.rows[i]>=(count?35+count*layout.chipHeight+count-1:40)))
 assert.ok(layout.chipHeight>=15)
})
test('dense month keeps legible minimum and overflows rather than hiding appointments',()=>{
 const layout=compactMonthLayout([20,20,20,20,20,20],500)
 assert.equal(layout.chipHeight,15)
 assert.ok(layout.rows.reduce((s,h)=>s+h,0)>500)
 const empty=compactMonthLayout([0,0,0,0,0,0],700)
 assert.ok(empty.rows.every(Number.isFinite))
})
