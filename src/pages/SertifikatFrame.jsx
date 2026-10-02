import React from 'react';
import { useLocation } from 'react-router-dom';

export default function SertifikatFrame() {
    const location = useLocation();

    // Memilih file HTML mana yang akan dimuat berdasarkan Route saat ini
    let srcFile = '/sertifikat/index.html';
    if (location.pathname.includes('/sinkronisasi')) {
        srcFile = '/sertifikat/mass.html';
    } else if (location.pathname.includes('/kalibrasi')) {
        srcFile = '/sertifikat/adjust.html';
    }

    return (
        <div className="w-full h-full overflow-hidden bg-neutral-50 relative">
            <iframe
                src={srcFile}
                title="Modul Sertifikat"
                className="absolute top-0 left-0 w-full h-full border-0 outline-none"
            />
        </div>
    )
}
