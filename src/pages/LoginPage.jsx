// Halaman Login: card terpusat, logo di atas, error Bahasa Indonesia.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, User, Lock, Loader2 } from 'lucide-react'
import Logo from '../components/layout/Logo'
import { login } from '../services/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Submit form: panggil service auth, redirect ke kalender bila sukses.
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/kalender', { replace: true })
    } catch (err) {
      setError(err.message || 'Username atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-lg relative overflow-hidden">
      {/* Aksen latar lembut */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-xl">
          <Logo size="lg" showSubtitle={false} />
        </div>

        {/* Card */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-xl shadow-2xl p-xl flex flex-col gap-lg">
          <div className="text-center flex flex-col gap-xs">
            <h1 className="font-h1 text-h1 text-on-surface">Selamat Datang</h1>
            <p className="font-body text-body text-on-surface-variant">
              Masuk ke Ichikara Management System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
            {/* Username */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-tag text-label-tag text-on-surface-variant uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoFocus
                  required
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg pl-10 pr-md py-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary font-body text-body"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-tag text-label-tag text-on-surface-variant uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg pl-10 pr-md py-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary font-body text-body"
                />
              </div>
            </div>

            {/* Pesan error */}
            {error && (
              <div className="bg-error/10 border border-error/30 text-error rounded-lg px-md py-sm font-body text-body text-center">
                {error}
              </div>
            )}

            {/* Tombol submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-container text-on-primary-container py-md rounded-xl font-h3 text-h3 flex items-center justify-center gap-sm transition-all active:scale-95 hover:opacity-90 disabled:opacity-50 shadow-lg"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <LogIn size={20} />
              )}
              {loading ? 'Memproses…' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center mt-lg font-caption text-caption text-on-surface-variant">
          Akun admin dikelola melalui Supabase Dashboard.
        </p>
      </div>
    </div>
  )
}
