// Halaman Pengaturan: manajemen interpreter, preferensi, fitur mendatang.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  SlidersHorizontal,
  Rocket,
  Lock,
  HardDriveUpload,
  MessageSquare,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import { Select } from '../components/ui/Field'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import InterpreterModal from '../components/profile/InterpreterModal'
import { useInterpreterStore } from '../app/store/useInterpreterStore'
import { useSettingsStore } from '../app/store/useSettingsStore'
import { getColor } from '../utils/colors'
import { toast } from '../app/store/useToastStore'

// Daftar fitur mendatang (kartu abu-abu "Segera Hadir").
const FUTURE_FEATURES = [
  { icon: Lock, title: 'Login Multi-user & Role', desc: 'Hak akses berbasis peran untuk koordinator & admin.' },
  { icon: HardDriveUpload, title: 'Integrasi Google Drive', desc: 'Simpan invoice & quotation otomatis ke Drive.' },
  { icon: MessageSquare, title: 'Notifikasi WhatsApp', desc: 'Pengingat jadwal & order via WhatsApp.' },
  { icon: BarChart3, title: 'Laporan & Analitik', desc: 'Metrik performa interpreter & pendapatan.' },
  { icon: RefreshCw, title: 'Sinkronisasi Google Calendar', desc: 'Sinkron dua arah dengan Google Calendar.' },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const interpreters = useInterpreterStore((s) => s.interpreters)
  const removeInterpreter = useInterpreterStore((s) => s.remove)
  const settings = useSettingsStore((s) => s.settings)
  const saveSettingState = useSettingsStore((s) => s.set)

  const [modal, setModal] = useState({ open: false, interpreter: null })
  const [delTarget, setDelTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Hapus interpreter.
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await removeInterpreter(delTarget.id)
      toast.success('Interpreter dihapus')
      setDelTarget(null)
    } catch (err) {
      toast.error('Gagal menghapus interpreter')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  // Simpan preferensi (timezone / currency).
  const savePref = async (key, value) => {
    try {
      await saveSettingState(key, value)
      toast.success('Preferensi disimpan')
    } catch {
      toast.error('Gagal menyimpan preferensi')
    }
  }

  return (
    <>
      <PageHeader title="Pengaturan" subtitle="Konfigurasi aplikasi & manajemen tim" />

      <div className="flex-1 overflow-y-auto p-xl">
        <div className="max-w-5xl mx-auto flex flex-col gap-huge pb-huge">
          {/* 1. Manajemen interpreter */}
          <section className="flex flex-col gap-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-h2 text-h2 text-on-surface flex items-center gap-sm">
                <Users size={20} className="text-secondary" /> Manajemen Interpreter
              </h3>
              <Button variant="secondary" onClick={() => setModal({ open: true, interpreter: null })}>
                <UserPlus size={18} /> Tambah Interpreter
              </Button>
            </div>

            {interpreters.length === 0 ? (
              <p className="font-body text-body text-on-surface-variant">
                Belum ada interpreter. Klik "Tambah Interpreter" untuk memulai.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                {interpreters.map((it) => {
                  const color = getColor(it.color_key)
                  return (
                    <div
                      key={it.id}
                      className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-lg flex flex-col gap-md"
                    >
                      <div className="flex justify-between items-start">
                        <button
                          onClick={() => navigate(`/profil/${it.id}`)}
                          className="flex items-center gap-md text-left"
                        >
                          <Avatar name={it.name} colorKey={it.color_key} avatarUrl={it.avatar_url} size="lg" />
                          <div>
                            <h4 className="font-h3 text-h3 text-on-surface">{it.name}</h4>
                            <span className="font-label-tag text-label-tag text-on-surface-variant uppercase tracking-wider">
                              {it.jlpt_level ? `JLPT ${it.jlpt_level}` : '—'} • {it.status}
                            </span>
                          </div>
                        </button>
                        <div className="flex gap-sm">
                          <button
                            onClick={() => setModal({ open: true, interpreter: it })}
                            className="text-on-surface-variant hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDelTarget(it)}
                            className="text-on-surface-variant hover:text-error transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-sm">
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: color.hex }} />
                        <span className="font-caption text-caption text-on-surface-variant">{color.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* 2. Preferensi umum */}
          <section className="flex flex-col gap-lg">
            <h3 className="font-h2 text-h2 text-on-surface flex items-center gap-sm">
              <SlidersHorizontal size={20} className="text-primary" /> Preferensi Umum
            </h3>
            <div className="bg-surface-container-high border border-outline-variant/10 rounded-xl p-lg grid grid-cols-1 sm:grid-cols-2 gap-md max-w-xl">
              <Select
                label="Timezone"
                value={settings.timezone}
                onChange={(e) => savePref('timezone', e.target.value)}
              >
                <option value="GMT+7">WIB (GMT+7)</option>
                <option value="GMT+8">WITA (GMT+8)</option>
                <option value="GMT+9">JST (GMT+9)</option>
              </Select>
              <Select
                label="Mata Uang"
                value={settings.currency}
                onChange={(e) => savePref('currency', e.target.value)}
              >
                <option value="IDR">IDR (Rp)</option>
                <option value="JPY">JPY (¥)</option>
              </Select>
            </div>
          </section>

          {/* 3. Fitur Mendatang */}
          <section className="flex flex-col gap-lg pt-xl border-t border-outline-variant/10">
            <h3 className="font-h2 text-h2 text-on-surface flex items-center gap-sm">
              <Rocket size={20} className="text-on-surface-variant" /> Fitur Mendatang
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              {FUTURE_FEATURES.map((f) => {
                const Icon = f.icon
                return (
                  <div
                    key={f.title}
                    className="bg-surface-container-low/50 border border-dashed border-outline-variant/30 rounded-xl p-lg flex flex-col gap-sm opacity-70 cursor-not-allowed"
                  >
                    <div className="flex justify-between items-center">
                      <Icon size={20} className="text-on-surface-variant" />
                      <span className="bg-surface-variant text-on-surface-variant font-label-tag text-label-tag px-sm py-[2px] rounded uppercase">
                        Segera Hadir
                      </span>
                    </div>
                    <h4 className="font-h3 text-h3 text-on-surface">{f.title}</h4>
                    <p className="font-caption text-caption text-on-surface-variant">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>

      <InterpreterModal
        open={modal.open}
        onClose={() => setModal({ open: false, interpreter: null })}
        interpreter={modal.interpreter}
      />

      <ConfirmDialog
        open={Boolean(delTarget)}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Interpreter"
        message={`Yakin ingin menghapus "${delTarget?.name}"? Semua jadwal & order terkait juga akan terhapus.`}
      />
    </>
  )
}
