import React, { useState, useEffect } from 'react';
import { HomeSettings, DEFAULT_HOME_SETTINGS } from '../types';
import {
  X,
  Settings,
  CreditCard,
  MessageCircle,
  Building2,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
  Copy,
  Check,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';

interface HomeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: HomeSettings;
  onSaveSettings: (newSettings: HomeSettings) => void;
}

export const HomeSettingsModal: React.FC<HomeSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  // Active settings state
  const [formData, setFormData] = useState<HomeSettings>(settings || DEFAULT_HOME_SETTINGS);
  const [activeTab, setActiveTab] = useState<'rekening' | 'whatsapp' | 'profil'>('rekening');
  const [copiedTest, setCopiedTest] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Sync state whenever modal opens or settings change
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings, isOpen]);

  // Helper to sanitize phone into international 62 format
  const formatToWhatsappLink = (phone: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (!clean.startsWith('62')) {
      clean = '62' + clean;
    }
    return clean;
  };

  const handlePhoneChange = (val: string) => {
    const autoLink = formatToWhatsappLink(val);
    setFormData((prev) => ({
      ...prev,
      noWhatsapp: val,
      whatsappLink: autoLink,
    }));
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan semua pengaturan beranda ke konfigurasi awal bawaan?')) {
      setFormData(DEFAULT_HOME_SETTINGS);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSavedRecently(true);
    setTimeout(() => {
      setIsSavedRecently(false);
      onClose();
    }, 900);
  };

  // Safe early return ONLY after all hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-200 my-auto flex flex-col max-h-[92vh] overflow-hidden">
        {/* HEADER MODAL */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Settings className="w-5 h-5 text-blue-200 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Pengaturan Menu Beranda</h2>
                <span className="text-[10px] bg-blue-500/40 text-blue-100 font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                  Admin MM Space
                </span>
              </div>
              <p className="text-xs text-blue-100/80 mt-0.5">
                Ubah nomor rekening, kontak WhatsApp, dan informasi tampilan halaman utama secara langsung.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-2 gap-1.5 shrink-0 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('rekening')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              activeTab === 'rekening'
                ? 'bg-white text-blue-700 shadow-xs border border-gray-200/80 font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>Nomor Rekening Bank</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              activeTab === 'whatsapp'
                ? 'bg-white text-emerald-700 shadow-xs border border-gray-200/80 font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kontak & WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              activeTab === 'profil'
                ? 'bg-white text-indigo-700 shadow-xs border border-gray-200/80 font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Teks & Profil Beranda</span>
          </button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-grow">
          {/* TAB 1: REKENING BANK */}
          {activeTab === 'rekening' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Informasi rekening ini akan ditampilkan pada banner pembayaran Beranda serta di samping formulir sewa agar calon penyewa dapat melakukan transfer dengan tepat.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nama Bank *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaBank}
                    onChange={(e) => setFormData({ ...formData, namaBank: e.target.value })}
                    placeholder="Contoh: BANK BRI, BANK BCA, MANDIRI"
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Kantor Cabang (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.cabangBank}
                    onChange={(e) => setFormData({ ...formData, cabangBank: e.target.value })}
                    placeholder="Contoh: KC Manokwari"
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nomor Rekening Bank *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nomorRekening}
                  onChange={(e) => setFormData({ ...formData, nomorRekening: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="Contoh: 035301000763566"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm font-mono font-black text-blue-900 tracking-wider outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50/30"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Nomor rekening hanya angka, tombol 'Salin' otomatis menyalin nomor ini.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Atas Nama Pemilik Rekening *
                </label>
                <input
                  type="text"
                  required
                  value={formData.atasNamaRekening}
                  onChange={(e) => setFormData({ ...formData, atasNamaRekening: e.target.value })}
                  placeholder="Contoh: Meinatri Cykitta Mandacan"
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                />
              </div>

              {/* LIVE PREVIEW BANNER REKENING */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Pratinjau Tampilan di Beranda:
                </span>
                <div className="bg-blue-50/90 p-4 rounded-2xl border border-blue-200 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] text-blue-800 font-bold">
                    <span>{formData.namaBank || 'BANK BRI'}</span>
                    {formData.cabangBank && (
                      <span className="bg-blue-200/70 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {formData.cabangBank}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-black text-blue-900 tracking-wider">
                      {formData.nomorRekening || '035301000763566'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formData.nomorRekening);
                        setCopiedTest(true);
                        setTimeout(() => setCopiedTest(false), 2000);
                      }}
                      className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 p-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer"
                      title="Uji coba salin"
                    >
                      {copiedTest ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-600" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-700">
                    a.n <span className="font-bold text-gray-900">{formData.atasNamaRekening || 'Meinatri Cykitta Mandacan'}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP & KONTAK */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Nomor WhatsApp ini digunakan untuk tombol "Chat WhatsApp Pengelola" di Beranda, banner survei lokasi, serta konfirmasi pendaftaran sewa.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nomor WhatsApp Tampilan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.noWhatsapp}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Contoh: 0812 888 19743"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm font-mono font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Format tampilan yang dibaca pengguna (misal: 0812 888 19743).
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  ID Tautan WhatsApp (wa.me) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-3 py-3 rounded-xl border border-gray-200 shrink-0">
                    https://wa.me/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.whatsappLink}
                    onChange={(e) => setFormData({ ...formData, whatsappLink: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="6281288819743"
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Otomatis diperbarui dengan awalan 62 untuk tautan klik langsung ke aplikasi WhatsApp.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Pesan Template Awal Calon Penyewa
                </label>
                <textarea
                  rows={2}
                  value={formData.pesanWaDefault}
                  onChange={(e) => setFormData({ ...formData, pesanWaDefault: e.target.value })}
                  placeholder="Teks otomatis saat calon penyewa mengklik tombol WhatsApp..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Lokasi / Alamat Properti di Beranda *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  placeholder="Jl. Pertanian Wosi, Manokwari, Papua Barat"
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50"
                />
              </div>

              {/* LIVE PREVIEW TOMBOL WA */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Pratinjau Tombol WhatsApp:
                </span>
                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] text-emerald-800 font-semibold">WhatsApp & Telepon Resmi</p>
                    <p className="text-lg font-black font-mono text-emerald-950">
                      {formData.noWhatsapp || '0812 888 19743'}
                    </p>
                    <p className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {formData.lokasi || 'Jl. Pertanian Wosi, Manokwari'}
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/${formData.whatsappLink}?text=${encodeURIComponent(formData.pesanWaDefault)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-2xs shrink-0"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat WhatsApp Pengelola
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROFIL & TEKS BERANDA */}
          {activeTab === 'profil' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-800 leading-relaxed">
                  Pengaturan ini mempengaruhi teks banner judul (Hero) di bagian atas Beranda dan identitas pengelola pada berkas surat perjanjian.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nama Usaha / Properti *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaProperti}
                    onChange={(e) => setFormData({ ...formData, namaProperti: e.target.value })}
                    placeholder="MM Space"
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nama Pengelola / Pemilik *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaPengelola}
                    onChange={(e) => setFormData({ ...formData, namaPengelola: e.target.value })}
                    placeholder="MEINATRI CYKITTA MANDACAN"
                    className="w-full border border-gray-200 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Judul Utama Banner Beranda *
                </label>
                <input
                  type="text"
                  required
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Sewa Rumah & Properti MM Space"
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Deskripsi Singkat Banner Beranda *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.deskripsiHero}
                  onChange={(e) => setFormData({ ...formData, deskripsiHero: e.target.value })}
                  placeholder="Deskripsi properti, fasilitas, dan keunggulan hunian..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-gray-500 hover:text-rose-600 font-semibold flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl hover:bg-rose-50 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Pengaturan Awal</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSavedRecently}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                {isSavedRecently ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Beranda</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
