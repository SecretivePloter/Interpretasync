# Ichikara Management System

Aplikasi web manajemen interpreter bahasa Jepang untuk koordinator program **SSW (Specified Skilled Worker)** Indonesia–Jepang. Backendnya memakai satu Supabase baru untuk Auth, operasional, inventaris, dan sertifikat.

## Tech Stack

- **React 18 + Vite** · **Tailwind CSS** (dark mode default)
- **React Router v6** · **Zustand** (state global)
- **date-fns** · **lucide-react** (ikon ringan) · **@dnd-kit/core** (Kanban)
- **Supabase** — PostgreSQL + Realtime + Auth + Storage

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build produksi ke dist/
npm run preview  # pratinjau hasil build
```

Kredensial Supabase ada di `.env` (lihat `.env.example`). Ikuti [panduan setup Supabase baru](SUPABASE_SETUP.md) sebelum menjalankan aplikasi.

Login menerima `username` (otomatis dipetakan ke `username@ichikara.co.id`) atau email lengkap. Buat dan kelola user lewat **Supabase Dashboard → Authentication** lalu petakan perannya pada `user_roles`.

## Struktur

```
src/
├── app/            App.jsx, Router.jsx, store/ (Zustand)
├── pages/          Login, Calendar, Order, ProfileList, Profile, Settings
├── components/     layout · calendar · filter · order · profile · ui
├── services/       supabase, auth, interpreters, events, orders, settings
├── hooks/          useRealtime, useCalendar, useFilter
└── utils/          colors, dateHelpers, constants
```

### Aturan arsitektur

- **Semua query Supabase hanya di `src/services/`** — komponen tidak query langsung.
- Auth terpusat di `services/auth.js`; subscription realtime di `hooks/useRealtime.js`.
- Akses `localStorage` hanya lewat store (middleware `persist` Zustand), bukan di komponen.
- Setiap route privat dibungkus `ProtectedRoute` (siap dikembangkan ke role-based).

## Database (Supabase)

Tabel operasional: `interpreters`, `events`, `orders`, `app_settings`, tabel inventaris, dan `sertifikat`. RLS membedakan `manajemen` dan `operator`; schema lengkap ada di migration.

Logo aplikasi: taruh `public/assets/images/logo.png`, atau unggah lewat **Pengaturan** (tersimpan ke Storage). Bila belum ada, tampil fallback teks "ICHIKARA".

## Halaman

1. **/login** — autentikasi
2. **/kalender** — kalender mingguan, filter interpreter (persist), CRUD jadwal, realtime
3. **/order** — tabel (sortable + pagination) & Kanban (drag-drop status), filter, insight status & revenue
4. **/profil** & **/profil/:id** — daftar + detail interpreter (statistik nyata, jadwal, riwayat order, heatmap)
5. **/pengaturan** — manajemen interpreter, upload logo, preferensi, fitur mendatang
