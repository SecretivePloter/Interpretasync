import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { TextInput, TextArea, Select } from '../ui/Field'
import { saveRecord } from '../../services/interpreterDatabase'
import { toast } from '../../app/store/useToastStore'
import { feeTotal, localDate, money, units } from '../../utils/interpreterDatabase'

const schemas = {
  experience: { table: 'interpreter_experiences', title: 'Pengalaman & penilaian', defaults: { company:'',project:'',year:'',start_date:'',end_date:'',status:'reference',rating:'',notes:'',source:'' }, fields: [
    ['company','Perusahaan','text',true],['project','Proyek / aktivitas','text',true],['year','Tahun (jika tanggal tidak diketahui)','number'],['start_date','Tanggal mulai','date'],['end_date','Tanggal selesai','date'],['status','Status','select',{reference:'Referensi, belum diverifikasi',confirmed:'Terkonfirmasi',completed:'Selesai dikonfirmasi',cancelled:'Dibatalkan'}],['rating','Rating tugas','select',{'':'Belum dinilai',1:'1 · Perlu perbaikan',2:'2 · Kurang',3:'3 · Cukup',4:'4 · Baik',5:'5 · Sangat baik'}],['notes','Catatan internal / alasan penilaian','textarea'],['source','Sumber pengalaman','text'] ] },
  rate: { table:'interpreter_rates',title:'Tarif interpreter', defaults:{company:'',activity:'',unit:'day',amount:'',currency:'IDR',valid_from:localDate(),valid_to:'',overtime_rate:0,transport:0,notes:'',source:''},fields:[
    ['company','Perusahaan (kosong = umum)','text'],['activity','Aktivitas / jenis proyek','text'],['unit','Satuan','select',units],['amount','Fee dasar','number',true],['currency','Mata uang','select',{IDR:'IDR',JPY:'JPY',USD:'USD'}],['valid_from','Berlaku mulai','date',true],['valid_to','Berlaku sampai','date'],['overtime_rate','Lembur per jam sesuai kesepakatan','number'],['transport','Transport per penugasan','number'],['notes','Ketentuan / batasan tarif','textarea'],['source','Sumber tarif','text'] ] },
  fee: {table:'interpreter_fees',title:'Hitung & simpan fee',defaults:{company:'',project:'',date:localDate(),currency:'IDR',unit:'day',quantity:1,rate:0,overtime_hours:0,overtime_rate:0,extras:0,deductions:0,payment_status:'draft',notes:''},fields:[
    ['company','Perusahaan','text',true],['project','Proyek / tugas','text',true],['date','Tanggal tugas','date',true],['currency','Mata uang','select',{IDR:'IDR',JPY:'JPY',USD:'USD'}],['unit','Satuan tarif','select',units],['quantity','Jumlah satuan yang disepakati','number',true],['rate','Tarif per satuan','number',true],['overtime_hours','Jam lembur aktual disetujui','number'],['overtime_rate','Tarif lembur per jam','number'],['extras','Transport, makan, tambahan (total)','number'],['deductions','Potongan disepakati (total)','number'],['payment_status','Status pembayaran','select',{draft:'Draft',approved:'Disetujui',paid:'Sudah dibayar'}],['notes','Rincian tambahan / potongan / kesepakatan','textarea'] ] },
  block: {table:'interpreter_blocks',title:'Blok ketersediaan',defaults:{start_date:localDate(),end_date:localDate(),reason:''},fields:[['start_date','Mulai tidak tersedia','date',true],['end_date','Sampai','date',true],['reason','Alasan / catatan konfirmasi','textarea']]},
}
export default function DatabaseEditor({kind, initial, interpreterId, onClose, onSaved}) {
  const schema = schemas[kind]
  const [form,setForm] = useState({...schema.defaults,...initial})
  const [saving,setSaving] = useState(false)
  const update = key => e => setForm(f => ({...f,[key]:e.target.value}))
  const save = async e => {
    e.preventDefault()
    if (saving) return
    if (form.start_date && form.end_date && form.end_date < form.start_date) return toast.error('Tanggal selesai harus setelah tanggal mulai')
    if (form.valid_to && form.valid_to < form.valid_from) return toast.error('Masa berlaku tarif tidak valid')
    if (kind === 'fee' && (!(Number(form.quantity)>0) || feeTotal(form)<0)) return toast.error('Jumlah harus positif dan total fee tidak boleh negatif')
    setSaving(true)
    try {
      const payload = {interpreter_id:interpreterId}
      if (initial?.id) payload.id=initial.id
      for (const [key,,type] of schema.fields) {
        const value = form[key]
        payload[key] = type === 'number' ? (value === '' ? (key==='year'?null:0) : Number(value)) : value
        if (type === 'date' && !value) payload[key]=null
      }
      if (kind==='experience') payload.rating=form.rating ? Number(form.rating):null
      if (initial?.event_id) payload.event_id=initial.event_id
      await saveRecord(schema.table,payload)
      toast.success('Data tersimpan')
      onSaved()
      onClose()
    } catch(err) {toast.error(err.message)} finally {setSaving(false)}
  }
  return <Modal open title={schema.title} onClose={() => !saving && onClose()} maxWidth="max-w-2xl">
    <form onSubmit={save} className="flex flex-col gap-md">
      {kind==='fee' && <p className="text-caption text-on-surface-variant">Gunakan paket dan waktu aktual yang disepakati. Jam placeholder kalender tidak dihitung otomatis.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">{schema.fields.map(([key,label,type,options]) => {
        const props={label,value:form[key] ?? '',onChange:update(key),required:options===true}
        if(type==='select') return <Select key={key} {...props}>{Object.entries(options).map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select>
        if(type==='textarea') return <TextArea key={key} {...props} className="sm:col-span-2" />
        return <TextInput key={key} {...props} type={type} min={type==='number'?(key==='year'?1900:0):undefined} step={type==='number'?(key==='year'?'1':'0.01'):undefined} />
      })}</div>
      {kind==='fee' && <div className="rounded-xl bg-primary/10 p-lg"><p className="text-caption text-on-surface-variant">Total fee interpreter</p><strong className="text-h1 text-primary">{money(feeTotal(form),form.currency)}</strong></div>}
      <div className="flex flex-wrap justify-end gap-sm"><Button type="button" variant="ghost" disabled={saving} onClick={onClose}>Batal</Button><Button type="submit" disabled={saving}>{saving?'Menyimpan…':'Simpan'}</Button></div>
    </form>
  </Modal>
}
