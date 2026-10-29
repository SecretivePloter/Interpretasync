// Avatar interpreter: foto bila ada, atau inisial berwarna sesuai color_key.
import { useEffect, useState } from 'react'
import { getInitials } from '../../utils/dateHelpers'
import { getColorHex, withAlpha } from '../../utils/colors'

const SIZES = {
  xs: 'w-4 h-4 text-[7px] shrink-0',
  sm: 'w-8 h-8 text-label-tag',
  md: 'w-10 h-10 text-body',
  lg: 'w-12 h-12 text-h2',
  xl: 'w-24 h-24 text-[32px]',
}

export default function Avatar({ name, colorKey = 'blue', avatarUrl, size = 'md', className = '' }) {
  const [imageFailed, setImageFailed] = useState(false)
  const hex = getColorHex(colorKey)
  const sizeClass = SIZES[size] || SIZES.md

  useEffect(() => {
    setImageFailed(false)
  }, [avatarUrl])

  if (avatarUrl && !imageFailed) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover border border-outline-variant/30 ${className}`}
        onError={() => setImageFailed(true)}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold ${className}`}
      style={{ backgroundColor: withAlpha(hex, 0.2), color: hex, border: `1px solid ${withAlpha(hex, 0.3)}` }}
    >
      {getInitials(name)}
    </div>
  )
}
