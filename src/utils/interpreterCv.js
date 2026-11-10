export const CV_BUCKET = 'ichikara-interpreter-cvs'
export const MAX_CV_BYTES = 5 * 1024 * 1024
export const CV_URL_SECONDS = 60

export async function validateCvFile(file) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('Pilih file PDF terlebih dahulu.')
  const name = String(file.name || '').normalize('NFC')
  if (!/\.pdf$/i.test(name) || /[\u0000-\u001f\u007f/\\]/.test(name) || [...name].length > 240)
    throw new Error('Gunakan nama file PDF yang valid, maksimal 240 karakter.')
  if (file.type && file.type.toLowerCase() !== 'application/pdf') throw new Error('Format CV harus PDF.')
  if (!file.size || file.size > MAX_CV_BYTES) throw new Error('Ukuran CV harus lebih dari 0 dan maksimal 5 MB.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.length !== file.size || ![37,80,68,70,45].every((value, i) => bytes[i] === value))
    throw new Error('Isi file tidak dikenali sebagai PDF. Pilih file PDF yang benar.')
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const sha256 = [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('')
  return { name, size: bytes.length, mime: 'application/pdf', sha256, bytes }
}

export const cvDate = value => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value)) + ' WIB'
export const cvSize = bytes => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
