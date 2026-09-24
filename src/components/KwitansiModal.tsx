import React, { useState } from 'react';
import { Tenant } from '../types';
import {
  formatRupiah,
  terbilang,
  formatIndoDate,
  generateKwitansiNumber,
  createWhatsAppReceiptUrl,
} from '../utils/formatters';
import { Printer, MessageCircle, X, FileDown, CheckCircle2, HelpCircle } from 'lucide-react';

interface KwitansiModalProps {
  tenant: Tenant | null;
  onClose: () => void;
}

export const KwitansiModal: React.FC<KwitansiModalProps> = ({ tenant, onClose }) => {
  const [showPdfTip, setShowPdfTip] = useState(false);

  if (!tenant) return null;

  const noKwitansi = generateKwitansiNumber(tenant.id);
  const tanggalHariIni = formatIndoDate(new Date().toISOString().split('T')[0]);
  const waUrl = createWhatsAppReceiptUrl(tenant);

  const handlePrint = () => {
    // Set temporary document title so browser uses clean filename when saving as PDF
    const originalTitle = document.title;
    const sanitizedName = tenant.nama.replace(/[^a-zA-Z0-9_-]/g, '_');
    document.title = `Kwitansi_MM_Space_${noKwitansi}_${sanitizedName}`;

    window.print();

    // Restore title after print dialog closes
    const restoreHandler = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreHandler);
    };
    window.addEventListener('afterprint', restoreHandler);

    setTimeout(() => {
      document.title = originalTitle;
    }, 2000);
  };

  return (
    <div className="kwitansi-modal-backdrop fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="kwitansi-modal-container bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-gray-200 my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* KWITANSI PRINT AREA (DICETAK ATAU DISIMPAN KE PDF) */}
        <div
          id="receiptPrintArea"
          className="p-6 bg-white border border-gray-300 rounded-xl space-y-4 font-sans text-gray-800 relative overflow-hidden"
        >
          {/* WATERMARK STEMPEL RESMI UNTUK STATUS LUNAS */}
          {tenant.status === 'Lunas' && (
            <div className="absolute right-12 top-28 pointer-events-none opacity-20 rotate-[-18deg] select-none border-4 border-emerald-700 text-emerald-800 font-black text-3xl px-4 py-1.5 rounded-lg tracking-widest uppercase">
              LUNAS
            </div>
          )}

          {/* HEADER KOP MM SPACE */}
          <div className="flex items-center justify-between border-b-2 border-gray-900 pb-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                <svg viewBox="0 0 500 350" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M70 190 L220 90 L300 145 L300 80 L350 80 L350 180 L420 180"
                    stroke="#C59B6C"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M100 270 V150 L160 230 L220 150 V270 M260 270 V150 L320 230 L380 150 V270"
                    stroke="#1E293B"
                    strokeWidth="30"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line x1="50" y1="270" x2="430" y2="270" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h2 className="font-extrabold text-gray-900 text-xl tracking-tight leading-none">MM SPACE</h2>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mt-0.5">
                  PROPERTY RENTALS & MANAGEMENT
                </p>
                <p className="text-[9px] text-gray-500 mt-1">
                  Jl. Pertanian Wosi, Manokwari, Papua Barat | WhatsApp: 0812 888 19743
                </p>
                <p className="text-[9px] text-gray-500">
                  Email: mm.disewain@gmail.com | Rekening: BRI 035301000763566
                </p>
              </div>
            </div>
          </div>

          {/* JUDUL DAN NOMOR */}
          <div className="text-center space-y-0.5 pt-1">
            <h1 className="font-extrabold text-gray-900 text-base uppercase tracking-wider">
              KWITANSI RESMI PEMBAYARAN
            </h1>
            <p className="text-xs font-mono font-semibold text-gray-600">
              No: {noKwitansi}
            </p>
          </div>

          {/* RINCIAN KWITANSI */}
          <div className="text-xs space-y-2.5 text-gray-800 pt-2 border-t border-dashed border-gray-200">
            <div className="flex">
              <span className="w-36 font-semibold text-gray-600 shrink-0">Telah Diterima Dari</span>
              <span className="w-4 text-center shrink-0">:</span>
              <span className="flex-1 font-bold text-gray-900">{tenant.nama}</span>
            </div>
            {tenant.nik && (
              <div className="flex">
                <span className="w-36 font-semibold text-gray-600 shrink-0">No. Identitas / NIK</span>
                <span className="w-4 text-center shrink-0">:</span>
                <span className="flex-1 font-mono text-gray-700">{tenant.nik}</span>
              </div>
            )}
            <div className="flex">
              <span className="w-36 font-semibold text-gray-600 shrink-0">Uang Sejumlah</span>
              <span className="w-4 text-center shrink-0">:</span>
              <span className="flex-1 italic bg-amber-50 px-2.5 py-1 rounded border border-amber-200 font-medium text-amber-950">
                "{terbilang(tenant.tarif).trim()} Rupiah"
              </span>
            </div>
            <div className="flex">
              <span className="w-36 font-semibold text-gray-600 shrink-0">Untuk Pembayaran</span>
              <span className="w-4 text-center shrink-0">:</span>
              <span className="flex-1 font-semibold text-gray-900">
                Sewa {tenant.unit} ({tenant.durasi} {tenant.satuan})
              </span>
            </div>
            <div className="flex">
              <span className="w-36 font-semibold text-gray-600 shrink-0">Periode Sewa</span>
              <span className="w-4 text-center shrink-0">:</span>
              <span className="flex-1 font-medium text-gray-800">
                {formatIndoDate(tenant.tglMulai)} s/d {formatIndoDate(tenant.jatuhTempo)}
              </span>
            </div>
            {tenant.plat && tenant.plat !== '-' && (
              <div className="flex">
                <span className="w-36 font-semibold text-gray-600 shrink-0">Plat / Keterangan</span>
                <span className="w-4 text-center shrink-0">:</span>
                <span className="flex-1 font-medium text-gray-800">{tenant.plat}</span>
              </div>
            )}
            <div className="flex">
              <span className="w-36 font-semibold text-gray-600 shrink-0">Status Deposit</span>
              <span className="w-4 text-center shrink-0">:</span>
              <span className={`flex-1 font-bold ${tenant.depositPaid ? 'text-emerald-700' : 'text-rose-600'}`}>
                {tenant.depositPaid
                  ? `Lunas (${formatRupiah(tenant.depositNominal)})`
                  : `Belum Dibayar (${formatRupiah(tenant.depositNominal)})`}
              </span>
            </div>
            <div className="flex">
              <span className="w-36 font-semibold text-gray-600 shrink-0">Sisa Kurang Bayar</span>
              <span className="w-4 text-center shrink-0">:</span>
              <span className={`flex-1 font-bold ${tenant.kurangBayar > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {tenant.kurangBayar > 0 ? formatRupiah(tenant.kurangBayar) : 'Lunas (Rp 0)'}
              </span>
            </div>
          </div>

          {/* TOTAL & TANDA TANGAN */}
          <div className="pt-4 flex justify-between items-end border-t border-gray-200">
            <div className="bg-gray-100 border-2 border-gray-900 px-4 py-2.5 rounded-lg">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Biaya Sewa</p>
              <p className="text-lg font-extrabold font-mono text-gray-900">
                {formatRupiah(tenant.tarif)},-
              </p>
            </div>

            <div className="text-center text-xs min-w-[170px]">
              <p className="text-gray-600">Manokwari, {tanggalHariIni}</p>
              <p className="font-semibold text-gray-800 mt-1">Penerima / Pengelola,</p>
              <div className="h-10 flex items-center justify-center">
                <span className="text-xs font-serif italic text-blue-900 font-bold opacity-80">MM Space Management</span>
              </div>
              <p className="font-bold text-gray-900 underline">Meinatri Cykitta Mandacan</p>
            </div>
          </div>
        </div>

        {/* PETUNJUK SIMPAN KE PDF */}
        {showPdfTip && (
          <div className="no-print bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl text-xs space-y-1 animate-in fade-in duration-150">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Cara Menyimpan / Ekspor ke File PDF:
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-blue-800 ml-1">
              <li>Klik tombol <strong>"Cetak / Ekspor PDF"</strong> di bawah.</li>
              <li>Pada dialog browser yang muncul, ubah <strong>Destination / Tujuan Printer</strong> menjadi <strong>"Save as PDF" (Simpan sebagai PDF)</strong>.</li>
              <li>Pilih opsi ukuran kertas (A4 atau Letter), lalu klik <strong>Save (Simpan)</strong>.</li>
            </ol>
          </div>
        )}

        {/* AKSI TOMBOL MODAL (TIDAK IKUT DICETAK / NO-PRINT) */}
        <div className="no-print flex flex-col gap-2 pt-1">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
              title="Cetak kwitansi langsung atau simpan sebagai dokumen PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Ekspor PDF</span>
            </button>

            <button
              onClick={() => setShowPdfTip(!showPdfTip)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
              title="Bantuan cara menyimpan kuitansi ke format PDF"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Info PDF</span>
            </button>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Kirim Kuitansi ke WhatsApp Penyewa ({tenant.noHp})
          </a>

          <button
            onClick={onClose}
            className="w-full border border-gray-300 hover:bg-gray-100 font-bold py-2 rounded-xl text-xs text-gray-700 transition flex items-center justify-center gap-1 mt-0.5"
          >
            <X className="w-4 h-4" />
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
