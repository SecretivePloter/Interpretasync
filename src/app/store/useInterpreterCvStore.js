import { create } from 'zustand'
import { listActiveCvs } from '../../services/interpreterCvs'

export const useInterpreterCvStore = create((set,get) => ({
  active: {}, loaded:false, loading:false, error:'', epoch:0,
  load: async (force=false) => {
    if (get().loading && !force) return
    const epoch=get().epoch+1
    set({loading:true,error:'',epoch})
    try {
      const rows=await listActiveCvs()
      if (get().epoch===epoch) set({active:Object.fromEntries(rows.map(row=>[row.interpreter_id,row])),loaded:true,error:''})
    } catch(error) { if(get().epoch===epoch)set({error:error.message}) }
    finally { if(get().epoch===epoch)set({loading:false}) }
  },
  reset:()=>set(s=>({active:{},loaded:false,loading:false,error:'',epoch:s.epoch+1})),
}))
