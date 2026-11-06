import { useMemo } from 'react'
import { CalendarCheck2, Building2, MapPin } from 'lucide-react'
import { buildTrackRecord } from '../../utils/interpreterDatabase'

export default function TrackRecord({events, experiences, query='', limit=20}) {
  const records=useMemo(()=>{
    return buildTrackRecord(events,experiences).filter(x=>`${x.title} ${x.company||''}`.toLowerCase().includes(query.toLowerCase()))
  },[events,experiences,query])
  const groups=records.slice(0,limit).reduce((result,row)=>{const key=row.date.slice(0,7)||'Tanggal belum tercatat';if(!result.has(key))result.set(key,[]);result.get(key).push(row);return result},new Map())
  return <div className="flex flex-col gap-lg">
    <div className="flex items-center gap-sm"><CalendarCheck2 size={20} className="text-primary shrink-0"/><div><h3 className="font-h2 text-h2">Track record tugas</h3><p className="text-caption text-on-surface-variant">{records.length} tugas terdahulu · terbaru ditampilkan lebih dulu</p></div></div>
    {!records.length&&<p className="text-body text-on-surface-variant">Belum ada riwayat tugas yang cocok.</p>}
    {[...groups.entries()].map(([month,rows])=><section key={month}>
      <h4 className="font-h3 text-h3 mb-md">{month.length===7?new Date(`${month}-01T12:00:00`).toLocaleDateString('id-ID',{month:'long',year:'numeric'}):month}</h4>
      <ol className="ml-xs border-l border-outline-variant/30 flex flex-col gap-md">{rows.map(row=><li key={row.key} className="relative ml-lg rounded-xl border border-outline-variant/15 bg-surface-container-low p-md min-w-0">
        <span className="absolute -left-[25px] top-5 h-3 w-3 rounded-full border-2 border-surface-container bg-primary" aria-hidden="true"/>
        <div className="flex flex-wrap gap-sm justify-between items-center"><time className="text-caption text-primary" dateTime={row.date}>{row.date.length===10?new Date(`${row.date}T12:00:00`).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):row.date||'Tanggal belum tercatat'}</time><span className="text-caption text-on-surface-variant">{row.completed?'Selesai terkonfirmasi':'Riwayat kalender'}</span></div>
        <h5 className="font-h3 text-h3 break-words mt-xs">{row.title}</h5>
        {(row.company||row.location)&&<div className="flex flex-wrap gap-x-md gap-y-xs mt-sm text-caption text-on-surface-variant">{row.company&&<span className="inline-flex items-center gap-xs"><Building2 size={13}/>{row.company}</span>}{row.location&&<span className="inline-flex items-center gap-xs"><MapPin size={13}/>{row.location}</span>}</div>}
        {row.rating&&<p className="text-caption text-primary mt-sm">★ {row.rating}/5</p>}
      </li>)}</ol>
    </section>)}
  </div>
}
