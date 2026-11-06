import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, ArrowUpRight, X } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { TextInput, Select } from '../components/ui/Field'
import WorkbookReview from '../components/profile/WorkbookReview'
import FeeCategories, { FeeCategoryPicker, feeCategories } from '../components/profile/FeeCategories'
import { useInterpreterStore } from '../app/store/useInterpreterStore'
import { useEventStore } from '../app/store/useEventStore'
import { listRecords } from '../services/interpreterDatabase'
import { availability, averageRating, localDate, restrictionApplies, directoryFee, matchesFee, trackCompanies, money, units } from '../utils/interpreterDatabase'

const defaults=()=>({company:'',duty:'',date:localDate(),start:'08:00',end:'17:00',sort:'name',unit:'day',min:'',max:''})
const unitLabels={day:'full day',half_day:'half day',month:'bulan',hour:'jam',session:'sesi',event:'event'}
function activeCount(f){const d=defaults();return Object.keys(d).filter(k=>f[k]!==d[k]).length}

export default function ProfileListPage(){
  const navigate=useNavigate()
  const interpreters=useInterpreterStore(s=>s.interpreters)
  const peopleLoaded=useInterpreterStore(s=>s.loaded)
  const events=useEventStore(s=>s.events)
  const eventsLoaded=useEventStore(s=>s.loaded)
  const [extra,setExtra]=useState({history:[],rates:[],blocks:[],restrictions:[]})
  const [ready,setReady]=useState(false)
  const [error,setError]=useState('')
  const [revision,setRevision]=useState(0)
  const [search,setSearch]=useState('')
  const [filters,setFilters]=useState(defaults)
  const [draft,setDraft]=useState(defaults)
  const [filterOpen,setFilterOpen]=useState(false)
  const [formError,setFormError]=useState('')
  const [review,setReview]=useState(false)
  useEffect(()=>{
    let active=true;setReady(false)
    Promise.all(['interpreter_experiences','interpreter_rates','interpreter_blocks','interpreter_restrictions'].map(t=>listRecords(t))).then(([history,rates,blocks,restrictions])=>{if(active){setExtra({history,rates,blocks,restrictions});setError('');setReady(true)}}).catch(e=>{if(active)setError(e.message)})
    return()=>{active=false}
  },[revision])
  const records=useMemo(()=>interpreters.filter(i=>i.name!=='Belum Ditentukan').map(i=>{
    const history=extra.history.filter(r=>r.interpreter_id===i.id)
    const jobs=events.filter(r=>r.interpreter_id===i.id)
    const restrictions=extra.restrictions.filter(r=>r.interpreter_id===i.id)
    const companies=trackCompanies(jobs,history)
    const relevant=history.filter(x=>!filters.company||x.company?.toUpperCase()===filters.company.toUpperCase())
    const fee=directoryFee(extra.rates.filter(r=>r.interpreter_id===i.id),filters)
    const fees=Object.fromEntries(feeCategories.map(({unit})=>[unit,directoryFee(extra.rates.filter(r=>r.interpreter_id===i.id),{...filters,unit})]))
    const status=restrictions.some(r=>!r.company)?'Blacklist semua perusahaan':restrictions.some(r=>restrictionApplies(r,filters.company))?'Dibatasi perusahaan':availability(i,events,extra.blocks,filters.date,filters.start,filters.end)
    return {...i,history,relevant,jobs,restrictions,companies,fee,fees,status}
  }),[interpreters,events,extra,filters])
  const companies=useMemo(()=>[...new Set(records.flatMap(i=>i.companies))].sort(),[records])
  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase()
    return records.filter(i=>(!filters.company||i.companies.includes(filters.company))&&(!filters.duty||i.status===filters.duty)&&matchesFee(i.fee,filters.min,filters.max)&&`${i.name} ${(i.specialties||[]).join(' ')} ${i.companies.join(' ')} ${i.jobs.map(j=>j.title).join(' ')} ${i.history.map(j=>j.project).join(' ')}`.toLowerCase().includes(q)).sort((a,b)=>{
      if(filters.sort==='fee')return (a.fee?.amount??Infinity)-(b.fee?.amount??Infinity)||a.name.localeCompare(b.name)
      if(filters.sort==='rating')return (averageRating(b.relevant)||0)-(averageRating(a.relevant)||0)||a.name.localeCompare(b.name)
      if(filters.sort==='experience')return b.relevant.filter(x=>x.status==='completed').length-a.relevant.filter(x=>x.status==='completed').length||a.name.localeCompare(b.name)
      if(filters.sort==='company')return (a.companies[0]||'\uffff').localeCompare(b.companies[0]||'\uffff')||a.name.localeCompare(b.name)
      if(filters.sort==='project')return (a.jobs.map(j=>j.title).sort()[0]||a.history.map(j=>j.project).sort()[0]||'\uffff').localeCompare(b.jobs.map(j=>j.title).sort()[0]||b.history.map(j=>j.project).sort()[0]||'\uffff')||a.name.localeCompare(b.name)
      return a.name.localeCompare(b.name)
    })
  },[records,search,filters])
  const update=key=>e=>setDraft(f=>({...f,[key]:e.target.value}))
  const apply=e=>{
    e.preventDefault()
    if(!draft.date||!draft.start||!draft.end||draft.end<=draft.start)return setFormError('Isi tanggal dan rentang jam yang valid dalam hari yang sama.')
    if((draft.min!==''&&Number(draft.min)<0)||(draft.max!==''&&Number(draft.max)<=0)||(draft.min!==''&&draft.max!==''&&Number(draft.min)>=Number(draft.max)))return setFormError('Batas maksimum harus lebih besar dari batas minimum.')
    setFilters({...draft});setFilterOpen(false);setFormError('')
  }
  const count=activeCount(filters)
  const loaded=ready&&peopleLoaded&&eventsLoaded
  return <>
    <PageHeader title="Database Interpreter" subtitle="Temukan interpreter sesuai pengalaman dan anggaran">
      <Button variant="ghost" onClick={()=>setReview(true)}>Tinjau data Excel</Button>
    </PageHeader>
    <div className="flex-1 overflow-y-auto p-md lg:p-xl flex flex-col gap-lg">
      <div className="flex flex-wrap gap-sm items-center">
        <div className="min-w-0 flex-1 basis-52 flex items-center gap-sm rounded-xl border border-outline-variant/20 bg-surface-container-low px-md py-sm"><Search size={18} className="shrink-0 text-on-surface-variant"/><input aria-label="Cari interpreter" placeholder="Cari nama atau perusahaan…" value={search} onChange={e=>setSearch(e.target.value)} className="min-w-0 w-full bg-transparent text-body text-on-surface outline-none placeholder:text-on-surface-variant"/></div>
        <Button variant={count?'primary':'outline'} onClick={()=>{setDraft({...filters});setFormError('');setFilterOpen(true)}}><SlidersHorizontal size={17}/>Filter{count>0&&<span className="rounded-full bg-on-surface/10 px-sm text-caption">{count}</span>}</Button>
      </div>
      <div className="flex flex-wrap justify-between items-center gap-sm text-caption text-on-surface-variant"><p role="status">{loaded?`${filtered.length} interpreter`:'Memuat database…'} · kategori filter: {feeCategories.find(c=>c.unit===filters.unit)?.label||unitLabels[filters.unit]}</p>{count>0&&<button className="inline-flex items-center gap-xs text-primary" onClick={()=>setFilters(defaults())}><X size={13}/>Reset filter</button>}</div>
      {(filters.company||filters.min!==''||filters.max!=='')&&<div className="flex flex-wrap gap-xs text-caption">{filters.company&&<span className="rounded-full bg-primary/10 text-primary px-md py-xs">{filters.company}</span>}{filters.min!==''&&<span className="rounded-full bg-primary/10 text-primary px-md py-xs">Mulai {money(filters.min)}</span>}{filters.max!==''&&<span className="rounded-full bg-primary/10 text-primary px-md py-xs">Di bawah {money(filters.max)} / {unitLabels[filters.unit]}</span>}</div>}
      {error&&<p role="alert" className="text-error">{error} <Button variant="ghost" onClick={()=>setRevision(n=>n+1)}>Coba lagi</Button></p>}
      {loaded&&<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">{filtered.map(i=><button key={i.id} onClick={()=>navigate(`/profil/${i.id}`)} className="min-w-0 rounded-xl border border-outline-variant/15 bg-surface-container-low p-lg text-left hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors flex flex-col gap-md">
        <div className="flex items-center gap-md min-w-0"><Avatar name={i.name} colorKey={i.color_key} avatarUrl={i.avatar_url} size="lg"/><div className="min-w-0 flex-1"><h2 className="font-h3 text-h3 text-on-surface break-words">{i.name}</h2><p className="text-caption text-on-surface-variant">{i.jlpt_level?`JLPT ${i.jlpt_level}`:i.status==='aktif'?'Interpreter':'Nonaktif'}</p></div><ArrowUpRight size={16} className="shrink-0 text-on-surface-variant"/></div>
        <FeeCategories fees={i.fees} selectedUnit={filters.unit} budgetActive={filters.min!==''||filters.max!==''}/>
        <div className="flex flex-wrap gap-xs">{i.companies.slice(0,5).map(c=><span key={c} className="rounded-md bg-primary/10 text-primary px-sm py-xs text-caption">{c}</span>)}{i.companies.length>5&&<span className="text-caption text-on-surface-variant py-xs">+{i.companies.length-5}</span>}{!i.companies.length&&<span className="text-caption text-on-surface-variant">Belum ada riwayat perusahaan</span>}</div>
        {i.restrictions.length>0&&<p className="text-caption text-error">{i.restrictions.map(r=>r.company?`Blacklist ${r.company}`:'Blacklist semua perusahaan').join(' · ')}</p>}
      </button>)}</div>}
      {loaded&&!filtered.length&&<div className="rounded-xl border border-dashed border-outline-variant/30 p-xl text-center"><h2 className="font-h3 text-h3">Tidak ada interpreter yang cocok</h2><p className="text-body text-on-surface-variant mt-sm">Coba ubah batas fee, satuan tarif, atau filter perusahaan.</p><Button className="mt-md" variant="ghost" onClick={()=>{setFilters(defaults());setSearch('')}}>Reset pencarian</Button></div>}
    </div>
    <Modal open={filterOpen} onClose={()=>setFilterOpen(false)} title="Filter interpreter" maxWidth="max-w-2xl" footer={<div className="w-full flex flex-wrap items-center justify-between gap-xs"><Button variant="ghost" className="!px-sm" onClick={()=>{setDraft(defaults());setFormError('')}}>Reset</Button><div className="flex gap-xs"><Button variant="ghost" className="!px-sm" onClick={()=>setFilterOpen(false)}>Batal</Button><Button form="interpreter-directory-filters" type="submit" className="!px-md">Terapkan filter</Button></div></div>}>
      <form id="interpreter-directory-filters" onSubmit={apply} className="flex flex-col gap-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md"><Select label="Perusahaan dalam riwayat tugas" value={draft.company} onChange={update('company')}><option value="">Semua perusahaan</option>{companies.map(c=><option key={c}>{c}</option>)}</Select><Select label="Status penugasan" value={draft.duty} onChange={update('duty')}><option value="">Semua status</option>{['Ada tugas','Tidak ada jadwal','Tidak tersedia','Nonaktif','Blacklist semua perusahaan','Dibatasi perusahaan'].map(c=><option key={c}>{c}</option>)}</Select></div>
        <fieldset className="rounded-xl bg-surface-container-low border border-outline-variant/15 p-md flex flex-col gap-md"><legend className="px-xs font-h3 text-h3">Anggaran fee</legend><FeeCategoryPicker value={draft.unit} onChange={unit=>setDraft(f=>({...f,unit}))}/><details><summary className="text-caption text-on-surface-variant cursor-pointer">Kategori tarif lainnya</summary><Select label="Kategori lainnya" value={draft.unit} onChange={update('unit')}>{Object.entries(units).map(([v,label])=><option key={v} value={v}>{label}</option>)}</Select></details><div className="flex flex-wrap gap-xs">{[['Di bawah Rp1 juta','','1000000'],['Rp1–1,5 juta','1000000','1500000'],['Semua fee','','']].map(([label,min,max])=><button key={label} type="button" onClick={()=>setDraft(f=>({...f,min,max}))} className={`rounded-full border px-md py-xs text-caption ${draft.min===min&&draft.max===max?'border-primary bg-primary/10 text-primary':'border-outline-variant/25 text-on-surface-variant'}`}>{label}</button>)}</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-md"><TextInput label="Fee minimum (Rp), termasuk" type="number" min="0" step="1" placeholder="Tanpa minimum" value={draft.min} onChange={update('min')}/><TextInput label="Fee maksimum (Rp), di bawah" type="number" min="1" step="1" placeholder="Tanpa maksimum" value={draft.max} onChange={update('max')}/></div><p className="text-caption text-on-surface-variant">Menggunakan tarif IDR yang berlaku pada tanggal request. Tarif khusus perusahaan diprioritaskan. Kandidat tanpa tarif tidak masuk hasil saat batas fee dipasang.</p></fieldset>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md"><TextInput label="Tanggal request" type="date" required value={draft.date} onChange={update('date')}/><TextInput label="Jam mulai" type="time" required value={draft.start} onChange={update('start')}/><TextInput label="Jam selesai" type="time" required value={draft.end} onChange={update('end')}/></div>
        <Select label="Urutkan" value={draft.sort} onChange={update('sort')}><option value="name">Nama A–Z</option><option value="fee">Fee terendah</option><option value="company">Perusahaan A–Z</option><option value="project">Proyek A–Z</option><option value="experience">Tugas selesai terkonfirmasi terbanyak</option><option value="rating">Rating tertinggi</option></Select>
        <p className="text-caption text-on-surface-variant">Tidak ada jadwal belum berarti siap menerima tugas. Konfirmasi kesiapan sebelum booking.</p>
        {formError&&<p role="alert" className="text-error">{formError}</p>}
      </form>
    </Modal>
    {review&&<WorkbookReview onClose={()=>{setReview(false);setRevision(n=>n+1)}}/>}
  </>
}
