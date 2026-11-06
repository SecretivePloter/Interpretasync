// Presentation-only palette. Persisted interpreter color_key is not changed.
function rgbHex(h,s,l){
  const a=s*Math.min(l,1-l)
  const f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0')}
  return `#${f(0)}${f(8)}${f(4)}`
}
export function luminance(hex){
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722
}
export function calendarSwatch(index){
  const bg=rgbHex((220+index*137.508)%360,.68,[.37,.48,.31,.57][index%4])
  const lum=luminance(bg)
  const foreground=(lum+.05)/.05 >= 1.05/(lum+.05)?'#000000':'#ffffff'
  return {bg,foreground}
}
export function buildCalendarColors(people){
  return Object.fromEntries(Object.values(people).sort((a,b)=>a.id.localeCompare(b.id)).map((p,index)=>[p.id,calendarSwatch(index)]))
}
export const unassignedColor={bg:'#475569',foreground:'#ffffff'}
