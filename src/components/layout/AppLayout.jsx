// Kerangka halaman privat: Sidebar + area konten + AI chatbot floating.
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useUiStore } from '../../app/store/useUiStore'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen)
  const closeMobileNav = useUiStore((s) => s.closeMobileNav)
  const marginLeft = collapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'

  return (
    <div className="h-screen bg-background text-on-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-fade-in"
          onClick={closeMobileNav}
          aria-hidden="true"
        />
      )}

      <main className={`${marginLeft} h-screen flex flex-col overflow-hidden transition-[margin] duration-200`}>
        <Outlet />
      </main>
    </div>
  )
}
