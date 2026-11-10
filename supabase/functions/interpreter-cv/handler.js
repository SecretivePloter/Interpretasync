import { CV_BUCKET, MAX_CV_BYTES, CV_URL_SECONDS, validateCvFile } from '../../../src/utils/interpreterCv.js'

const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)
const allowedOrigin = origin => !origin || ['https://app.ichikara.co.id','https://interpretasync.vercel.app','https://interpretasync-secretiveploters-projects.vercel.app'].includes(origin) || /^https:\/\/interpretasync-[a-z0-9-]+-secretiveploters-projects\.vercel\.app$/.test(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)

async function limitedFormData(request) {
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Pilih file PDF terlebih dahulu.')
  const parts = []; let size = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_CV_BYTES + 65536) { await reader.cancel(); throw new Error('Ukuran CV maksimal 5 MB.') }
    parts.push(value)
  }
  const bytes = new Uint8Array(size); let offset = 0
  for (const part of parts) { bytes.set(part,offset); offset += part.length }
  return new Response(bytes,{headers:{'Content-Type':request.headers.get('Content-Type')}}).formData()
}

export function createCvHandler({ createClient, env }) {
  return async request => {
    const origin = request.headers.get('Origin') || ''
    const headers = { 'Content-Type':'application/json', 'Cache-Control':'no-store', 'Vary':'Origin',
      ...(allowedOrigin(origin) ? {'Access-Control-Allow-Origin':origin || 'https://app.ichikara.co.id'} : {}),
      'Access-Control-Allow-Headers':request.headers.get('Access-Control-Request-Headers') || 'authorization,apikey,content-type,x-client-info',
      'Access-Control-Allow-Methods':'POST,OPTIONS' }
    const reply = (status,body) => new Response(JSON.stringify(body),{status,headers})
    if (!allowedOrigin(origin)) return reply(403,{error:'Asal permintaan tidak diizinkan.'})
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers})
    if (request.method !== 'POST') return reply(405,{error:'Metode tidak diizinkan.'})
    const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1]
    if (!token) return reply(401,{error:'Silakan masuk terlebih dahulu.'})
    try {
      const options = { db:{schema:'ichikara'}, auth:{persistSession:false,autoRefreshToken:false} }
      const caller = createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{...options,global:{headers:{Authorization:`Bearer ${token}`}}})
      const { data:identity,error:authError } = await caller.auth.getUser(token)
      if (authError || !identity?.user) return reply(401,{error:'Sesi tidak valid. Silakan masuk kembali.'})
      const role = await caller.rpc('is_management')
      if (role.error || role.data !== true) return reply(403,{error:'Akses CV hanya untuk manajemen.'})
      const admin = createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),options)
      const storage = admin.storage.from(CV_BUCKET)
      const erase = async (id, completedUpload=false) => {
        const marked = await admin.rpc('begin_delete_interpreter_cv',{p_cv_id:id,p_completed_upload:completedUpload})
        if (marked.error) return {error:marked.error.message?.includes('10 menit') ? marked.error.message : 'Penghapusan CV belum selesai. Silakan coba lagi.'}
        if (!marked.data) return {ok:true}
        const removed = await storage.remove([marked.data])
        if (removed.error && String(removed.error.statusCode ?? removed.error.status) !== '404') return {error:'File belum dapat dihapus. Versi ini ditandai untuk penghapusan; silakan coba lagi.'}
        const deleted = await admin.from('interpreter_cvs').delete().eq('id',id).eq('state','deleting')
        return deleted.error ? {error:'Penghapusan metadata belum selesai. Silakan coba lagi.'} : {ok:true}
      }
      if (request.headers.get('Content-Type')?.startsWith('multipart/form-data')) {
        let form, file
        try { form = await limitedFormData(request); file = await validateCvFile(form.get('file')) }
        catch (error) { return reply(400,{error:error.message}) }
        const person = String(form.get('interpreter_id') || '').toLowerCase()
        if (!uuid(person)) return reply(400,{error:'Interpreter tidak valid.'})
        const found = await admin.from('interpreters').select('id').eq('id',person).maybeSingle()
        if (found.error || !found.data) return reply(404,{error:'Interpreter tidak ditemukan.'})
        const duplicate = await admin.from('interpreter_cvs').select('id').eq('interpreter_id',person).eq('sha256',file.sha256).eq('state','ready').maybeSingle()
        if (duplicate.error) return reply(503,{error:'Status CV belum dapat diperiksa. Coba lagi.'})
        if (duplicate.data) return reply(409,{error:'File yang sama sudah ada di riwayat CV. Tidak perlu mengunggah ulang.'})
        const id = crypto.randomUUID(), path = `${person}/${id}.pdf`
        const reserved = await admin.from('interpreter_cvs').insert({id,interpreter_id:person,storage_path:path,original_name:file.name,byte_size:file.size,mime_type:file.mime,sha256:file.sha256,uploaded_by:identity.user.id,state:'pending',is_active:false})
        if (reserved.error) return reply(503,{error:'Unggahan CV belum dapat dimulai. Coba lagi.'})
        const uploaded = await storage.upload(path,file.bytes,{contentType:file.mime,cacheControl:'0',upsert:false})
        // An uncertain upload may complete after a network timeout. Keep pending metadata
        // so cleanup after 10 minutes can remove it safely through the Storage API.
        if (uploaded.error) return reply(503,{error:'Unggahan belum selesai. CV sebelumnya tetap tersedia. Coba unggah lagi; unggahan tertunda dapat dibersihkan setelah 10 menit.'})
        const finalized = await admin.rpc('finalize_interpreter_cv',{p_cv_id:id})
        if (finalized.error) {
          await erase(id,true)
          return reply(finalized.error.code==='23505'?409:503,{error:finalized.error.code==='23505'?'File yang sama sudah ada di riwayat CV.':'CV belum dapat diaktifkan. CV sebelumnya tetap tersedia; periksa riwayat unggahan.'})
        }
        return reply(200,{ok:true})
      }
      const length = Number(request.headers.get('Content-Length') || 0)
      if (length > 4096) return reply(400,{error:'Permintaan tidak valid.'})
      let body
      try { body = await request.json() } catch { return reply(400,{error:'Permintaan tidak valid.'}) }
      if (!uuid(body.cv_id) || !['download','delete'].includes(body.action)) return reply(400,{error:'Permintaan CV tidak valid.'})
      const found = await admin.from('interpreter_cvs').select('*').eq('id',body.cv_id).maybeSingle()
      if (found.error) return reply(503,{error:'Data CV belum dapat dimuat.'})
      if (!found.data) return body.action==='delete' ? reply(200,{ok:true}) : reply(404,{error:'CV tidak ditemukan.'})
      if (body.action==='delete') {
        const result = await erase(body.cv_id)
        return reply(result.error?409:200,result)
      }
      if (found.data.state!=='ready') return reply(409,{error:'Versi CV ini belum tersedia untuk diunduh.'})
      const signed = await storage.createSignedUrl(found.data.storage_path,CV_URL_SECONDS)
      if (signed.error) return reply(503,{error:'Tautan download CV belum dapat dibuat. Coba lagi.'})
      return reply(200,{url:signed.data.signedUrl,filename:found.data.original_name,expires_in:CV_URL_SECONDS})
    } catch {
      return reply(503,{error:'Layanan CV belum tersedia. Silakan coba lagi.'})
    }
  }
}
