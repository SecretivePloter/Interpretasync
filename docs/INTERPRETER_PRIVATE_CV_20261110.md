# CV privat pada database interpreter

## Perilaku pengguna
Setiap kartu di Database Interpreter memiliki Download CV dan Update CV, tanpa tombol bersarang di tombol pembuka profil. Klik badan kartu tetap membuka profil. Fitur yang sama ada di panel profil. Download nonaktif jika belum ada CV; unggahan pertama dilakukan melalui Update CV, pilih PDF, lalu Upload CV.

Dialog menampilkan CV aktif, riwayat versi, nama asli, waktu WIB, ukuran, dan status unggahan/penghapusan. Nama file Jepang/spasi dipertahankan (normalisasi NFC); ekstensi PDF tidak dipisah per huruf pada layar kecil. Semua versi ready dapat diunduh. Hapus memerlukan konfirmasi, menghapus versi yang dipilih saja; jika versi aktif dihapus, versi ready terbaru yang tersisa menjadi aktif. Jika semua versi dihapus, Download kembali nonaktif.

Format awal PDF saja (DOCX opsional belum diaktifkan). Batas 5 MiB/5.242.880 byte. Client dan server memeriksa ekstensi, MIME, ukuran, nama tanpa karakter kontrol/pemisah path, serta signature %PDF-. Bucket juga membatasi MIME application/pdf dan ukuran 5 MiB. Pemeriksaan ini mengenali format PDF, bukan parser seluruh isi dokumen. Nama asli maksimal 240 karakter; path Storage tidak memakai nama tersebut, melainkan interpreter UUID/CV UUID.pdf.

## Akses dan penyimpanan
| Pelaku | Izin |
| --- | --- |
| Anon/tanpa login | Tidak dapat membaca metadata atau CV |
| Operator/interpreter/non-manajemen | Tidak dapat membaca, upload, download, atau hapus CV |
| Manajemen | Membaca metadata dan file ready; upload/delete melalui layanan server terautentikasi |
| Backend service_role | Operasi internal Storage dan transaksi metadata; key tidak dikirim ke browser |

Bucket ichikara-interpreter-cvs PRIVATE. Metadata ichikara.interpreter_cvs berisi id, interpreter_id, storage_path, original_name, byte_size, mime_type, sha256, state, is_active, created_at, uploaded_at, uploaded_by. uploaded_by berasal dari Auth getUser, bukan body client. FK actor menjadi null bila akun pengunggah dihapus; file/riwayat tetap terkelola.

RLS metadata hanya SELECT untuk authenticated yang memenuhi ichikara.is_management(). Authenticated tidak diberi INSERT/UPDATE/DELETE metadata. Storage SELECT hanya untuk manajemen dan object yang metadata-nya ready; tidak ada policy write/delete Storage bagi klien. Fungsi finalize/delete SECURITY INVOKER, search_path kosong, EXECUTE hanya service_role. Tidak ada policy/bucket lain yang diperluas.

Edge Function interpreter-cv memvalidasi token lewat Auth getUser(token), lalu RPC is_management dengan Authorization caller. Verify JWT gateway false karena autentikasi dilakukan sendiri secara eksplisit, bukan endpoint tanpa autentikasi. Semua tindakan selain preflight melewati pemeriksaan identitas dan peran sebelum membaca body/Storage. Tidak memakai user_metadata sebagai otorisasi. CORS membatasi aplikasi/preview project dan localhost; respons no-store. SDK server dipin ke @supabase/supabase-js2.107.0, sesuai versi terpasang saat implementasi.

Download menghasilkan signed URL 60 detik. Browser langsung mengambil blob tanpa credentials/cache, memakai nama asli untuk download dan merevoke object URL. Tautan tidak disimpan di database/localStorage. Client memeriksa origin/path Storage sebelum mengambil file. Signed URL yang sudah diterbitkan dapat berlaku sampai 60 detik; akses baru selalu diperiksa ulang.

## Konsistensi dan kegagalan
1. Reserve metadata pending sebelum upload, tanpa mengubah CV aktif. Body multipart dibatasi saat streaming, lalu server memvalidasi bytes dan hash SHA-256.
2. Upload object baru tanpa upsert. Semua versi memiliki path UUID berbeda.
3. Finalize mengunci baris interpreter, memeriksa actor masih manajemen dan object Storage sudah memiliki ukuran/MIME yang sesuai, menonaktifkan versi lama dan mengaktifkan versi baru dalam satu transaksi. Unique active/interpreter dan unique ready/interpreter/hash menjaga konkurensi dan duplikat.
4. Bila Storage gagal/hasilnya tidak pasti, pending tetap tercatat dan CV lama tetap aktif. File yang mungkin selesai belakangan tetap memiliki metadata, tidak menjadi object tanpa referensi. Riwayat menyediakan Bersihkan setelah 10 menit; retry upload baru tetap diperbolehkan.
5. Bila finalize gagal setelah upload sudah diketahui selesai, server menandai dan membersihkan object baru melalui Storage API. Jika cleanup gagal, status deleting tetap terlihat dan dapat dicoba lagi. File duplikat tidak mengganti CV aktif.
6. Hapus menandai deleting dan memindahkan active ke versi ready lain sebelum menghapus bytes. Jika penghapusan gagal, metadata tetap ada untuk retry. Metadata dihapus setelah Storage berhasil; object yang sudah hilang (404) dianggap berhasil dibersihkan. Client tidak boleh memaksa cleanup pending yang masih berjalan.

Penghapusan interpreter diblokir oleh FK RESTRICT saat riwayat/pending CV masih ada. Pesan di Pengaturan mengarahkan pengguna membersihkan seluruh versi melalui Update CV terlebih dahulu. Tidak ada cascade metadata yang meninggalkan file privat. Akun pengunggah dapat dihapus tanpa membuang riwayat (uploaded_by SET NULL).

Metadata CV masuk publication realtime dengan RLS yang sama. Satu subscription khusus hanya dipasang saat role manajemen, debounce refresh150ms, resync saat reconnect. Cache metadata tidak dipersist ke localStorage dan dibersihkan saat logout; hasil request lama tidak dapat mengisi cache setelah reset.

## File implementasi
- src/utils/interpreterCv.js: aturan validasi bersama client/server, hash, format ukuran/waktu.
- src/services/interpreterCvs.js: metadata pagination, invoke, upload/delete/download privat.
- src/app/store/useInterpreterCvStore.js: active map, dedup request, epoch guard dan reset logout.
- InterpreterCvActions.jsx / InterpreterCvManager.jsx: tombol kartu/profil, picker PDF, riwayat/status dan konfirmasi hapus.
- ProfileListPage.jsx: article dengan tombol pembuka profil dan footer CV sebagai sibling; tidak ada nested buttons.
- ProfilePage.jsx: panel CV; App.jsx/useRealtime.js: lifecycle role/logout dan subscription CV.
- services/interpreters.js / SettingsPage.jsx: pesan FK CV saat penghapusan profil.
- supabase/functions/interpreter-cv/index.ts dan handler.js: API privat. Tidak menyentuh bot WhatsApp atau kalender/fee.
- supabase/migrations/20261110110002_interpreter_private_cv.sql dan rollback pasangannya. Migrasi dibuat lewat CLI dan nomor diurutkan setelah versi repo sebelumnya, seperti fitur2.

## Pengujian dan batas bukti
| Skenario | Hasil yang diharapkan | Bukti |
| --- | --- | --- |
| PDF Jepang/spasi, MIME browser kosong | Nama dipertahankan, hash benar | Unit client/server + UI download/upload fixture |
| DOCX/PNG berganti nama, kosong/lebih5MiB, path/control name | Ditolak sebelum Storage | Unit/shared validator, handler, UI PDF palsu |
| Tidak login/token salah/anon | 401 tanpa akses CV | Endpoint production diuji HTTP langsung; preflight204 |
| Peran non-manajemen | 403/metadata tidak terbaca | Unit handler, actual SQL RLS dengan role bukan manajemen, kontrol UI tersembunyi |
| Management metadata read, direct write/upload | Metadata terlihat, bypass write/Storage ditolak | Actual SQL RLS dalam transaksi dengan pending fixture tidak ter-commit |
| Upload baru mengganti active | History lama tetap, satu active | SQL lifecycle temporary + mocked browser HTTP |
| Duplikat isi dengan nama berbeda | Tidak menambah versi ready atau mengganti active | Hash/handler/SQL temporary dan UI |
| Upload terputus/finalize gagal | CV lama tetap, pending/deleting dapat dibersihkan | Handler fake Storage + SQL temporary lifecycle |
| Delete aktif | Konfirmasi dahulu, versi sebelumnya dipromosikan | SQL temporary + UI mocked HTTP; DELETE0 sebelum konfirmasi |
| Delete Storage gagal / object sudah hilang | Metadata tidak hilang prematur / retry selesai | Unit handler500/404 |
| Hapus interpreter yang memiliki CV | Diblokir, tidak meninggalkan file | FK RESTRICT dan test lifecycle temporary |
| Client mencoba override pending cleanup | Tidak bisa memaksa p_completed_upload | Unit handler dan SQL pending10menit |
| Tampilan 390/1024 light/dark | Overflow root0, footer jelas, ekstensi utuh | Screenshot/DOM dan reviewer visual terpisah |
| Navigasi kartu dan CV | Download/Update tidak membuka profil, badan kartu tetap membuka profil | UI fixture, browser download event, nested buttons0 |
| Logout/perubahan role | Cache kosong, kontrol CV hilang | UI store/role test dan App reset integration |
| Upload/download CV nyata dengan sesi manajemen production | File tersimpan dan dapat diunduh setelah reload | Belum diuji end-to-end; tidak menggunakan CV pribadi atau kredensial pengguna untuk pengujian |

38 unit/regresi lulus. Build lokal lulus; peringatan ukuran bundle lama tetap ada. SQL migrasi idempoten dieksekusi dua kali sebelum commit dan diuji dengan tabel temporary untuk lifecycle/object metadata. Pengujian RLS memakai satu metadata pending tidak ter-commit yang dihapus sebelum commit. Tidak ada file PDF operasional diunggah/dihapus untuk tes. Query setelah tes: metadata CV0, bucket private, limit/MIME benar, izin service finalize/Storage SELECT benar, anon metadata SELECT false. Advisor tidak menambah temuan keamanan baru.

## Deployment dan rollback
Backend: project lulxlffsgswplbggivrm, Edge Function interpreter-cv ACTIVE versi2. Deployment UI Vercel tidak otomatis mendeploy Edge Functions; pembaruan backend perlu deploy Supabase terpisah, termasuk file shared validator. Environment SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY hanya memakai environment bawaan server Edge; tidak perlu menaruh service key di VITE_*.

Checkpoint GitHub: codex/checkpoint-before-interpreter-cv-20261110 pada fe6d15f49c37e7893430df7fd7c0747caf3c728c.
Deployment sebelum CV: https://interpretasync-3r4yhnsq3-secretiveploters-projects.vercel.app

Undo tampilan cukup promote deployment checkpoint. Bila sudah ada CV, pertahankan backend/bucket/metadata privat; jangan menghapus metadata dan kehilangan referensi file. Untuk rollback penuh, bersihkan semua versi menggunakan UI/Storage API saat fitur masih aktif, lalu kembalikan frontend dan hapus/nonaktifkan Edge Function. SQL supabase/rollback/20261110110002_interpreter_private_cv.sql akan MENOLAK bila metadata atau object masih ada, baru menghapus tabel/fungsi/bucket kosong bila aman. Jangan menghapus file Storage melalui SQL. Rollback sudah ditinjau, tidak dijalankan production.

Referensi: https://supabase.com/docs/guides/storage/security/access-control , https://supabase.com/docs/guides/storage/serving/downloads , https://supabase.com/docs/guides/functions/auth
