import React, { useState, useEffect } from 'react';
import { Download, Trash2, FileText, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabase';

export default function GaleriSertifikat() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [generatingMap, setGeneratingMap] = useState({});

    const fetchRecords = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('sertifikat')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRecords(data || []);
        } catch (err) {
            console.error(err);
            setError('Gagal memuat data Sertifikat. Pastikan tabel "sertifikat" sudah ada di Supabase. (' + err.message + ')');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const triggerDownload = (blob, fileName) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const handleDownload = async (record) => {
        setGeneratingMap(prev => ({ ...prev, [record.nomor]: true }));
        const namaLengkap = record.nama_peserta || record.nama || 'Sertifikat';
        const safeName = namaLengkap.replace(/[^\w\s-]/g, '_').trim();
        const safeNomor = (record.nomor || '').replace(/[/\\]/g, '_');
        const pdfFileName = `Sertifikat_${safeName}.pdf`;

        try {
            // 1. Cek apakah PDF fisiknya sudah ada di Storage
            const { data: existData, error: existError } = await supabase
                .storage
                .from('sertifikat_arsip')
                .download(pdfFileName);

            if (!existError && existData) {
                triggerDownload(existData, pdfFileName);
                setGeneratingMap(prev => ({ ...prev, [record.nomor]: false }));
                return;
            }

            // 2. Jika PDF belum ada (misal dari hasil Generate Massal),
            //    maka Auto-Generate secara background menggunakan iframe worker.

            // a. Minta foto peserta dari bucket "sertifikat_photos"
            let photoDataUrl = null;
            const { data: photoList } = await supabase.storage.from('sertifikat_photos').list();
            const photoInfo = photoList?.find(f => f.name.startsWith(`${safeName}_${safeNomor}`));

            if (photoInfo) {
                const { data: photoBlob } = await supabase.storage.from('sertifikat_photos').download(photoInfo.name);
                if (photoBlob) {
                    photoDataUrl = await new Promise(r => {
                        const reader = new FileReader();
                        reader.onload = () => r(reader.result);
                        reader.readAsDataURL(photoBlob);
                    });
                }
            }

            // b. Siapkan hidden iframe worker ke index.html
            let worker = document.getElementById('pdf-worker-iframe');
            if (!worker) {
                worker = document.createElement('iframe');
                worker.id = 'pdf-worker-iframe';
                // PENTING: Jangan gunakan 'display: none' karena browser tidak akan me-render DOM/SVG
                // yang ukuran viewBox-nya bergantung pada layout. Gunakan trik absolute + off-screen.
                worker.style.position = 'absolute';
                worker.style.top = '-9999px';
                worker.style.left = '-9999px';
                worker.style.width = '1200px';
                worker.style.height = '800px';
                worker.style.visibility = 'hidden';
                worker.src = '/sertifikat/index.html';
                document.body.appendChild(worker);
                // Tunggu sampai iframe ter-load
                await new Promise(r => { worker.onload = r; });
            }

            // c. Tangkap pesan balasan dari worker
            const onMessage = (e) => {
                if (e.data?.type === 'WORKER_PDF_DONE' && e.data?.nomor === record.nomor) {
                    window.removeEventListener('message', onMessage);
                    setGeneratingMap(prev => ({ ...prev, [record.nomor]: false }));

                    if (e.data.success) {
                        const a = document.createElement('a');
                        a.href = e.data.pdfDataUrl; // Base64 Data URL dari worker
                        a.download = e.data.fileName;
                        a.click();
                    } else {
                        alert('Gagal auto-generate PDF: ' + (e.data.error || 'Unknown Error'));
                    }
                }
            };
            window.addEventListener('message', onMessage);

            // d. Instruksikan iframe untuk mulai menggambar PDF
            worker.contentWindow.postMessage({
                type: 'WORKER_GENERATE_PDF',
                payload: record,
                photoDataUrl: photoDataUrl
            }, '*');

        } catch (err) {
            alert('Gagal memproses file: ' + err.message);
            setGeneratingMap(prev => ({ ...prev, [record.nomor]: false }));
        }
    };

    const handleDelete = async (record) => {
        const namaLengkap = record.nama_peserta || record.nama || 'Sertifikat';
        const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus data sertifikat untuk ${namaLengkap} (${record.nomor})?\n\nPeringatan: Menghapus data ini juga akan membuat sertifikat tidak valid di menu Cek Keaslian (Validator)!`);
        if (!confirmDelete) return;

        try {
            const { error: dbError } = await supabase
                .from('sertifikat')
                .delete()
                .eq('nomor', record.nomor);

            if (dbError) throw dbError;

            // Hapus fisik storage (opsional/best-effort)
            const safeName = namaLengkap.replace(/[^\w\s-]/g, '_').trim();
            const pdfFileName = `Sertifikat_${safeName}.pdf`;
            await supabase.storage.from('sertifikat_arsip').remove([pdfFileName]).catch(() => { });

            setRecords(prev => prev.filter(r => r.nomor !== record.nomor));
        } catch (err) {
            alert('Gagal menghapus data: ' + err.message);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto text-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Galeri Data Sertifikat</h1>
                    <p className="text-slate-400 text-sm">
                        Menampilkan semua data sertifikat yang terdaftar di sistem.
                        Klik "Download PDF" untuk mendapatkan salinan fisik. <strong>File massal akan langsung di-generate otomatis saat didownload.</strong>
                    </p>
                </div>

                <button
                    onClick={fetchRecords}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 text-white rounded-lg transition-colors text-sm font-medium"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Memuat...' : 'Muat Ulang Data'}
                </button>
            </div>

            {error ? (
                <div className="p-4 bg-red-900/30 border border-red-800 rounded-xl mb-6 flex gap-3 text-red-200">
                    <AlertCircle className="shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            ) : loading && records.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                    <RefreshCw size={32} className="animate-spin mb-4" />
                    <p>Memuat database sertifikat...</p>
                </div>
            ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                    <FileText size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium text-slate-300">Belum ada Data Sertifikat</p>
                    <p className="text-sm text-center max-w-sm mt-2">
                        Silakan buat sertifikat melalui <strong>Generator Satuan</strong> atau <strong>Sinkronisasi Excel Massal</strong>.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {records.map((record) => {
                        const namaLengkap = record.nama_peserta || record.nama || 'Tanpa Nama';
                        const isGenerating = generatingMap[record.nomor];

                        return (
                            <div key={record.nomor} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all group flex flex-col relative overflow-hidden">

                                {isGenerating && (
                                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-indigo-400">
                                        <RefreshCw size={24} className="animate-spin mb-2" />
                                        <span className="text-xs font-medium px-4 text-center">Meracik PDF<br />Otomatis...</span>
                                    </div>
                                )}

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-slate-200 text-sm truncate" title={namaLengkap}>
                                            {namaLengkap}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1 truncate" title={record.nomor}>
                                            {record.nomor}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {record.asal_sekolah || '-'} &bull; <strong>{record.predikat || '-'}</strong>
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-800 flex gap-2">
                                    <button
                                        onClick={() => handleDownload(record)}
                                        disabled={isGenerating}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg transition-colors text-xs font-medium"
                                    >
                                        <Download size={14} />
                                        Download PDF
                                    </button>
                                    <button
                                        onClick={() => handleDelete(record)}
                                        disabled={isGenerating}
                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/40 disabled:opacity-50 text-red-400 rounded-lg transition-colors text-xs font-medium border border-red-900/50"
                                        title="Hapus Data & Arsip"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
