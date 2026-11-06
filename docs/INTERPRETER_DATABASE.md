# Database interpreter

## Revisi direktori ringkas dan popup filter
Kartu direktori fokus pada foto/nama, fee IDR per satuan yang dipilih, dan tag perusahaan dari track record (completed experiences dan past calendar; reference-only, future dan cancelled dikecualikan). Perusahaan dapat dikenali dari kolom company atau kode eksplisit pada judul kalender, misalnya TMMIN, SHP dan KAO. Tarif bukan sumber tag pengalaman. Blacklist tetap ditampilkan tanpa statistik panjang atau pesan berulang.

Satu tombol Filter membuka popup berisi perusahaan, status jadwal, satuan tarif, batas fee, tanggal/jam dan pengurutan. Default full day. Batas minimum inklusif, batas maksimum eksklusif, sehingga preset di bawah Rp1 juta mengecualikan tarif Rp1.000.000. Rate IDR efektif pada tanggal request dipakai; tarif khusus perusahaan diprioritaskan ketika company dipilih. Fee terendah dari variasi aktivitas diberi label Mulai. Kandidat tanpa tarif dikecualikan saat budget aktif. Draft filter diterapkan hanya saat Terapkan; Batal tidak mengubah hasil. Tombol aksi tetap di footer popup saat isi digulir.

## Revisi track record dan tarif, 6 November 2026
- Tombol per baris "Lengkapi pengalaman & rating" dihapus. Riwayat ditampilkan sebagai timeline berkelompok per bulan, terbaru lebih dahulu. Tugas selesai terkonfirmasi memakai status tersendiri; event yang telah lewat memakai label riwayat kalender. Tugas future dan pengalaman cancelled tidak menjadi tugas selesai.
- Tarif terbaru pemilik bertanggal 5 November 2026 dimasukkan langsung ke database: 55 variasi (30 full day, 12 half day, 13 bulanan). Tarif tetap mempertahankan angka, aktivitas, pasangan bahasa, dan pengecualian akomodasi. Data tarif aktual tidak disimpan dalam repository publik.
- Alias Budi Hartono/Budi, Joe/Juhana dan Yanoshin/Yanosin dikonfirmasi pemilik. Profil yang belum ada dibuat tanpa mengarang kontak.
- Tabel interpreter_restrictions menyimpan pembatasan yang dikonfirmasi pemilik: 4 global dan 2 khusus TMMIN. Tarif tetap tersimpan sebagai referensi biaya; pembatasan terlihat di profil dan direktori. Nama global-blacklist tidak muncul sebagai "Tidak ada jadwal" ketika filter itu dipilih. Pembatasan scoped memengaruhi status ketika perusahaan yang dipilih cocok.
- Nominal blacklist tanpa satuan disimpan sebagai catatan pembatasan, tidak diberi satuan tarif buatan. Tarif tanpa nominal lembur/transport menampilkan "Belum ditetapkan".

## Penggunaan
1. Buka **Profil / Database Interpreter**. Cari nama, spesialisasi, pengalaman proyek; pilih perusahaan, tanggal dan jam request. Urutkan nama, perusahaan, proyek, jumlah tugas selesai atau rating.
2. Status **Ada tugas** berarti ada jadwal beririsan dengan jam request. **Tidak tersedia** berasal dari blok tanggal. **Tidak ada jadwal** bukan konfirmasi kesiapan menerima tugas. Penugasan kalender dengan jam placeholder 06–21 tetap memblok waktu secara konservatif.
3. Buka profil, tab **Pengalaman**. Tambahkan pengalaman atau pilih **Lengkapi pengalaman & rating** pada jadwal terdahulu. Konfirmasi perusahaan, hasil tugas, rating dan catatannya. Jadwal lewat dan quotation approved tidak otomatis dianggap pekerjaan selesai.
4. Tab **Tarif** menyimpan fee pembelian jasa interpreter berdasarkan aktivitas/perusahaan, satuan, mata uang, masa berlaku, transport dan tarif lembur yang disepakati. Gunakan tarif untuk mengisi kalkulator, lalu periksa tanggal dan kesepakatan setiap tugas.
5. Tab **Rekap fee** menyimpan jumlah satuan, tarif snapshot, jam lembur aktual yang disetujui, tambahan dan potongan. Total dihasilkan database. Draft/disetujui/dibayar dicatat manual. Nilai ini tidak otomatis menjadi tagihan pelanggan atau transfer pembayaran; nominal order lama dilabeli Estimasi Order.
6. Tab **Ketersediaan** mencatat blok tanggal untuk cuti/ketidaktersediaan yang dikonfirmasi.

## Sumber Excel
463 baris sumber dari 7 sheet workbook pemilik diimpor pada 6 November 2026. Dua sheet kosong dan nomor urut tanpa quotation tidak diimpor. SHA256 workbook: `cf61ddd58fdca112bb6fc2060efcf9e620c59649ec58b4cb4a9560e4513ea112`.

Tombol **Tinjau data Excel** menampilkan sel asal, formula dan cached value, konteks perusahaan dan kandidat nama. Pengguna memilih identitas dan meninjau satuan/currency/tanggal berlaku sebelum menjadikan data sebagai pengalaman atau tarif. Unknown names harus dibuat melalui Pengaturan; alias tidak digabung otomatis. Satu baris yang mengandung beberapa tarif bisa ditinjau sekali dan tarif tambahan dicatat melalui profil dengan referensi sel yang sama. Reviewed sources tetap dapat dibaca.

Lima referensi pengalaman awal untuk Aulia (TMMIN), Dicky (TMMIN/OMI), Basukurta (KFN), Salim (OMI) ditautkan berdasarkan nama persis. Status **reference**, tanpa tanggal harian palsu dan tanpa rating buatan. Tarif Excel belum diaktifkan otomatis.

Ekstraksi read-only membutuhkan Python/openpyxl. Jalankan:

```powershell
python scripts/extract-interpreter-workbook.py "path-to-workbook.xlsx" ".local/interpreter-workbook.json"
node scripts/prepare-interpreter-source-import.mjs ".local/interpreter-workbook.json" ".local/interpreter-source-import.sql"
```

Jalankan SQL hasil melalui Supabase setelah meninjau sumber. Kunci hash+sheet+row mencegah impor ulang workbook identik. Workbook versi berbeda menjadi sumber baru yang perlu ditinjau, sehingga perubahan tarif tidak menimpa riwayat.

## Penyimpanan dan akses
Migration `20261106_interpreter_database.sql` membuat experiences, rates, fees, blocks dan sources di schema ichikara. Migration `20261106_interpreter_source_review.sql` membuat RPC review atomik dengan row lock dan penolakan replay.

Semua tabel memakai RLS, hanya `ichikara.is_management()` yang boleh membaca/menulis. Anon tidak mendapat hak tabel atau RPC. Public display tidak menerima tarif/rating/catatan internal. Fee menggunakan numeric dan nilai total generated, bukan perhitungan jam kalender. Mata uang dipisahkan, tidak ada konversi otomatis. Pajak, THR, BPJS, prorata gaji bulanan dan rumus lembur regulasi tidak diotomatisasi; catat kesepakatannya sebelum memakai kalkulator.

## Verifikasi
- `node --test scripts/interpreter-database.test.mjs`: hitungan fee, pembulatan, konflik jam/batas bersebelahan, blok tanggal, rata-rata rating.
- Build produksi dan `git diff --check`.
- SQL transaksi rollback di database live: CRUD fee management, total generated, RLS non-management, review sumber atomik dan penolakan replay.
- Browser lokal dengan fixture terisolasi: daftar/profil/tab tarif/kalkulator/simpan rekap/tinjauan, overflow 0 pada 390 dan 1024 px. Ini tidak membuktikan login end-to-end pengguna produksi.

## Deployment / rollback
Vercel project `interpretasync`; VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY diperlukan saat build. Fixture .local, screenshot, env dan file sumber tidak diunggah ke Vercel/Git.

Jika frontend perlu dikembalikan, deploy commit sebelumnya. Migration bersifat penambahan dan data baru dapat dipertahankan; jangan drop tabel keuangan/riwayat sebagai rollback frontend. Referensi tarif di rekap berupa snapshot sehingga perubahan/hapus tarif master tidak mengubah fee tugas lama.
