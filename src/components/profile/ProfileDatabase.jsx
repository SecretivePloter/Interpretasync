import { useCallback, useEffect, useState } from 'react'
import Button from '../ui/Button'
import { TextInput } from '../ui/Field'
import DatabaseEditor from './DatabaseEditor'
import { listRecords, deleteRecord } from '../../services/interpreterDatabase'
import { averageRating, localDate, money, units } from '../../utils/interpreterDatabase'
import { toast } from '../../app/store/useToastStore'

const tables={experience:'interpreter_experiences',rate:'interpreter_rates',fee:'interpreter_fees',block:'interpreter_blocks'}
const statuses={reference:'Referensi belum diverifikasi',confirmed:'Terkonfirmasi',completed:'Selesai',cancelled:'Dibatalkan'}
export default function ProfileDatabase({interpreterId,events}) {
  const [data,setData]=useState({experience:[],rate:[],fee:[],block:[]})
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
  const past=events.filter(e=>e.date<localDate() && !data.experience.some(x=>x.event_id===e.id)).filter(search).sort((a,b)=>b.date.localeCompare(a.date))
  const rowActions=(kind,row)=><div className="flex flex-wrap gap-sm mt-sm"><Button variant="ghost" onClick={()=>setEditor({kind,initial:row})}>Edit</Button><Button variant="ghost" onClick={()=>remove(kind,row)}>Hapus</Button></div>
  const card='rounded-xl border border-outline-variant/20 bg-surface-container-low p-lg min-w-0'
  return <section className="min-w-0 rounded-xl border border-outline-variant/20 bg-surface-container p-lg flex flex-col gap-md">
    <div className="flex flex-wrap items-center justify-between gap-md"><div><h2 className="text-h2 font-h2">Database pengalaman & fee</h2><p className="text-caption text-on-surface-variant">{data.experience.length} catatan pengalaman · {rating?`${rating.toFixed(1)}/5 dari ${data.experience.filter(x=>x.rating).length} penilaian`:'Belum ada penilaian'}</p></div></div>
    <div className="flex flex-wrap gap-xs" role="tablist" aria-label="Database interpreter">{[['experience','Pengalaman'],['rate','Tarif'],['fee','Rekap fee'],['block','Ketersediaan']].map(([key,label])=><button role="tab" aria-selected={tab===key} key={key} onClick={()=>{setTab(key);setQuery('');setLimit(20)}} className={`rounded-lg px-md py-sm text-body ${tab===key?'bg-primary text-on-primary':'bg-surface-container-low text-on-surface-variant'}`}>{label}</button>)}</div>
    {error && <div role="alert" className="text-error">{error} <Button variant="ghost" onClick={reload}>Coba lagi</Button></div>}
    {loading?<p className="text-on-surface-variant">Memuat database…</p>:<>
      <div className="flex flex-wrap items-end justify-between gap-md"><TextInput label="Cari perusahaan / proyek" value={query} onChange={e=>{setQuery(e.target.value);setLimit(20)}} className="flex-1 min-w-0" /><Button onClick={()=>setEditor({kind:tab,initial:{}})}>+ {tab==='experience'?'Pengalaman':tab==='rate'?'Tarif':tab==='fee'?'Hitung fee':'Blok tanggal'}</Button></div>
      {tab==='experience' && <>
        {data.experience.filter(search).slice(0,limit).map(row=><article key={row.id} className={card}><p className="text-caption text-primary">{row.company} · {row.start_date||row.year||'Tanggal belum diketahui'}</p><h3 className="font-h3 text-h3 break-words">{row.project}</h3><p className="text-caption text-on-surface-variant">{statuses[row.status]}{row.rating?` · ★ ${row.rating}/5`:''}</p><p className="whitespace-pre-wrap text-body mt-sm break-words">{row.notes}</p>{row.source&&<p className="text-caption text-on-surface-variant mt-sm break-words">Sumber: {row.source}</p>}{rowActions('experience',row)}</article>)}
        {!data.experience.filter(search).length&&<p className="text-on-surface-variant">Belum ada pengalaman terstruktur yang cocok.</p>}
        <h3 className="font-h3 text-h3 mt-md">Jadwal terdahulu</h3><p className="text-caption text-on-surface-variant">Jadwal yang sudah lewat belum membuktikan tugas terlaksana. Lengkapi perusahaan dan konfirmasi hasil tugas untuk memasukkannya ke pengalaman.</p>
        {past.slice(0,limit).map(row=><div className={card} key={row.id}><p className="text-caption text-on-surface-variant">{row.date} · {row.company||'Perusahaan belum diisi'}</p><p className="break-words">{row.title}</p><Button variant="ghost" onClick={()=>setEditor({kind:'experience',initial:{event_id:row.id,company:row.company||'',project:row.title,start_date:row.date,end_date:row.date,year:Number(row.date.slice(0,4)),source:`Kalender ${row.date}`,notes:row.notes||''}})}>Lengkapi pengalaman & rating</Button></div>)}
      </>}
      {tab==='rate' && <><p className="text-caption text-on-surface-variant">Tarif pembelian jasa interpreter. Tarif khusus perusahaan/aktivitas dan masa berlakunya dipilih secara eksplisit.</p>{data.rate.filter(search).slice(0,limit).map(row=><article key={row.id} className={card}><p className="text-caption text-primary">{row.company||'Semua perusahaan'} · {row.activity||'Umum'}</p><strong className="text-h2">{money(row.amount,row.currency)} / {units[row.unit]}</strong><p className="text-caption text-on-surface-variant">Berlaku {row.valid_from}{row.valid_to?` sampai ${row.valid_to}`:' dan seterusnya'} · Lembur {money(row.overtime_rate,row.currency)}/jam · Transport {money(row.transport,row.currency)}</p><p className="whitespace-pre-wrap text-body break-words">{row.notes}</p>{rowActions('rate',row)}<Button variant="outline" onClick={()=>setEditor({kind:'fee',initial:{company:row.company,project:row.activity,unit:row.unit,rate:row.amount,currency:row.currency,overtime_rate:row.overtime_rate,extras:row.transport,notes:`Tarif disalin: ${row.id}; berlaku ${row.valid_from}${row.valid_to?` sampai ${row.valid_to}`:''}. ${row.notes}`}})}>Gunakan untuk hitung fee</Button></article>)}</>}
      {tab==='fee' && <><p className="text-caption text-on-surface-variant">Nominal disimpan sebagai kesepakatan tugas. Mengubah tarif master tidak mengubah rekap lama. Total mata uang berbeda ditampilkan terpisah.</p><div className="flex flex-wrap gap-md">{[...new Set(data.fee.filter(search).map(x=>x.currency))].map(c=><div className={card} key={c}><p className="text-caption text-on-surface-variant">Total {c} · belum dibayar</p><strong>{money(data.fee.filter(search).filter(x=>x.currency===c&&x.payment_status!=='paid').reduce((s,x)=>s+Number(x.total),0),c)}</strong></div>)}</div>{data.fee.filter(search).slice(0,limit).map(row=><article className={card} key={row.id}><p className="text-caption text-on-surface-variant">{row.date} · {row.company} · {({draft:'Draft',approved:'Disetujui',paid:'Sudah dibayar'})[row.payment_status]}</p><h3 className="font-h3 break-words">{row.project}</h3><strong className="text-h2">{money(row.total,row.currency)}</strong><p className="text-caption text-on-surface-variant">{row.quantity} × {money(row.rate,row.currency)} / {units[row.unit]} + lembur {row.overtime_hours} jam × {money(row.overtime_rate,row.currency)} + tambahan {money(row.extras,row.currency)} − potongan {money(row.deductions,row.currency)}</p><p className="whitespace-pre-wrap break-words">{row.notes}</p>{rowActions('fee',row)}</article>)}</>}
      {tab==='block' && <><p className="text-caption text-on-surface-variant">Blok tanggal untuk cuti atau ketidaktersediaan yang sudah dikonfirmasi. Tidak ada jadwal belum berarti siap menerima tugas.</p>{data.block.slice(0,limit).map(row=><article className={card} key={row.id}><strong>{row.start_date} sampai {row.end_date}</strong><p className="whitespace-pre-wrap break-words">{row.reason}</p>{rowActions('block',row)}</article>)}</>}
      {(data[tab].filter(search).length>limit||(tab==='experience'&&past.length>limit))&&<Button variant="ghost" onClick={()=>setLimit(n=>n+20)}>Tampilkan lebih banyak</Button>}
    </>}
    {editor&&<DatabaseEditor key={`${editor.kind}-${editor.initial.id||'new'}`} {...editor} interpreterId={interpreterId} onClose={()=>setEditor(null)} onSaved={reload} />}
  </section>
}
