// Modal dengan overlay, transisi fade + scale halus, dan tombol close.
import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }) {
  // Tutup modal dengan tombol Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-lg">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] flex flex-col bg-surface-container border border-outline-variant/20 rounded-xl shadow-2xl animate-modal-in`}
      >
        <div className="flex items-center justify-between px-xl py-lg border-b border-outline-variant/10">
          <h3 className="font-h2 text-h2 text-on-surface">{title}</h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors rounded-full p-1 hover:bg-on-surface/5"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-xl py-lg overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-sm px-xl py-lg border-t border-outline-variant/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
