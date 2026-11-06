import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { TextInput,TextArea,Select } from '../ui/Field'
import { listRecords } from '../../services/interpreterDatabase'
import { supabase } from '../../services/supabase'
import { useInterpreterStore } from '../../app/store/useInterpreterStore'
import { toast } from '../../app/store/useToastStore'
import { localDate, units } from '../../utils/interpreterDatabase'

export default function WorkbookReview({onClose}) {
  const people=useInterpreterStore(s=>s.interpreters)
  const [rows,setRows]=useState([])
  const [sheet,setSheet]=useState('')
  const [search,setSearch]=useState('')
  const [status,setStatus]=useState('pending')
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  const [selected,setSelected]=useState(null)
  const [form,setForm]=useState({})
  const [saving,setSaving]=useState(false)
  const [limit,setLimit]=useState(30)
  const load=async()=>{setLoading(true);try{setRows(await listRecords('interpreter_sources'));setError('')}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{load()},[])
  const open=row=>{setSelected(row);setForm({interpreter_id:row.interpreter_id||people.find(p=>p.name.toLowerCase()===row.candidate_name.trim().toLowerCase())?.id||'',kind:'reference',company:row.raw_data._company_context||'',project:row.sheet==='Sales Rate Basic'?row.raw_data[`F${row.row_number}`]||'':row.sheet==='Rate Int. Project'?row.raw_data[`E${row.row_number}`]||'':'',year:'',amount:'',unit:'day',currency:'IDR',valid_from:localDate(),notes:''})}
  const change=key=>e=>setForm(f=>({...f,[key]:e.target.value}))
  const save=async e=>{
    e.preventDefault();if(saving||selected.status!=='pending')return
    if(['experience','rate'].includes(form.kind)&&!form.interpreter_id)return toast.error('Pilih interpreter yang identitasnya sudah dipastikan')
    setSaving(true)
    try{const {error}=await supabase.rpc('review_interpreter_source',{p_source_id:selected.id,p_interpreter_id:form.interpreter_id||null,p_kind:form.kind,p_data:form});if(error)throw error;toast.success('Tinjauan tersimpan');setSelected(null);await load()}catch(e){toast.error(e.message)}finally{setSaving(false)}
  }
  const filtered=rows.filter(r=>(!sheet||r.sheet===sheet)&&(!status||r.status===status)&&`${r.candidate_name} ${JSON.stringify(r.raw_data)}`.toLowerCase().includes(search.toLowerCase()))
  return <Modal open title="Tinjau sumber Excel" maxWidth="max-w-4xl" onClose={()=>!saving&&onClose()}>
    <div className="flex flex-col gap-md">
      <p className="text-caption text-on-surface-variant">Data asli dipertahankan bersama referensi sel. Pastikan identitas, satuan, mata uang, dan masa berlaku sebelum memasukkan tarif. Approved pada quotation tidak berarti tugas selesai. Untuk interpreter baru, tambahkan profil melalui Pengaturan lalu buka kembali tinjauan.</p>
      {error&&<p role="alert" className="text-error">{error} <Button onClick={load}>Coba lagi</Button></p>}
      {selected?<form onSubmit={save} className="flex flex-col gap-md">
        <Button type="button" variant="ghost" disabled={saving} onClick={()=>setSelected(null)}>← Daftar sumber</Button>
        <h3 className="font-h3">{selected.sheet} · baris {selected.row_number} · {selected.candidate_name||'Nama belum dipetakan'}</h3>
        <div className="max-h-56 overflow-auto rounded-lg border border-outline-variant/20 p-md"><dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-sm text-caption">{Object.entries(selected.raw_data).map(([cell,value])=><div className="contents" key={cell}><dt className="text-primary">{cell}</dt><dd className="whitespace-pre-wrap break-words">{typeof value==='object'?JSON.stringify(value):String(value)}</dd></div>)}</dl></div>
        <fieldset disabled={selected.status!=='pending'} className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <Select label="Tindakan" value={form.kind} onChange={change('kind')}><option value="reference">Tandai sudah ditinjau (sumber saja)</option><option value="experience">Tambah referensi pengalaman</option><option value="rate">Tambah tarif interpreter</option><option value="ignored">Abaikan baris ini</option></Select>
          <Select label="Interpreter terkonfirmasi" value={form.interpreter_id} onChange={change('interpreter_id')} required={['experience','rate'].includes(form.kind)}><option value="">Pilih identitas</option>{people.filter(p=>p.name!=='Belum Ditentukan').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select>
          {['experience','rate'].includes(form.kind)&&<><TextInput label="Perusahaan" value={form.company} onChange={change('company')} required={form.kind==='experience'} /><TextInput label="Proyek / aktivitas" value={form.project} onChange={change('project')} required={form.kind==='experience'} /></>}
          {form.kind==='experience'&&<TextInput label="Tahun (boleh kosong)" type="number" min="1900" max="2200" value={form.year} onChange={change('year')} />}
          {form.kind==='rate'&&<><TextInput label="Fee (sudah dipastikan sebagai fee interpreter)" type="number" min="0" step="0.01" value={form.amount} onChange={change('amount')} required /><Select label="Satuan" value={form.unit} onChange={change('unit')}>{Object.entries(units).map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select><Select label="Mata uang" value={form.currency} onChange={change('currency')}>{['IDR','JPY','USD'].map(c=><option key={c}>{c}</option>)}</Select><TextInput label="Tarif berlaku mulai" type="date" value={form.valid_from} onChange={change('valid_from')} required /></>}
        </fieldset>
        <TextArea label="Catatan tinjauan / bukti identitas dan tarif" value={form.notes} onChange={change('notes')} />
        {selected.status==='pending'?<Button type="submit" disabled={saving}>{saving?'Menyimpan…':'Simpan tinjauan'}</Button>:<p className="text-caption text-on-surface-variant">Sudah ditinjau {selected.reviewed_at||''}. {selected.review_notes}</p>}
      </form>:<>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md"><Select label="Sheet" value={sheet} onChange={e=>{setSheet(e.target.value);setLimit(30)}}><option value="">Semua sheet</option>{[...new Set(rows.map(r=>r.sheet))].map(s=><option key={s}>{s}</option>)}</Select><Select label="Status" value={status} onChange={e=>{setStatus(e.target.value);setLimit(30)}}><option value="">Semua</option><option value="pending">Perlu tinjauan</option><option value="reviewed">Sudah ditinjau</option><option value="ignored">Diabaikan</option></Select><TextInput label="Cari nama / isi" value={search} onChange={e=>{setSearch(e.target.value);setLimit(30)}} /></div>
        <p className="text-caption text-on-surface-variant">{loading?'Memuat sumber…':`${filtered.length} baris sumber`}</p>
        {filtered.slice(0,limit).map(r=><div key={r.id} className="rounded-xl border border-outline-variant/20 p-md min-w-0"><p className="text-caption text-on-surface-variant">{r.sheet} · baris {r.row_number} · {r.status}</p><p className="font-h3 break-words">{r.candidate_name||'Referensi perusahaan / quotation'}</p><p className="text-caption text-on-surface-variant break-words line-clamp-2">{Object.values(r.raw_data).map(v=>typeof v==='object'?JSON.stringify(v):String(v)).join(' · ')}</p><Button variant="ghost" onClick={()=>open(r)}>{r.status==='pending'?'Tinjau & petakan':'Lihat sumber'}</Button></div>)}
        {filtered.length>limit&&<Button variant="ghost" onClick={()=>setLimit(n=>n+30)}>Tampilkan berikutnya</Button>}
      </>}
    </div>
  </Modal>
}
