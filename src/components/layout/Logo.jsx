// Logo Ichikara: tampilkan gambar dari file statis /public/assets/images/logo.png,
// fallback ke teks "ICHIKARA" bila file tidak ada / gagal dimuat.
import { useState } from 'react'

export default function Logo({ size = 'md', showSubtitle = true }) {
  const [imgError, setImgError] = useState(false)
  // Sumber tetap: file statis di folder public.
  const src = '/assets/images/logo.png'

  const textSize = size === 'lg' ? 'text-[28px]' : 'text-h1'
  const imgSize = size === 'lg' ? 'h-24' : 'h-16'

  return (
    <div className="flex flex-col gap-xs">
      {!imgError ? (
        <img
          src={src}
          alt="Ichikara"
          className={`${imgSize} w-auto object-contain self-start`}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`font-bold text-primary tracking-tight ${textSize}`}>
          ICHIKARA
        </span>
      )}
      {showSubtitle && (
        <span className="font-label-tag text-label-tag text-on-surface-variant uppercase tracking-widest">
          Management System
        </span>
      )}
    </div>
  )
}
