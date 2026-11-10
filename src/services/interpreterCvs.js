import { supabase } from './supabase'
import { validateCvFile } from '../utils/interpreterCv'

async function readVersions(interpreterId, activeOnly) {
  const rows = []
  for (let from = 0; ; from += 500) {
    let query = supabase.from('interpreter_cvs').select('*').order('uploaded_at',{ascending:false}).order('id').range(from,from+499)
    if (interpreterId) query = query.eq('interpreter_id',interpreterId)
    if (activeOnly) query = query.eq('state','ready').eq('is_active',true)
    const {data,error} = await query
    if (error) throw new Error('Data CV belum dapat dimuat. Silakan coba lagi.')
    rows.push(...data)
    if (data.length < 500) return rows
  }
}
export const listActiveCvs = () => readVersions(null,true)
export const listCvVersions = id => readVersions(id,false)

async function invoke(body) {
  const {data,error} = await supabase.functions.invoke('interpreter-cv',{body})
  if (error) {
    let message = 'Layanan CV belum dapat dihubungi. Periksa koneksi dan coba lagi.'
    try { const response = await error.context?.json(); if (response?.error) message = response.error } catch { /* network error */ }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}
export async function uploadInterpreterCv(interpreterId,file) {
  await validateCvFile(file)
  const form = new FormData()
  form.set('interpreter_id',interpreterId); form.set('file',file)
  return invoke(form)
}
export const deleteInterpreterCv = id => invoke({action:'delete',cv_id:id})
export async function downloadInterpreterCv(id) {
  const {url,filename} = await invoke({action:'download',cv_id:id})
  const expected = new URL(import.meta.env.VITE_SUPABASE_URL)
  let signed
  try { signed = new URL(url) } catch { throw new Error('Tautan download CV tidak valid.') }
  if (signed.origin !== expected.origin || !signed.pathname.startsWith('/storage/v1/object/sign/')) throw new Error('Tautan download CV tidak valid.')
  const response = await fetch(url,{cache:'no-store',credentials:'omit'})
  if (!response.ok) throw new Error('Download CV gagal atau tautannya kedaluwarsa. Silakan coba lagi.')
  const blob = await response.blob()
  const localUrl = URL.createObjectURL(blob)
  const link = document.createElement('a');link.href=localUrl;link.download=filename;link.style.display='none'
  document.body.appendChild(link);link.click();link.remove()
  window.setTimeout(()=>URL.revokeObjectURL(localUrl),1000)
}
