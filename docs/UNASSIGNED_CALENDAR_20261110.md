# Penanda jadwal belum ada interpreter

Fitur 3 saja. Kalender privat bulanan Ringkas/Detail, mingguan, highlight hari ini, dan kalender publik/TV memakai indikator yang sama. ID placeholder terverifikasi: `6d846630-b7a3-4f17-9399-524b407166ae`. `order_id` tidak menjadi syarat. Nama master persis Belum Ditentukan juga dikenali; profil belum dimuat tidak dianggap kosong. Null interpreter dikenali untuk kompatibilitas data mendatang (kolom saat ini NOT NULL).

## Perubahan
- Ikon tanda seru 12 px, tooltip/aria Bahasa Indonesia; pulse opacity CSS dua detik, statis saat reduced motion.
- Realtime privat mengikuti schema ichikara. Handler event idempoten, update dapat memasukkan baris yang baru menjadi terlihat sesuai RLS.
- Publik menerima hanya revisi singleton. Trigger statement events/interpreters memperbarui revisi, SELECT anonim dibolehkan hanya pada tabel sinyal. Tidak ada akses anonim baru ke events. Data tetap melalui RPC publik lama; debounce 150 ms dan polling cadangan 60 detik. Reconnect memuat ulang RPC.
- Tidak mengubah jenis, assignment, schema, kode, atau conflict detection bot.

## Checklist manual dan bukti
- [x] Build Vite dan 7 assertion klasifikasi lulus.
- [x] Ringkas/Detail: 10 ikon sesuai fixture November; assignment via handler store mengurangi menjadi 9 tanpa reload. Kembalikan placeholder mengembalikan ikon.
- [x] Mingguan: 3 indikator pada minggu 8-14 November. Avatar placeholder digantikan ikon agar tidak keluar kartu sempit.
- [x] Light/dark 390, 1024, 1440: root overflow 0, indikator bulanan terpotong 0. Kalender lebar tetap memiliki scroll internal seperti sebelumnya.
- [x] prefers-reduced-motion menghasilkan animation-name none.
- [x] Publik dengan client anonim asli membaca 10 indikator dan memuat ulang RPC setelah perubahan revisi melalui realtime.
- [x] Realtime anonim menerima hanya kolom id/revision. SELECT events anonim mengembalikan kosong; UPDATE revisi dan EXECUTE fungsi trigger tidak diizinkan untuk anon.
- [x] Trigger diuji dengan UPDATE events WHERE false di transaksi rollback: revisi naik satu, data jadwal tidak diubah.
- [ ] Uji operasional dua akun production: buka jadwal placeholder, assign interpreter, pastikan ikon hilang pada kalender privat dan TV. Belum dilakukan karena tidak memakai sesi pengguna terautentikasi/mengubah jadwal sungguhan.
- [ ] Uji bot aktual: belum dibuktikan. Bot lokal yang dikonfirmasi aktif memakai project Supabase berbeda; fitur ini hanya merespons data yang masuk database aplikasi.

## Checkpoint dan rollback
Frontend awal: commit fad56181a7dc24849cfe806f6d1c364135f56301, branch checkpoint `codex/checkpoint-before-unassigned-indicator-20261110`.
Deployment awal: https://interpretasync-p9enshpow-secretiveploters-projects.vercel.app
Rollback frontend menggunakan checkpoint atau promote deployment awal. Setelah frontend lama aktif, jalankan SQL `supabase/rollback/20261110100000_calendar_display_revision.sql`. Rollback hanya menghapus tabel sinyal beserta trigger/fungsinya, tidak mengubah jadwal atau profil. Migrasi maju idempoten dan tidak mengganti arti nilai lama.

Referensi: https://supabase.com/docs/guides/realtime/postgres-changes
