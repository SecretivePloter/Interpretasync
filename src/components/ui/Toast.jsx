// Kontainer toast global — render daftar toast dari useToastStore.
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore } from '../../app/store/useToastStore'

const CONFIG = {
  success: { icon: CheckCircle2, color: 'text-secondary', border: 'border-secondary/30' },
  error: { icon: XCircle, color: 'text-error', border: 'border-error/30' },
  info: { icon: Info, color: 'text-primary', border: 'border-primary/30' },
}

export default function Toast() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed bottom-xl right-xl z-[200] flex flex-col gap-sm">
      {toasts.map((t) => {
        const cfg = CONFIG[t.type] || CONFIG.info
        const Icon = cfg.icon
        return (
          <div
            key={t.id}
            className={`flex items-center gap-md min-w-[260px] max-w-sm bg-surface-container-high border ${cfg.border} rounded-xl px-lg py-md shadow-2xl animate-toast-in`}
          >
            <Icon size={20} className={cfg.color} />
            <span className="flex-1 font-body text-body text-on-surface">
              {t.message}
            </span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-on-surface-variant hover:text-on-surface"
              aria-label="Tutup"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
