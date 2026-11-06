# Checkpoint sebelum perubahan keterbacaan kalender

Checkpoint dibuat sebelum perubahan kalender:
- GitHub branch: `codex/checkpoint-calendar-before-contrast-20261106`
- Commit: `5245b63edd88ec4005f1afc40f3daafebae246c3`
- Local tag: `checkpoint/calendar-before-contrast-20261106`
- Deployment lama: `dpl_2HNucG8b6LWud7UrRk42stJ6bM5Z`
- URL lama: https://interpretasync-qtqy2jaqv-secretiveploters-projects.vercel.app

## Undo tampilan live dengan cepat
Dalam checkout yang terhubung ke project Vercel interpretasync:

```powershell
vercel rollback https://interpretasync-qtqy2jaqv-secretiveploters-projects.vercel.app --yes
```

Perintah rollback dicek melalui `vercel rollback --help`; tidak dijalankan saat membuat checkpoint. Pastikan status Ready serta alias app.ichikara.co.id sesudah rollback. Source GitHub perlu disinkronkan juga agar deploy berikutnya tidak menerapkan kembali perubahan yang dibatalkan.

## Mengembalikan source kalender saja
Buat branch dari main terbaru, lalu restore hanya file kalender berikut dari checkpoint:

```powershell
git fetch origin
git switch -c codex/undo-calendar-readability origin/main
git restore --source=origin/codex/checkpoint-calendar-before-contrast-20261106 -- src/pages/CalendarPage.jsx src/components/calendar/MonthGrid.jsx src/components/calendar/CalendarGrid.jsx src/components/calendar/EventBlock.jsx src/components/calendar/TodayDutyHighlights.jsx
npm run build
git add src/pages/CalendarPage.jsx src/components/calendar/MonthGrid.jsx src/components/calendar/CalendarGrid.jsx src/components/calendar/EventBlock.jsx src/components/calendar/TodayDutyHighlights.jsx
git commit -m "Restore calendar presentation checkpoint"
```

Publish commit rollback dengan alur GitHub/Vercel yang sama. `calendarColors.js` dapat dibiarkan tanpa dipakai. Prosedur ini tidak menghapus commit atau menimpa perubahan di halaman database interpreter. Tidak ada perubahan schema, jadwal, fee, avatar atau warna master interpreter dalam revisi kalender ini.

## Perubahan visual
Palet solid kontras dengan warna teks hitam/putih dipilih menurut luminansi, pemetaan per interpreter konsisten pada bulan/minggu/highlight. Angka tanggal20px, batas kotak jelas, nama+judul+jam membungkus tanpa ellipsis. Baris kalender mengikuti isi; hanya4/5/6 minggu yang benar-benar memuat tanggal bulan dipakai. Semua jadwal tetap dalam DOM, tanpa +N tersembunyi. Kalender memiliki area scroll sendiri dan mode layar penuh; bulan sangat padat tetap dapat memerlukan scroll agar teks12px terbaca. Highlight hari ini dapat dibuka dari ringkasan sehingga ruang bulan lebih besar. Default view bulanan. Perbaikan import toISODate juga menjaga tombol tambah jadwal bekerja.

## Verifikasi
Palet48 warna diuji unik, masing-masing memenuhi kontras teks minimal4.5:1. Mapping tidak bergantung urutan input object. Dua tes kalender dan sembilan tes database interpreter lolos. Browser lokal memakai salinan baca-saja115 jadwal November2026: semua115 event dirender, tanggal30 ada, angka tanggal20px dan border1px. Root overflow0 di390/1024/1630px; gulir horizontal sengaja terbatas pada area kalender. Fullscreen/Escape, navigasi bulan, dan dialog Tambah Jadwal diuji tanpa menyimpan data produksi. Header tanggal sticky mempertahankan konteks tanggal ketika minggu tergulir; judge screenshot independen mengonfirmasi tidak ada overlap.
