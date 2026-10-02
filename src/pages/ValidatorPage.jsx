import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { jsPDF } from 'jspdf';
import { Search, CheckCircle, Download, XCircle } from 'lucide-react';

export default function ValidatorPage() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(false);

    // Search Data in Supabase
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            // Endpoint publik hanya mengembalikan field yang diperlukan validator.
            const { data, error: invokeError } = await supabase.functions.invoke('certificate-verify', {
                body: { nomor: query.trim() },
            });
            if (invokeError) throw invokeError;
            if (!data?.certificate) {
                setError('Sertifikat tidak ditemukan. Periksa kembali Nomor Sertifikat Anda.');
                return;
            }
            setResult(data.certificate);
        } catch (err) {
            setError('Gagal menghubungi server verifikasi: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!result) return;
        setDownloading(true);

        try {
            // SVG Processing helpers (porting from index.html)
            const PRE_PROCESS = (text) => {
                let t = text.replace(/\{\{ A<\/text>(\s*<text\b[^>]*>) \}\}<\/text>(\s*<text\b[^>]*>)mat Baik(<\/text>)/, `{{ Amat Baik }}</text>$1</text>$2$3`);
                t = t.replace(/\{\{([^<}]*)<\/text>(\s*<text\b[^>]*>)\s*([^<}]*\}\})/g, (_, p1, tag, p2) => `</text>${tag}{{${p1}${p2}`);
                return t;
            };

            const REPLACE = (doc, map) => {
                const textEls = doc.getElementsByTagName('text');
                const centerKeys = new Set(['NAMA PESERTA', 'NAMA', 'predikat', 'Level Bahasa Jepang', 'lama Waktu Belajar', 'lulus/ tidak lulus', 'lulus/tidak', 'Nomor Sertifikat 1', 'Nomor Sertifikat 2', 'Tempat dan Tanggal Lahir Peserta']);
                for (const el of textEls) {
                    if (el.closest('defs')) continue;
                    for (const [key, value] of Object.entries(map)) {
                        const escaped = key.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
                        const re = new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`, 'gi');
                        const nodes = [];
                        el.childNodes.forEach(n => { if (n.nodeType === 3) nodes.push(n) });
                        el.querySelectorAll('tspan').forEach(t => t.childNodes.forEach(n => { if (n.nodeType === 3) nodes.push(n) }));

                        let matched = false;
                        nodes.forEach(n => {
                            if (re.test(n.textContent)) { n.textContent = n.textContent.replace(re, value || ''); matched = true }
                        });

                        if (matched && centerKeys.has(key)) {
                            const xAttr = parseFloat(el.getAttribute('x') || 0);
                            if (!isNaN(xAttr)) {
                                el.setAttribute('text-anchor', 'middle');
                                el.querySelectorAll('tspan').forEach(t => { if (t.hasAttribute('x')) t.setAttribute('x', xAttr) });
                            }
                        }
                    }
                }
            };

            // 1. Fetch raw SVG
            const [frontRes, backRes] = await Promise.all([
                fetch('/sertifikat/front.svg'),
                fetch('/sertifikat/back.svg')
            ]);

            const fText = PRE_PROCESS(await frontRes.text());
            const bText = PRE_PROCESS(await backRes.text());

            const fDoc = new DOMParser().parseFromString(fText, 'image/svg+xml');
            const bDoc = new DOMParser().parseFromString(bText, 'image/svg+xml');

            // Font Patch
            [fDoc, bDoc].forEach(d => {
                const style = d.querySelector('style')
                if (style) {
                    let css = style.textContent.replace(/font-family:'Barlow Condensed SemiBold'/g, "font-family:'Barlow Condensed'");
                    css = css.replace(/font-family:'Barlow Condensed Medium'/g, "font-family:'Barlow Condensed'");
                    style.textContent = css;
                }
            });

            // Photo Inject (Look up Supabase Storage)
            const photoNodes = fDoc.querySelectorAll('image');
            for (const el of photoNodes) {
                const href = el.getAttribute('href') || el.getAttribute('xlink:href') || '';
                if (href.includes('ImgID3')) {
                    // URL foto ditandatangani server dan hanya hidup singkat.
                    const pUrl = result.photo_url;
                    if (!pUrl) continue;
                    el.setAttribute('href', pUrl);
                    // We also need to fetch it to base64 so canvas doesn't get tainted if CORS blocks
                    try {
                        const blob = await fetch(pUrl).then(r => r.blob());
                        const dataUrl = await new Promise(res => {
                            const rd = new FileReader();
                            rd.onload = e => res(e.target.result);
                            rd.readAsDataURL(blob);
                        });
                        el.setAttribute('href', dataUrl);
                    } catch (e) { }
                }
            }

            // Fix background images
            const fixImgPaths = async (doc, folder) => {
                const els = Array.from(doc.querySelectorAll('image'));
                await Promise.all(els.map(async el => {
                    const href = el.getAttribute('href') || el.getAttribute('xlink:href') || '';
                    if (href.startsWith('data:')) return;
                    const basename = href.split('/').pop().split('\\').pop();
                    const path = `/sertifikat/${folder}${basename}`;
                    try {
                        const blob = await fetch(path).then(r => r.blob());
                        const dataUrl = await new Promise(res => {
                            const rd = new FileReader();
                            rd.onload = e => res(e.target.result);
                            rd.readAsDataURL(blob);
                        });
                        el.setAttribute('href', dataUrl);
                    } catch (e) {
                        el.setAttribute('href', path);
                    }
                }));
            };

            await fixImgPaths(fDoc, 'front_images/');
            await fixImgPaths(bDoc, 'back_images/');

            // Apply Placeholders
            REPLACE(fDoc, {
                'NAMA PESERTA': result.nama_peserta,
                'Nomor Sertifikat 2': result.nomor,
                'Nomor Sertifikat 1': 'No.DK.01.03/278/IX/2024',
                'Tempat dan Tanggal Lahir Peserta': result.ttl,
                'Level Bahasa Jepang': result.level,
                'predikat': result.predikat,
                'lama Waktu Belajar': result.lama,
                'lulus/ tidak lulus': result.lulus,
                'Tanggal Selesai Kursus': result.tgl_selesai,
                'Tanggal terbit Sertifikat': result.tgl_terbit,
            });

            REPLACE(bDoc, {
                'NAMA': result.nama_peserta,
                'Tanggal terbit sertifikat': result.tgl_terbit,
                'lulus/tidak': result.lulus,
                'nilai1': result.n1, 'nilai2': result.n2, 'nilai3': result.n3, 'nilai4': result.n4, 'nilai5': result.n5
            });

            // Add adj IDs and apply localStorage alignments
            const assignId = (doc) => {
                const seen = new Map();
                doc.querySelectorAll('text, image').forEach(el => {
                    let base = (el.tagName.toLowerCase() === 'image')
                        ? 'i:' + (el.getAttribute('href') || '').split('/').pop().slice(0, 40)
                        : 't:' + (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
                    const cnt = seen.get(base) || 0; seen.set(base, cnt + 1);
                    el.setAttribute('adj-id', cnt === 0 ? base : `${base}__${cnt}`);
                })
            }
            assignId(fDoc); assignId(bDoc);

            const applyAdj = async (el, page) => {
                const saved = JSON.parse(localStorage.getItem('ich_adj') || '{}');
                let PageData = saved[page];
                if (!PageData) return;

                // Note: Since this is frontend, they must have the adjustments synced or pre-baked!
                // But if it's the client's PC, they likely won't have local adjustments. Admin has them.
                // Still honoring it if it exists.
                Object.entries(PageData).forEach(([adjId, adj]) => {
                    const node = el.querySelector(`[adj-id="${adjId}"]`);
                    if (node) {
                        const b = node.getBBox();
                        const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
                        const tx = (adj.dx + cx * (1 - adj.scale)).toFixed(2);
                        const ty = (adj.dy + cy * (1 - adj.scale)).toFixed(2);
                        const t = `translate(${tx},${ty}) scale(${adj.scale})`;
                        const o = node.getAttribute('transform') || '';
                        node.setAttribute('transform', o ? `${t} ${o}` : t);
                    }
                })
            }

            // Import to invisible div for getBbox
            const container = document.createElement('div');
            container.style.position = 'fixed'; container.style.opacity = '0.01'; container.style.zIndex = '-99';
            document.body.appendChild(container);

            const fEl = document.importNode(fDoc.documentElement, true);
            const bEl = document.importNode(bDoc.documentElement, true);
            [fEl, bEl].forEach(n => { n.removeAttribute('width'); n.removeAttribute('height'); n.style.width = '100%' });

            container.appendChild(fEl); container.appendChild(bEl);
            await new Promise(r => requestAnimationFrame(r));
            await applyAdj(fEl, 'front');
            await applyAdj(bEl, 'back');

            // Draw to Canvas -> PDF
            const svgToC = async (node) => {
                const W = 2339, H = 1654;
                const blob = new Blob([new XMLSerializer().serializeToString(node)], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const cvs = document.createElement('canvas');
                cvs.width = W; cvs.height = H;
                const ctx = cvs.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
                return new Promise(r => {
                    const img = new Image();
                    img.onload = () => { ctx.drawImage(img, 0, 0, W, H); URL.revokeObjectURL(url); r(cvs) };
                    img.src = url;
                })
            }

            const cv1 = await svgToC(fEl);
            const cv2 = await svgToC(bEl);
            document.body.removeChild(container);

            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            pdf.addImage(cv1.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210);
            pdf.addPage();
            pdf.addImage(cv2.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210);

            pdf.save(`Sertifikat_${result.nama_peserta.replace(/[^\w\s-]/g, '_')}.pdf`);

        } catch (err) {
            alert("Gagal men-download PDF: " + err.message);
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div className="min-h-screen bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8 flex flex-col items-center">

            <div className="text-center max-w-2xl w-full mb-10">
                <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight sm:text-4xl">
                    Validator Sertifikat Ichikara
                </h1>
                <p className="mt-4 text-lg text-neutral-500">
                    Masukkan nomor sertifikat unik untuk memverifikasi keaslian sertifikat dan melihat perincian kompetensi kelulusan peserta.
                </p>
            </div>

            <div className="max-w-xl w-full bg-white shadow-xl rounded-2xl overflow-hidden border border-neutral-100">
                <div className="p-8">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-neutral-400" />
                            </div>
                            <input
                                type="text"
                                className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-neutral-300 rounded-lg py-3 px-4 bg-neutral-50 border outline-none transition-all placeholder:text-neutral-400"
                                placeholder="Contoh: ICH-2026-042"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Mencari...' : 'Periksa'}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-6 rounded-lg bg-red-50 p-4 border border-red-100 flex items-start">
                            <XCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {result && (
                        <div className="mt-8">
                            <div className="flex items-center justify-between border-b pb-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-800">{result.nama_peserta}</h2>
                                    <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        Sertifikat Valid & Resmi ({result.nomor})
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${result.lulus?.toUpperCase() === 'LULUS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                        {result.lulus}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                                    <p className="text-xs text-neutral-500 font-medium uppercase">Level Bahasa</p>
                                    <p className="font-semibold text-neutral-900">{result.level || '-'}</p>
                                </div>
                                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                                    <p className="text-xs text-neutral-500 font-medium uppercase">Predikat Kelulusan</p>
                                    <p className="font-semibold text-blue-700">{result.predikat || '-'}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Rincian Nilai (Skor 0-100)</h3>
                                <div className="grid grid-cols-5 gap-2 text-center">
                                    {[
                                        { label: 'Nilai 1', val: result.n1 },
                                        { label: 'Nilai 2', val: result.n2 },
                                        { label: 'Nilai 3', val: result.n3 },
                                        { label: 'Nilai 4', val: result.n4 },
                                        { label: 'Nilai 5', val: result.n5 },
                                    ].map((item, idx) => (
                                        <div key={idx} className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                                            <p className="text-[10px] text-blue-600 font-bold uppercase">{item.label}</p>
                                            <p className="text-lg font-black text-blue-900 mt-1">{item.val || '-'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="w-full flex justify-center items-center gap-2 px-4 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 transition-all"
                            >
                                {downloading ? (
                                    <span className="flex items-center gap-2">Memproses File (Harap Tunggu)... <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div></span>
                                ) : (
                                    <><Download className="w-4 h-4" /> Download PDF Sertifikat</>
                                )}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div >
    );
}
