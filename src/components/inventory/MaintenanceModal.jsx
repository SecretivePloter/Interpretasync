// Modal catat / edit riwayat maintenance peralatan.
import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { TextInput, TextArea, Select } from '../ui/Field'
import { toast } from '../../app/store/useToastStore'
import { useInventoryStore } from '../../app/store/useInventoryStore'

const TIPE_OPTIONS = [
  'Servis Rutin', 'Perbaikan', 'Kalibrasi', 'Penggantian Suku Cadang', 'Pembersihan', 'Lainnya',
]

const EMPTY = {
  item_id: '',
  tanggal: new Date().toISOString().split('T')[0],
  tipe_maintenance: 'Servis Rutin',
  deskripsi: '',
  biaya: 0,
  teknisi: '',
}

export default function MaintenanceModal({ open, record, defaultItemId, onClose }) {
  const items = useInventoryStore((s) => s.items)
  const asetItems = items.filter((x) => x.tipe === 'aset')
  const addMaintenance = useInventoryStore((s) => s.addMaintenance)
  const editMaintenance = useInventoryStore((s) => s.editMaintenance)
  const isEdit = !!record

  const [form, setForm] = useState({ ...EMPTY, item_id: defaultItemId || '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(record ? {
      item_id: record.item_id || '',
      tanggal: record.tanggal || EMPTY.tanggal,
      tipe_maintenance: record.tipe_maintenance || 'Servis Rutin',
      deskripsi: record.deskripsi || '',
      biaya: record.biaya ?? 0,
      teknisi: record.teknisi || '',
    } : { ...EMPTY, item_id: defaultItemId || '' })
  }, [open, record, defaultItemId])

  const setF = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const setNum = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: Math.max(0, parseInt(e.target.value) || 0) }))

  const handleSave = async () => {
    if (!form.item_id) return toast.error('Pilih peralatan terlebih dahulu')
    if (!form.tanggal) return toast.error('Tanggal wajib diisi')
    setSaving(true)
    try {
      if (isEdit) {
        await editMaintenance(record.id, form)
        toast.success('Catatan maintenance diperbarui')
      } else {
        await addMaintenance(form)
        toast.success('Catatan maintenance ditambahkan')
      }
      onClose()
    } catch (e) {
      toast.error(e.message || 'Gagal menyimpan catatan maintenance')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}
      title={isEdit ? 'Edit Catatan Maintenance' : 'Catat Maintenance'}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-md">
        <Select label="Peralatan / Aset" required value={form.item_id} onChange={setF('item_id')}>
          <option value="">— Pilih peralatan —</option>
          {asetItems.map((x) => (
            <option key={x.id} value={x.id}>[{x.kode}] {x.nama}</option>
          ))}
          {asetItems.length === 0 && <option disabled>Belum ada barang bertipe "Aset"</option>}
        </Select>

        <div className="grid grid-cols-2 gap-md">
          <TextInput label="Tanggal" required type="date" value={form.tanggal} onChange={setF('tanggal')} />
          <Select label="Tipe Maintenance" value={form.tipe_maintenance} onChange={setF('tipe_maintenance')}>
            {TIPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </div>

        <TextArea label="Deskripsi Pekerjaan" value={form.deskripsi} onChange={setF('deskripsi')}
          placeholder="Detail pekerjaan yang dilakukan…" rows={2} />

        <div className="grid grid-cols-2 gap-md">
          <TextInput label="Biaya (Rp)" type="number" min="0"
            value={form.biaya} onChange={setNum('biaya')} />
          <TextInput label="Teknisi / Vendor" value={form.teknisi} onChange={setF('teknisi')}
            placeholder="Nama teknisi" />
        </div>

        <div className="flex justify-end gap-sm mt-sm">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Catat'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
