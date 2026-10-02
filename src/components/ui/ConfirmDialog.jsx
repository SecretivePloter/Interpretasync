// Dialog konfirmasi (dipakai sebelum aksi hapus). Dibangun di atas Modal.
import Modal from './Modal'
import Button from './Button'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message,
  confirmLabel = 'Hapus',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Memproses…' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-md items-start">
        <div className="shrink-0 w-10 h-10 rounded-full bg-error/15 flex items-center justify-center">
          <AlertTriangle size={20} className="text-error" />
        </div>
        <p className="font-body text-body text-on-surface-variant pt-xs">
          {message}
        </p>
      </div>
    </Modal>
  )
}
