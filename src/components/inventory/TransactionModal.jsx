// Modal catat transaksi masuk / keluar stok.
import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { TextInput, Select } from '../ui/Field'
import { toast } from '../../app/store/useToastStore'
import { useInventoryStore } from '../../app/store/useInventoryStore'

export default function TransactionModal({ open, defaultItemId, onClose }) {
  const items = useInventoryStore((s) => s.items)
  const addTransaction = useInventoryStore((s) => s.addTransaction)

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    item_id: defaultItemId || '',
    tipe: 'masuk',
    jumlah: 1,
    keterangan: '',
    tanggal: today,
  })
  const [saving, setSaving] = useState(false)

  const setF = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const setNum = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: Math.max(1, parseInt(e.target.value) || 1) }))

  const selectedItem = items.find((x) => x.id === form.item_id)

  const handleSave = async () => {
    if (!form.item_id) return toast.error('Pilih barang terlebih dahulu')
    if (form.tipe === 'keluar' && selectedItem && form.jumlah > selectedItem.stok_saat_ini) {
      return toast.error(`Stok tidak cukup. Tersedia: ${selectedItem.stok_saat_ini} ${selectedItem.satuan}`)
    }
    setSaving(true)
    try {
      await addTransaction({ ...form, jumlah: Number(form.jumlah) })
      toast.success(form.tipe === 'masuk' ? 'Stok masuk dicatat' : 'Stok keluar dicatat')
      onClose()
    } catch (e) {
      toast.error(e.message || 'Gagal mencatat transaksi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Catat Transaksi" maxWidth="max-w-md">
      <div className="flex flex-col gap-md">
        {/* Toggle tipe masuk/keluar */}
        <div className="flex gap-sm">
          {['masuk', 'keluar'].map((t) => (
            <button
              key={t}
              onClick={() => setForm((f) => ({ ...f, tipe: t }))}
              className={`flex-1 py-sm rounded-lg font-label-tag text-label-tag uppercase tracking-wide transition-colors border ${
                form.tipe === t
                  ? t === 'masuk'
                    ? 'bg-success/20 text-success border-success/40'
                    : 'bg-error/20 text-error border-error/40'
                  : 'bg-surface text-on-surface-variant border-outline-variant/20 hover:bg-on-surface/5'
              }`}
            >
              {t === 'masuk' ? '↑ Masuk' : '↓ Keluar'}
            </button>
          ))}
        </div>

        <Select label="Barang" required value={form.item_id} onChange={setF('item_id')}>
          <option value="">— Pilih barang —</option>
          {items.map((x) => (
            <option key={x.id} value={x.id}>
              [{x.kode}] {x.nama} (stok: {x.stok_saat_ini} {x.satuan})
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-md">
          <TextInput
            label={`Jumlah${selectedItem ? ` (${selectedItem.satuan})` : ''}`}
            required type="number" min="1"
            value={form.jumlah} onChange={setNum('jumlah')}
          />
          <TextInput label="Tanggal" type="date" value={form.tanggal} onChange={setF('tanggal')} />
        </div>

        <TextInput label="Keterangan" value={form.keterangan} onChange={setF('keterangan')}
          placeholder="cth: Pembelian supplier, Pemakaian event…" />

        <div className="flex justify-end gap-sm mt-sm">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan…' : 'Catat'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
