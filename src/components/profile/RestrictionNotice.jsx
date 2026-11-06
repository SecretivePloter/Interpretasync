export default function RestrictionNotice({restrictions=[]}) {
  if(!restrictions.length)return null
  return <div className="rounded-xl border border-error/30 bg-error/10 p-md text-body" role="note"><p className="font-h3 text-error">Pembatasan penugasan</p>{restrictions.map(r=><p key={r.id||r.company} className="text-caption mt-xs break-words"><strong>{r.company?`Blacklist ${r.company}`:'Blacklist semua perusahaan'}</strong>{r.reason?` · ${r.reason}`:''}</p>)}</div>
}
