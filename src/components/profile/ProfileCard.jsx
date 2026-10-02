// Panel kiri profil: avatar, identitas, kontak, bio, dan aksi.
import { useNavigate } from 'react-router-dom'
import { Phone, Mail, MessageCircle, Pencil, CalendarSearch, BadgeCheck } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { getColorHex } from '../../utils/colors'

export default function ProfileCard({ interpreter, onEdit }) {
  const navigate = useNavigate()
  const hex = getColorHex(interpreter.color_key)
  const active = interpreter.status === 'aktif'

  // Buka kalender dengan filter hanya interpreter ini.
  const viewSchedule = () =>
    navigate('/kalender', { state: { filterInterpreter: interpreter.id } })

  const contacts = [
    { icon: Phone, value: interpreter.phone },
    { icon: Mail, value: interpreter.email },
    { icon: MessageCircle, value: interpreter.line_id },
  ].filter((c) => c.value)

  return (
    <div className="bg-surface-container border border-outline-variant/10 rounded-xl p-xl flex flex-col items-center text-center gap-md">
      <div className="relative">
        <Avatar name={interpreter.name} colorKey={interpreter.color_key} avatarUrl={interpreter.avatar_url} size="xl" />
        {active && (
          <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-secondary border-4 border-surface-container flex items-center justify-center">
            <BadgeCheck size={14} className="text-on-secondary" />
          </span>
        )}
      </div>

      <h2 className="font-h1 text-h1 text-on-surface">{interpreter.name}</h2>

      {/* Spesialisasi */}
      <div className="flex flex-wrap gap-xs justify-center">
        {(interpreter.specialties || []).map((s) => (
          <Badge key={s} color={hex}>
            {s}
          </Badge>
        ))}
      </div>

      {/* JLPT + status */}
      <div className="flex items-center gap-sm">
        {interpreter.jlpt_level && (
          <span className="inline-flex items-center gap-xs bg-tertiary/15 text-tertiary px-md py-xs rounded-full border border-tertiary/20 font-label-tag text-label-tag">
            <BadgeCheck size={14} /> JLPT {interpreter.jlpt_level}
          </span>
        )}
        <span
          className="inline-flex items-center gap-xs px-md py-xs rounded-full font-label-tag text-label-tag"
          style={{
            color: active ? '#2ECC71' : '#8c909e',
            backgroundColor: active ? 'rgba(46,204,113,0.12)' : 'rgba(140,144,158,0.12)',
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? '#2ECC71' : '#8c909e' }} />
          {active ? 'Aktif' : 'Non-aktif'}
        </span>
      </div>

      {/* Kontak */}
      {contacts.length > 0 && (
        <div className="w-full flex flex-col gap-sm text-left mt-sm pt-md border-t border-outline-variant/10">
          {contacts.map((c, i) => {
            const Icon = c.icon
            return (
              <div key={i} className="flex items-center gap-md text-on-surface">
                <Icon size={16} className="text-on-surface-variant shrink-0" />
                <span className="font-body text-body break-all">{c.value}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Bio */}
      {interpreter.notes && (
        <div className="w-full text-left mt-sm pt-md border-t border-outline-variant/10">
          <h4 className="font-label-tag text-label-tag text-on-surface-variant uppercase tracking-widest mb-xs">
            Bio
          </h4>
          <p className="font-body text-body text-on-surface-variant/90 italic">"{interpreter.notes}"</p>
        </div>
      )}

      {/* Aksi */}
      <div className="w-full flex flex-col gap-sm mt-md">
        <Button variant="outline" className="w-full" onClick={onEdit}>
          <Pencil size={18} /> Edit Profil
        </Button>
        <Button variant="ghost" className="w-full" onClick={viewSchedule}>
          <CalendarSearch size={18} /> Lihat Semua Jadwal
        </Button>
      </div>
    </div>
  )
}
