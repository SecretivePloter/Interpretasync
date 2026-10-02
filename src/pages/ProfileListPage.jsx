// Daftar semua interpreter sebagai kartu. Klik kartu -> halaman profil detail.
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { useInterpreterStore } from '../app/store/useInterpreterStore'
import { getColorHex } from '../utils/colors'

export default function ProfileListPage() {
  const navigate = useNavigate()
  const interpreters = useInterpreterStore((s) => s.interpreters)
  const loading = useInterpreterStore((s) => s.loading)
  const loaded = useInterpreterStore((s) => s.loaded)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return interpreters
    return interpreters.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.specialties || []).some((s) => s.toLowerCase().includes(q)),
    )
  }, [interpreters, search])

  return (
    <>
      <PageHeader title="Profil Interpreter" subtitle="Daftar tim penerjemah">
        <div className="flex items-center gap-sm px-md py-sm rounded-lg bg-surface-container-low border border-outline-variant/10 w-72">
          <Search size={18} className="text-on-surface-variant" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / spesialisasi…"
            className="bg-transparent border-none focus:outline-none text-body font-body w-full text-on-surface placeholder:text-on-surface-variant/60"
          />
        </div>
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-xl">
        {!loaded && loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada interpreter"
            description="Tambahkan interpreter melalui halaman Pengaturan."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {filtered.map((it) => {
              const hex = getColorHex(it.color_key)
              const active = it.status === 'aktif'
              return (
                <button
                  key={it.id}
                  onClick={() => navigate(`/profil/${it.id}`)}
                  className="text-left bg-surface-container-low border border-outline-variant/10 rounded-xl p-lg flex flex-col gap-md hover:border-primary/30 hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-md">
                      <Avatar name={it.name} colorKey={it.color_key} avatarUrl={it.avatar_url} size="lg" />
                      <div>
                        <h3 className="font-h3 text-h3 text-on-surface">{it.name}</h3>
                        <span className="font-caption text-caption text-on-surface-variant">
                          {it.jlpt_level ? `JLPT ${it.jlpt_level}` : 'JLPT —'}
                        </span>
                      </div>
                    </div>
                    <span
                      className="w-3 h-3 rounded-full mt-1"
                      style={{
                        backgroundColor: active ? '#2ECC71' : '#8c909e',
                        boxShadow: active ? '0 0 10px rgba(46,204,113,0.5)' : 'none',
                      }}
                      title={active ? 'Aktif' : 'Non-aktif'}
                    />
                  </div>
                  <div className="flex flex-wrap gap-xs">
                    {(it.specialties || []).slice(0, 3).map((s) => (
                      <Badge key={s} color={hex}>
                        {s}
                      </Badge>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
