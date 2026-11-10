import test from 'node:test'
import assert from 'node:assert/strict'
import {validateCvFile,MAX_CV_BYTES} from '../src/utils/interpreterCv.js'
import {createCvHandler} from '../supabase/functions/interpreter-cv/handler.js'
const pdf=(name='履歴書 Grace 2026.PDF',type='application/pdf',content='%PDF-1.4\n%%EOF')=>new File([content],name,{type})
test('PDF validation preserves Japanese/spaces, supports empty browser MIME, and hashes content',async()=>{
 const a=await validateCvFile(pdf()),b=await validateCvFile(pdf('other.pdf',''))
 assert.equal(a.name,'履歴書 Grace 2026.PDF');assert.equal(a.sha256,b.sha256);assert.equal(a.sha256.length,64);assert.equal(a.mime,'application/pdf')
})
test('reject wrong extension/MIME, renamed non-PDF, empty, oversized and unsafe names',async()=>{
 for(const f of [pdf('x.docx'),pdf('x.pdf','image/png'),pdf('x.pdf','application/pdf','JPEG'),pdf('x.pdf','application/pdf',''),pdf('../x.pdf'),pdf('x\n.pdf'),pdf('x.pdf','application/pdf',new Uint8Array(MAX_CV_BYTES+1))])await assert.rejects(validateCvFile(f))
})
const request=(token='valid',body={action:'download',cv_id:'11111111-1111-4111-8111-111111111111'})=>new Request('https://api.example/cv',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)})
function fake({role=true,auth=true,duplicate=false,uploadError=false,finalizeError=false,cv=null,removeError=null}={}){
 const calls=[];let uploaded=false
 const builder=(table)=>{let action='select';const query={select(){return this},eq(){return this},insert(row){action='insert';calls.push({action:'reserve',row});return this},delete(){action='delete';return this},maybeSingle:async()=>({data:table==='interpreters'?{id:'11111111-1111-4111-8111-111111111111'}:cv || (duplicate?{id:'existing'}:null),error:null}),then(resolve){calls.push({action,table});return Promise.resolve({data:null,error:null}).then(resolve)}};return query}
 const storage={upload:async(path,bytes,options)=>{uploaded=true;calls.push({action:'upload',path,options});return {error:uploadError?{}:null}},remove:async paths=>{calls.push({action:'remove',paths});return {error:removeError}},createSignedUrl:async(path,seconds)=>{calls.push({action:'sign',path,seconds});return {data:{signedUrl:'signed'},error:null}}}
 const caller={auth:{getUser:async()=>({data:{user:auth?{id:'22222222-2222-4222-8222-222222222222'}:null},error:auth?null:{}})},rpc:async()=>({data:role,error:null})}
 const admin={from:builder,storage:{from:()=>storage},rpc:async(name,args)=>{calls.push({action:name,args});return name==='finalize_interpreter_cv'?{error:finalizeError?{code:'23505'}:null}:{data:'cleanup.pdf',error:null}}}
 const handler=createCvHandler({createClient:(_url,key)=>key==='service'?admin:caller,env:name=>name==='SUPABASE_SERVICE_ROLE_KEY'?'service':'public'})
 return {handler,calls,get uploaded(){return uploaded}}
}
test('missing/invalid identity and non-management cannot reach Storage',async()=>{
 for(const [config,token,status] of [[{},'',401],[{auth:false},'bad',401],[{role:false},'valid',403]]){
  const f=fake(config);assert.equal((await f.handler(request(token))).status,status);assert.equal(f.calls.length,0)
 }
})
test('CORS rejects foreign origin and preflight works without authentication',async()=>{
 const f=fake();const r=request();r.headers.set('Origin','https://evil.example');assert.equal((await f.handler(r)).status,403)
 const p=await f.handler(new Request('https://api.example/cv',{method:'OPTIONS',headers:{Origin:'https://app.ichikara.co.id'}}));assert.equal(p.status,204)
})
async function upload(handler,file=pdf()){
 const form=new FormData();form.set('interpreter_id','11111111-1111-4111-8111-111111111111');form.set('file',file)
 return handler(new Request('https://api.example/cv',{method:'POST',headers:{Authorization:'Bearer valid'},body:form}))
}
test('server independently rejects renamed non-PDF before reserving or writing',async()=>{
 const f=fake();assert.equal((await upload(f.handler,pdf('fake.pdf','application/pdf','JPEG'))).status,400);assert.equal(f.calls.length,0)
})
test('upload uses UUID path, no upsert, owner identity and finalizes after Storage',async()=>{
 const f=fake();assert.equal((await upload(f.handler)).status,200)
 const reserve=f.calls.find(c=>c.action==='reserve').row,stored=f.calls.find(c=>c.action==='upload')
 assert.match(stored.path,/^[a-f0-9-]+\/[a-f0-9-]+\.pdf$/);assert.equal(stored.options.upsert,false);assert.equal(reserve.uploaded_by,'22222222-2222-4222-8222-222222222222')
 assert.ok(f.calls.findIndex(c=>c.action==='upload')<f.calls.findIndex(c=>c.action==='finalize_interpreter_cv'))
})
test('duplicate contents never upload another object',async()=>{
 const f=fake({duplicate:true});assert.equal((await upload(f.handler)).status,409);assert.equal(f.uploaded,false)
})
test('failed Storage upload never activates; pending metadata stays tracked',async()=>{
 const f=fake({uploadError:true});assert.equal((await upload(f.handler)).status,503);assert.ok(f.calls.some(c=>c.action==='reserve'));assert.ok(!f.calls.some(c=>c.action==='finalize_interpreter_cv'||c.action==='remove'))
})
test('failed finalization cleans only the new completed upload through Storage API',async()=>{
 const f=fake({finalizeError:true});assert.equal((await upload(f.handler)).status,409);assert.ok(f.calls.some(c=>c.action==='remove'));assert.ok(f.calls.some(c=>c.action==='begin_delete_interpreter_cv'&&c.args.p_completed_upload===true))
})

test('ready CV download issues a 60-second signed URL and a filename only after authorization',async()=>{
 const f=fake({cv:{state:'ready',storage_path:'person/cv.pdf',original_name:'履歴書.pdf'}})
 const r=await f.handler(request());assert.equal(r.status,200);assert.equal((await r.json()).expires_in,60)
 assert.equal(f.calls.find(c=>c.action==='sign').seconds,60)
 const pending=fake({cv:{state:'pending'}});assert.equal((await pending.handler(request())).status,409);assert.ok(!pending.calls.some(c=>c.action==='sign'))
})
test('delete action cannot force cleanup of an unfinished upload using client parameters',async()=>{
 const f=fake({cv:{state:'pending'}})
 await f.handler(request('valid',{action:'delete',cv_id:'11111111-1111-4111-8111-111111111111',p_completed_upload:true}))
 assert.equal(f.calls.find(c=>c.action==='begin_delete_interpreter_cv').args.p_completed_upload,false)
})

test('retry after an already removed object can complete metadata cleanup',async()=>{
 const f=fake({cv:{state:'deleting'},removeError:{statusCode:'404'}})
 const r=await f.handler(request('valid',{action:'delete',cv_id:'11111111-1111-4111-8111-111111111111'}))
 assert.equal(r.status,200);assert.ok(f.calls.some(c=>c.action==='delete'&&c.table==='interpreter_cvs'))
})
test('Storage deletion failure preserves tracked metadata for retry',async()=>{
 const f=fake({cv:{state:'ready'},removeError:{statusCode:'500'}})
 const r=await f.handler(request('valid',{action:'delete',cv_id:'11111111-1111-4111-8111-111111111111'}))
 assert.equal(r.status,409);assert.ok(!f.calls.some(c=>c.action==='delete'&&c.table==='interpreter_cvs'))
})
