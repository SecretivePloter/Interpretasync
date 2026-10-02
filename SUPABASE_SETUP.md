# Setup Supabase Baru

Project ini hanya memakai satu Supabase untuk Auth, Operasional, Inventaris, dan Sertifikat.
Modul keuangan tidak ikut dideploy.

## 1. Buat project dan environment

1. Buat project Supabase baru.
2. Salin `.env.example` menjadi `.env`.
3. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari menu **Settings > API** project baru.
4. Jangan pernah memasukkan `service_role` key ke `.env` frontend atau Git.

## 2. Buat schema dan admin pertama

1. Di **Settings > API**, tambahkan `ichikara` pada **Exposed schemas**. Jangan hapus schema lain yang sedang dipakai project tersebut.
2. Buka **SQL Editor**, jalankan `supabase/migrations/20261002_initial_operational_and_certificates.sql`.
2. Buat akun admin pertama dari **Authentication > Users**.
3. Jalankan query berikut, ganti emailnya:

```sql
insert into ichikara.user_roles (user_id, role)
select id, 'manajemen'
from auth.users
where email = 'admin@domain-anda.com'
on conflict (user_id) do update set role = excluded.role;
```

Role user yang belum dipetakan adalah `operator`, bukan manajemen.

## 3. Deploy validator sertifikat

```bash
supabase link --project-ref PROJECT_REF_BARU
supabase functions deploy certificate-verify --no-verify-jwt
```

Fungsi ini memakai `SUPABASE_SERVICE_ROLE_KEY` bawaan Edge Function untuk membuat signed URL foto yang hidup 60 detik. Key itu tidak dimasukkan ke browser.

## 4. Konfigurasi generator sertifikat statis

1. Salin `public/sertifikat/config.js.example` menjadi `public/sertifikat/config.js`.
2. Isi URL dan anon key project baru.
3. File `config.js` memang di-ignore Git karena dibuat untuk lingkungan deployment.

## 5. Validasi sebelum deploy frontend

```bash
npm install
npm run build
```

Pastikan login admin, CRUD interpreter, jadwal, order, inventaris, unggah avatar, generate sertifikat, dan validator publik diuji pada project baru.
