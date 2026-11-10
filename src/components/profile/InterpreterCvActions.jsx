import { useEffect, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import Button from '../ui/Button'
import InterpreterCvManager from './InterpreterCvManager'
import { useAuthStore } from '../../app/store/useAuthStore'
import { useInterpreterCvStore } from '../../app/store/useInterpreterCvStore'
import { downloadInterpreterCv } from '../../services/interpreterCvs'
import { toast } from '../../app/store/useToastStore'

export default function InterpreterCvActions({interpreter}) {
  const role=useAuthStore(s=>s.role)
  const active=useInterpreterCvStore(s=>s.active[interpreter.id])
  const loading=useInterpreterCvStore(s=>s.loading),loaded=useInterpreterCvStore(s=>s.loaded),error=useInterpreterCvStore(s=>s.error)
  const load=useInterpreterCvStore(s=>s.load)
  const [open,setOpen]=useState(false),[downloading,setDownloading]=useState(false)
  useEffect(()=>{if(role==='manajemen'&&!useInterpreterCvStore.getState().loaded)load()},[role,load])
  if(role!=='manajemen')return null
  return <div className="mt-auto min-w-0 border-t border-outline-variant/15 pt-md" data-testid="interpreter-cv-actions">
    <p className={`mb-sm truncate text-caption ${error?'text-error':'text-on-surface-variant'}`} title={active?.original_name}>{error?'Status CV belum dapat dimuat':active?active.original_name:loading||!loaded?'Memuat CV…':'Belum ada CV'}</p>
    <div className="flex flex-wrap gap-sm">
      <Button variant="outline" className="min-w-0 flex-1 !px-sm !text-caption" disabled={!active||downloading} onClick={async()=>{setDownloading(true);try{await downloadInterpreterCv(active.id)}catch(e){toast.error(e.message);load(true)}finally{setDownloading(false)}}} aria-label={`Download CV ${interpreter.name}`}><Download size={15} className="shrink-0"/>{downloading?'Mengunduh…':'Download CV'}</Button>
      <Button variant="ghost" className="min-w-0 flex-1 !px-sm !text-caption" onClick={()=>setOpen(true)} aria-label={`Update CV ${interpreter.name}`}><Upload size={15} className="shrink-0"/>Update CV</Button>
    </div>
    <InterpreterCvManager interpreter={interpreter} open={open} onClose={()=>setOpen(false)}/>
  </div>
}
