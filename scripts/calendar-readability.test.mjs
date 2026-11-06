import test from 'node:test'
import assert from 'node:assert/strict'
import {buildCalendarColors,calendarSwatch,luminance} from '../src/utils/calendarColors.js'
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
