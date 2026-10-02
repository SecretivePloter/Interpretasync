// Modal tambah/edit order. Simpan via store (realtime), hapus dengan konfirmasi.
import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { TextInput, TextArea, Select } from '../ui/Field'
import { Trash2, MessageCircle } from 'lucide-react'
import { useOrderStore } from '../../app/store/useOrderStore'
import { toast } from '../../app/store/useToastStore'
import { ORDER_STATUSES, PAID_STATUSES } from '../../utils/constants'
import { computeStatusPatch } from '../../utils/orderStatus'
import { sanitizeWhatsapp, waLink } from '../../utils/whatsapp'

const empty = {
  interpreter_id: '',
  client_name: '',
  quotation_number: '',
  date: '',
  duration_hours: '',
  fee_estimate: '',
  status: 'quotation',
  estimated_payment_date: '',
  paid_date: '',
  whatsapp: '',
  notes: '',
  invoice_link: '',
}

// Status yang menampilkan field estimasi jatuh tempo (sudah/akan ditagih).
const DUE_DATE_STATUSES = ['invoice', 'overdue', 'paid', 'complete']

// Validasi link invoice: harus URL valid berskema https.
function isValidHttpsUrl(value) {
  try {
    const u = new URL(value)
    return u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function OrderModal({ open, onClose, order, interpreters }) {
  const addOrder = useOrderStore((s) => s.add)
  const editOrder = useOrderStore((s) => s.edit)
  const removeOrder = useOrderStore((s) => s.remove)

  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const isEdit = Boolean(order)

  useEffect(() => {
    if (!open) return
    if (order) {
      setForm({
        interpreter_id: order.interpreter_id || '',
        client_name: order.client_name || '',
        quotation_number: order.quotation_number || '',
        date: order.date || '',
        duration_hours: order.duration_hours ?? '',
        fee_estimate: order.fee_estimate ?? '',
        status: order.status || 'quotation',
        estimated_payment_date: order.estimated_payment_date || '',
        paid_date: order.paid_date || '',
        whatsapp: order.whatsapp || '',
        notes: order.notes || '',
        invoice_link: order.invoice_link || '',
      })
    } else {
      setForm(empty)
    }
  }, [open, order])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = async () => {
    if (!form.interpreter_id) return toast.error('Interpreter wajib dipilih')
    if (!form.client_name.trim()) return toast.error('Nama klien wajib diisi')
    if (!form.date) return toast.error('Tanggal wajib diisi')
    const invoiceLink = form.invoice_link.trim()
    if (invoiceLink && !isValidHttpsUrl(invoiceLink))
      return toast.error('Link invoice harus URL valid (diawali https://)')

    setSaving(true)
    try {
      const payload = {
        interpreter_id: form.interpreter_id,
        client_name: form.client_name.trim(),
        quotation_number: form.quotation_number.trim() || null,
        date: form.date,
        duration_hours: form.duration_hours === '' ? null : Number(form.duration_hours),
        fee_estimate: form.fee_estimate === '' ? 0 : Number(form.fee_estimate),
        status: form.status,
        estimated_payment_date: form.estimated_payment_date || null,
        paid_date: form.paid_date || null,
        whatsapp: sanitizeWhatsapp(form.whatsapp) || null,
        notes: form.notes.trim() || null,
        invoice_link: invoiceLink || null,
      }
      // Lengkapi otomatis: estimasi jatuh tempo (invoice) & tanggal bayar (paid/complete)
      // bila belum diisi manual.
      Object.assign(payload, computeStatusPatch(payload, payload.status))
      if (isEdit) await editOrder(order.id, payload)
      else await addOrder(payload)
      toast.success('Order tersimpan')
      onClose()
    } catch (err) {
      toast.error('Gagal menyimpan order')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await removeOrder(order.id)
      toast.success('Order dihapus')
      setConfirmDel(false)
      onClose()
    } catch (err) {
      toast.error('Gagal menghapus order')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? 'Edit Order' : 'Tambah Order'}
        footer={
          <>
            {isEdit && (
              <Button
                variant="ghost"
                className="text-error mr-auto"
                onClick={() => setConfirmDel(true)}
                disabled={saving}
              >
                <Trash2 size={18} /> Hapus
              </Button>
            )}
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-lg">
          <Select
            label="Interpreter"
            required
            value={form.interpreter_id}
            onChange={update('interpreter_id')}
          >
            <option value="">— Pilih interpreter —</option>
            {interpreters.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </Select>
          <TextInput
            label="Klien / Perusahaan"
            required
            value={form.client_name}
            onChange={update('client_name')}
            placeholder="mis. PT. Sinar Jaya"
          />
          <TextInput
            label="No. File Quotation"
            value={form.quotation_number}
            onChange={update('quotation_number')}
            placeholder="contoh: QT-2026-001"
          />
          <div className="flex flex-col gap-sm">
            <TextInput
              label="Nomor WhatsApp"
              type="tel"
              inputMode="numeric"
              value={form.whatsapp}
              onChange={update('whatsapp')}
              placeholder="contoh: 628123456789"
            />
            {/* Tombol follow up muncul hanya bila nomor sudah diisi */}
            {sanitizeWhatsapp(form.whatsapp) && (
              <a
                href={waLink(form.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-sm self-start rounded-lg px-md py-sm font-h3 text-h3 text-white transition-all active:scale-95 hover:opacity-90"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle size={18} /> Follow Up via WhatsApp
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 gap-md">
            <TextInput
              label="Tanggal"
              required
              type="date"
              value={form.date}
              onChange={update('date')}
            />
            <Select label="Status" value={form.status} onChange={update('status')}>
              {ORDER_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <TextInput
              label="Durasi (jam)"
              type="number"
              min="0"
              step="0.5"
              value={form.duration_hours}
              onChange={update('duration_hours')}
              placeholder="2"
            />
            <TextInput
              label="Estimasi Fee (Rp)"
              type="number"
              min="0"
              step="1000"
              value={form.fee_estimate}
              onChange={update('fee_estimate')}
              placeholder="500000"
            />
          </div>
          {/* Field pembayaran muncul sesuai status */}
          {(DUE_DATE_STATUSES.includes(form.status) ||
            PAID_STATUSES.includes(form.status)) && (
            <div className="grid grid-cols-2 gap-md">
              {DUE_DATE_STATUSES.includes(form.status) && (
                <TextInput
                  label="Estimasi Jatuh Tempo"
                  type="date"
                  value={form.estimated_payment_date}
                  onChange={update('estimated_payment_date')}
                />
              )}
              {PAID_STATUSES.includes(form.status) && (
                <TextInput
                  label="Tanggal Dibayar"
                  type="date"
                  value={form.paid_date}
                  onChange={update('paid_date')}
                />
              )}
            </div>
          )}
          <TextArea
            label="Catatan"
            value={form.notes}
            onChange={update('notes')}
            placeholder="Catatan tambahan (opsional)"
          />
          <TextInput
            label="Link Invoice (Google Drive)"
            type="url"
            value={form.invoice_link}
            onChange={update('invoice_link')}
            placeholder="Tempel link Google Drive di sini"
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={handleDelete}
        loading={saving}
        title="Hapus Order"
        message={`Yakin ingin menghapus order "${order?.client_name}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </>
  )
}
