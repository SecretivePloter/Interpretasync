// Hook tipis di atas useFilterStore: sediakan daftar event yang lolos filter
// + helper untuk FilterBar.
import { useMemo } from 'react'
import { useFilterStore } from '../app/store/useFilterStore'

// Saring event: event milik interpreter yang disembunyikan benar-benar dibuang.
export function useFilteredEvents(events) {
  const hiddenIds = useFilterStore((s) => s.hiddenIds)
  return useMemo(
    () => events.filter((e) => !hiddenIds.includes(e.interpreter_id)),
    [events, hiddenIds],
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
