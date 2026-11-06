import { useEffect, useMemo, useState } from 'react'
import { Maximize2, Minimize2, ChevronDown, RotateCcw } from 'lucide-react'
import { getMonthGrid, isSameDay, isSameMonth, toISODate, trimTime, isAllDayEvent, formatMonthYear } from '../../utils/dateHelpers'
import { buildCalendarColors, unassignedColor } from '../../utils/calendarColors'
import { DAY_LABELS } from '../../utils/constants'
import { useFilterStore } from '../../app/store/useFilterStore'
import Avatar from '../ui/Avatar'

export default function MonthGrid({currentDate,events,interpretersById,onDayClick,onEventClick,totalEvents=events.length}){
  const [fullScreen,setFullScreen]=useState(false)
  const [legend,setLegend]=useState(false)
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
  const monthPrefix=toISODate(currentDate).slice(0,7)
  const monthEvents=events.filter(e=>e.date.startsWith(monthPrefix))
  const assigned=[...new Set(monthEvents.map(e=>e.interpreter_id))].map(id=>interpretersById[id]).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name))
  useEffect(()=>{if(!fullScreen)return;const close=e=>{if(e.key==='Escape')setFullScreen(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[fullScreen])
  return <section aria-label="Kalender bulanan lengkap" className={`${fullScreen?'fixed inset-0 z-[70]':'flex-1 min-h-0'} flex flex-col bg-background`}>
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-sm border-b border-outline/40 bg-surface-container px-md py-sm">
      <div><p className="font-h3 text-h3">{formatMonthYear(currentDate)} <span className="text-caption font-normal text-on-surface-variant">· {monthEvents.length} jadwal</span></p><p className="text-caption text-on-surface-variant">{events.length<totalEvents?'Sebagian interpreter sedang difilter':'Seluruh jadwal bulan ini ditampilkan'} · geser ke samping dan gulir ke bawah</p></div>
      <div className="flex flex-wrap gap-sm text-caption"><button className="inline-flex items-center gap-xs rounded-lg border border-outline/30 px-sm py-xs" onClick={()=>setLegend(x=>!x)} aria-expanded={legend}><span>Warna interpreter</span><ChevronDown size={14}/></button>{events.length<totalEvents&&<button className="inline-flex items-center gap-xs text-primary" onClick={showAll}><RotateCcw size={14}/>Tampilkan semua</button>}<button className="inline-flex items-center gap-xs rounded-lg border border-outline/30 px-sm py-xs" onClick={()=>setFullScreen(x=>!x)}>{fullScreen?<Minimize2 size={14}/>:<Maximize2 size={14}/>} {fullScreen?'Keluar layar penuh':'Layar penuh'}</button></div>
    </div>
    {legend&&<div className="shrink-0 max-h-36 overflow-y-auto flex flex-wrap gap-sm p-md border-b border-outline/30 bg-surface-container">{assigned.map(p=><span key={p.id} className="inline-flex items-center gap-xs text-caption"><span className="h-3 w-3 rounded-sm" style={{background:colors[p.id].bg}}/>{p.name}</span>)}</div>}
    <div className="flex-1 min-h-0 overflow-auto overscroll-contain" data-testid="month-scroll">
      <div className="min-w-[1050px] border-l border-t border-outline/60">
        <div className="sticky top-0 z-20 grid grid-cols-7 bg-surface-container border-b-2 border-outline/60">{DAY_LABELS.map((label,i)=><div key={label} className={`border-r border-outline/50 py-sm text-center text-[13px] font-semibold ${i===0?'text-error':'text-on-surface'}`}>{label}</div>)}</div>
        <div className="grid grid-cols-7 auto-rows-auto">{days.map((day,index)=>{
          const iso=toISODate(day),inMonth=isSameMonth(day,currentDate),today=isSameDay(day,new Date())
          const dayEvents=byDate[iso]||[]
          return <div key={iso} data-date={iso} className={`min-h-[110px] min-w-0 border-r border-b border-outline/60 p-[6px] flex flex-col ${inMonth?'bg-surface-container': 'bg-surface-container-high'} ${today?'ring-2 ring-inset ring-primary':''}`}>
            <div className={`sticky top-[36px] z-10 flex justify-between items-center gap-xs mb-[6px] -mx-[6px] -mt-[6px] px-[6px] py-[6px] border-b border-outline/30 ${inMonth?'bg-surface-container':'bg-surface-container-high'}`}><button onClick={()=>onDayClick(day)} aria-label={`Tambah jadwal ${iso}`} className={`flex items-center justify-center w-9 h-9 rounded-lg text-[20px] font-bold ${today?'bg-primary text-on-primary':!inMonth?'text-on-surface-variant':index%7===0?'text-error':'text-on-surface'}`}><time dateTime={iso}>{day.getDate()}</time></button>{dayEvents.length>0&&<span className="text-[11px] text-on-surface-variant">{dayEvents.length} jadwal</span>}</div>
            <div className="flex flex-col gap-1">{dayEvents.map(ev=>{
              const p=interpretersById[ev.interpreter_id],color=colors[p?.id]||unassignedColor
              const time=isAllDayEvent(ev.start_time,ev.end_time)?'Seharian':`${trimTime(ev.start_time)}–${trimTime(ev.end_time)}`
              return <button key={ev.id} data-event-id={ev.id} onClick={()=>onEventClick(ev)} className="text-left w-full min-w-0 rounded-md px-[6px] py-[4px] border border-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary hover:brightness-110" style={{background:color.bg,color:color.foreground}} title={`${iso} · ${p?.name||'Belum ditentukan'} · ${ev.title} · ${time}`}>
                <span className="flex items-center gap-1 min-w-0"><Avatar name={p?.name||'?'} avatarUrl={p?.avatar_url} colorKey={p?.color_key} size="xs" className="!w-4 !h-4 border-white/50 shrink-0"/><span className="text-[12px] font-bold leading-4 break-words">{p?.name||'Belum ditentukan'}</span></span>
                <span className="block text-[12px] leading-4 break-words mt-[2px]">{ev.title}</span>
                {!isAllDayEvent(ev.start_time,ev.end_time)&&<span className="block text-[11px] leading-4 mt-[2px] font-medium">{time}</span>}
              </button>
            })}</div>
            {dayEvents.length===0&&<button className="flex-1 min-h-10 rounded-md text-[11px] text-on-surface-variant hover:bg-primary/5" aria-label={`Tambah jadwal pada ${iso}`} onClick={()=>onDayClick(day)}>+</button>}
          </div>
        })}</div>
      </div>
    </div>
  </section>
}
