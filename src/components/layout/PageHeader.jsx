// Header atas konten halaman (judul + aksi opsional di kanan).
// Di mobile (<lg) menampilkan tombol hamburger untuk membuka drawer sidebar.
import { Menu } from 'lucide-react'
import { useUiStore } from '../../app/store/useUiStore'

export default function PageHeader({ title, subtitle, children }) {
  const openMobileNav = useUiStore((s) => s.openMobileNav)

  return (
    <header className="flex flex-wrap justify-between items-center gap-sm lg:gap-md w-full px-md lg:px-xl py-md bg-surface border-b border-outline-variant/10 sticky top-0 z-40 shrink-0">
      <div className="flex items-center gap-sm min-w-0">
        {/* Hamburger hanya mobile */}
        <button
          onClick={openMobileNav}
          className="lg:hidden shrink-0 -ml-1 p-1 rounded-lg text-on-surface-variant hover:text-primary hover:bg-on-surface/5 transition-colors"
          aria-label="Buka menu"
        >
          <Menu size={22} />
        </button>
        <div className="flex flex-col min-w-0">
          <h1 className="font-h1 text-h1 text-on-surface truncate">{title}</h1>
          {subtitle && (
            <p className="font-caption text-caption text-on-surface-variant truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-xs lg:gap-md">{children}</div>
    </header>
  )
}
