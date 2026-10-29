// Filter bar interpreter: chip berwarna untuk toggle tampil/sembunyi jadwal.
// State filter dipersist via Zustand (tidak reset saat ganti minggu).
import { getColorHex, withAlpha } from '../../utils/colors'
import { useFilterControls } from '../../hooks/useFilter'
import Avatar from '../ui/Avatar'

export default function FilterBar({ interpreters }) {
  const { toggle, showAll, isVisible } = useFilterControls()
  const allVisible = interpreters.every((interpreter) => isVisible(interpreter.id))

  return (
    <div className="flex flex-wrap items-center gap-sm px-md lg:px-xl py-md bg-surface-container-low border-b border-outline-variant/10">
      {/* Tombol reset "Semua" */}
      <button
        onClick={showAll}
        className={`flex items-center gap-xs px-sm py-xs rounded-full border text-caption font-caption transition-colors ${
          allVisible
            ? 'bg-surface-container-high border-outline-variant/30 text-on-surface'
            : 'border-outline-variant/20 text-on-surface-variant hover:bg-on-surface/5'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-primary" />
        Semua
      </button>

      {/* Chip tiap interpreter */}
      {interpreters.map((it) => {
        const hex = getColorHex(it.color_key)
        const visible = isVisible(it.id)
        return (
          <button
            key={it.id}
            onClick={() => toggle(it.id)}
            title={visible ? 'Klik untuk sembunyikan' : 'Klik untuk tampilkan'}
            className="flex items-center gap-xs px-sm py-[3px] rounded-full border text-caption font-caption transition-all"
            style={{
              opacity: visible ? 1 : 0.35,
              // Saat tersembunyi pakai token tema (bukan warna dark hardcoded)
              // agar terbaca benar di light & dark mode.
              color: visible ? hex : 'rgb(var(--c-on-surface-variant))',
              backgroundColor: visible ? withAlpha(hex, 0.12) : 'transparent',
              borderColor: withAlpha(hex, visible ? 0.4 : 0.2),
            }}
            aria-pressed={visible}
          >
            <Avatar
              name={it.name}
              colorKey={it.color_key}
              avatarUrl={it.avatar_url}
              size="xs"
              className="!w-[18px] !h-[18px] !text-[7px]"
            />
            {it.name}
          </button>
        )
      })}

      {interpreters.length === 0 && (
        <span className="text-caption text-on-surface-variant">
          Tidak ada interpreter dengan jadwal pada periode ini.
        </span>
      )}
    </div>
  )
}
