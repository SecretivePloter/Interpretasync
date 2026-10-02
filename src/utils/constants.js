// Konstanta global aplikasi Ichikara.

// Label hari (urutan Minggu-Sabtu sesuai requirement UI).
export const DAY_LABELS = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']
export const DAY_LABELS_LONG = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
]

// Konfigurasi grid kalender.
export const CALENDAR_START_HOUR = 6 // 06:00
export const CALENDAR_END_HOUR = 21 // 21:00
export const HOUR_HEIGHT = 44 // tinggi 1 jam dalam px; 44×15jam=660px agar 06-21 muat tanpa scroll

// Rentang jam untuk event "Seharian" (All Day). Tidak ada kolom DB khusus:
// event seharian = jam mulai/selesai sama persis dengan rentang penuh kalender.
// Dipakai EventModal (auto-isi) & EventBlock (deteksi label "Seharian").
export const ALL_DAY_START = `${String(CALENDAR_START_HOUR).padStart(2, '0')}:00`
export const ALL_DAY_END = `${String(CALENDAR_END_HOUR).padStart(2, '0')}:00`

// Status order beserta metadata tampilan.
// Urutan: Quotation -> Waiting for Approval -> Order -> Invoice -> Paid -> Complete.
// Overdue adalah status pengecualian (otomatis dari Invoice yang lewat jatuh tempo).
export const ORDER_STATUSES = [
  { key: 'quotation', label: 'Quotation' },
  { key: 'waiting_for_approval', label: 'Waiting for Approval' },
  { key: 'order', label: 'Order' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'paid', label: 'Paid' },
  { key: 'complete', label: 'Complete' },
  { key: 'overdue', label: 'Overdue' },
]

// Kolom Kanban (overdue tidak punya kolom, hanya badge di tabel).
export const KANBAN_COLUMNS = [
  { key: 'quotation', label: 'Quotation' },
  { key: 'waiting_for_approval', label: 'Waiting for Approval' },
  { key: 'order', label: 'Order' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'paid', label: 'Paid' },
  { key: 'complete', label: 'Complete' },
]

// Status yang dianggap "sudah dibayar" vs "belum dibayar" (untuk ringkasan keuangan).
export const PAID_STATUSES = ['paid', 'complete']
export const UNPAID_STATUSES = ['waiting_for_approval', 'invoice', 'overdue']

// Termin pembayaran default (hari) untuk menghitung estimasi jatuh tempo invoice.
export const PAYMENT_TERM_DAYS = 30

// Item navigasi sidebar (ikon = nama komponen lucide-react).
export const NAV_ITEMS = [
  { path: '/kalender', label: 'Kalender', icon: 'CalendarDays' },
  { path: '/order', label: 'Order', icon: 'ClipboardList' },
  { path: '/quotation', label: 'Quotation', icon: 'FileText' },
  { path: '/profil', label: 'Profil', icon: 'Users' },
  { path: '/pengaturan', label: 'Pengaturan', icon: 'Settings' },
]

// Grup navigasi (mendukung section separator di Sidebar).
// roles: daftar role yang boleh melihat grup ini. Tanpa field = semua role.
export const NAV_GROUPS = [
  {
    label: 'Inventaris',
    // Tampil untuk semua role (manajemen & operator)
    items: [
      { path: '/inventaris', label: 'Inventaris', icon: 'Package' },
    ],
  },
  {
    label: 'Operasional',
    roles: ['manajemen'],
    items: [
      { path: '/kalender', label: 'Kalender', icon: 'CalendarDays' },
      { path: '/order', label: 'Order', icon: 'ClipboardList' },
      { path: '/quotation', label: 'Quotation', icon: 'FileText' },
      { path: '/profil', label: 'Profil', icon: 'Users' },
      { path: '/pengaturan', label: 'Pengaturan', icon: 'Settings' },
    ],
  },
  {
    label: 'Sertifikasi',
    roles: ['manajemen'],
    items: [
      { path: '/sertifikat/generator', label: 'Generator Satuan', icon: 'FileText' },
      { path: '/sertifikat/sinkronisasi', label: 'Generate Massal', icon: 'Award' },
      { path: '/sertifikat/galeri', label: 'Galeri Arsip', icon: 'FolderOpen' },
      { path: '/sertifikat/kalibrasi', label: 'Kalibrasi Layout', icon: 'Settings' },
      { path: '/validator', label: 'Portal Validator', icon: 'BookOpen' },
    ]
  },
]

// Kategori inventaris — pilihan tetap, tiap kategori punya tipe default.
// tipe: 'aset' | 'supplies' | 'properti'
export const INVENTORY_KATEGORI = [
  { nama: 'Elektronik', tipe: 'aset', satuan: 'unit' },
  { nama: 'Furnitur & Peralatan', tipe: 'aset', satuan: 'unit' },
  { nama: 'Kendaraan', tipe: 'aset', satuan: 'unit' },
  { nama: 'Buku & Materi', tipe: 'supplies', satuan: 'pcs' },
  { nama: 'ATK', tipe: 'supplies', satuan: 'pcs' },
  { nama: 'Kertas & Percetakan', tipe: 'supplies', satuan: 'rim' },
  { nama: 'Kebersihan & Sanitasi', tipe: 'supplies', satuan: 'pcs' },
  { nama: 'Seragam & Atribut', tipe: 'properti', satuan: 'pcs' },
  { nama: 'Dokumen & Sertifikat', tipe: 'properti', satuan: 'pcs' },
  { nama: 'Lainnya', tipe: null, satuan: 'pcs' },
]

// Spesialisasi umum (untuk dropdown/tag di form interpreter).
export const SPECIALTY_OPTIONS = [
  'Manufaktur',
  'Konstruksi',
  'Food Processing',
  'Pertanian',
  'Perawatan (Kaigo)',
  'Perhotelan',
  'Otomotif',
]

export const JLPT_LEVELS = ['N1', 'N2', 'N3', 'N4', 'N5']

export const PAGE_SIZE = 20 // pagination tabel order

// Domain default untuk konversi username -> email saat login.
export const LOGIN_EMAIL_DOMAIN = 'ichikara.co.id'
