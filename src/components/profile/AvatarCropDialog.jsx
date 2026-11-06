import { useEffect, useRef, useState } from 'react'
import { Loader2, Minus, Plus } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { toast } from '../../app/store/useToastStore'

const CROP_SIZE = 280
const OUTPUT_SIZE = 512

function limitPosition(position, image, scale) {
  if (!image) return position
  const maxX = Math.max(0, (image.naturalWidth * scale - CROP_SIZE) / 2)
  const maxY = Math.max(0, (image.naturalHeight * scale - CROP_SIZE) / 2)
  return {
    x: Math.max(-maxX, Math.min(maxX, position.x)),
    y: Math.max(-maxY, Math.min(maxY, position.y)),
  }
}

function makeImageFile(image, position, scale) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const context = canvas.getContext('2d')
    if (!context) {
      reject(new Error('Browser tidak dapat memproses gambar ini'))
      return
    }

    const sourceSize = CROP_SIZE / scale
    const centerX = image.naturalWidth / 2 - position.x / scale
    const centerY = image.naturalHeight / 2 - position.y / scale
    const sourceX = Math.max(0, Math.min(image.naturalWidth - sourceSize, centerX - sourceSize / 2))
    const sourceY = Math.max(0, Math.min(image.naturalHeight - sourceSize, centerY - sourceSize / 2))

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    )

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gambar gagal diproses. Coba pilih foto lain.'))
          return
        }
        const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
        resolve(new File([blob], `profile-${Date.now()}.${extension}`, {
          type: blob.type || 'image/jpeg',
          lastModified: Date.now(),
        }))
      },
      'image/webp',
      0.9,
    )
  })
}

export default function AvatarCropDialog({ open, file, onClose, onApply }) {
  const [image, setImage] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [processing, setProcessing] = useState(false)
  const [sourceUrl, setSourceUrl] = useState('')
  const drag = useRef(null)
  const baseScale = image
    ? Math.max(CROP_SIZE / image.naturalWidth, CROP_SIZE / image.naturalHeight)
    : 1
  const scale = baseScale * zoom

  useEffect(() => {
    if (!file) {
      setSourceUrl('')
      return undefined
    }
    const url = URL.createObjectURL(file)
    setSourceUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!open || !sourceUrl) {
      setImage(null)
      return
    }

    let active = true
    const loadedImage = new Image()
    loadedImage.onload = () => {
      if (!active) return
      setImage(loadedImage)
      setZoom(1)
      setPosition({ x: 0, y: 0 })
    }
    loadedImage.onerror = () => {
      if (active) setImage(null)
    }
    loadedImage.src = sourceUrl
    return () => { active = false }
  }, [open, sourceUrl])

  const changeZoom = (value) => {
    const nextZoom = Math.max(1, Math.min(3, value))
    setZoom(nextZoom)
    setPosition((current) => limitPosition(current, image, baseScale * nextZoom))
  }

  const handlePointerDown = (event) => {
    if (!image) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
  }

  const handlePointerMove = (event) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return
    const deltaX = event.clientX - drag.current.x
    const deltaY = event.clientY - drag.current.y
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    setPosition((current) => limitPosition({ x: current.x + deltaX, y: current.y + deltaY }, image, scale))
  }

  const handlePointerUp = (event) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null
  }

  const applyCrop = async () => {
    if (!image || processing) return
    setProcessing(true)
    try {
      await onApply(await makeImageFile(image, position, scale))
    } catch (error) {
      console.error(error)
      toast.error(error?.message || 'Foto gagal disesuaikan')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !processing && onClose()}
      title="Sesuaikan Foto Profil"
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={processing}>Batal</Button>
          <Button onClick={applyCrop} disabled={!image || processing}>
            {processing ? <Loader2 size={17} className="animate-spin" /> : null}
            Gunakan foto
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-md">
        <p className="max-w-sm text-center font-caption text-caption text-on-surface-variant">
          Geser foto untuk mengatur posisi. Perbesar atau perkecil sampai pas di dalam lingkaran.
        </p>

        <div
          className="relative h-[280px] w-[280px] max-w-full touch-none select-none overflow-hidden rounded-full border-4 border-surface bg-surface-container-high shadow-[0_0_0_1px_rgba(128,128,128,0.25)] cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="group"
          tabIndex={0}
          aria-label="Area pemotongan foto. Geser foto untuk mengatur posisi."
          onKeyDown={(event) => {
            const step = event.shiftKey ? 30 : 10
            const moves = {
              ArrowLeft: { x: -step, y: 0 },
              ArrowRight: { x: step, y: 0 },
              ArrowUp: { x: 0, y: -step },
              ArrowDown: { x: 0, y: step },
            }
            const move = moves[event.key]
            if (!move) return
            event.preventDefault()
            setPosition((current) => limitPosition({ x: current.x + move.x, y: current.y + move.y }, image, scale))
          }}
          onKeyDownCapture={(event) => {
            if (event.key.startsWith('Arrow')) event.stopPropagation()
          }}
        >
          {image ? (
            <img
              src={sourceUrl}
              alt="Pratinjau foto yang sedang disesuaikan"
              draggable="false"
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
              style={{
                width: image.naturalWidth * scale,
                height: image.naturalHeight * scale,
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-md text-center font-caption text-caption text-on-surface-variant">
              Foto tidak dapat dibuka. Pilih berkas gambar lain.
            </div>
          )}
        </div>

        <div className="flex w-full max-w-xs items-center gap-sm">
          <button
            type="button"
            onClick={() => changeZoom(zoom - 0.1)}
            disabled={!image || zoom <= 1}
            aria-label="Perkecil foto"
            className="rounded-full p-xs text-on-surface-variant hover:bg-on-surface/5 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Minus size={18} />
          </button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => changeZoom(Number(event.target.value))}
            disabled={!image}
            aria-label="Atur pembesaran foto"
            className="min-w-0 flex-1 accent-primary"
          />
          <button
            type="button"
            onClick={() => changeZoom(zoom + 0.1)}
            disabled={!image || zoom >= 3}
            aria-label="Perbesar foto"
            className="rounded-full p-xs text-on-surface-variant hover:bg-on-surface/5 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Plus size={18} />
          </button>
        </div>

        <p className="font-caption text-caption text-on-surface-variant">
          Hasil disimpan sebagai foto persegi 512 × 512.
        </p>
      </div>
    </Modal>
  )
}
