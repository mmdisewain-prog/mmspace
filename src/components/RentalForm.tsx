import React, { useState, useEffect } from 'react';
import { Tenant, ALL_UNITS, UnitDefinition, HomeSettings, DEFAULT_HOME_SETTINGS } from '../types';
import { calculateJatuhTempo } from '../utils/formatters';
import {
  Upload,
  Copy,
  Check,
  MessageCircle,
  CreditCard,
  Phone,
  Calendar,
  AlertCircle,
  FileCheck,
  User,
  ShieldCheck,
  Home,
  CheckCircle2,
} from 'lucide-react';

interface RentalFormProps {
  tenants: Tenant[];
  units?: UnitDefinition[];
  selectedUnitName?: string;
  homeSettings?: HomeSettings;
  onSubmitTenant: (tenant: Omit<Tenant, 'id'>, ktpFile?: File, buktiFile?: File) => Promise<void>;
}

export const RentalForm: React.FC<RentalFormProps> = ({
  tenants,
  units = ALL_UNITS,
  selectedUnitName,
  homeSettings = DEFAULT_HOME_SETTINGS,
  onSubmitTenant,
}) => {
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [noHp, setNoHp] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(selectedUnitName || units[0]?.name || ALL_UNITS[0].name);
  const [tglMulai, setTglMulai] = useState(new Date().toISOString().split('T')[0]);
  const [durasi, setDurasi] = useState(1);
  const [satuan, setSatuan] = useState<'Tahun' | 'Bulan'>(units[0]?.satuan || 'Tahun');
  const [plat, setPlat] = useState('');
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active tenants map for unit availability
  const activeTenants = tenants.filter(
    (t) => t.contractStatus === 'Aktif' || t.contractStatus === 'Proses Verifikasi'
  );
  const unitOccupancyMap = new Map<string, Tenant>();
  activeTenants.forEach((t) => unitOccupancyMap.set(t.unit, t));

  // Update selected unit when parent prop changes
  useEffect(() => {
    if (selectedUnitName) {
      setSelectedUnit(selectedUnitName);
      const unitObj = units.find((u) => u.name === selectedUnitName);
      if (unitObj) {
        setSatuan(unitObj.satuan);
      }
    }
  }, [selectedUnitName, units]);

  const currentUnitObj = units.find((u) => u.name === selectedUnit) || units[0] || ALL_UNITS[0];

  const handleUnitSelectChange = (unitName: string) => {
    setSelectedUnit(unitName);
    const u = units.find((x) => x.name === unitName);
    if (u) {
      setSatuan(u.satuan);
    }
  };

  const copyRekening = () => {
    navigator.clipboard.writeText(homeSettings.nomorRekening);
    setCopiedRekening(true);
    setTimeout(() => setCopiedRekening(false), 2500);
  };

  // High-performance canvas image compressor (prevents localStorage freeze / quota crash)
  const compressImageFile = (file: File, maxWidth = 1200, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      // If PDF or not image, use standard FileReader
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nama || !noHp || !selectedUnit || !tglMulai) {
      setErrorMessage('Mohon lengkapi seluruh kolom wajib bertanda bintang (*).');
      return;
    }

    if (!ktpFile || !buktiFile) {
      setErrorMessage('Mohon lampirkan Foto KTP dan Bukti Transfer Bank.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ktpBase64 = await compressImageFile(ktpFile);
      const buktiBase64 = await compressImageFile(buktiFile);

      const totalTarif = (currentUnitObj?.defaultTarif || 0) * durasi;
      const jatuhTempo = calculateJatuhTempo(tglMulai, durasi, satuan);

      const newTenant: Omit<Tenant, 'id'> = {
        nama,
        nik: nik || '-',
        noHp,
        unit: currentUnitObj.name,
        category: currentUnitObj.category,
        plat: plat || '-',
        tglMulai,
        durasi,
        satuan,
        jatuhTempo,
        tarif: totalTarif,
        kurangBayar: totalTarif,
        depositNominal: currentUnitObj.defaultDeposit || 0,
        depositPaid: false,
        status: 'Proses Verifikasi',
        contractStatus: 'Proses Verifikasi',
        ktpData: ktpBase64,
        buktiData: buktiBase64,
        createdAt: new Date().toISOString().split('T')[0],
      };

      await onSubmitTenant(newTenant, ktpFile, buktiFile);

      setSuccessMessage(
        `Terima kasih Bapak/Ibu ${nama}! Formulir dan bukti pembayaran Anda untuk "${selectedUnit}" berhasil dikirim. Pengelola akan memverifikasi dalam 1x24 jam.`
      );

      // Reset form
      setNama('');
      setNik('');
      setNoHp('');
      setPlat('');
      setKtpFile(null);
      setBuktiFile(null);
      const ktpInput = document.getElementById('ktpInput') as HTMLInputElement;
      const buktiInput = document.getElementById('buktiInput') as HTMLInputElement;
      if (ktpInput) ktpInput.value = '';
      if (buktiInput) buktiInput.value = '';

      window.scrollTo({ top: 300, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Gagal mengirim formulir: ' + (err.message || 'Terjadi kesalahan sistem.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group units by category for clean dropdown
  const distinctCategories = Array.from(new Set(units.map((u) => u.category)));

  return (
    <div className="space-y-6">
      {/* NOTIFIKASI SUKSES */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 sm:p-5 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
          <FileCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-emerald-900">Pengajuan Berhasil Terkirim!</h4>
            <p className="text-xs text-emerald-800 mt-1">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="mt-2 text-xs font-bold text-emerald-700 underline"
            >
              Tutup Pesan
            </button>
          </div>
        </div>
      )}

      {/* NOTIFIKASI ERROR */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 p-4 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-rose-900">Peringatan Formulir</h4>
            <p className="text-xs text-rose-800 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* QUICK INFO CARDS (REKENING RESMI & KONTAK PENGELOLA) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* REKENING RESMI BRI */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">
                Rekening Resmi
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mt-2">Transfer Pembayaran {homeSettings.namaBank}</h3>
            <p className="text-[11px] text-gray-500 mb-2">Semua pembayaran sewa dan deposit dialihkan ke:</p>

            <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-100 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-blue-800 font-bold">
                <span>{homeSettings.namaBank}</span>
                {homeSettings.cabangBank && (
                  <span className="bg-blue-200/60 px-1.5 py-0.5 rounded">{homeSettings.cabangBank}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-black text-blue-900 tracking-wider">
                  {homeSettings.nomorRekening}
                </span>
                <button
                  type="button"
                  onClick={copyRekening}
                  className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 p-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer"
                  title="Salin Nomor Rekening"
                >
                  {copiedRekening ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-600" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-700 font-medium">
                a.n <span className="font-bold text-gray-900">{homeSettings.atasNamaRekening}</span>
              </p>
            </div>
          </div>
        </div>

        {/* KONTAK RESMI PENGELOLA */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                Kontak & Survei Lokasi
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mt-2">Pusat Layanan Penyewa {homeSettings.namaProperti}</h3>
            <p className="text-[11px] text-gray-500 mb-2">
              Ingin mengecek fisik properti, survei lokasi, atau butuh bantuan pendaftaran?
            </p>

            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-emerald-800 font-semibold">WhatsApp & Telepon Resmi</p>
                <p className="text-xl font-black font-mono text-emerald-950 tracking-wide">
                  {homeSettings.noWhatsapp}
                </p>
                <p className="text-[11px] text-emerald-700">
                  Lokasi: {homeSettings.lokasi}
                </p>
              </div>
              <a
                href={`https://wa.me/${homeSettings.whatsappLink}?text=${encodeURIComponent(homeSettings.pesanWaDefault)}`}
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
      </div>

      {/* FORMULIR PENDAFTARAN RESMI DENGAN TAMPILAN BERSIH & MENARIK */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* HEADER FORM */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Formulir Pendaftaran
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold mt-1">
                Pengajuan Sewa Unit Properti MM Space
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Isi data diri penyewa, tentukan unit yang diinginkan, dan unggah bukti transfer pembayaran.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-blue-100 bg-black/20 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Verifikasi Terpercaya</span>
            </div>
          </div>
        </div>

        {/* BODY FORMULIR */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6">
          {/* LANGKAH 1: DATA IDENTITAS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                1
              </div>
              <h3 className="text-sm font-bold text-gray-800">
                Data Identitas Penyewa
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Lengkap Penyewa *
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Sesuai KTP (contoh: Ratna Dewi)"
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nomor WhatsApp / HP Aktif *
                </label>
                <input
                  type="tel"
                  required
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nomor Induk Kependudukan (NIK KTP)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="16 digit NIK (opsional jika foto KTP diunggah)"
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Plat Kendaraan / Keterangan Usaha (Opsional)
                </label>
                <input
                  type="text"
                  value={plat}
                  onChange={(e) => setPlat(e.target.value)}
                  placeholder="Contoh: PB 1234 RD atau Toko Kelontong"
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                />
              </div>
            </div>
          </div>

          {/* LANGKAH 2: PILIH PROPERTI & JANGKA WAKTU (TANPA HARGA DI PILIH UNIT) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                2
              </div>
              <h3 className="text-sm font-bold text-gray-800">
                Pilihan Unit Properti & Jangka Waktu Sewa
              </h3>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase">
                  Pilih Unit Properti *
                </label>
                {unitOccupancyMap.has(selectedUnit) && (
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ⚠️ Unit ini saat ini berstatus terisi
                  </span>
                )}
              </div>

              {/* DROPDOWN UNIT TANPA HARGA (SESUAI PERMINTAAN USER) */}
              <select
                value={selectedUnit}
                onChange={(e) => handleUnitSelectChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-gray-800"
              >
                {distinctCategories.map((cat) => {
                  const unitsInCat = units.filter((u) => u.category === cat);
                  return (
                    <optgroup key={cat} label={`🏷️ ${cat} (${unitsInCat.length} Unit)`}>
                      {unitsInCat.map((u) => {
                        const occ = unitOccupancyMap.get(u.name);
                        return (
                          <option key={u.id} value={u.name}>
                            {u.name} {occ ? '(TERISI)' : '(Tersedia)'}
                          </option>
                        );
                      })}
                    </optgroup>
                  );
                })}
              </select>

              {currentUnitObj && (
                <p className="text-[11px] text-gray-500 mt-1.5">
                  <span className="font-semibold text-gray-700">Fasilitas: </span>
                  {currentUnitObj.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tanggal Mulai Sewa *
                </label>
                <input
                  type="date"
                  required
                  value={tglMulai}
                  onChange={(e) => setTglMulai(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Jangka Waktu Sewa *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={durasi}
                    onChange={(e) => setDurasi(Math.max(1, Number(e.target.value)))}
                    className="w-1/3 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-bold text-center"
                  />
                  <input
                    type="text"
                    readOnly
                    value={satuan}
                    className="w-2/3 border border-gray-200 rounded-xl p-3 text-xs outline-none bg-gray-100 text-gray-700 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* LANGKAH 3: UPLOAD BERKAS & KONFIRMASI */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <h3 className="text-sm font-bold text-gray-800">
                Lampiran Berkas & Bukti Pembayaran
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Upload Foto KTP Asli *
                </label>
                <input
                  id="ktpInput"
                  type="file"
                  accept="image/*,.pdf"
                  required
                  onChange={(e) => setKtpFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-2.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-200 rounded-xl p-1.5 cursor-pointer bg-gray-50/50"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Foto KTP asli jelas terbaca (otomatis dioptimalkan)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Upload Bukti Transfer Bank *
                </label>
                <input
                  id="buktiInput"
                  type="file"
                  accept="image/*,.pdf"
                  required
                  onChange={(e) => setBuktiFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-2.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-gray-200 rounded-xl p-1.5 cursor-pointer bg-gray-50/50"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Struk ATM / Screenshot M-Banking ke {homeSettings.namaBank} a.n {homeSettings.atasNamaRekening}
                </span>
              </div>
            </div>
          </div>

          {/* TOMBOL SUBMIT */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition shadow-sm text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses Formulir & Berkas...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kirim Formulir Pengajuan Sewa</span>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              Data Anda aman dan terlindungi. Pengelola MM Space akan menghubungi melalui WhatsApp untuk konfirmasi serah terima kunci.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
