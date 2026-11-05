// Modal tambah/edit interpreter. Dipakai di halaman Profil & Pengaturan.
// Termasuk pemilih warna, toggle spesialisasi, dan upload avatar ke Storage.
import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import AvatarCropDialog from './AvatarCropDialog'
import { TextInput, TextArea, Select } from '../ui/Field'
import { Upload, Check } from 'lucide-react'
import { COLOR_PALETTE } from '../../utils/colors'
import { SPECIALTY_OPTIONS, JLPT_LEVELS } from '../../utils/constants'
import { useInterpreterStore } from '../../app/store/useInterpreterStore'
import { removeAvatar, uploadAvatar } from '../../services/settings'
import { toast } from '../../app/store/useToastStore'

const empty = {
  name: '',
  color_key: 'blue',
  specialties: [],
  jlpt_level: '',
  phone: '',
  email: '',
  line_id: '',
  status: 'aktif',
  notes: '',
  avatar_url: '',
}

export default function InterpreterModal({ open, onClose, interpreter }) {
  const addInterpreter = useInterpreterStore((s) => s.add)
  const editInterpreter = useInterpreterStore((s) => s.edit)

  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [cropSource, setCropSource] = useState(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const isEdit = Boolean(interpreter)

  useEffect(() => {
    if (!open) return
    setAvatarFile(null)
    setCropSource(null)
    setCropOpen(false)
    if (interpreter) {
      // Pastikan field nullable dari DB tidak override '' dengan null
      // agar .trim() di handleSave tidak crash.
      setForm({
        ...empty,
        ...interpreter,
        specialties: interpreter.specialties || [],
        phone: interpreter.phone || '',
        email: interpreter.email || '',
        line_id: interpreter.line_id || '',
        notes: interpreter.notes || '',
        avatar_url: interpreter.avatar_url || '',
      })
    } else {
      setForm(empty)
    }
  }, [open, interpreter])

  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl('')
      return undefined
    }
    const url = URL.createObjectURL(avatarFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // Toggle satu spesialisasi.
  const toggleSpecialty = (s) =>
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(s)
        ? f.specialties.filter((x) => x !== s)
        : [...f.specialties, s],
    }))

  // Validasi file lalu buka cropper. File diunggah ketika profil disimpan.
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      return toast.error('Pilih foto berformat JPG, PNG, WebP, atau AVIF')
    }
    if (file.size > 15 * 1024 * 1024) return toast.error('Ukuran foto maksimal 15 MB')
    setCropSource(file)
    setCropOpen(true)
  }

  const handleCropClose = () => {
    if (saving) return
    setCropOpen(false)
    setCropSource(null)
  }

  const handleCropApply = async (file) => {
    setAvatarFile(file)
    setCropOpen(false)
    setCropSource(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Nama wajib diisi')

    setSaving(true)
    let uploadedAvatarPath = null
    try {
      const avatarUrl = avatarFile ? await uploadAvatar(avatarFile) : (form.avatar_url || null)
      if (avatarFile) uploadedAvatarPath = avatarUrl
      const payload = {
        name: form.name.trim(),
        color_key: form.color_key,
        specialties: form.specialties,
        jlpt_level: form.jlpt_level || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        line_id: form.line_id.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
        avatar_url: avatarUrl,
      }
      if (isEdit) await editInterpreter(interpreter.id, payload)
      else await addInterpreter(payload)
      toast.success('Interpreter tersimpan')
      onClose()
    } catch (err) {
      if (uploadedAvatarPath) {
        try {
          await removeAvatar(uploadedAvatarPath)
        } catch (cleanupError) {
          console.error('Foto baru gagal dibersihkan setelah profil gagal disimpan:', cleanupError)
        }
      }
      toast.error(`Gagal menyimpan interpreter: ${err?.message || 'periksa koneksi dan izin Storage'}`)
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title={isEdit ? 'Edit Interpreter' : 'Tambah Interpreter'}
      maxWidth="max-w-xl"
      footer={
        <>
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
        {/* Avatar + upload */}
        <div className="flex flex-wrap items-center gap-lg">
          <Avatar
            name={form.name || '?'}
            colorKey={form.color_key}
            avatarUrl={previewUrl || form.avatar_url}
            size="xl"
          />
          <div className="flex min-w-0 flex-col items-start gap-xs">
            <label className="inline-flex cursor-pointer items-center gap-sm rounded-lg border border-outline-variant/30 px-md py-sm font-h3 text-h3 text-on-surface transition-colors hover:bg-on-surface/5 focus-within:ring-2 focus-within:ring-primary">
              <Upload size={18} />
              {avatarFile ? 'Ganti Foto' : (form.avatar_url ? 'Ubah Foto' : 'Pilih Foto')}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={handleAvatarSelect}
                disabled={saving}
              />
            </label>
            <p className="font-caption text-caption text-on-surface-variant">
              {avatarFile ? 'Foto siap disimpan. Tekan Simpan untuk mengunggah.' : 'Maksimal 15 MB. Foto akan dipotong persegi.'}
            </p>
          </div>
        </div>

        <TextInput label="Nama" required value={form.name} onChange={update('name')} placeholder="Nama lengkap" />

        {/* Pemilih warna */}
        <div className="flex flex-col gap-xs">
          <label className="font-label-tag text-label-tag text-on-surface-variant uppercase tracking-wider">
            Warna
          </label>
          <div className="flex flex-wrap gap-sm">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color_key: c.key }))}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  backgroundColor: c.hex,
                  outline: form.color_key === c.key ? `2px solid ${c.hex}` : 'none',
                  outlineOffset: '2px',
                }}
                title={c.label}
              >
                {form.color_key === c.key && <Check size={16} className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Spesialisasi */}
        <div className="flex flex-col gap-xs">
          <label className="font-label-tag text-label-tag text-on-surface-variant uppercase tracking-wider">
            Spesialisasi
          </label>
          <div className="flex flex-wrap gap-sm">
            {SPECIALTY_OPTIONS.map((s) => {
              const on = form.specialties.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  className={`px-md py-xs rounded-full border font-caption text-caption transition-colors ${
                    on
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'border-outline-variant/20 text-on-surface-variant hover:bg-on-surface/5'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-md">
          <Select label="JLPT" value={form.jlpt_level} onChange={update('jlpt_level')}>
            <option value="">—</option>
            {JLPT_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          <Select label="Status" value={form.status} onChange={update('status')}>
            <option value="aktif">Aktif</option>
            <option value="non-aktif">Non-aktif</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-md">
          <TextInput label="No. HP" value={form.phone} onChange={update('phone')} placeholder="+62…" />
          <TextInput label="LINE ID" value={form.line_id} onChange={update('line_id')} placeholder="line_id" />
        </div>
        <TextInput label="Email" type="email" value={form.email} onChange={update('email')} placeholder="nama@email.com" />
        <TextArea label="Bio / Catatan" value={form.notes} onChange={update('notes')} placeholder="Catatan singkat" />
      </div>
    </Modal>
    <AvatarCropDialog
      open={cropOpen}
      file={cropSource}
      onClose={handleCropClose}
      onApply={handleCropApply}
    />
    </>
  )
}
