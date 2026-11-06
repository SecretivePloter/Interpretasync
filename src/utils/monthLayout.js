// Compact mode fits a whole month when the viewport permits a readable 15px row.
// Dense months retain scrolling instead of hiding events or shrinking text further.
export function compactMonthLayout(counts, height){
  const available=Math.max(0,height-28)
  const total=counts.reduce((s,n)=>s+n,0)
  const overhead=counts.reduce((s,n)=>s+(n?35+Math.max(0,n-1):40),0)
  const chipHeight=Math.max(15,Math.min(20,total?Math.floor((available-overhead)/total):20))
  const base=counts.map(n=>n?35+n*chipHeight+Math.max(0,n-1):40)
  const extra=Math.max(0,available-base.reduce((s,n)=>s+n,0))/counts.length
  return {chipHeight,rows:base.map(h=>h+extra)}
}
