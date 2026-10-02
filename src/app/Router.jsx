// Definisi seluruh route aplikasi. Halaman privat dibungkus ProtectedRoute + AppLayout.
// Route manajemen-only dibungkus RequireRole; operator hanya bisa akses /inventaris.
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/layout/ProtectedRoute'
import RequireRole from '../components/layout/RequireRole'
import AppLayout from '../components/layout/AppLayout'
import LoginPage from '../pages/LoginPage'
import CalendarPage from '../pages/CalendarPage'
import OrderPage from '../pages/OrderPage'
import ProfileListPage from '../pages/ProfileListPage'
import ProfilePage from '../pages/ProfilePage'
import SettingsPage from '../pages/SettingsPage'
import QuotationPage from '../pages/QuotationPage'
import SertifikatFrame from '../pages/SertifikatFrame'
import InventarisPage from '../pages/InventarisPage'
import ValidatorPage from '../pages/ValidatorPage'
import GaleriSertifikat from '../pages/GaleriSertifikat'
import MassGeneratePage from '../pages/MassGeneratePage'

const MANAJEMEN = ['manajemen']
const ALL_ROLES = ['manajemen', 'operator']

export default function Router({ session, ready }) {
  return (
    <Routes>
      {/* Publik */}
      <Route
        path="/login"
        element={session ? <Navigate to="/kalender" replace /> : <LoginPage />}
      />
      <Route path="/validator" element={<ValidatorPage />} />

      {/* Privat */}
      <Route
        element={
          <ProtectedRoute session={session} ready={ready}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Inventaris — semua role */}
        <Route
          path="/inventaris"
          element={<RequireRole roles={ALL_ROLES}><InventarisPage /></RequireRole>}
        />

        {/* Operasional — manajemen only */}
        <Route path="/kalender" element={<RequireRole roles={MANAJEMEN}><CalendarPage /></RequireRole>} />
        <Route path="/order" element={<RequireRole roles={MANAJEMEN}><OrderPage /></RequireRole>} />
        <Route path="/profil" element={<RequireRole roles={MANAJEMEN}><ProfileListPage /></RequireRole>} />
        <Route path="/profil/:id" element={<RequireRole roles={MANAJEMEN}><ProfilePage /></RequireRole>} />
        <Route path="/pengaturan" element={<RequireRole roles={MANAJEMEN}><SettingsPage /></RequireRole>} />
        <Route path="/quotation" element={<RequireRole roles={MANAJEMEN}><QuotationPage /></RequireRole>} />
        <Route path="/sertifikat/generator" element={<RequireRole roles={MANAJEMEN}><SertifikatFrame /></RequireRole>} />
        <Route path="/sertifikat/sinkronisasi" element={<RequireRole roles={MANAJEMEN}><MassGeneratePage /></RequireRole>} />
        <Route path="/sertifikat/galeri" element={<RequireRole roles={MANAJEMEN}><GaleriSertifikat /></RequireRole>} />
        <Route path="/sertifikat/kalibrasi" element={<RequireRole roles={MANAJEMEN}><SertifikatFrame /></RequireRole>} />

      </Route>

      {/* Default */}
      <Route path="/" element={<Navigate to="/kalender" replace />} />
      <Route path="*" element={<Navigate to="/kalender" replace />} />
    </Routes>
  )
}
