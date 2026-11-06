// Daftar semua interpreter sebagai kartu. Klik kartu -> halaman profil detail.
import { useState, useMemo, useEffect } from 'react'
import { useEventStore } from '../app/store/useEventStore'
import { listRecords } from '../services/interpreterDatabase'
import { availability, averageRating, localDate } from '../utils/interpreterDatabase'
import { TextInput, Select } from '../components/ui/Field'
import Button from '../components/ui/Button'
import WorkbookReview from '../components/profile/WorkbookReview'
import { useNavigate } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { useInterpreterStore } from '../app/store/useInterpreterStore'
import { getColorHex } from '../utils/colors'

export default function ProfileListPage() {
  const navigate = useNavigate()
  const interpreters = useInterpreterStore((s) => s.interpreters)
  const loading = useInterpreterStore((s) => s.loading)
  const loaded = useInterpreterStore((s) => s.loaded)
  const [search, setSearch] = useState('')
  const events = useEventStore(s=>s.events)
  const eventsLoaded = useEventStore(s=>s.loaded)
  const [extra,setExtra] = useState({history:[],rates:[],blocks:[]})
  const [company,setCompany] = useState('')
  const [duty,setDuty] = useState('')
  const [date,setDate] = useState(localDate())
  const [start,setStart] = useState('08:00')
  const [end,setEnd] = useState('17:00')
  const [sort,setSort] = useState('name')
  const [review,setReview] = useState(false)
  const [revision,setRevision] = useState(0)
  const [error,setError] = useState('')
  const [extraReady,setExtraReady] = useState(false)
  useEffect(()=>{let active=true;setExtraReady(false);Promise.all(['interpreter_experiences','interpreter_rates','interpreter_blocks'].map(t=>listRecords(t))).then(([history,rates,blocks])=>{if(active){setExtra({history,rates,blocks});setError('');setExtraReady(true)}}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[revision])
  const companies = [...new Set([...extra.history,...extra.rates,...events].map(x=>x.company).filter(Boolean))].sort()
  const validRange = date && start && end && start < end
  const status = i => !validRange ? 'Rentang belum valid' : !eventsLoaded || !extraReady ? 'Ketersediaan belum termuat' : availability(i,events,extra.blocks,date,start,end)
  const relevant = i => extra.history.filter(x=>x.interpreter_id===i.id&&(!company||x.company===company))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return interpreters.filter(i=>i.name!=='Belum Ditentukan').filter(i=>!duty||status(i)===duty).filter(i=>!company||[...extra.history,...extra.rates,...events].some(x=>x.interpreter_id===i.id&&x.company===company)).filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.specialties || []).some((s) => s.toLowerCase().includes(q)) ||
        relevant(i).some(x=>`${x.company} ${x.project}`.toLowerCase().includes(q)),
    ).sort((a,b)=>sort==='rating'?(averageRating(relevant(b))||0)-(averageRating(relevant(a))||0):sort==='experience'?relevant(b).filter(x=>x.status==='completed').length-relevant(a).filter(x=>x.status==='completed').length:sort==='company'||sort==='project'?(relevant(a).map(x=>x[sort]).sort()[0]||'\uffff').localeCompare(relevant(b).map(x=>x[sort]).sort()[0]||'\uffff'):a.name.localeCompare(b.name))
  }, [interpreters, search,extra,company,duty,date,start,end,sort,events,eventsLoaded,extraReady])

  return (
    <>
      <PageHeader title="Database Interpreter" subtitle="Pengalaman proyek, ketersediaan, dan fee">
        <Button variant="outline" onClick={()=>setReview(true)}>Tinjau data Excel</Button>
        <div className="flex items-center gap-sm px-md py-sm rounded-lg bg-surface-container-low border border-outline-variant/10 w-72">
          <Search size={18} className="text-on-surface-variant" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / spesialisasi…"
            className="bg-transparent border-none focus:outline-none text-body font-body w-full text-on-surface placeholder:text-on-surface-variant/60"
          />
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-md lg:p-xl">
        <div className="rounded-xl bg-surface-container-low border border-outline-variant/20 p-lg mb-lg flex flex-col gap-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-md">
            <Select label="Perusahaan" value={company} onChange={e=>setCompany(e.target.value)}><option value="">Semua perusahaan</option>{companies.map(c=><option key={c}>{c}</option>)}</Select>
            <Select label="Status pada rentang pilihan" value={duty} onChange={e=>setDuty(e.target.value)}><option value="">Semua status</option>{['Ada tugas','Tidak ada jadwal','Tidak tersedia','Nonaktif'].map(c=><option key={c}>{c}</option>)}</Select>
            <Select label="Urutkan" value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Nama A–Z</option><option value="company">Perusahaan A–Z</option><option value="project">Proyek A–Z</option><option value="experience">Tugas selesai terbanyak</option><option value="rating">Rating tertinggi</option></Select>
            <TextInput label="Tanggal request" type="date" value={date} onChange={e=>setDate(e.target.value)} />
            <TextInput label="Jam mulai" type="time" value={start} onChange={e=>setStart(e.target.value)} />
            <TextInput label="Jam selesai" type="time" value={end} onChange={e=>setEnd(e.target.value)} />
          </div>
          {!validRange&&<p role="alert" className="text-error">Isi tanggal dan rentang jam yang valid dalam hari yang sama.</p>}
          <p className="text-caption text-on-surface-variant">Tidak ada jadwal belum berarti siap menerima pekerjaan. Konfirmasi kesiapan sebelum booking. Riwayat penawaran tidak dihitung sebagai tugas selesai.</p>
          {error&&<p role="alert" className="text-error">{error} <Button variant="ghost" onClick={()=>setRevision(n=>n+1)}>Coba lagi</Button></p>}
          <p className="text-caption text-on-surface-variant">{filtered.length} interpreter ditemukan</p>
        </div>
        {!loaded && loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada interpreter"
            description="Tambahkan interpreter melalui halaman Pengaturan."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {filtered.map((it) => {
              const hex = getColorHex(it.color_key)
              const active = it.status === 'aktif'
              return (
                <button
                  key={it.id}
                  onClick={() => navigate(`/profil/${it.id}`)}
                  className="min-w-0 text-left bg-surface-container-low border border-outline-variant/10 rounded-xl p-lg flex flex-col gap-md hover:border-primary/30 hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-md">
                      <Avatar name={it.name} colorKey={it.color_key} avatarUrl={it.avatar_url} size="lg" />
                      <div>
                        <h3 className="font-h3 text-h3 text-on-surface">{it.name}</h3>
                        <span className="font-caption text-caption text-on-surface-variant">
                          {it.jlpt_level ? `JLPT ${it.jlpt_level}` : 'JLPT —'}
                        </span>
                      </div>
                    </div>
                    <span
                      className="w-3 h-3 rounded-full mt-1"
                      style={{
                        backgroundColor: active ? '#2ECC71' : '#8c909e',
                        boxShadow: active ? '0 0 10px rgba(46,204,113,0.5)' : 'none',
                      }}
                      title={active ? 'Aktif' : 'Non-aktif'}
                    />
                  </div>
                  <p className="text-caption text-primary">{status(it)}</p>
                  <p className="text-caption text-on-surface-variant">{relevant(it).filter(x=>x.status==='completed').length} tugas selesai terkonfirmasi · {averageRating(relevant(it))?`★ ${averageRating(relevant(it)).toFixed(1)}/5 (${relevant(it).filter(x=>x.rating).length} penilaian)`:'Belum dinilai'}</p>
                  <p className="text-caption text-on-surface-variant break-words">{[...new Set(relevant(it).map(x=>x.company))].slice(0,3).join(' · ')||'Pengalaman perusahaan belum dilengkapi'}</p>
                  <div className="flex flex-wrap gap-xs">
                    {(it.specialties || []).slice(0, 3).map((s) => (
                      <Badge key={s} color={hex}>
                        {s}
                      </Badge>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
      {review&&<WorkbookReview onClose={()=>{setReview(false);setRevision(n=>n+1)}} />}
    </>
  )
}
