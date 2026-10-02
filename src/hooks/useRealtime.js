// Kelola seluruh subscription realtime Supabase di satu tempat.
// Setiap perubahan tabel disinkronkan ke store Zustand terkait.
import { useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useInterpreterStore } from '../app/store/useInterpreterStore'
import { useEventStore } from '../app/store/useEventStore'
import { useOrderStore } from '../app/store/useOrderStore'

// Petakan event postgres_changes -> handler store.
function bindTable(channel, table, store) {
  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table },
    (payload) => {
      const s = store.getState()
      if (payload.eventType === 'INSERT') s.applyInsert(payload.new)
      else if (payload.eventType === 'UPDATE') s.applyUpdate(payload.new)
      else if (payload.eventType === 'DELETE') s.applyDelete(payload.old.id)
    },
  )
}

// Pasang sekali di App: subscribe interpreters, events, orders.
export function useRealtime() {
  useEffect(() => {
    const channel = supabase.channel('ichikara-realtime')
    bindTable(channel, 'interpreters', useInterpreterStore)
    bindTable(channel, 'events', useEventStore)
    bindTable(channel, 'orders', useOrderStore)
    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
