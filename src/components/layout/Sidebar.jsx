// Sidebar navigasi kiri untuk modul operasional, inventaris, dan sertifikat.
// Desktop (lg+): rail 240px collapsible. Mobile (<lg): drawer geser.
// Grup bisa di-collapse/expand; state persist via useUiStore.
import { NavLink, useNavigate } from 'react-router-dom'
import {
  CalendarDays, ClipboardList, FileText, Users, Settings, Plus, LogOut,
  PanelLeftClose, PanelLeft, Sun, Moon, X, ChevronDown,
  Package, Award,
} from 'lucide-react'
import { NAV_GROUPS } from '../../utils/constants'
import Logo from './Logo'
import { logout } from '../../services/auth'
import { toast } from '../../app/store/useToastStore'
import { useThemeStore } from '../../app/store/useThemeStore'
import { useUiStore } from '../../app/store/useUiStore'
import { useAuthStore } from '../../app/store/useAuthStore'

const ICONS = {
  CalendarDays, ClipboardList, FileText, Users, Settings,
  Package, Award,
}

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const isDark = theme === 'dark'
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen)
  const closeMobileNav = useUiStore((s) => s.closeMobileNav)
  const collapsedGroups = useUiStore((s) => s.collapsedGroups)
  const toggleGroup = useUiStore((s) => s.toggleGroup)
  const role = useAuthStore((s) => s.role)

  const handleLogout = async () => {
    try {
      await logout()
      closeMobileNav()
      navigate('/login')
    } catch {
      toast.error('Gagal keluar')
    }
  }

  const handleNav = () => closeMobileNav()

  const widthCls = collapsed ? 'w-[240px] lg:w-[72px]' : 'w-[240px]'
  const hideOnCollapse = collapsed ? 'lg:hidden' : ''
  const slideCls = mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'

  // Filter grup berdasarkan role: grup dengan roles field hanya tampil bila role user ada di dalamnya.
  const visibleGroups = NAV_GROUPS.filter(
    (g) => !g.roles || !role || g.roles.includes(role),
  )

  return (
    <aside
      className={`fixed h-full left-0 top-0 ${widthCls} ${slideCls} bg-surface-container-high dark:bg-surface-container border-r border-outline-variant/10 flex flex-col py-xl px-md gap-lg z-50 transition-[width,transform] duration-200 overflow-y-auto`}
    >
      {/* Brand + toggle */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className={hideOnCollapse}><Logo /></div>
        <button onClick={onToggle} className="hidden lg:block text-on-surface-variant hover:text-primary transition-colors p-1 rounded-lg hover:bg-on-surface/5" aria-label="Lebarkan/Sempitkan sidebar">
          {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
        <button onClick={closeMobileNav} className="lg:hidden text-on-surface-variant hover:text-primary transition-colors p-1 rounded-lg hover:bg-on-surface/5" aria-label="Tutup menu">
          <X size={22} />
        </button>
      </div>

      {/* Tombol tambah jadwal — hanya manajemen */}
      {(!role || role === 'manajemen') && (
        <button
          onClick={() => { closeMobileNav(); navigate('/kalender', { state: { openNew: true } }) }}
          className="w-full bg-primary-container text-on-primary-container py-md px-lg rounded-xl font-h3 text-h3 flex items-center justify-center gap-sm transition-transform active:scale-95 shadow-lg flex-shrink-0"
        >
          <Plus size={20} />
          <span className={hideOnCollapse}>Tambah Jadwal</span>
        </button>
      )}

      {/* Navigasi dengan grup collapsible */}
      <nav className="flex flex-col gap-xs flex-1">
        {visibleGroups.map((group, gi) => {
          const isGroupCollapsed = !!collapsedGroups[group.label]

          return (
            <div key={group.label} className={gi > 0 ? 'mt-sm' : ''}>
              {/* Header grup — bisa di-klik untuk collapse/expand */}
              <button
                onClick={() => toggleGroup(group.label)}
                className={`w-full flex items-center gap-sm mb-xs group/ghdr ${collapsed ? 'lg:hidden' : ''}`}
                aria-expanded={!isGroupCollapsed}
              >
                <div className="h-px flex-1 bg-outline-variant/30" />
                <span className="text-label-tag font-label-tag text-on-surface-variant/60 uppercase tracking-widest px-xs whitespace-nowrap group-hover/ghdr:text-on-surface-variant transition-colors">
                  {group.label}
                </span>
                <ChevronDown
                  size={12}
                  className={`text-on-surface-variant/40 group-hover/ghdr:text-on-surface-variant transition-transform duration-200 ${isGroupCollapsed ? '-rotate-90' : ''}`}
                />
                <div className="h-px flex-1 bg-outline-variant/30" />
              </button>

              {/* Garis tipis saat collapsed di desktop */}
              {collapsed && gi > 0 && (
                <div className="hidden lg:block h-px bg-outline-variant/30 mb-xs" />
              )}

              {/* Items dengan animasi collapse */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isGroupCollapsed && !collapsed ? 'max-h-0' : 'max-h-[600px]'
                }`}
              >
                {group.items.map((item) => {
                  const Icon = ICONS[item.icon]
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/inventaris'}
                      onClick={handleNav}
                      className={({ isActive }) =>
                        `flex items-center gap-md px-md py-sm rounded-lg transition-colors duration-200 ${
                          isActive
                            ? 'text-primary font-bold bg-on-surface/5'
                            : 'text-on-surface-variant hover:bg-on-surface/5'
                        }`
                      }
                    >
                      {Icon && <Icon size={18} className="shrink-0" />}
                      <span className={`font-body text-body ${hideOnCollapse}`}>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Toggle tema */}
      <button
        onClick={toggleTheme}
        title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        className={`flex items-center gap-md px-md py-sm rounded-lg text-on-surface-variant hover:bg-on-surface/5 hover:text-primary transition-colors flex-shrink-0 ${collapsed ? 'lg:justify-center' : ''}`}
      >
        {isDark ? <Moon size={20} className="shrink-0" /> : <Sun size={20} className="shrink-0" />}
        <span className={`flex items-center flex-1 gap-md ${hideOnCollapse}`}>
          <span className="font-body text-body flex-1 text-left">{isDark ? 'Mode Gelap' : 'Mode Terang'}</span>
          <span className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${isDark ? 'bg-primary-container' : 'bg-surface-variant'}`}>
            <span className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow transition-all ${isDark ? 'left-[18px]' : 'left-[2px]'}`} />
          </span>
        </span>
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-md px-md py-sm rounded-lg text-on-surface-variant hover:bg-on-surface/5 hover:text-error transition-colors flex-shrink-0"
      >
        <LogOut size={20} className="shrink-0" />
        <span className={`font-body text-body ${hideOnCollapse}`}>Keluar</span>
      </button>
    </aside>
  )
}
