// Bungkus route privat: arahkan ke /login bila belum ada session.
// Siap dikembangkan (mis. role-based) di kemudian hari.
import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ session, ready, children }) {
  const location = useLocation()

  // Selama session belum dicek, tahan render (hindari flicker redirect).
  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center text-on-surface-variant">
        Memuat…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
