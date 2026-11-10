// Modal tambah/edit jadwal. Validasi field wajib, simpan via store (realtime sync),
// dan hapus dengan konfirmasi.
import { useState, useEffect, useMemo } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { TextInput, TextArea, Select } from '../ui/Field'
import { Trash2 } from 'lucide-react'
import { useEventStore } from '../../app/store/useEventStore'
import { toast } from '../../app/store/useToastStore'
import { trimTime, isAllDayEvent } from '../../utils/dateHelpers'
import { ALL_DAY_START, ALL_DAY_END } from '../../utils/constants'
import { monthEnd, regularScheduleDates, regularScheduleConflicts, scheduleSaveError, scheduleTypeLabel } from '../../utils/scheduleTypes'

const empty = {
  title: '',
  schedule_type: 'project',
  end_date: '',
  weekdays: [1, 2, 3, 4, 5],
  interpreter_id: '',
  date: '',
  start_time: '',
  end_time: '',
  location: '',
  company: '',
  notes: '',
  order_id: '',
  all_day: false, // hanya state lokal UI — tidak dikirim ke DB
}

export default function EventModal({ open, onClose, event, prefill, interpreters, orders }) {
  const allEvents = useEventStore((s) => s.events)
  const addRegularSeries = useEventStore((s) => s.addRegularSeries)
  const addEvent = useEventStore((s) => s.add)
  const editEvent = useEventStore((s) => s.edit)
  const removeEvent = useEventStore((s) => s.remove)

  const [form, setForm] = useState(empty)
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const isEdit = Boolean(event)

  // Isi form saat modal dibuka (mode edit pakai data event, mode baru pakai prefill).
  useEffect(() => {
    if (!open) return
    if (event) {
      setForm({
        ...empty,
        schedule_type: event.schedule_type || 'project',
        title: event.title || '',
        interpreter_id: event.interpreter_id || '',
        date: event.date || '',
        start_time: trimTime(event.start_time),
        end_time: trimTime(event.end_time),
        location: event.location || '',
        company: event.company || '',
        notes: event.notes || '',
        order_id: event.order_id || '',
        // Deteksi otomatis: event lama dengan rentang penuh dianggap "Seharian".
        all_day: isAllDayEvent(event.start_time, event.end_time),
      })
    } else {
      setForm({ ...empty, ...prefill })
    }
  }, [open, event, prefill])

  useEffect(() => { setSaveError('') }, [form])
  const isNewRegular = !isEdit && form.schedule_type === 'reguler'
  const recurrence = useMemo(() => {
    if (!isNewRegular) return { dates: form.date ? [form.date] : [], error: '' }
    try { return { dates: regularScheduleDates(form.date, form.end_date, form.weekdays), error: '' } }
    catch (error) { return { dates: [], error: error.message } }
  }, [isNewRegular, form.date, form.end_date, form.weekdays])
  const conflicts = useMemo(() => saving ? [] : regularScheduleConflicts(allEvents,
    recurrence.dates.map(date => ({ ...form, date })), event?.id), [allEvents, recurrence.dates, form, event?.id, saving])
  const changeType = (e) => {
    const schedule_type = e.target.value
    setForm(f => ({ ...f, schedule_type, end_date: f.end_date || monthEnd(f.date) }))
  }
  const changeDate = (e) => {
    const date = e.target.value
    setForm(f => ({ ...f, date, end_date: !f.end_date || f.end_date === monthEnd(f.date) ? monthEnd(date) : f.end_date }))
  }
  const toggleWeekday = (day) => setForm(f => ({ ...f, weekdays: f.weekdays.includes(day) ? f.weekdays.filter(d => d !== day) : [...f.weekdays, day] }))

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // Toggle "Seharian": isi otomatis jam mulai/selesai ke rentang penuh kalender,
  // dan nonaktifkan input jam manual. Saat dimatikan, kosongkan agar diisi ulang.
  const toggleAllDay = (e) => {
    const checked = e.target.checked
    setForm((f) => ({
      ...f,
      all_day: checked,
      start_time: checked ? ALL_DAY_START : '',
      end_time: checked ? ALL_DAY_END : '',
    }))
  }

  // Validasi + simpan.
  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Judul wajib diisi')
    if (!form.interpreter_id) return toast.error('Interpreter wajib dipilih')
    if (!form.date || !form.start_time || !form.end_time)
      return toast.error('Tanggal & jam wajib diisi')
    if (form.end_time <= form.start_time)
      return toast.error('Jam selesai harus setelah jam mulai')

    if (isNewRegular && recurrence.error) return toast.error(recurrence.error)
    if (conflicts.length) return toast.error('Ada jadwal yang bertabrakan dengan Reguler. Ubah tanggal, jam, atau interpreter.')

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        schedule_type: form.schedule_type,
        regular_series_id: form.schedule_type === 'reguler' ? event?.regular_series_id || null : null,
        interpreter_id: form.interpreter_id,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location.trim() || null,
        company: form.company.trim() || null,
        notes: form.notes.trim() || null,
        order_id: form.order_id || null,
      }
      if (isEdit) await editEvent(event.id, payload)
      else if (isNewRegular) await addRegularSeries(payload, recurrence.dates)
      else await addEvent(payload)
      toast.success(isNewRegular ? `${recurrence.dates.length} jadwal Reguler tersimpan` : 'Jadwal tersimpan')
      onClose()
    } catch (err) {
      const message = scheduleSaveError(err)
      setSaveError(message)
      toast.error(message)
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Hapus event.
  const handleDelete = async () => {
    setSaving(true)
    try {
      await removeEvent(event.id)
      toast.success('Jadwal dihapus')
      setConfirmDel(false)
      onClose()
    } catch (err) {
      toast.error('Gagal menghapus jadwal')
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
        title={isEdit ? 'Edit Jadwal' : 'Tambah Jadwal'}
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
            <Button onClick={handleSave} disabled={saving || conflicts.length > 0 || (isNewRegular && Boolean(recurrence.error))}>
              {saving ? 'Menyimpan…' : isNewRegular ? `Simpan ${recurrence.dates.length} jadwal` : 'Simpan'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-lg">
          <Select label="Tipe jadwal" value={form.schedule_type} onChange={changeType}>
            <option value="project">Project / harian</option>
            <option value="reguler">Reguler / bulanan</option>
          </Select>
          {isEdit && event?.regular_series_id && <p className="text-caption text-on-surface-variant">Perubahan dan penghapusan hanya berlaku untuk tanggal ini.</p>}
          {saveError && <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-sm text-caption text-error">{saveError}</p>}
          <TextInput
            label="Judul"
            required
            value={form.title}
            onChange={update('title')}
            placeholder="mis. QC Inspection"
          />
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
          {/* Toggle Seharian: hemat waktu, tak perlu set jam manual */}
          <label className="flex items-center gap-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.all_day}
              onChange={toggleAllDay}
              className="w-4 h-4 rounded accent-[rgb(var(--c-primary))] cursor-pointer"
            />
            <span className="font-body text-body text-on-surface">Seharian</span>
            <span className="font-caption text-caption text-on-surface-variant">
              (otomatis {ALL_DAY_START}–{ALL_DAY_END}, tanpa set jam)
            </span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            <TextInput
              label="Tanggal"
              required
              type="date"
              value={form.date}
              onChange={changeDate}
            />
            <TextInput
              label="Mulai"
              required
              type="time"
              value={form.start_time}
              onChange={update('start_time')}
              disabled={form.all_day}
              className={form.all_day ? 'opacity-50' : ''}
            />
            <TextInput
              label="Selesai"
              required
              type="time"
              value={form.end_time}
              onChange={update('end_time')}
              disabled={form.all_day}
              className={form.all_day ? 'opacity-50' : ''}
            />
          </div>
          {isNewRegular && <fieldset className="min-w-0 rounded-xl border border-outline-variant/30 bg-surface-container-low p-md">
            <legend className="px-xs text-caption font-medium">Rangkaian Reguler</legend>
            <TextInput label="Sampai tanggal" type="date" required min={form.date} value={form.end_date} onChange={update('end_date')} />
            <p className="mb-xs mt-sm text-caption text-on-surface-variant">Ulangi pada hari</p>
            <div className="flex flex-wrap gap-sm">{[[1,'Senin'],[2,'Selasa'],[3,'Rabu'],[4,'Kamis'],[5,'Jumat'],[6,'Sabtu'],[0,'Minggu']].map(([day,label]) =>
              <label key={day} className="inline-flex items-center gap-xs rounded-lg border border-outline-variant/30 px-sm py-xs text-caption">
                <input type="checkbox" checked={form.weekdays.includes(day)} onChange={() => toggleWeekday(day)} className="h-3.5 w-3.5 accent-[rgb(var(--c-primary))]" />{label}
              </label>)}</div>
            <p className="mt-sm text-caption text-on-surface-variant" aria-live="polite">{recurrence.error || `${recurrence.dates.length} jadwal akan dibuat. Tanggal tanpa hari kerja terpilih dilewati.`}</p>
          </fieldset>}
          {conflicts.length > 0 && <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-md text-caption text-error">
            <p className="font-medium">Ada {conflicts.length} jadwal bertabrakan. Pilih interpreter atau waktu lain.</p>
            <ul className="mt-xs space-y-1">{conflicts.slice(0,4).map(c => <li key={c.id}>{c.date} · {trimTime(c.start_time)}–{trimTime(c.end_time)} · {scheduleTypeLabel(c)} · {c.title}</li>)}</ul>
            {conflicts.length > 4 && <p className="mt-xs">Dan {conflicts.length - 4} jadwal lainnya.</p>}
          </div>}
          <div className="grid grid-cols-2 gap-md">
            <TextInput
              label="Lokasi"
              value={form.location}
              onChange={update('location')}
              placeholder="mis. Pabrik / Online"
            />
            <TextInput
              label="Perusahaan / PT"
              value={form.company}
              onChange={update('company')}
              placeholder="mis. PT. Sinar Jaya"
            />
          </div>
          <Select label="Link ke Order" value={form.order_id} onChange={update('order_id')}>
            <option value="">— Tidak ada —</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.client_name} • {o.date}
              </option>
            ))}
          </Select>
          <TextArea
            label="Catatan"
            value={form.notes}
            onChange={update('notes')}
            placeholder="Catatan tambahan (opsional)"
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={handleDelete}
        loading={saving}
        title="Hapus Jadwal"
        message={`Yakin ingin menghapus jadwal "${event?.title}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </>
  )
}
