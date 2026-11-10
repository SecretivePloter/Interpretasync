# Fitur 4: bintang emas untuk jadwal baru/diperbarui

## Aturan dan pilihan
Bintang aktif selama 24 jam sejak pembuatan atau perubahan penting terakhir. Membuka detail tidak menghapusnya. Dibanding seen per pengguna, aturan waktu tidak membutuhkan tabel aktivitas pengguna/RLS baru dan berlaku konsisten untuk kalender privat maupun penonton TV anonim. Konsekuensi: semua pengguna melihat masa aktif yang sama; pembaruan penting sebelum migrasi tidak dapat direkonstruksi dengan aman dari updated_at.

Tanggal, jam mulai/selesai, interpreter, judul pekerjaan, perusahaan, lokasi, serta tautan Job Order memicu bintang. Catatan, updated_at, whitespace di ujung teks, dan perubahan null menjadi teks kosong tidak memicunya. Judul pekerjaan tetap dianggap penting meskipun perubahannya kecil. Perubahan setelah migrasi dicatat oleh trigger server; client tidak bisa mengatur timestamp/daftar field secara langsung. Hanya nama field terakhir yang disimpan, tanpa nilai lama/baru atau isi catatan.

Data lama tidak di-UPDATE massal: calendar_changed_at/fields tetap null. created_at menjadi baseline, sehingga jadwal yang benar-benar baru dibuat dalam 24 jam terakhir tetap mendapat bintang. Waktu tampil dalam WIB. Kedaluwarsa mengikuti jam perangkat; gunakan pengaturan waktu otomatis pada perangkat display.

## File dan dependensi
- src/utils/calendarChanges.js: jendela 24 jam, baseline legacy, batas waktu terdekat, label tooltip.
- src/hooks/useCalendarChangeClock.js: satu timeout per grid/panel, pembaruan focus/visibility, cleanup saat unmount. Tidak ada interval per chip.
- src/components/calendar/RecentChangeIndicator.jsx dan src/index.css: bintang emas statis 12 px, alas terang dan stroke gelap, title/aria Bahasa Indonesia.
- MonthGrid.jsx, CalendarGrid.jsx, EventBlock.jsx, TodayDutyHighlights.jsx: integrasi indikator dan clock. Bulanan Ringkas/Detail serta highlight tetap dipertahankan.
- Mingguan menghitung lebar minimum dari jumlah kolom benturan: tiap kolom 42 px sebelum jarak kartu. Header/body tetap sejajar; kalender menggulir di dalam area sendiri saat padat. Ini mencegah ikon dan avatar keluar dari kartu pada layar sempit, termasuk dua penanda pada kartu yang sama.
- PublicDisplayCalendar.jsx menggunakan public_display_calendar_v2; RPC lama tidak diubah. Feed baru mengembalikan enam field publik lama ditambah timestamp dan nama field perubahan saja. Batas rentang/tanggal tetap melalui RPC lama.
- Migrasi supabase/migrations/20261110110000_calendar_recent_changes.sql: dua kolom nullable dan trigger BEFORE INSERT/UPDATE, fungsi SECURITY INVOKER dengan search_path tetap; revoke EXECUTE publik. Trigger updated_at lama, policies events, publication, dan sinyal revisi fitur 3 tetap berlaku.
- v2 adalah SECURITY DEFINER yang sengaja boleh dibaca anon/authenticated, seperti RPC publik lama. SELECT langsung events tidak dibuka. Advisor menandai EXECUTE fungsi publik ini sesuai desain; izin internal trigger tetap dicabut. Referensi: https://supabase.com/docs/guides/database/functions dan https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- Bot WhatsApp, schedule_assignments, jenis, dan conflict detection tidak diubah. Database bot yang terpisah belum disinkronkan oleh fitur ini.

## Checklist pengujian manual
| Skenario | Hasil yang diharapkan | Bukti/status |
| --- | --- | --- |
| Buat jadwal | Timestamp server, label Jadwal baru, bintang aktif | Lulus probe SQL sementara |
| Ganti tanggal/jam/interpreter/pekerjaan/perusahaan/lokasi/Job Order | Masa aktif diperbarui, tooltip menyebut field yang berubah | Lulus delapan field pada probe SQL |
| Ubah catatan saja atau simpan tanpa perubahan penting | Timestamp bintang dan daftar field sebelumnya tetap | Lulus probe SQL |
| Kirim metadata bintang buatan dari client | Nilai diabaikan dan ditentukan server | Lulus insert/update probe SQL |
| Jadwal legacy lama dengan updated_at baru | Tidak menjadi baru hanya karena updated_at | Lulus unit test, migrasi tidak menulis ulang baris lama |
| Tepat sebelum/sesudah 24 jam tanpa reload | Bintang ada sebelum batas, hilang setelahnya | Lulus jam virtual browser, 1990 ms sebelum deadline dan 50 ms sesudah |
| Buka detail, lalu ada perubahan penting lain | Detail tetap terbuka normal; bintang tetap sampai kedaluwarsa dan dapat muncul lagi | Lulus UI fixture, tombol Simpan hadir, store update |
| Dua penanda dan avatar pada kartu padat | Tidak overlap/clipping; ikon peringatan tetap mendukung reduced motion | Lulus screenshot dan ukuran DOM |
| Light/dark 390, 1024, 1440 | Overflow root 0, clipping ikon 0 di bulanan dan mingguan | Lulus setelah koreksi minimum lebar mingguan |
| Gambar avatar bersama bintang | Jalur img tetap dipakai dan gambar berhasil dimuat | Lulus fixture gambar sintetis, bukan foto personal production |
| Public/TV anonim | v2 memuat data aman dan metadata, bintang terbaca | Lulus client anonim asli di halaman lokal dengan RPC production |
| Sinyal realtime publik | RPC v2 dimuat ulang tanpa reload halaman | Lulus transport production dengan revisi sinyal saja; tidak mengubah jadwal sungguhan |
| Dua akun login production mengubah jadwal | Bintang muncul pada akun lain dan TV | Belum diuji end-to-end; handler store, SQL trigger, publik realtime diuji terpisah |

Unit/regresi: node --test scripts/calendar-changes.test.mjs scripts/calendar-readability.test.mjs scripts/interpreter-database.test.mjs, 18 test lulus. Build Vite lulus dengan peringatan chunk besar yang sudah ada. Validasi SQL supabase/tests/calendar_recent_changes.sql dijalankan dalam transaksi migrasi, memakai tabel sementara; data jadwal produksi tidak diubah untuk pengujian. Pembandingan proyeksi v1/v2 dan penolakan rentang invalid lulus sebagai anon.

## Checkpoint dan rollback
Checkpoint GitHub: codex/checkpoint-before-calendar-star-20261110 pada 84b2276acb8bc86c100f19d0110ec4b70ede87da.
Deployment awal: https://interpretasync-igj98qkki-secretiveploters-projects.vercel.app

Urutan undo:
1. Promote deployment awal di Vercel atau deploy kembali frontend checkpoint.
2. Jalankan supabase/rollback/20261110110000_calendar_recent_changes.sql. SQL bersifat idempoten, menghapus hanya fungsi v2, trigger/metadata fitur 4. Fitur 3 dan RPC lama tetap ada.
3. Periksa kalender privat dan TV kembali memakai frontend lama. Tidak perlu mengubah bot.

Rollback SQL sudah ditinjau, tidak dijalankan pada production. Migrasi maju idempoten (ADD IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS). Jangan membalik urutan rollback karena frontend fitur 4 memerlukan RPC v2.
