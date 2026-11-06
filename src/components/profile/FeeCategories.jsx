import { Sun, Sunrise, CalendarDays } from 'lucide-react'
import { money } from '../../utils/interpreterDatabase'

export const feeCategories=[
  {unit:'day',label:'Harian · Full day',short:'Full day',basis:'per hari',icon:Sun},
  {unit:'half_day',label:'Harian · Half day',short:'Half day',basis:'per half day',icon:Sunrise},
  {unit:'month',label:'Bulanan',short:'Bulanan',basis:'per bulan',icon:CalendarDays},
]

export function FeeCategoryPicker({value,onChange}) {
  return <fieldset className="flex flex-col gap-sm"><legend className="text-body font-medium mb-sm">Kategori fee untuk filter</legend><div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">{feeCategories.map(({unit,label,basis,icon:Icon})=><label key={unit} className={`relative flex items-center sm:items-start sm:flex-col gap-sm rounded-xl border p-md cursor-pointer ${value===unit?'border-primary bg-primary/10':'border-outline-variant/25 bg-surface-container'}`}><input className="peer absolute right-3 top-3 h-4 w-4 accent-primary" type="radio" name="fee-category" value={unit} checked={value===unit} onChange={()=>onChange(unit)}/><span className="absolute inset-0 rounded-xl pointer-events-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary"/><Icon size={18} className={value===unit?'text-primary':'text-on-surface-variant'}/><span><span className="block text-body font-medium">{label}</span><span className="block text-caption text-on-surface-variant">{basis}</span></span></label>)}</div></fieldset>
}

export default function FeeCategories({fees,selectedUnit,budgetActive=false}) {
  return <div className="rounded-lg border border-outline-variant/15 divide-y divide-outline-variant/15 overflow-hidden">{feeCategories.map(({unit,label,basis,icon:Icon})=>{
    const fee=fees[unit]
    const selected=selectedUnit===unit&&budgetActive
    return <div key={unit} className={`flex flex-wrap items-center justify-between gap-x-sm gap-y-xs px-md py-sm ${selected?'bg-primary/10':'bg-surface-container/40'}`}>
      <span className="inline-flex items-center gap-sm text-caption text-on-surface"><Icon size={15} className={selected?'text-primary shrink-0':'text-on-surface-variant shrink-0'}/>{label}</span>
      <span className="text-right"><span className={`block text-body font-semibold ${selected?'text-primary':'text-on-surface'}`}>{fee?`${fee.varies?'Mulai ':''}${money(fee.amount)}`:'Belum diisi'}</span><span className="block text-[11px] leading-4 text-on-surface-variant">{basis}{selected?' · filter aktif':''}</span></span>
    </div>
  })}</div>
}
