import React, { useState, useEffect } from 'react';
import { Tenant, HomeSettings, DEFAULT_HOME_SETTINGS } from '../types';
import {
  formatRupiah,
  terbilang,
  formatIndoDate,
} from '../utils/formatters';
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  Check,
  Building2,
  Car,
  RotateCcw,
  HelpCircle,
  Calendar,
  User,
  ShieldAlert,
} from 'lucide-react';

interface SuratPerjanjianModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  allTenants?: Tenant[];
  homeSettings?: HomeSettings;
}

export const SuratPerjanjianModal: React.FC<SuratPerjanjianModalProps> = ({
  isOpen,
  onClose,
  tenant,
  allTenants = [],
  homeSettings = DEFAULT_HOME_SETTINGS,
}) => {
  // Fallback blank tenant template when no existing tenant is registered yet
  const fallbackTenant: Tenant = {
    id: 1,
    unit: 'Ruko Unit 1',
    category: 'Ruko',
    nama: 'Nama Calon Penyewa',
    nik: '',
    noHp: '',
    plat: '',
    tglMulai: new Date().toISOString().split('T')[0],
    durasi: 1,
    satuan: 'Tahun',
    jatuhTempo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tarif: 0,
    kurangBayar: 0,
    depositNominal: 0,
    depositPaid: true,
    status: 'Lunas',
    contractStatus: 'Aktif',
    createdAt: new Date().toISOString().split('T')[0],
  };

  // Selected tenant state
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(
    tenant ? tenant.id : allTenants[0]?.id || null
  );

  const activeTenant =
    allTenants.find((t) => t.id === selectedTenantId) || tenant || fallbackTenant;

  // View Mode: 'preview' (Print/Preview PDF) vs 'editor' (Edit Isi Surat & Klausul)
  const [activeTab, setActiveTab] = useState<'preview' | 'editor'>('preview');
  const [copiedText, setCopiedText] = useState(false);
  const [showPdfTip, setShowPdfTip] = useState(false);

  // Template Type: 'properti' (Rumah, Ruko, Gudang) vs 'parkir' (Slot / Lahan Parkir Kendaraan)
  const isDefaultParking = Boolean(
    activeTenant &&
      (activeTenant.category === 'Lahan Parkir' ||
        activeTenant.unit.toLowerCase().includes('parkir') ||
        activeTenant.unit.toLowerCase().includes('slot'))
  );

  const [agreementType, setAgreementType] = useState<'properti' | 'parkir'>(
    isDefaultParking ? 'parkir' : 'properti'
  );

  // Editable Form Fields
  const [judulSurat, setJudulSurat] = useState('');
  const [noSurat, setNoSurat] = useState('');
  const [tanggalPerjanjian, setTanggalPerjanjian] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Pihak Pertama (Pengelola / Pemilik) - Tidak ada lagi embel-embel "MM Space Management"
  const [pihak1Nama, setPihak1Nama] = useState('MEINATRI CYKITTA MANDACAN');
  const [pihak1Jabatan, setPihak1Jabatan] = useState('Pemilik / Pengelola Properti');
  const [pihak1Alamat, setPihak1Alamat] = useState(
    'Jl. Pertanian Wosi, Manokwari, Papua Barat'
  );
  const [pihak1Hp, setPihak1Hp] = useState('0812 888 19743');

  // Pihak Kedua (Penyewa)
  const [pihak2Nama, setPihak2Nama] = useState('');
  const [pihak2Nik, setPihak2Nik] = useState('');
  const [pihak2Hp, setPihak2Hp] = useState('');
  const [pihak2Alamat, setPihak2Alamat] = useState('');
  const [pihak2Pekerjaan, setPihak2Pekerjaan] = useState('');
  const [pihak2Plat, setPihak2Plat] = useState('');
  const [pihak2JenisKendaraan, setPihak2JenisKendaraan] = useState('');

  // Objek Sewa & Keuangan
  const [unitObjek, setUnitObjek] = useState('');
  const [durasiText, setDurasiText] = useState('');
  const [tglMulai, setTglMulai] = useState('');
  const [jatuhTempo, setJatuhTempo] = useState('');
  const [tarif, setTarif] = useState(0);
  const [depositNominal, setDepositNominal] = useState(0);
  const [statusBayarText, setStatusBayarText] = useState('');

  // Pasal-Pasal Kontrak (Dapat Di-edit Bebas)
  const [pasal1Judul, setPasal1Judul] = useState('');
  const [pasal1Isi, setPasal1Isi] = useState('');

  const [pasal2Judul, setPasal2Judul] = useState('');
  const [pasal2Isi, setPasal2Isi] = useState('');

  const [pasal3Judul, setPasal3Judul] = useState('');
  const [pasal3Isi, setPasal3Isi] = useState('');

  const [pasal4Judul, setPasal4Judul] = useState('');
  const [pasal4Isi, setPasal4Isi] = useState('');

  const [pasal5Judul, setPasal5Judul] = useState('');
  const [pasal5Isi, setPasal5Isi] = useState('');

  const [pasal6Judul, setPasal6Judul] = useState('');
  const [pasal6Isi, setPasal6Isi] = useState('');

  const [catatanKhusus, setCatatanKhusus] = useState('');
  const [penutupText, setPenutupText] = useState(
    'Demikian Surat Perjanjian Sewa Menyewa ini dibuat dan ditandatangani oleh kedua belah pihak dalam keadaan sadar, sehat jasmani dan rohani, serta tanpa paksaan dari pihak manapun untuk dipergunakan sebagaimana mestinya.'
  );

  // Helper to initialize or reset content based on tenant and template type
  const initializeAgreementData = (
    t: Tenant | null,
    type: 'properti' | 'parkir'
  ) => {
    if (!t) return;

    const year = new Date().getFullYear();
    const seq = String(t.id).padStart(4, '0').slice(-4);

    const unit = t.unit;
    const durasi = `${t.durasi} (${terbilang(t.durasi).trim()}) ${t.satuan}`;
    const formattedTarif = `${formatRupiah(t.tarif)} (${terbilang(t.tarif).trim()} Rupiah)`;
    const formattedDepo = `${formatRupiah(t.depositNominal)} (${terbilang(t.depositNominal).trim()} Rupiah)`;
    const statusText =
      t.status === 'Lunas'
        ? 'LUNAS (Penuh)'
        : t.kurangBayar > 0
        ? `BELUM LUNAS (Sisa Kurang Bayar: ${formatRupiah(t.kurangBayar)})`
        : t.status.toUpperCase();

    // Set Common Fields
    setTanggalPerjanjian(new Date().toISOString().split('T')[0]);
    setPihak1Nama(homeSettings.namaPengelola || 'MEINATRI CYKITTA MANDACAN');
    setPihak1Alamat(homeSettings.lokasi || 'Jl. Pertanian Wosi, Manokwari, Papua Barat');
    setPihak1Hp(homeSettings.noWhatsapp || '0812 888 19743');

    setPihak2Nama(t.nama);
    setPihak2Nik(t.nik || '-');
    setPihak2Hp(t.noHp);
    setPihak2Alamat('Jl. Pertanian Wosi, Manokwari, Papua Barat');
    setPihak2Pekerjaan('Karyawan Swasta / Wiraswasta');
    setPihak2Plat(t.plat && t.plat !== '-' ? t.plat : 'PB 1234 XX');
    setPihak2JenisKendaraan(
      t.category === 'Lahan Parkir' ? 'Mobil Pribadi / Roda 4' : 'Sepeda Motor / Mobil'
    );

    setUnitObjek(unit);
    setDurasiText(durasi);
    setTglMulai(t.tglMulai);
    setJatuhTempo(t.jatuhTempo);
    setTarif(t.tarif);
    setDepositNominal(t.depositNominal);
    setStatusBayarText(statusText);

    if (type === 'parkir') {
      // FORMAT KHUSUS SEWA SLOT PARKIR
      setJudulSurat('SURAT PERJANJIAN SEWA MENYEWA SLOT PARKIR KENDARAAN');
      setNoSurat(`SPK-PRK/MMS/${year}/${seq}`);
      setPihak1Jabatan('Pemilik / Pengelola Lahan Parkir');

      setPasal1Judul('PASAL 1: OBJEK SEWA & IDENTITAS KENDARAAN');
      setPasal1Isi(
        `1. PIHAK PERTAMA menyewakan kepada PIHAK KEDUA slot parkir kendaraan bermotor yang berlokasi di Area Parkir Kompleks MM Space, Jl. Pertanian Wosi, Manokwari, Papua Barat, yaitu: ${unit}.\n` +
        `2. Objek sewa ini hanya diperuntukkan secara khusus untuk memarkir 1 (satu) unit kendaraan terdaftar milik PIHAK KEDUA dengan identitas: No. Plat Kendaraan: ${t.plat && t.plat !== '-' ? t.plat : 'PB 1234 XX'}, Jenis: Mobil / Roda 4.\n` +
        `3. PIHAK KEDUA dilarang mengganti unit kendaraan terdaftar dengan kendaraan lain tanpa persetujuan tertulis dari PIHAK PERTAMA.`
      );

      setPasal2Judul('PASAL 2: JANGKA WAKTU SEWA PARKIR');
      setPasal2Isi(
        `Perjanjian sewa slot parkir ini berlaku untuk jangka waktu ${durasi}, terhitung sejak tanggal ${formatIndoDate(t.tglMulai)} sampai dengan tanggal ${formatIndoDate(t.jatuhTempo)}.`
      );

      setPasal3Judul('PASAL 3: BIAYA SEWA PARKIR & SISTEM PEMBAYARAN');
      setPasal3Isi(
        `1. Biaya sewa slot parkir yang telah disepakati adalah sebesar ${formattedTarif} yang wajib dibayarkan lunas di muka sebelum kendaraan ditempatkan pada slot parkir.\n` +
        `2. Pembayaran ditransfer ke rekening resmi: Bank BRI No. Rekening 035301000763566 a.n MEINATRI CYKITTA MANDACAN.\n` +
        `3. Status pembayaran saat kontrak ini disahkan: ${statusText}.`
      );

      setPasal4Judul('PASAL 4: TATA TERTIB, KETENTUAN, & BATAS TANGGUNG JAWAB PARKIR');
      setPasal4Isi(
        `1. PIHAK KEDUA wajib memarkirkan kendaraan secara rapi dan tertib di dalam batas garis slot parkir yang telah dialokasikan, serta tidak menghalangi pintu gerbang, manuver kendaraan lain, maupun akses jalan keluar-masuk.\n` +
        `2. Kendaraan yang diparkir wajib selalu dalam keadaan terkunci rapat, rem tangan terpasang aman, serta tidak dalam kondisi berisiko menimbulkan kebakaran atau kebocoran bahan bakar/oli.\n` +
        `3. PIHAK KEDUA bertanggung jawab penuh terhadap barang-barang berharga pribadi di dalam kendaraan. PIHAK PERTAMA menyediakan area parkir berpagar, namun tidak bertanggung jawab atas kehilangan perhiasan, uang tunai, laptop, atau benda berharga lain yang ditinggalkan di dalam mobil/kendaraan.\n` +
        `4. Dilarang keras menyimpan bahan peledak, zat kimia berbahaya, bahan mudah terbakar secara tidak aman, senjata tajam/senjata api, maupun benda-benda ilegal/terlarang oleh hukum di dalam kendaraan.\n` +
        `5. Area slot parkir murni untuk parkir/penitipan kendaraan. Dilarang keras menggunakan area parkir untuk mendirikan bedeng/tenda liar, bengkel mesin berat berjangka panjang, atau usaha cuci mobil komersial.\n` +
        `6. PIHAK KEDUA wajib menjaga kebersihan area parkir, tidak membuang sampah sembarangan, serta wajib segera membersihkan bila terdapat ceceran oli dari kendaraannya.`
      );

      setPasal5Judul('PASAL 5: PENGAKHIRAN SEWA & PENERTIBAN KENDARAAN');
      setPasal5Isi(
        `1. Perjanjian sewa slot parkir ini berakhir sesuai jangka waktu yang tercantum pada Pasal 2.\n` +
        `2. Apabila masa sewa telah berakhir dan PIHAK KEDUA tidak melakukan perpanjangan kontrak serta pembayaran sewa dalam waktu paling lambat 3 (tiga) hari kalender sejak jatuh tempo, maka PIHAK PERTAMA berhak menertibkan, menggembok, atau memindahkan kendaraan tersebut dari area slot parkir MM Space.\n` +
        `3. Segala biaya atau konsekuensi yang timbul akibat penertiban kendaraan karena kelalaian perpanjangan sewa sepenuhnya menjadi tanggung jawab PIHAK KEDUA.`
      );

      setPasal6Judul('PASAL 6: PENYELESAIAN PERSELISIHAN');
      setPasal6Isi(
        `Segala bentuk perselisihan yang mungkin timbul dari pelaksanaan perjanjian ini akan diselesaikan secara musyawarah untuk mencapai mufakat. Apabila tidak tercapai kata mufakat, para pihak sepakat memilih penyelesaian di Pengadilan Negeri Manokwari.`
      );

      setCatatanKhusus(
        'Kunci cadangan / remote alarm tetap dipegang oleh penyewa. Harap mengabari pengelola bila meninggalkan kendaraan lebih dari 14 hari berturut-turut.'
      );
    } else {
      // FORMAT STANDAR SEWA MENYEWA PROPERTI (RUMAH / RUKO / GUDANG)
      setJudulSurat('SURAT PERJANJIAN SEWA MENYEWA PROPERTI');
      setNoSurat(`SPK/MMS/${year}/${seq}`);
      setPihak1Jabatan('Pemilik / Pengelola Properti');

      setPasal1Judul('PASAL 1: OBJEK SEWA & PERUNTUKAN');
      setPasal1Isi(
        `1. PIHAK PERTAMA menyewakan kepada PIHAK KEDUA bangunan/unit properti milik PIHAK PERTAMA yang beralamat di Kompleks MM Space, Jl. Pertanian Wosi, Manokwari, Papua Barat, yaitu berupa: ${unit}.\n` +
        `2. PIHAK KEDUA mempergunakan objek sewa tersebut untuk tempat hunian / kegiatan usaha yang sah, tertib, dan tidak melanggar hukum serta norma ketertiban yang berlaku.`
      );

      setPasal2Judul('PASAL 2: JANGKA WAKTU SEWA');
      setPasal2Isi(
        `Perjanjian sewa-menyewa ini berlaku untuk jangka waktu ${durasi}, terhitung sejak tanggal ${formatIndoDate(t.tglMulai)} sampai dengan tanggal ${formatIndoDate(t.jatuhTempo)}.`
      );

      setPasal3Judul('PASAL 3: HARGA SEWA & TATA CARA PEMBAYARAN');
      setPasal3Isi(
        `1. Harga sewa yang telah disepakati adalah sebesar ${formattedTarif} untuk jangka waktu sewa tersebut di atas.\n` +
        `2. Pembayaran ditransfer langsung ke rekening resmi: Bank BRI No. Rekening 035301000763566 a.n. MEINATRI CYKITTA MANDACAN.\n` +
        `3. Status pembayaran saat kontrak ini disahkan: ${statusText}.`
      );

      setPasal4Judul('PASAL 4: JAMINAN DEPOSIT');
      setPasal4Isi(
        `PIHAK KEDUA menyetorkan uang jaminan deposit sebesar ${formattedDepo} yang akan dikembalikan secara penuh kepada PIHAK KEDUA setelah masa sewa berakhir, setelah dipotong biaya perbaikan kerusakan atau tunggakan pemakaian listrik/air bila ada.`
      );

      setPasal5Judul('PASAL 5: HAK, KEWAJIBAN, & TATA TERTIB');
      setPasal5Isi(
        `1. PIHAK KEDUA wajib memelihara dan menjaga kebersihan, kerapian, fasilitas, serta keamanan lingkungan objek sewa MM Space.\n` +
        `2. PIHAK KEDUA dilarang menyewakan kembali atau mengalihkan hak sewa objek sewa kepada pihak ketiga tanpa izin tertulis dari PIHAK PERTAMA.\n` +
        `3. Pemakaian listrik dan air ditanggung penyewa sesuai meteran mandiri masing-masing unit.`
      );

      setPasal6Judul('PASAL 6: PENYELESAIAN PERSELISIHAN');
      setPasal6Isi(
        `Segala perselisihan yang timbul dari pelaksanaan perjanjian ini akan diselesaikan secara musyawarah untuk mufakat. Apabila tidak tercapai mufakat, para pihak sepakat memilih domisili hukum di Pengadilan Negeri Manokwari.`
      );

      setCatatanKhusus(
        'Listrik dan air ditanggung penyewa sesuai pemakaian mandiri. Dilarang mengubah struktur bangunan fisik tanpa persetujuan tertulis pengelola.'
      );
    }
  };

  // Sync when tenant changes
  useEffect(() => {
    if (activeTenant) {
      const isPark =
        activeTenant.category === 'Lahan Parkir' ||
        activeTenant.unit.toLowerCase().includes('parkir') ||
        activeTenant.unit.toLowerCase().includes('slot');
      const targetType = isPark ? 'parkir' : 'properti';
      setAgreementType(targetType);
      initializeAgreementData(activeTenant, targetType);
    }
  }, [activeTenant]);

  // Handle switching template manually
  const handleSwitchTemplate = (type: 'properti' | 'parkir') => {
    setAgreementType(type);
    initializeAgreementData(activeTenant, type);
  };

  // Print function with automatic PDF filename
  const handlePrint = () => {
    const originalTitle = document.title;
    const sanitizedName = pihak2Nama.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedNo = noSurat.replace(/[^a-zA-Z0-9_-]/g, '_');
    document.title = `Surat_Perjanjian_${agreementType === 'parkir' ? 'Parkir' : 'Properti'}_${sanitizedNo}_${sanitizedName}`;

    window.print();

    const restoreHandler = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreHandler);
    };
    window.addEventListener('afterprint', restoreHandler);

    setTimeout(() => {
      document.title = originalTitle;
    }, 2000);
  };

  // Copy full structured agreement text for WhatsApp or Email
  const handleCopyText = () => {
    const fullText =
      `${judulSurat}\n` +
      `Nomor: ${noSurat}\n\n` +
      `Pada hari ini, ${formatIndoDate(tanggalPerjanjian)}, bertempat di Manokwari, Papua Barat:\n\n` +
      `I. PIHAK PERTAMA:\n` +
      `Nama: ${pihak1Nama}\n` +
      `Jabatan: ${pihak1Jabatan}\n` +
      `Alamat: ${pihak1Alamat}\n` +
      `WhatsApp: ${pihak1Hp}\n\n` +
      `II. PIHAK KEDUA:\n` +
      `Nama: ${pihak2Nama}\n` +
      `NIK: ${pihak2Nik}\n` +
      `WhatsApp: ${pihak2Hp}\n` +
      `Alamat: ${pihak2Alamat}\n` +
      `Pekerjaan: ${pihak2Pekerjaan}\n` +
      (agreementType === 'parkir' || pihak2Plat ? `Plat Kendaraan: ${pihak2Plat}\n` : '') +
      (agreementType === 'parkir' ? `Jenis Kendaraan: ${pihak2JenisKendaraan}\n` : '') +
      `\n` +
      `OBJEK SEWA:\n` +
      `Unit: ${unitObjek}\n` +
      `Durasi: ${durasiText}\n` +
      `Periode: ${formatIndoDate(tglMulai)} s/d ${formatIndoDate(jatuhTempo)}\n` +
      `Biaya: ${formatRupiah(tarif)} (${terbilang(tarif).trim()} Rupiah)\n` +
      `Deposit: ${formatRupiah(depositNominal)}\n` +
      `Status Bayar: ${statusBayarText}\n\n` +
      `KLAUSUL PASAL:\n` +
      `[${pasal1Judul}]\n${pasal1Isi}\n\n` +
      `[${pasal2Judul}]\n${pasal2Isi}\n\n` +
      `[${pasal3Judul}]\n${pasal3Isi}\n\n` +
      `[${pasal4Judul}]\n${pasal4Isi}\n\n` +
      `[${pasal5Judul}]\n${pasal5Isi}\n\n` +
      `[${pasal6Judul}]\n${pasal6Isi}\n\n` +
      `Catatan Khusus: ${catatanKhusus}\n\n` +
      `${penutupText}\n\n` +
      `PIHAK KEDUA: ${pihak2Nama}\n` +
      `PIHAK PERTAMA: ${pihak1Nama}`;

    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="agreement-modal-backdrop fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="agreement-modal-container bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 space-y-4 border border-gray-200 my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[96vh] flex flex-col">
        
        {/* MODAL HEADER & CONTROLS (NO-PRINT) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                agreementType === 'parkir'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {agreementType === 'parkir' ? (
                <Car className="w-5 h-5" />
              ) : (
                <Building2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-900 text-sm sm:text-base leading-tight">
                  Surat Perjanjian Sewa (SPK)
                </h3>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                    agreementType === 'parkir'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}
                >
                  {agreementType === 'parkir' ? 'Format Slot Parkir' : 'Format Properti'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Penyewa: <strong>{activeTenant.nama}</strong> ({activeTenant.unit})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {allTenants.length > 1 && (
              <select
                value={selectedTenantId || ''}
                onChange={(e) => setSelectedTenantId(Number(e.target.value))}
                className="text-xs border rounded-lg px-2.5 py-1.5 bg-gray-50 font-semibold text-gray-800 outline-none max-w-[160px] truncate"
                title="Pilih Penyewa Lain"
              >
                {allTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama} - {t.unit}
                  </option>
                ))}
              </select>
            )}

            {/* TAB TOGGLE: PRATINJAU vs EDIT ISI SURAT */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === 'preview'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Pratinjau & Cetak</span>
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === 'editor'
                    ? 'bg-white text-blue-700 shadow-xs ring-1 ring-blue-300'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit Isi Surat</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUBHEADER: PILIHAN FORMAT SURAT (PROPERTI VS SLOT PARKIR) */}
        <div className="no-print bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700">Pilihan Format Dokumen:</span>
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
              <button
                onClick={() => handleSwitchTemplate('properti')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition ${
                  agreementType === 'properti'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Sewa Properti / Hunian</span>
              </button>
              <button
                onClick={() => handleSwitchTemplate('parkir')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition ${
                  agreementType === 'parkir'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Sewa Slot Parkir Kendaraan</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => initializeAgreementData(activeTenant, agreementType)}
              className="text-xs text-gray-600 hover:text-gray-900 font-semibold px-2.5 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 flex items-center gap-1 transition"
              title="Kembalikan redaksi pasal ke teks default standar MM Space"
            >
              <RotateCcw className="w-3 h-3 text-gray-500" />
              <span>Reset ke Template Standar</span>
            </button>
          </div>
        </div>

        {/* BODY CONTENT: SWITCH ANTARA TAB EDITOR DAN TAB PRATINJAU DOKUMEN */}
        {activeTab === 'editor' ? (
          /* TAB 1: FORMULIR EDIT ISI SURAT LENGKAP */
          <div className="no-print flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Mode Edit Isi Surat Aktif:</strong> Anda dapat mengedit judul surat, nomor surat, data Pihak Pertama (tanpa teks MM Space Management), identitas penyewa, hingga redaksi Pasal 1 sampai Pasal 6 secara lengkap. Semua perubahan akan langsung tercetak pada dokumen PDF.
              </div>
            </div>

            {/* SEKSI 1: DATA ADMINISTRASI SURAT */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                1. Judul & Administrasi Surat
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Judul Dokumen Perjanjian
                  </label>
                  <input
                    type="text"
                    value={judulSurat}
                    onChange={(e) => setJudulSurat(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs font-bold bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Nomor Surat (SPK)
                  </label>
                  <input
                    type="text"
                    value={noSurat}
                    onChange={(e) => setNoSurat(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs font-mono font-bold bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Tanggal Perjanjian Dibuat
                  </label>
                  <input
                    type="date"
                    value={tanggalPerjanjian}
                    onChange={(e) => setTanggalPerjanjian(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Unit Objek Sewa
                  </label>
                  <input
                    type="text"
                    value={unitObjek}
                    onChange={(e) => setUnitObjek(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs font-bold bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Durasi Sewa
                  </label>
                  <input
                    type="text"
                    value={durasiText}
                    onChange={(e) => setDurasiText(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs bg-gray-50/50"
                  />
                </div>
              </div>
            </div>

            {/* SEKSI 2: IDENTITAS PIHAK PERTAMA (PENGELOLA) */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                2. Data Pihak Pertama (Pemilik / Pengelola) — Bebas Tanpa Frasa &quot;MM Space Management&quot;
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Nama Pihak Pertama
                  </label>
                  <input
                    type="text"
                    value={pihak1Nama}
                    onChange={(e) => setPihak1Nama(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs font-bold bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Jabatan / Status
                  </label>
                  <input
                    type="text"
                    value={pihak1Jabatan}
                    onChange={(e) => setPihak1Jabatan(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={pihak1Hp}
                    onChange={(e) => setPihak1Hp(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs font-mono bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Alamat Pihak Pertama
                  </label>
                  <input
                    type="text"
                    value={pihak1Alamat}
                    onChange={(e) => setPihak1Alamat(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs bg-gray-50/50"
                  />
                </div>
              </div>
            </div>

            {/* SEKSI 3: IDENTITAS PIHAK KEDUA (PENYEWA) */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                3. Data Pihak Kedua (Penyewa)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Nama Lengkap Penyewa
                  </label>
                  <input
                    type="text"
                    value={pihak2Nama}
                    onChange={(e) => setPihak2Nama(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs font-bold bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Nomor NIK / KTP
                  </label>
                  <input
                    type="text"
                    value={pihak2Nik}
                    onChange={(e) => setPihak2Nik(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs font-mono bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={pihak2Hp}
                    onChange={(e) => setPihak2Hp(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs font-mono bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Pekerjaan
                  </label>
                  <input
                    type="text"
                    value={pihak2Pekerjaan}
                    onChange={(e) => setPihak2Pekerjaan(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Plat / Nomor Polisi Kendaraan
                  </label>
                  <input
                    type="text"
                    value={pihak2Plat}
                    onChange={(e) => setPihak2Plat(e.target.value)}
                    placeholder="Contoh: PB 1234 XX"
                    className="w-full border rounded-lg p-2 text-xs font-mono font-bold bg-gray-50/50 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Jenis / Tipe Kendaraan
                  </label>
                  <input
                    type="text"
                    value={pihak2JenisKendaraan}
                    onChange={(e) => setPihak2JenisKendaraan(e.target.value)}
                    placeholder="Contoh: Mobil Toyota Avanza / Truk"
                    className="w-full border rounded-lg p-2 text-xs bg-gray-50/50"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Alamat Domisili / KTP Penyewa
                  </label>
                  <input
                    type="text"
                    value={pihak2Alamat}
                    onChange={(e) => setPihak2Alamat(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs bg-gray-50/50"
                  />
                </div>
              </div>
            </div>

            {/* SEKSI 4: EDIT ISI PASAL-PASAL KONTRAK */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  4. Redaksi Pasal-Pasal Kontrak (Dapat Diubah Sepenuhnya)
                </h4>
                <span className="text-[11px] text-gray-500">
                  Format Aktif: <strong>{agreementType === 'parkir' ? 'Sewa Slot Parkir' : 'Sewa Properti'}</strong>
                </span>
              </div>

              {/* PASAL 1 */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-800">
                  Judul Pasal 1:
                </label>
                <input
                  type="text"
                  value={pasal1Judul}
                  onChange={(e) => setPasal1Judul(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs font-bold bg-gray-50/50 uppercase"
                />
                <label className="block text-[11px] font-medium text-gray-600 mt-1">
                  Isi Redaksi Pasal 1:
                </label>
                <textarea
                  rows={3}
                  value={pasal1Isi}
                  onChange={(e) => setPasal1Isi(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs leading-relaxed bg-gray-50/50"
                />
              </div>

              {/* PASAL 2 */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-800">
                  Judul Pasal 2:
                </label>
                <input
                  type="text"
                  value={pasal2Judul}
                  onChange={(e) => setPasal2Judul(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs font-bold bg-gray-50/50 uppercase"
                />
                <label className="block text-[11px] font-medium text-gray-600 mt-1">
                  Isi Redaksi Pasal 2:
                </label>
                <textarea
                  rows={2}
                  value={pasal2Isi}
                  onChange={(e) => setPasal2Isi(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs leading-relaxed bg-gray-50/50"
                />
              </div>

              {/* PASAL 3 */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-800">
                  Judul Pasal 3:
                </label>
                <input
                  type="text"
                  value={pasal3Judul}
                  onChange={(e) => setPasal3Judul(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs font-bold bg-gray-50/50 uppercase"
                />
                <label className="block text-[11px] font-medium text-gray-600 mt-1">
                  Isi Redaksi Pasal 3:
                </label>
                <textarea
                  rows={3}
                  value={pasal3Isi}
                  onChange={(e) => setPasal3Isi(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs leading-relaxed bg-gray-50/50"
                />
              </div>

              {/* PASAL 4 */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-800">
                  Judul Pasal 4:
                </label>
                <input
                  type="text"
                  value={pasal4Judul}
                  onChange={(e) => setPasal4Judul(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs font-bold bg-gray-50/50 uppercase"
                />
                <label className="block text-[11px] font-medium text-gray-600 mt-1">
                  Isi Redaksi Pasal 4:
                </label>
                <textarea
                  rows={4}
                  value={pasal4Isi}
                  onChange={(e) => setPasal4Isi(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs leading-relaxed bg-gray-50/50"
                />
              </div>

              {/* PASAL 5 */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-800">
                  Judul Pasal 5:
                </label>
                <input
                  type="text"
                  value={pasal5Judul}
                  onChange={(e) => setPasal5Judul(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs font-bold bg-gray-50/50 uppercase"
                />
                <label className="block text-[11px] font-medium text-gray-600 mt-1">
                  Isi Redaksi Pasal 5:
                </label>
                <textarea
                  rows={3}
                  value={pasal5Isi}
                  onChange={(e) => setPasal5Isi(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs leading-relaxed bg-gray-50/50"
                />
              </div>

              {/* PASAL 6 */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-800">
                  Judul Pasal 6:
                </label>
                <input
                  type="text"
                  value={pasal6Judul}
                  onChange={(e) => setPasal6Judul(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs font-bold bg-gray-50/50 uppercase"
                />
                <label className="block text-[11px] font-medium text-gray-600 mt-1">
                  Isi Redaksi Pasal 6:
                </label>
                <textarea
                  rows={2}
                  value={pasal6Isi}
                  onChange={(e) => setPasal6Isi(e.target.value)}
                  className="w-full border rounded-lg p-2 text-xs leading-relaxed bg-gray-50/50"
                />
              </div>

              {/* CATATAN TAMBAHAN & PENUTUP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-800 mb-1">
                    Klausul / Catatan Khusus Tambahan:
                  </label>
                  <textarea
                    rows={3}
                    value={catatanKhusus}
                    onChange={(e) => setCatatanKhusus(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs leading-relaxed bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-800 mb-1">
                    Kalimat Penutup Surat:
                  </label>
                  <textarea
                    rows={3}
                    value={penutupText}
                    onChange={(e) => setPenutupText(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs leading-relaxed bg-gray-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveTab('preview')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Lihat Tampilan Dokumen / Siap Cetak</span>
              </button>
            </div>
          </div>
        ) : (
          /* TAB 2: PRATINJAU DOKUMEN CETAK & PDF RESMI */
          <div className="flex-1 overflow-y-auto pr-1">
            <div
              id="agreementPrintArea"
              className="bg-white text-gray-900 font-serif p-6 sm:p-8 rounded-xl border border-gray-200 shadow-xs space-y-4 text-xs leading-relaxed"
            >
              {/* KOP SURAT RESMI MM SPACE */}
              <div className="flex items-center justify-between border-b-2 border-gray-900 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 500 350" className="w-full h-full" fill="none">
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
                    <h2 className="font-extrabold text-gray-900 text-lg tracking-tight leading-none font-sans">
                      MM SPACE
                    </h2>
                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mt-0.5 font-sans">
                      {agreementType === 'parkir'
                        ? 'PARKING RENTALS & MANAGEMENT MANOKWARI'
                        : 'PROPERTY RENTALS & MANAGEMENT MANOKWARI'}
                    </p>
                    <p className="text-[8px] text-gray-500 mt-0.5 font-sans">
                      Jl. Pertanian Wosi, Manokwari, Papua Barat | WhatsApp: 0812 888 19743
                    </p>
                    <p className="text-[8px] text-gray-500 font-sans">
                      Email: mm.disewain@gmail.com / meina3cykytha@gmail.com
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block font-sans">
                  <span
                    className={`inline-block px-2.5 py-1 rounded text-[10px] font-extrabold uppercase border ${
                      agreementType === 'parkir'
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-blue-50 text-blue-900 border-blue-300'
                    }`}
                  >
                    {agreementType === 'parkir' ? 'Slot Parkir Resmi' : 'Properti Resmi'}
                  </span>
                </div>
              </div>

              {/* JUDUL DOKUMEN & NOMOR */}
              <div className="text-center space-y-0.5 pt-1">
                <h1 className="font-bold text-gray-950 text-sm sm:text-base uppercase tracking-wider underline">
                  {judulSurat}
                </h1>
                <p className="text-[11px] font-sans font-semibold text-gray-600">
                  Nomor: {noSurat}
                </p>
              </div>

              <p className="text-justify indent-6">
                Pada hari ini, <strong>{formatIndoDate(tanggalPerjanjian)}</strong>, bertempat di Manokwari, Provinsi Papua Barat, telah dibuat dan disepakati perjanjian sewa-menyewa oleh dan antara pihak-pihak sebagai berikut:
              </p>

              {/* IDENTITAS PARA PIHAK */}
              <div className="space-y-2.5 pl-1 sm:pl-2">
                {/* PIHAK PERTAMA - TANPA EMBEL-EMBEL "MM SPACE MANAGEMENT" */}
                <div>
                  <p className="font-bold font-sans text-gray-900">
                    I. PIHAK PERTAMA (PEMILIK / PENGELOLA):
                  </p>
                  <table className="w-full text-left ml-2 sm:ml-4 text-[11px] sm:text-xs">
                    <tbody>
                      <tr>
                        <td className="w-36 font-semibold">Nama Lengkap</td>
                        <td className="w-3">:</td>
                        <td className="font-bold">{pihak1Nama}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">Jabatan / Status</td>
                        <td>:</td>
                        <td>{pihak1Jabatan}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">Alamat</td>
                        <td>:</td>
                        <td>{pihak1Alamat}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">No. Telepon / WA</td>
                        <td>:</td>
                        <td>{pihak1Hp}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[11px] italic text-gray-600 ml-2 sm:ml-4 mt-0.5">
                    Selanjutnya dalam surat perjanjian ini disebut sebagai <strong>PIHAK PERTAMA</strong>.
                  </p>
                </div>

                {/* PIHAK KEDUA */}
                <div>
                  <p className="font-bold font-sans text-gray-900">
                    II. PIHAK KEDUA (PENYEWA):
                  </p>
                  <table className="w-full text-left ml-2 sm:ml-4 text-[11px] sm:text-xs">
                    <tbody>
                      <tr>
                        <td className="w-36 font-semibold">Nama Lengkap</td>
                        <td className="w-3">:</td>
                        <td className="font-bold uppercase">{pihak2Nama}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">No. KTP / NIK</td>
                        <td>:</td>
                        <td className="font-mono">{pihak2Nik || '-'}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">No. WhatsApp / HP</td>
                        <td>:</td>
                        <td className="font-mono">{pihak2Hp}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">Alamat KTP / Domisili</td>
                        <td>:</td>
                        <td>{pihak2Alamat}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold">Pekerjaan</td>
                        <td>:</td>
                        <td>{pihak2Pekerjaan}</td>
                      </tr>
                      {/* RINCIAN KHUSUS KENDARAAN (PARKIR) */}
                      {pihak2Plat && pihak2Plat !== '-' && (
                        <tr>
                          <td className="font-semibold text-blue-900">No. Polisi / Plat Kendaraan</td>
                          <td>:</td>
                          <td className="font-mono font-bold text-blue-950">{pihak2Plat}</td>
                        </tr>
                      )}
                      {agreementType === 'parkir' && pihak2JenisKendaraan && (
                        <tr>
                          <td className="font-semibold text-blue-900">Jenis / Merk Kendaraan</td>
                          <td>:</td>
                          <td>{pihak2JenisKendaraan}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <p className="text-[11px] italic text-gray-600 ml-2 sm:ml-4 mt-0.5">
                    Selanjutnya dalam surat perjanjian ini disebut sebagai <strong>PIHAK KEDUA</strong>.
                  </p>
                </div>
              </div>

              <p className="text-justify">
                Kedua belah pihak telah bersepakat untuk mengikatkan diri dalam Perjanjian Sewa Menyewa ini dengan syarat-syarat dan ketentuan-ketentuan yang diatur dalam pasal-pasal berikut:
              </p>

              {/* PASAL-PASAL KONTRAK */}
              <div className="space-y-3 pt-1">
                {/* PASAL 1 */}
                <div>
                  <h4 className="font-bold font-sans text-center text-xs uppercase">
                    {pasal1Judul}
                  </h4>
                  <div className="text-justify mt-1 whitespace-pre-line">
                    {pasal1Isi}
                  </div>
                </div>

                {/* PASAL 2 */}
                <div>
                  <h4 className="font-bold font-sans text-center text-xs uppercase">
                    {pasal2Judul}
                  </h4>
                  <div className="text-justify mt-1 whitespace-pre-line">
                    {pasal2Isi}
                  </div>
                </div>

                {/* PASAL 3 */}
                <div>
                  <h4 className="font-bold font-sans text-center text-xs uppercase">
                    {pasal3Judul}
                  </h4>
                  <div className="text-justify mt-1 whitespace-pre-line">
                    {pasal3Isi}
                  </div>
                </div>

                {/* PASAL 4 */}
                <div>
                  <h4 className="font-bold font-sans text-center text-xs uppercase">
                    {pasal4Judul}
                  </h4>
                  <div className="text-justify mt-1 whitespace-pre-line">
                    {pasal4Isi}
                  </div>
                </div>

                {/* PASAL 5 */}
                <div>
                  <h4 className="font-bold font-sans text-center text-xs uppercase">
                    {pasal5Judul}
                  </h4>
                  <div className="text-justify mt-1 whitespace-pre-line">
                    {pasal5Isi}
                  </div>
                </div>

                {/* PASAL 6 */}
                <div>
                  <h4 className="font-bold font-sans text-center text-xs uppercase">
                    {pasal6Judul}
                  </h4>
                  <div className="text-justify mt-1 whitespace-pre-line">
                    {pasal6Isi}
                  </div>
                </div>

                {/* CATATAN KHUSUS */}
                {catatanKhusus && (
                  <div className="bg-gray-50/70 p-2.5 rounded border border-gray-200 text-[11px]">
                    <strong>Catatan / Ketentuan Khusus Tambahan:</strong> {catatanKhusus}
                  </div>
                )}
              </div>

              {/* KALIMAT PENUTUP */}
              <p className="text-justify pt-2">
                {penutupText}
              </p>

              {/* KOLOM TANDA TANGAN KEDUA BELAH PIHAK */}
              {/* CATATAN: PADA KOLOM PIHAK PERTAMA, HILANGKAN TEKS "MM SPACE MANAGEMENT" SEPERTI PERMINTAAN USER */}
              <div className="pt-4 flex justify-between items-start text-center font-sans text-xs">
                <div className="w-52 space-y-1">
                  <p className="font-semibold text-gray-700">PIHAK KEDUA (PENYEWA)</p>
                  <div className="h-20 flex items-center justify-center border-b border-gray-400">
                    <span className="text-[10px] text-gray-400 italic">(Tanda Tangan Penyewa)</span>
                  </div>
                  <p className="font-bold text-gray-900 uppercase mt-2">{pihak2Nama}</p>
                  <p className="text-[10px] text-gray-500">
                    {agreementType === 'parkir' ? 'Penyewa Slot Parkir' : 'Penyewa Unit'}
                  </p>
                </div>

                <div className="w-56 space-y-1">
                  <p className="text-gray-600">Manokwari, {formatIndoDate(tanggalPerjanjian)}</p>
                  <p className="font-semibold text-gray-700">PIHAK PERTAMA</p>
                  <div className="h-20 flex flex-col items-center justify-center border-b border-gray-400 relative">
                    <div className="border border-dashed border-gray-400 text-[8px] text-gray-400 px-2 py-1 rounded select-none absolute left-2 top-2">
                      Materai 10.000
                    </div>
                    {/* Bersih dari teks "MM Space Management" */}
                  </div>
                  <p className="font-bold text-gray-900 underline mt-2">{pihak1Nama}</p>
                  <p className="text-[10px] text-gray-500">{pihak1Jabatan}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PETUNJUK SIMPAN KE PDF (NO-PRINT) */}
        {showPdfTip && (
          <div className="no-print bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl text-xs space-y-1 animate-in fade-in duration-150">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Petunjuk Ekspor Surat Perjanjian ke PDF:
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-blue-800 ml-1">
              <li>Pastikan tab berada pada <strong>&quot;Pratinjau &amp; Cetak&quot;</strong>.</li>
              <li>Klik tombol <strong>&quot;Cetak / Simpan PDF&quot;</strong> di bawah.</li>
              <li>Pada opsi <strong>Tujuan / Destination</strong>, pilih <strong>&quot;Save as PDF&quot; (Simpan sebagai PDF)</strong>.</li>
              <li>Pilih ukuran kertas A4, margin default/none, lalu klik tombol <strong>Save / Simpan</strong>. Berkas surat resmi Anda akan tersimpan otomatis.</li>
            </ol>
          </div>
        )}

        {/* MODAL ACTIONS (NO-PRINT) */}
        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowPdfTip(!showPdfTip)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Info PDF</span>
            </button>
            <button
              onClick={handleCopyText}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-gray-300 hover:bg-gray-100 text-gray-700 flex items-center gap-1 transition"
              title="Salin isi surat perjanjian lengkap untuk dikirim via WA / email"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Tersalin!' : 'Salin Teks Perjanjian'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeTab === 'editor' ? (
              <button
                onClick={() => setActiveTab('preview')}
                className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Lihat Pratinjau Dokumen</span>
              </button>
            ) : (
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-initial bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                title="Cetak langsung atau simpan menjadi file PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-300 hover:bg-gray-100 text-gray-700 transition"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
