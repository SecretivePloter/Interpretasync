import { useFilterStore } from '../../app/store/useFilterStore'

export default function ScheduleTypeToggle() {
  const showRegular = useFilterStore(s => s.showRegular)
  const setShowRegular = useFilterStore(s => s.setShowRegular)
  return <label className="inline-flex shrink-0 cursor-pointer items-center gap-xs rounded-lg border border-outline/30 px-sm py-xs text-caption">
    <input type="checkbox" checked={showRegular} onChange={e => setShowRegular(e.target.checked)} className="h-3.5 w-3.5 accent-[rgb(var(--c-primary))]" />
    Tampilkan Reguler
  </label>
}
