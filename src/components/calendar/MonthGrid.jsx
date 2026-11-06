import { useEffect, useMemo, useState, useRef } from 'react'
import { compactMonthLayout } from '../../utils/monthLayout'
import { Maximize2, Minimize2, ChevronDown, RotateCcw } from 'lucide-react'
import { getMonthGrid, isSameDay, isSameMonth, toISODate, trimTime, isAllDayEvent, formatMonthYear } from '../../utils/dateHelpers'
import { buildCalendarColors, unassignedColor } from '../../utils/calendarColors'
import { DAY_LABELS } from '../../utils/constants'
import { useFilterStore } from '../../app/store/useFilterStore'
import Avatar from '../ui/Avatar'

export default function MonthGrid({currentDate,events,interpretersById,onDayClick,onEventClick,totalEvents=events.length}){
  const [fullScreen,setFullScreen]=useState(false)
  const [legend,setLegend]=useState(false)
  const [compact,setCompact]=useState(true)
  const [viewportHeight,setViewportHeight]=useState(700)
  const scrollRef=useRef(null)
  useEffect(()=>{const observer=new ResizeObserver(([entry])=>setViewportHeight(entry.contentRect.height));if(scrollRef.current)observer.observe(scrollRef.current);return()=>observer.disconnect()},[])
  const showAll=useFilterStore(s=>s.showAll)
  const days=useMemo(()=>{
    const grid=getMonthGrid(currentDate)
    // Omit trailing weeks which contain no date in the selected month.
    while(grid.length>28&&!grid.slice(-7).some(d=>isSameMonth(d,currentDate)))grid.splice(-7)
    return grid
  },[currentDate])
  const colors=useMemo(()=>buildCalendarColors(interpretersById),[interpretersById])
  const sortedEvents=useMemo(()=>[...events].sort((a,b)=>(a.start_time||'').localeCompare(b.start_time||'')||(interpretersById[a.interpreter_id]?.name||'').localeCompare(interpretersById[b.interpreter_id]?.name||'')),[events,interpretersById])
  const byDate=useMemo(()=>sortedEvents.reduce((m,e)=>{(m[e.date]??=[]).push(e);return m},{}),[sortedEvents])
  const counts=Array.from({length:days.length/7},(_,week)=>Math.max(0,...days.slice(week*7,week*7+7).map(d=>(byDate[toISODate(d)]||[]).length)))
  const layout=compactMonthLayout(counts,viewportHeight)
  const monthPrefix=toISODate(currentDate).slice(0,7)
  const monthEvents=events.filter(e=>e.date.startsWith(monthPrefix))
  const assigned=[...new Set(monthEvents.map(e=>e.interpreter_id))].map(id=>interpretersById[id]).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name))
  useEffect(()=>{if(!fullScreen)return;const close=e=>{if(e.key==='Escape')setFullScreen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[fullScreen])
  return <section aria-label="Kalender bulanan lengkap" className={`${fullScreen?'fixed inset-0 z-[70]':'flex-1 min-h-0'} flex flex-col bg-background`}>
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-sm border-b border-outline/40 bg-surface-container px-md py-1">
      <div><p className="font-h3 text-h3">{formatMonthYear(currentDate)} <span className="text-caption font-normal text-on-surface-variant">· {monthEvents.length} jadwal</span></p><p className="text-caption text-on-surface-variant">{events.length<totalEvents?'Sebagian interpreter sedang difilter':'Seluruh jadwal bulan ini'} · klik jadwal untuk detail</p></div>
      <div className="flex flex-wrap gap-sm text-caption"><div className="inline-flex rounded-lg border border-outline/30 overflow-hidden"><button aria-pressed={compact} className={`px-sm py-xs ${compact?'bg-primary text-on-primary':''}`} onClick={()=>setCompact(true)}>Ringkas</button><button aria-pressed={!compact} className={`px-sm py-xs ${!compact?'bg-primary text-on-primary':''}`} onClick={()=>setCompact(false)}>Detail</button></div><button className="inline-flex items-center gap-xs rounded-lg border border-outline/30 px-sm py-xs" onClick={()=>setLegend(x=>!x)} aria-expanded={legend}><span>Warna interpreter</span><ChevronDown size={14}/></button>{events.length<totalEvents&&<button className="inline-flex items-center gap-xs text-primary" onClick={showAll}><RotateCcw size={14}/>Tampilkan semua</button>}<button className="inline-flex items-center gap-xs rounded-lg border border-outline/30 px-sm py-xs" onClick={()=>setFullScreen(x=>!x)}>{fullScreen?<Minimize2 size={14}/>:<Maximize2 size={14}/>} {fullScreen?'Keluar layar penuh':'Layar penuh'}</button></div>
    </div>
    {legend&&<div className="shrink-0 max-h-36 overflow-y-auto flex flex-wrap gap-sm p-md border-b border-outline/30 bg-surface-container">{assigned.map(p=><span key={p.id} className="inline-flex items-center gap-xs text-caption"><span className="h-3 w-3 rounded-sm" style={{background:colors[p.id].bg}}/>{p.name}</span>)}</div>}
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto overscroll-contain" data-testid="month-scroll">
      <div className="min-w-[1050px] border-l border-t border-outline/60">
        <div className="sticky top-0 z-20 h-[26px] grid grid-cols-7 bg-surface-container border-b-2 border-outline/60">{DAY_LABELS.map((label,i)=><div key={label} className={`border-r border-outline/50 flex items-center justify-center text-center text-[13px] font-semibold ${i===0?'text-error':'text-on-surface'}`}>{label}</div>)}</div>
        <div className="grid grid-cols-7 auto-rows-auto" style={compact?{gridTemplateRows:layout.rows.map(h=>`${h}px`).join(' ')}:undefined}>{days.map((day,index)=>{
          const iso=toISODate(day),inMonth=isSameMonth(day,currentDate),today=isSameDay(day,new Date())
          const dayEvents=byDate[iso]||[]
          return <div key={iso} data-date={iso} className={`min-w-0 border-r border-b border-outline/60 flex flex-col ${compact?'p-[2px]':'p-[6px] min-h-[110px]'} ${inMonth?'bg-surface-container': 'bg-surface-container-high'} ${today?'ring-2 ring-inset ring-primary':''}`}>
            <div style={{top:26}} className={`sticky z-10 flex justify-between items-center gap-xs border-b border-outline/30 ${compact?'mb-[2px] -mx-[2px] -mt-[2px] px-[2px] py-[2px]':'mb-[6px] -mx-[6px] -mt-[6px] px-[6px] py-[6px]'} ${inMonth?'bg-surface-container':'bg-surface-container-high'}`}><button onClick={()=>onDayClick(day)} aria-label={`Tambah jadwal ${iso}`} className={`flex items-center justify-center rounded-md font-bold ${compact?'w-6 h-6 text-[18px]':'w-9 h-9 text-[20px]'} ${today?'bg-primary text-on-primary':!inMonth?'text-on-surface-variant':index%7===0?'text-error':'text-on-surface'}`}><time dateTime={iso}>{day.getDate()}</time></button>{dayEvents.length>0&&<span className="text-[11px] text-on-surface-variant">{dayEvents.length}{!compact&&' jadwal'}</span>}</div>
            <div className={`flex flex-col ${compact?'gap-[1px]':'gap-1'}`}>{dayEvents.map(ev=>{
              const p=interpretersById[ev.interpreter_id],color=colors[p?.id]||unassignedColor
              const time=isAllDayEvent(ev.start_time,ev.end_time)?'Seharian':`${trimTime(ev.start_time)}–${trimTime(ev.end_time)}`
              return <button key={ev.id} data-event-id={ev.id} onClick={()=>onEventClick(ev)} className={`text-left w-full min-w-0 rounded border border-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary hover:brightness-110 ${compact?'px-[3px] py-0':'px-[6px] py-[4px]'}`} style={{background:color.bg,color:color.foreground,height:compact?layout.chipHeight:undefined}} title={`${iso} · ${p?.name||'Belum ditentukan'} · ${ev.title} · ${time}`}>
                {compact?<span className="flex items-center gap-[3px] min-w-0 leading-none"><Avatar name={p?.name||'?'} avatarUrl={p?.avatar_url} colorKey={p?.color_key} size="xs" className="!w-3 !h-3 shrink-0 !text-[6px]"/><strong className="text-[11px] max-w-[45%] shrink-0 truncate">{p?.name||'Belum ditentukan'}</strong><span className="text-[11px] min-w-0 truncate">{ev.title}</span></span>:<>
                <span className="flex items-center gap-1 min-w-0"><Avatar name={p?.name||'?'} avatarUrl={p?.avatar_url} colorKey={p?.color_key} size="xs" className="!w-4 !h-4 border-white/50 shrink-0"/><span className="text-[12px] font-bold leading-4 break-words">{p?.name||'Belum ditentukan'}</span></span>
                <span className="block text-[12px] leading-4 break-words mt-[2px]">{ev.title}</span>
                {!isAllDayEvent(ev.start_time,ev.end_time)&&<span className="block text-[11px] leading-4 mt-[2px] font-medium">{time}</span>}</>}

              </button>
            })}</div>
            {dayEvents.length===0&&!compact&&<button className={`flex-1 ${compact?'min-h-0':'min-h-10'} rounded-md text-[11px] text-on-surface-variant hover:bg-primary/5`} aria-label={`Tambah jadwal pada ${iso}`} onClick={()=>onDayClick(day)}>+</button>}
          </div>
        })}</div>
      </div>
    </div>
  </section>
}
