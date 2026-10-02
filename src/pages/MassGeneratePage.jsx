import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../services/supabase';
import { Upload, FileSpreadsheet, Image as ImageIcon, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';

const PREDIKAT_RANGES = [
    { min: 100, label: 'Sempurna' },
    { min: 91, label: 'Amat Sangat Baik' },
    { min: 86, label: 'Amat Baik' },
    { min: 71, label: 'Baik' },
    { min: 60, label: 'Cukup' },
    { min: 0, label: 'Kurang' }
];

export default function MassGeneratePage() {
    const [excelData, setExcelData] = useState([]);
    const [photoFiles, setPhotoFiles] = useState({});
    const [logs, setLogs] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [excelName, setExcelName] = useState('');
    const [photoCount, setPhotoCount] = useState(0);

    const fileExcelRef = useRef(null);
    const filePhotosRef = useRef(null);

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [...prev, { id: Date.now() + Math.random(), msg, type }]);
    };

    const getNominalValue = (row, possibleKeys) => {
        for (const k of possibleKeys) {
            if (row[k] !== undefined) return String(row[k]);
        }
        return "";
    };

    const calculatePredikat = (n1, n2, n3, n4, n5) => {
        const scores = [n1, n2, n3, n4, n5].map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (scores.length === 0) return "";
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        for (const p of PREDIKAT_RANGES) {
            if (avg >= p.min) return p.label;
        }
        return "Kurang";
    };

    const downloadTemplate = () => {
        const data = [
            ["Nama", "No Sertifikat", "TTL", "Level", "Lama Belajar", "Lulus/Tidak", "Tanggal Selesai", "Tanggal Terbit", "Nilai 1", "Nilai 2", "Nilai 3", "Nilai 4", "Nilai 5", "Predikat"],
            ["Dimas Pratama", "ICH-2026-001", "Jakarta, 1 Januari 2000", "N5", "3 Bulan", "LULUS", "30 Juni 2026", "25 Juni 2026", "85", "90", "75", "80", "95", ""],
            ["Andi Kurniawan", "ICH-2026-002", "Surabaya, 5 Februari 2001", "N4", "6 Bulan", "LULUS", "30 Juni 2026", "25 Juni 2026", "60", "65", "70", "68", "75", ""]
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 16 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data_Siswa");
        XLSX.writeFile(wb, "Template_Data_Siswa.xlsx");
    };

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setExcelName(file.name);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const parsedData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
            setExcelData(parsedData);
            addLog(`Berhasil membaca Excel. Ditemukan ${parsedData.length} baris data siswa.`, 'success');
        } catch (err) {
            addLog('Gagal membaca Excel: ' + err.message, 'error');
        }
    };

    const handlePhotosUpload = (e) => {
        const files = e.target.files;
        if (!files.length) return;
        const newPhotos = {};
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const basename = file.name.replace(/\.[^/.]+$/, "").trim();
            newPhotos[basename.toLowerCase()] = file;
        }
        setPhotoFiles(newPhotos);
        setPhotoCount(Object.keys(newPhotos).length);
        addLog(`${files.length} foto disiapkan dalam memori.`, 'success');
    };

    const startMassGeneration = async () => {
        setIsProcessing(true);
        addLog('Modul tersambung. Memulai proses sinkronisasi database secara native...', 'info');

        try {
            let successCount = 0;
            let failedCount = 0;

            for (let i = 0; i < excelData.length; i++) {
                const row = excelData[i];
                const nama = getNominalValue(row, ['Nama', 'Nama_Siswa']);
                if (!nama) continue;

                const noSertif = getNominalValue(row, ['No Sertifikat', 'No_Sertifikat', 'Nomor Sertifikat']);
                const ttl = getNominalValue(row, ['TTL', 'Tempat Tanggal Lahir']);
                const level = getNominalValue(row, ['Level']);
                const lama = getNominalValue(row, ['Lama Belajar', 'LamaWaktuBelajar']);
                const lulus = getNominalValue(row, ['Lulus/Tidak', 'Kelulusan', 'Status']);
                const selesai = getNominalValue(row, ['Tanggal Selesai', 'Tgl Selesai']);
                const terbit = getNominalValue(row, ['Tanggal Terbit', 'Tgl Terbit']);

                const n1 = getNominalValue(row, ['Nilai 1', 'Nilai1', 'N1']);
                const n2 = getNominalValue(row, ['Nilai 2', 'Nilai2', 'N2']);
                const n3 = getNominalValue(row, ['Nilai 3', 'Nilai3', 'N3']);
                const n4 = getNominalValue(row, ['Nilai 4', 'Nilai4', 'N4']);
                const n5 = getNominalValue(row, ['Nilai 5', 'Nilai5', 'N5']);

                // Bug #9 fix: ambil Predikat dari Excel jika ada, kalau tidak ada baru hitung otomatis
                const predikatFromExcel = getNominalValue(row, ['Predikat', 'predikat']);
                const predikat = predikatFromExcel || calculatePredikat(n1, n2, n3, n4, n5);

                addLog(`[${i + 1}/${excelData.length}] Memproses data: ${nama}`, 'info');

                const payload = {
                    nomor: noSertif,
                    nama_peserta: nama,
                    ttl, level, lama, predikat, n1, n2, n3, n4, n5, lulus,
                    tgl_selesai: selesai, tgl_terbit: terbit
                };

                const { error } = await supabase
                    .from('sertifikat')
                    .upsert(payload, { onConflict: 'nomor' });

                if (error) {
                    addLog(`Gagal sinkron data utama ${nama}: ${error.message}`, 'error');
                    failedCount++;
                    continue;
                }

                successCount++;

                // Bug #8 fix: lookup foto pakai lowercase, path storage pakai nama asli
                const namaLower = nama.trim().toLowerCase();
                const photoFile = photoFiles[namaLower];
                if (photoFile) {
                    try {
                        addLog(`Mengunggah foto peserta: ${nama}...`, 'info');
                        const ext = photoFile.name.split('.').pop();
                        const safeName = nama.replace(/[^\w\s-]/g, '_').trim();
                        // Ganti karakter / di nomor sertifikat agar aman sebagai filename
                        const safeNomor = noSertif.replace(/[/\\]/g, '_');
                        const filePath = `${safeName}_${safeNomor}.${ext}`;

                        const { error: storageErr } = await supabase.storage
                            .from('sertifikat_photos')
                            .upload(filePath, photoFile, { upsert: true });

                        if (storageErr) throw storageErr;
                        addLog(`Foto berhasil diunggah: ${filePath}`, 'success');
                    } catch (e) {
                        addLog(`Peringatan - Gagal menyimpan foto ${nama}: ${e.message}`, 'error');
                    }
                } else {
                    addLog(`Foto untuk "${nama}" tidak ditemukan. Pastikan nama file foto persis sama dengan kolom Nama di Excel.`, 'warning');
                }
            }

            addLog(`=== SELESAI SINKRONISASI ===`, 'success');
            addLog(`✅ Berhasil: ${successCount} data, ❌ Gagal: ${failedCount} data`, 'info');
        } catch (err) {
            addLog('Kesalahan Sistem Fatal: ' + err.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6 text-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700/50">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Generate Massal</h1>
                    <p className="text-sm text-slate-400 mt-1">Impor data dari .xlsx untuk sinkronisasi Database Validator</p>
                </div>
                <button onClick={downloadTemplate} className="mt-4 sm:mt-0 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition font-medium shadow-lg shadow-emerald-900/20 w-fit">
                    <Download size={16} /> Download Template Excel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* EXCEL UPLOAD */}
                <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
                    <div className="flex items-center gap-3 mb-4 text-white">
                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                            <FileSpreadsheet size={20} />
                        </div>
                        <h2 className="font-medium text-lg">1. Upload Data Excel</h2>
                    </div>

                    <label
                        htmlFor="fileExcel"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-xl cursor-pointer hover:bg-slate-700/50 hover:border-indigo-500 transition-colors"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <Upload className="w-8 h-8 mb-3 text-slate-400" />
                            <p className="text-sm text-slate-300 font-medium">Klik untuk memilih file Excel</p>
                            <p className="text-xs text-slate-500 mt-1">.xlsx, .csv</p>
                        </div>
                        <input id="fileExcel" type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleExcelUpload} />
                    </label>
                    <div className="mt-3 text-sm text-center font-medium pr-1 text-indigo-300">
                        {excelName ? `File dimuat: ${excelName} (${excelData.length} baris)` : 'Belum ada file Excel dipilih'}
                    </div>
                </div>

                {/* PHOTO UPLOAD */}
                <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
                    <div className="flex items-center gap-3 mb-4 text-white">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                            <ImageIcon size={20} />
                        </div>
                        <h2 className="font-medium text-lg">2. Upload Pas Foto (Opsi)</h2>
                    </div>

                    <label
                        htmlFor="filePhotos"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-xl cursor-pointer hover:bg-slate-700/50 hover:border-emerald-500 transition-colors"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <Upload className="w-8 h-8 mb-3 text-slate-400" />
                            <p className="text-sm text-slate-300 font-medium">Klik untuk blok semua file foto</p>
                            <p className="text-xs text-slate-500 mt-1">Pastikan nama foto persis seperti di kolom Nama Excel! (.jpg/.png)</p>
                        </div>
                        <input id="filePhotos" type="file" multiple accept="image/*" className="hidden" onChange={handlePhotosUpload} />
                    </label>
                    <div className="mt-3 text-sm text-center font-medium pr-1 text-emerald-300">
                        {photoCount > 0 ? `${photoCount} file foto dimuat` : 'Belum ada file foto dipilih'}
                    </div>
                </div>
            </div>

            {/* SYNCHRONIZE BUTTON */}
            <button
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-lg transition-colors shadow-lg shadow-indigo-900/20 mt-4"
                onClick={startMassGeneration}
                disabled={excelData.length === 0 || isProcessing}
            >
                {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
                {isProcessing ? 'MENSINKRONIKAN DATA...' : 'MULAI SINKRONISASI DATABASE'}
            </button>

            {/* TERMINAL LOG */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mt-6 shadow-inner">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                    <span className="ml-2 text-xs text-slate-500 font-mono font-bold tracking-widest">LOG SISTEM</span>
                </div>
                <div className="p-4 h-64 overflow-y-auto font-mono text-sm space-y-2">
                    {logs.map(log => (
                        <div key={log.id} className="flex items-start gap-2">
                            <span className="text-slate-600 select-none">›</span>
                            <span className={
                                log.type === 'error' ? 'text-rose-400' :
                                    log.type === 'success' ? 'text-emerald-400' :
                                        log.type === 'warning' ? 'text-amber-400' :
                                            'text-indigo-200'
                            }>
                                {log.msg}
                            </span>
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-slate-600 opacity-50 select-none">Menunggu file dimuat...</div>}
                </div>
            </div>

        </div>
    );
}
