import { useEffect, useRef, useState } from 'react'
import { Download, FileText, Trash2, Upload } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { listCvVersions, uploadInterpreterCv, deleteInterpreterCv, downloadInterpreterCv } from '../../services/interpreterCvs'
import { useInterpreterCvStore } from '../../app/store/useInterpreterCvStore'
import { cvDate, cvSize, validateCvFile } from '../../utils/interpreterCv'
import { toast } from '../../app/store/useToastStore'

function CvFilename({name}) {
  return /\.pdf$/i.test(name) ? <>{name.slice(0,-4)}<span className="whitespace-nowrap">{name.slice(-4)}</span></> : name
}

export default function InterpreterCvManager({interpreter,open,onClose}) {
  const [rows,setRows]=useState([]),[file,setFile]=useState(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[target,setTarget]=useState(null)
  const alive=useRef(false)
  const refresh=async()=>{
    const data=await listCvVersions(interpreter.id)
    if(alive.current)setRows(data)
    await useInterpreterCvStore.getState().load(true)
  }
  useEffect(()=>{
    alive.current=open
    if(!open){setFile(null);setRows(previous=>previous.length?[]:previous);setTarget(null);setBusy(false);return}
    setLoading(true);setError('');setFile(null);setTarget(null)
    useInterpreterCvStore.getState().load(true)
    listCvVersions(interpreter.id).then(data=>{if(alive.current)setRows(data)}).catch(e=>{if(alive.current)setError(e.message)}).finally(()=>{if(alive.current)setLoading(false)})
    return()=>{alive.current=false}
  },[open,interpreter.id])
  const choose=async e=>{
    const selected=e.target.files?.[0];e.target.value=''
    if(!selected)return
    setBusy(true);setError('');setFile(null)
    try{await validateCvFile(selected);setFile(selected)}catch(e){setError(e.message)}finally{setBusy(false)}
  }
  const run=async action=>{
    if(busy)return
    setBusy(true);setError('')
    try{await action()}catch(e){if(alive.current)setError(e.message)}finally{if(alive.current)setBusy(false)}
  }
  return <>
    <Modal open={open} onClose={()=>{if(!busy)onClose()}} title="CV interpreter" maxWidth="max-w-2xl" footer={<><Button variant="ghost" disabled={busy} onClick={onClose}>Tutup</Button><Button disabled={busy||!file} onClick={()=>run(async()=>{await uploadInterpreterCv(interpreter.id,file);setFile(null);await refresh();toast.success('CV berhasil diperbarui')})}><Upload size={15}/>{busy?'Memproses…':'Upload CV'}</Button></>}>
      <div className="flex min-w-0 flex-col gap-md">
        <p className="font-medium text-on-surface break-words">{interpreter.name}</p>
        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low p-md">
          <label className={`inline-flex cursor-pointer items-center gap-sm rounded-lg border border-outline-variant/30 px-md py-sm text-body ${busy?'pointer-events-none opacity-50':''}`}><Upload size={16}/>Pilih PDF<input type="file" accept=".pdf,application/pdf" disabled={busy} onChange={choose} className="sr-only" aria-label="Pilih file CV PDF"/></label>
          <p className="mt-sm text-caption text-on-surface-variant">PDF, maksimal 5 MB. Update menyimpan versi baru; versi sebelumnya tetap tersedia.</p>
          {file&&<p className="mt-sm break-all text-caption text-primary"><CvFilename name={file.name}/> · {cvSize(file.size)}</p>}
        </div>
        {error&&<div role="alert" className="rounded-lg bg-error/5 p-sm text-caption text-error break-words">{error}<button className="ml-sm underline" disabled={busy} onClick={()=>run(refresh)}>Coba muat ulang</button></div>}
        <h3 className="font-h3 text-h3">Riwayat CV</h3>
        {loading?<p className="text-caption text-on-surface-variant">Memuat riwayat CV…</p>:!rows.length?<p className="text-caption text-on-surface-variant">Belum ada CV. Pilih PDF lalu tekan Upload CV.</p>:<ul className="flex flex-col gap-sm">{rows.map(row=><li key={row.id} className={`min-w-0 rounded-xl border p-md ${row.is_active?'border-primary/35 bg-primary/5':'border-outline-variant/20'}`}>
          <div className="flex min-w-0 items-start gap-sm"><FileText size={18} className="shrink-0 text-on-surface-variant"/><div className="min-w-0 flex-1"><p className="text-body font-medium break-all"><CvFilename name={row.original_name}/></p><p className="mt-xs text-caption text-on-surface-variant">{cvDate(row.uploaded_at)} · {cvSize(row.byte_size)}</p><p className={`mt-xs text-caption ${row.is_active?'text-primary':'text-on-surface-variant'}`}>{row.is_active?'CV aktif':row.state==='ready'?'Versi sebelumnya':row.state==='pending'?'Unggahan belum selesai. Dapat dibersihkan setelah 10 menit.':'Penghapusan belum selesai. Silakan coba lagi.'}</p></div></div>
          <div className="mt-sm flex flex-wrap gap-xs">{row.state==='ready'&&<Button variant="ghost" className="!px-sm !text-caption" disabled={busy} onClick={()=>run(()=>downloadInterpreterCv(row.id))}><Download size={14}/>Download</Button>}<Button variant="ghost" className="!px-sm !text-caption text-error" disabled={busy} onClick={()=>setTarget(row)}><Trash2 size={14}/>{row.state==='ready'?'Hapus':'Bersihkan'}</Button></div>
        </li>)}</ul>}
      </div>
    </Modal>
    <ConfirmDialog open={Boolean(target)} onClose={()=>{if(!busy)setTarget(null)}} loading={busy} title="Hapus versi CV" message={`Hapus “${target?.original_name || 'CV'}”? File versi ini akan dihapus. Jika CV aktif dihapus, versi sebelumnya yang masih tersedia akan menjadi aktif.`} onConfirm={()=>run(async()=>{await deleteInterpreterCv(target.id);setTarget(null);await refresh();toast.success('Versi CV dihapus')})}/>
  </>
}
