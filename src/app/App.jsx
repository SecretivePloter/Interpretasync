// Root aplikasi: kelola session auth, muat data awal, pasang realtime global.
import { useEffect, useState } from 'react'
import Router from './Router'
import Toast from '../components/ui/Toast'
import { getSession, onAuthChange, fetchUserRole } from '../services/auth'
import { useRealtime } from '../hooks/useRealtime'
import { useInterpreterStore } from './store/useInterpreterStore'
import { useEventStore } from './store/useEventStore'
import { useOrderStore } from './store/useOrderStore'
import { useSettingsStore } from './store/useSettingsStore'
import { useAuthStore } from './store/useAuthStore'

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  const setRole = useAuthStore((s) => s.setRole)
  const clearRole = useAuthStore((s) => s.clearRole)

  const loadInterpreters = useInterpreterStore((s) => s.load)
  const loadEvents = useEventStore((s) => s.load)
  const loadOrders = useOrderStore((s) => s.load)
  const loadSettings = useSettingsStore((s) => s.load)

  useRealtime()

  // Cek session awal + dengarkan perubahan auth.
  useEffect(() => {
    getSession().then((s) => {
      setSession(s)
      setReady(true)
    })
    const unsub = onAuthChange((s) => {
      setSession(s)
      if (!s) clearRole()
    })
    return unsub
  }, [clearRole])

  // Setelah login, muat role + seluruh data awal dari Supabase.
  useEffect(() => {
    if (session) {
      fetchUserRole(session.user.id).then(setRole).catch(() => setRole('operator'))
      loadSettings()
      loadInterpreters()
      loadEvents()
      loadOrders()
    }
  }, [session, setRole, loadSettings, loadInterpreters, loadEvents, loadOrders])

  return (
    <>
      <Router session={session} ready={ready} />
      <Toast />
    </>
  )
}
