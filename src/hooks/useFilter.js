import { scheduleVisible } from '../utils/scheduleTypes'
// Hook tipis di atas useFilterStore: sediakan daftar event yang lolos filter
// + helper untuk FilterBar.
import { useMemo } from 'react'
import { useFilterStore } from '../app/store/useFilterStore'

// Saring event: event milik interpreter yang disembunyikan benar-benar dibuang.
export function useFilteredEvents(events) {
  const showRegular = useFilterStore((s) => s.showRegular)
  const hiddenIds = useFilterStore((s) => s.hiddenIds)
  return useMemo(
    () => events.filter((e) => scheduleVisible(e, hiddenIds, showRegular)),
    [events, hiddenIds, showRegular],
  )
}

// Akses kontrol filter (toggle, showAll, status visibilitas).
export function useFilterControls() {
  const hiddenIds = useFilterStore((s) => s.hiddenIds)
  const toggle = useFilterStore((s) => s.toggle)
  const showAll = useFilterStore((s) => s.showAll)
  return {
    hiddenIds,
    toggle,
    showAll,
    isVisible: (id) => !hiddenIds.includes(id),
    allVisible: hiddenIds.length === 0,
  }
}
