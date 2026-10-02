// Modal tambah/edit barang inventaris.
import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { TextInput, TextArea, Select } from '../ui/Field'
import { toast } from '../../app/store/useToastStore'
import { useInventoryStore } from '../../app/store/useInventoryStore'
import { INVENTORY_KATEGORI } from '../../utils/constants'

const TIPE_OPTIONS = [
  { value: 'aset',     label: 'Peralatan / Aset' },
  { value: 'supplies', label: 'Supplies / Habis Pakai' },
  { value: 'properti', label: 'Properti Interpreter' },
]

const SATUAN_OPTIONS = ['pcs', 'unit', 'lembar', 'rim', 'botol', 'pak', 'set', 'roll', 'liter', 'kg', 'eksemplar']

const EMPTY = {
  kode: '', nama: '', kategori: '', tipe: 'supplies',
  satuan: 'pcs', stok_saat_ini: 0, stok_minimum: 0, lokasi: '', deskripsi: '',
}

export default function ItemModal({ open, item, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const addItem = useInventoryStore((s) => s.addItem)
  const editItem = useInventoryStore((s) => s.editItem)
  const isEdit = !!item

  useEffect(() => {
    if (!open) return
    setForm(item ? {
      kode: item.kode || '',
      nama: item.nama || '',
      kategori: item.kategori || '',
      tipe: item.tipe || 'supplies',
      satuan: item.satuan || 'pcs',
      stok_saat_ini: item.stok_saat_ini ?? 0,
      stok_minimum: item.stok_minimum ?? 0,
      lokasi: item.lokasi || '',
      deskripsi: item.deskripsi || '',
    } : EMPTY)
  }, [open, item])

  const setF = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const setNum = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: Math.max(0, parseInt(e.target.value) || 0) }))

  // Saat kategori dipilih, auto-fill tipe & satuan sesuai preset.
  const handleKategori = (e) => {
    const nama = e.target.value
    const preset = INVENTORY_KATEGORI.find((k) => k.nama === nama)
    setForm((f) => ({
      ...f,
      kategori: nama,
      ...(preset?.tipe ? { tipe: preset.tipe } : {}),
      ...(preset?.satuan && !isEdit ? { satuan: preset.satuan } : {}),
    }))
  }

  const handleSave = async () => {
    if (!form.kode.trim()) return toast.error('Kode barang wajib diisi')
    if (!form.nama.trim()) return toast.error('Nama barang wajib diisi')
    setSaving(true)
    try {
      if (isEdit) {
        await editItem(item.id, { ...form, kode: form.kode.trim(), nama: form.nama.trim() })
        toast.success('Barang berhasil diperbarui')
      } else {
        await addItem({ ...form, kode: form.kode.trim(), nama: form.nama.trim() })
        toast.success('Barang berhasil ditambahkan')
      }
      onClose()
    } catch (e) {
      toast.error(e.message || 'Gagal menyimpan barang')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Barang' : 'Tambah Barang'}>
      <div className="flex flex-col gap-md">
        <div className="grid grid-cols-2 gap-md">
          <TextInput label="Kode Barang" required value={form.kode} onChange={setF('kode')}
            placeholder="cth: LPT-001" maxLength={30} />
          <Select label="Satuan" value={form.satuan} onChange={setF('satuan')}>
            {SATUAN_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>

        <TextInput label="Nama Barang" required value={form.nama} onChange={setF('nama')}
          placeholder="cth: Laptop Dell Inspiron 15" />

        {/* Kategori — auto-fill tipe saat dipilih */}
        <Select label="Kategori" value={form.kategori} onChange={handleKategori}>
          <option value="">— Pilih kategori —</option>
          {INVENTORY_KATEGORI.map((k) => (
            <option key={k.nama} value={k.nama}>{k.nama}</option>
          ))}
        </Select>

        <Select label="Tipe" value={form.tipe} onChange={setF('tipe')}>
          {TIPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>

        <div className="grid grid-cols-2 gap-md">
          <TextInput label={isEdit ? 'Stok Saat Ini' : 'Stok Awal'} type="number" min="0"
            value={form.stok_saat_ini} onChange={setNum('stok_saat_ini')} />
          <TextInput label="Stok Minimum (Reorder Point)" type="number" min="0"
            value={form.stok_minimum} onChange={setNum('stok_minimum')}
            placeholder="0 = nonaktif" />
        </div>

        <TextInput label="Lokasi Penyimpanan" value={form.lokasi} onChange={setF('lokasi')}
          placeholder="cth: Lemari A, Lantai 2" />

        <TextArea label="Deskripsi / Catatan" value={form.deskripsi} onChange={setF('deskripsi')}
          placeholder="Catatan tambahan…" rows={2} />
      </div>

      <div className="flex justify-end gap-sm mt-xl">
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Barang'}
        </Button>
      </div>
    </Modal>
  )
}
