// Guard role: arahkan ke /inventaris bila role tidak memenuhi syarat.
// Gunakan sebagai wrapper element pada route yang butuh role tertentu.
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../app/store/useAuthStore'

export default function RequireRole({ roles, children }) {
  const role = useAuthStore((s) => s.role)

  // Tunggu sampai role dimuat (null = belum fetch selesai).
  if (role === null) return null

  if (!roles.includes(role)) {
    return <Navigate to="/inventaris" replace />
  }

  return children
}
