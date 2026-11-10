# Fitur 2: Project dan Reguler pada kalender

## Lingkup yang disetujui
Reguler/Project diterapkan di Interpretasync. Pengguna secara eksplisit menjawab pada 10 November 2026: “lewati dulu untuk bot whatsappnya”. Tidak ada perubahan pada kode, konfigurasi, database, jenis rutin/kontrak, conflict detection, maupun layanan WhatsApp. Pemeriksaan lintas bot/aplikasi belum aktif dan tidak diklaim selesai.

## Model data dan trade-off
| Pilihan | Kelebihan | Kekurangan |
| --- | --- | --- |
| Satu record rentang + pola hari | Hemat baris, kontrak mudah diperpanjang terpusat | Kalender, availability, realtime, pengecualian libur dan semua pembaca lama harus mengevaluasi pola; tidak kompatibel dengan event date tunggal |
| Materialisasi satu record per tanggal, dipilih | Tetap memakai events/date/jam; mudah mengubah atau menghapus satu tanggal; pembaca jadwal lama tetap bekerja | Lebih banyak baris; edit satu tanggal tidak mengubah seluruh rangkaian; perlu paginasi |

Field baru `events.schedule_type text NOT NULL DEFAULT 'project'` dibatasi project/reguler. Ini klasifikasi kalender, tidak menggunakan atau mengubah arti `schedule_assignments.jenis` milik bot. `regular_series_id uuid` mengelompokkan tanggal satu rangkaian, hanya boleh terisi untuk Reguler. Tidak ada tabel baru atau perubahan RLS. Unique index series/date mencegah tanggal ganda dalam satu rangkaian.

Semua data lama otomatis Project melalui default kolom, tanpa UPDATE massal/menyalakan bintang. Query setelah migrasi menunjukkan 342 Project dan tidak ada Reguler buatan. Jadwal lama tidak ditebak klasifikasinya dari klien, tarif, atau judul. Regular series baru dibuat sebagai satu INSERT array (satu transaksi), bukan loop request; konflik satu hari membatalkan seluruh batch.

## Perilaku UI
- Tambah/Edit Jadwal memiliki Tipe, default Project. Untuk Reguler baru, pilih tanggal mulai, sampai tanggal, hari kerja dan jam. Form menampilkan jumlah tanggal; batas form 366 hari kalender per rangkaian. Default Senin sampai Jumat; hari libur nasional tidak otomatis dikecualikan, hapus/ubah tanggal tersebut bila diperlukan.
- Edit/Hapus hanya berlaku untuk satu tanggal dan dijelaskan pada modal. Hapus tetap meminta konfirmasi. Tidak ada aksi bulk edit/delete rangkaian dalam lingkup ini.
- Project tetap memakai warna interpreter. Reguler selalu satu skema abu-abu: light #e2e8f0/#1e293b, dark #334155/#f1f5f9. Label REG dan garis tepi putus-putus membedakan tanpa mengandalkan warna. Pada blok mingguan sangat pendek, garis tepi/tooltip Reguler tetap ada sementara label REG disembunyikan agar tidak keluar kartu.
- Bulanan Ringkas tetap satu baris per jadwal; Reguler diletakkan berdekatan setelah Project, tidak disembunyikan ke grup yang memerlukan klik tambahan. Semua tanggal tetap memakai layout adaptif lama. Layar penuh, Detail, avatar, pulse unassigned dan bintang emas tetap bekerja.
- Toggle Tampilkan Reguler tersimpan di filter kalender, berlaku di privat dan TV publik. Filter tampilan tidak membuang data dari store dan tidak memengaruhi conflict detection atau availability. Highlight hari ini tetap memakai daftar tugas asli seperti sebelumnya. Tampilkan semua pada grid mereset filter kalender termasuk Reguler.
- Legenda membedakan warna interpreter Project dan satu swatch abu-abu Reguler. RPC publik v3 menambah hanya schedule_type di atas proyeksi aman v2; v1/v2 tetap tersedia. regular_series_id, perusahaan, lokasi dan catatan privat tidak ditambahkan ke feed publik.

## Conflict detection aplikasi
Dua exclusion constraint PostgreSQL memakai btree_gist dan rentang timestamp lokal `[mulai, selesai)`:
1. events_project_regular_no_overlap: interpreter sama, waktu overlap dan tipe berbeda ditolak (Project/Reguler dua arah). Operator GiST <> pada tipe menjaga Project/Project tetap diperbolehkan sesuai perilaku lama.
2. events_regular_no_overlap: dua Reguler overlap pada interpreter sama ditolak.

Jam berdampingan, tanggal berbeda, dan interpreter berbeda tidak bentrok. Placeholder Belum Ditentukan (ID master terverifikasi) dikecualikan karena belum memakai kapasitas seseorang; saat di-assign ke orang sungguhan, constraint kembali berlaku. Constraint berada pada tabel sehingga berlaku juga untuk penulisan API/klien lama dan melindungi dari penulisan bersamaan. UI memeriksa events mentah tanpa filter sebelum simpan; error SQL 23P01 ditampilkan dalam Bahasa Indonesia tanpa nilai privat dari detail database. Reguler tidak menambahkan status cancelled; untuk melepas tanggal gunakan penghapusan jadwal seperti alur lama.

Perubahan schedule_type dihitung sebagai update penting pada trigger bintang. Perubahan catatan tetap tidak memicunya.

## File yang berubah
- src/utils/scheduleTypes.js: tipe/warna/filter, tanggal UTC deterministik, pemeriksaan interval dan pesan error.
- RegularScheduleLabel.jsx, ScheduleTypeToggle.jsx, MonthGrid.jsx, CalendarGrid.jsx, EventBlock.jsx, TodayDutyHighlights.jsx, src/index.css: tampilan dan kontrol kalender.
- EventModal.jsx: tipe, pola hari, preview tanggal, konflik, simpan batch dan scope satu tanggal.
- useFilterStore.js/useFilter.js: toggle persisted, default true; data pemeriksaan benturan tidak difilter.
- useEventStore.js/services/events.js: batch satu request; fetchAllEvents dipaginasi 500 baris dengan urutan date/start_time/id agar materialisasi tidak terpotong pada batas standar 1000 baris.
- PublicDisplayCalendar.jsx: RPC v3 dan jumlah asli untuk status/reset filter.
- calendarChanges.js: label perubahan tipe untuk bintang.
- .vercelignore: mengecualikan artefak CLI supabase/.temp; perubahan .gitignore milik pengguna tidak diikutkan.

## Migrasi dan rollback
Migrasi: supabase/migrations/20261110110001_calendar_project_regular.sql. File dibuat memakai CLI migration new; nomor akhirnya diturunkan dari versi tertinggi repo +1 detik karena beberapa migrasi terdahulu memakai timestamp lebih akhir daripada jam CLI saat ini. File lama tidak diganti nama. DDL idempoten dijalankan dua kali dalam transaksi yang sama dan lulus sebelum commit; constraint dicek berdasarkan nama serta tabel. btree_gist dipasang di extensions, operator class memakai schema extension yang sebenarnya.

Checkpoint GitHub `codex/checkpoint-before-regular-calendar-20261110`, commit 89e9e392b00e37a01bf88fdecbb350bb10a23d78.
Deployment sebelum fitur: https://interpretasync-4vm3tio2k-secretiveploters-projects.vercel.app

Urutan undo:
1. Promote deployment checkpoint di Vercel atau deploy ulang commit checkpoint.
2. Jalankan supabase/rollback/20261110110001_calendar_project_regular.sql.
3. Pastikan kalender lama dan RPC v2 kembali dipakai. Jadwal Reguler yang sudah dibuat tetap ada sebagai event Project biasa; tanggal tidak dihapus. Metadata jenis/rangkaian memang dilepas.

Rollback mempertahankan extension btree_gist agar tidak mengganggu pemakai lain. Fungsi tracking bintang dikembalikan ke versi fitur 4. RPC v1/v2, sinyal realtime dan policy existing tetap ada. Rollback ditinjau, tidak dijalankan pada production.

## Checklist pengujian
| Skenario | Hasil | Status/bukti |
| --- | --- | --- |
| Jadwal lama/default client lama | Project, perilaku Project/Project tetap | Lulus SQL sementara dan query default production |
| Reguler November Senin-Jumat | 21 tanggal, akhir pekan dilewati | Lulus unit dan form melalui mock HTTP; hanya 1 POST, 21 rows, 1 series UUID |
| Rentang invalid/leap year/tanpa hari kerja | Pesan validasi/penolakan yang tepat | Lulus unit dan form |
| Project/Reguler dua arah, Reguler/Reguler | Benturan ditolak | Lulus exclusion constraints pada tabel temporary |
| Jam berdampingan, interpreter/tanggal berbeda | Diizinkan | Lulus unit/SQL |
| Placeholder tanpa interpreter | Tidak memblokir kapasitas orang | Lulus unit/SQL; pulse tetap tampil di screenshot |
| Batch berisi satu benturan | Tidak ada baris batch yang tersimpan | Lulus probe SQL temporary |
| UPDATE memindah jadwal ke waktu bentrok | Ditolak | Lulus probe SQL temporary |
| Rangkaian/tanggal ganda atau tipe invalid | Ditolak | Lulus unique/check constraints temporary |
| Perubahan tipe | Metadata bintang memuat schedule_type | Lulus SQL temporary |
| Reguler disembunyikan lalu tambah Project bentrok | Simpan nonaktif dan daftar benturan tetap ada | Lulus form dengan state/filter sebenarnya dan mock HTTP |
| Server mendeteksi benturan setelah preflight | Error ramah, modal tetap terbuka | Lulus simulasi response 23P01; detail privat tidak ditampilkan |
| Edit satu tanggal, lalu hapus | Sibling tidak berubah; DELETE baru dikirim setelah konfirmasi | Lulus UI/mocked HTTP |
| Ringkas/Detail, light/dark 390/1024/1440 | Satu warna Reguler, warna Project tetap beragam; overflow root 0 dan clipping badge 0 | Lulus screenshot/DOM; 34 Reguler pada fixture 115 jadwal |
| Form pada 390/1024 light/dark | Footer simpan terbaca, tanpa overflow root | Lulus screenshot/DOM dan pemeriksa visual terpisah |
| Pembacaan >1000 jadwal | Seluruh data terbaca; kegagalan halaman tidak mengembalikan data parsial | Lulus 1201 row mocked REST, offset 0/500/1000, error halaman kedua diteruskan |
| Public/TV dan realtime tipe | RPC v3 aman, perubahan tipe memperbarui style tanpa reload, filter berfungsi | Lulus client anonim asli + perubahan respons tipe hanya di browser fixture, dipicu sinyal revisi production; tidak mengubah event nyata |
| Publik tidak memperoleh akses SELECT events baru | Kosong melalui RLS, proyeksi v3 sama dengan v2 selain tipe | Lulus SQL sebagai anon |
| Dua akun login production dan kontrak sungguhan | Simpan, realtime dan benturan operasional | Belum dijalankan; DB, UI, service dan transport diuji terpisah |
| Bot WhatsApp | Tidak disentuh | Ditunda atas instruksi pengguna, bukan dianggap terintegrasi |

25 unit/regresi lulus. Build lokal dan pemeriksaan git diff --check lulus. Probe SQL memakai tabel sementara LIKE events INCLUDING ALL di dalam transaksi migrasi; tidak ada jadwal production ditulis untuk pengujian. Advisor baru hanya EXECUTE SECURITY DEFINER v3 untuk anon/authenticated, disengaja bagi TV publik; tidak ada grant baru pada events.

Referensi primer:
- https://www.postgresql.org/docs/current/btree-gist.html
- https://www.postgresql.org/docs/current/rangetypes.html
- https://supabase.com/docs/reference/javascript/range
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
