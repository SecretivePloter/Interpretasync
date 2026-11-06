# Checkpoint sebelum mode ringkas sebulan

- Checkpoint GitHub: `codex/checkpoint-before-month-compact-20261106`
- Commit: `f7fe1c19eca4ced4696610895a8b587857a84646`
- Deployment sebelum revisi: `dpl_AeC2xgXdx5sVHRCvdNi3nmJJA2AC`
- URL: https://interpretasync-eeu94wh4z-secretiveploters-projects.vercel.app
- Checkpoint awal sebelum warna kontras juga tetap tersimpan, lihat CALENDAR_CHECKPOINT_20261106.md.

Undo live:

```powershell
vercel rollback https://interpretasync-eeu94wh4z-secretiveploters-projects.vercel.app --yes
```

Sinkronkan GitHub juga sebelum deployment berikutnya: restore hanya `src/components/calendar/MonthGrid.jsx` dan `src/pages/CalendarPage.jsx` dari branch checkpoint lalu build/commit/publish. Helper monthLayout.js dapat dibiarkan unused. Tidak ada perubahan data Supabase dalam revisi ini.

Mode Ringkas default menampilkan satu baris per jadwal dengan avatar, nama, dan judul. Label panjang memakai ellipsis; tooltip dan klik menampilkan detail lengkap. Mode Detail menampilkan kartu lengkap seperti checkpoint. ResizeObserver menghitung tinggi area kalender, tinggi baris minggu mengikuti hari terpadat. Tinggi chip15–20px, font11px, angka tanggal18px. Semua event tetap dirender; jadwal sangat padat tetap scroll pada tinggi minimum, tidak disembunyikan. Highlight hari ini dibuka di popup agar tidak memakan tinggi kalender.

Verifikasi:115jadwal November seluruhnya dalam DOM, semua tanggal1–30 terlihat pada1819×921 tanpa vertical scroll (clientHeight=scrollHeight=766), fullscreen1366×768 juga tanpa vertical scroll (719/719). Tanggal31 muncul hanya pada bulan yang memiliki31hari. Detail toggle, popup highlight, dan ukuran lain diuji lokal dengan snapshot jadwal read-only. Separate visual judge memastikan tidak ada overlap; ringkasan lebih kecil dan label panjang dipotong, detail tersedia lewat klik.
