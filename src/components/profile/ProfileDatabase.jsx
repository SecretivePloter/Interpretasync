import { useCallback, useEffect, useState } from 'react'
import Button from '../ui/Button'
import { TextInput } from '../ui/Field'
import DatabaseEditor from './DatabaseEditor'
import TrackRecord from './TrackRecord'
import TariffList from './TariffList'
import RestrictionNotice from './RestrictionNotice'
import { listRecords, deleteRecord } from '../../services/interpreterDatabase'
import { averageRating, buildTrackRecord, money, units } from '../../utils/interpreterDatabase'
import { toast } from '../../app/store/useToastStore'

const tables={experience:'interpreter_experiences',rate:'interpreter_rates',fee:'interpreter_fees',block:'interpreter_blocks',restriction:'interpreter_restrictions'}
const statuses={reference:'Referensi belum diverifikasi',confirmed:'Terkonfirmasi',completed:'Selesai',cancelled:'Dibatalkan'}
export default function ProfileDatabase({interpreterId,events}) {
  const [data,setData]=useState({experience:[],rate:[],fee:[],block:[],restriction:[]})
  const [tab,setTab]=useState('experience')
  const [editor,setEditor]=useState(null)
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  const [query,setQuery]=useState('')
  const [limit,setLimit]=useState(20)
  const reload=useCallback(async()=>{
    setLoading(true)
    try {const pairs=await Promise.all(Object.entries(tables).map(async([k,t])=>[k,await listRecords(t,interpreterId)]));setData(Object.fromEntries(pairs));setError('')}
    catch(e){setError(e.message)} finally {setLoading(false)}
  },[interpreterId])
  useEffect(()=>{reload()},[reload])
  const remove=async(kind,row)=>{
    if(!window.confirm('Hapus data ini? Tindakan ini menghapus satu catatan yang dipilih.'))return
    try{await deleteRecord(tables[kind],row.id);await reload();toast.success('Data dihapus')}catch(e){toast.error(e.message)}
  }
  const search=row=>!query || `${row.company||''} ${row.project||row.activity||row.title||''} ${row.notes||''}`.toLowerCase().includes(query.toLowerCase())
  const rating=averageRating(data.experience)
  const trackCount=buildTrackRecord(events,data.experience).filter(search).length
  const rowActions=(kind,row)=><div className="flex flex-wrap gap-sm mt-sm"><Button variant="ghost" onClick={()=>setEditor({kind,initial:row})}>Edit</Button><Button variant="ghost" onClick={()=>remove(kind,row)}>Hapus</Button></div>
  const card='rounded-xl border border-outline-variant/20 bg-surface-container-low p-lg min-w-0'
  return <section className="min-w-0 rounded-xl border border-outline-variant/20 bg-surface-container p-lg flex flex-col gap-md">
    <RestrictionNotice restrictions={data.restriction} />
    <div className="flex flex-wrap items-center justify-between gap-md"><div><h2 className="text-h2 font-h2">Database pengalaman & fee</h2><p className="text-caption text-on-surface-variant">{data.experience.length} catatan pengalaman · {rating?`${rating.toFixed(1)}/5 dari ${data.experience.filter(x=>x.rating).length} penilaian`:'Belum ada penilaian'}</p></div></div>
    <div className="flex flex-wrap gap-xs" role="tablist" aria-label="Database interpreter">{[['experience','Track record'],['rate','Tarif'],['fee','Rekap fee'],['block','Ketersediaan']].map(([key,label])=><button role="tab" aria-selected={tab===key} key={key} onClick={()=>{setTab(key);setQuery('');setLimit(20)}} className={`rounded-lg px-md py-sm text-body ${tab===key?'bg-primary text-on-primary':'bg-surface-container-low text-on-surface-variant'}`}>{label}</button>)}</div>
    {error && <div role="alert" className="text-error">{error} <Button variant="ghost" onClick={reload}>Coba lagi</Button></div>}
    {loading?<p className="text-on-surface-variant">Memuat database…</p>:<>
      <div className="flex flex-wrap items-end justify-between gap-md"><TextInput label="Cari perusahaan / proyek" value={query} onChange={e=>{setQuery(e.target.value);setLimit(20)}} className="flex-1 min-w-0" /><Button onClick={()=>setEditor({kind:tab,initial:{}})}>+ {tab==='experience'?'Catatan':tab==='rate'?'Tarif':tab==='fee'?'Hitung fee':'Blok tanggal'}</Button></div>
      {tab==='experience' && <>
        <TrackRecord events={events} experiences={data.experience} query={query} limit={limit} />
        {data.experience.filter(search).length>0&&<details className={card}><summary className="cursor-pointer font-h3 text-h3">Catatan & referensi proyek</summary><div className="flex flex-col gap-md mt-md">{data.experience.filter(search).slice(0,limit).map(row=><article key={row.id}><p className="text-caption text-primary">{row.company} · {row.year||row.start_date||'Tanggal belum diketahui'}</p><h3 className="font-h3 break-words">{row.project}</h3><p className="text-caption text-on-surface-variant">{statuses[row.status]}</p><p className="whitespace-pre-wrap text-body break-words">{row.notes}</p>{rowActions('experience',row)}</article>)}</div></details>}
      </>}
      {tab==='rate' && <TariffList rates={data.rate.filter(search).slice(0,limit)} onEdit={row=>setEditor({kind:'rate',initial:row})} onDelete={row=>remove('rate',row)} onUse={row=>setEditor({kind:'fee',initial:{company:row.company,project:row.activity,unit:row.unit,rate:row.amount,currency:row.currency,overtime_rate:row.overtime_rate,extras:row.transport,notes:`Tarif update ${row.valid_from}. ${row.notes||''}`}})} />}
      {tab==='fee' && <><p className="text-caption text-on-surface-variant">Nominal disimpan sebagai kesepakatan tugas. Mengubah tarif master tidak mengubah rekap lama. Total mata uang berbeda ditampilkan terpisah.</p><div className="flex flex-wrap gap-md">{[...new Set(data.fee.filter(search).map(x=>x.currency))].map(c=><div className={card} key={c}><p className="text-caption text-on-surface-variant">Total {c} · belum dibayar</p><strong>{money(data.fee.filter(search).filter(x=>x.currency===c&&x.payment_status!=='paid').reduce((s,x)=>s+Number(x.total),0),c)}</strong></div>)}</div>{data.fee.filter(search).slice(0,limit).map(row=><article className={card} key={row.id}><p className="text-caption text-on-surface-variant">{row.date} · {row.company} · {({draft:'Draft',approved:'Disetujui',paid:'Sudah dibayar'})[row.payment_status]}</p><h3 className="font-h3 break-words">{row.project}</h3><strong className="text-h2">{money(row.total,row.currency)}</strong><p className="text-caption text-on-surface-variant">{row.quantity} × {money(row.rate,row.currency)} / {units[row.unit]} + lembur {row.overtime_hours} jam × {money(row.overtime_rate,row.currency)} + tambahan {money(row.extras,row.currency)} − potongan {money(row.deductions,row.currency)}</p><p className="whitespace-pre-wrap break-words">{row.notes}</p>{rowActions('fee',row)}</article>)}</>}
      {tab==='block' && <><p className="text-caption text-on-surface-variant">Blok tanggal untuk cuti atau ketidaktersediaan yang sudah dikonfirmasi. Tidak ada jadwal belum berarti siap menerima tugas.</p>{data.block.slice(0,limit).map(row=><article className={card} key={row.id}><strong>{row.start_date} sampai {row.end_date}</strong><p className="whitespace-pre-wrap break-words">{row.reason}</p>{rowActions('block',row)}</article>)}</>}
      {(data[tab].filter(search).length>limit||(tab==='experience'&&trackCount>limit))&&<Button variant="ghost" onClick={()=>setLimit(n=>n+20)}>Tampilkan lebih banyak</Button>}
    </>}
    {editor&&<DatabaseEditor key={`${editor.kind}-${editor.initial.id||'new'}`} {...editor} interpreterId={interpreterId} onClose={()=>setEditor(null)} onSaved={reload} />}
  </section>
}
