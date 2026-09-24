export interface Tenant {
  id: number;
  unit: string;
  category: string;
  nama: string;
  nik?: string;
  noHp: string;
  plat?: string;
  tglMulai: string;
  durasi: number;
  satuan: 'Tahun' | 'Bulan';
  jatuhTempo: string;
  tarif: number;
  kurangBayar: number;
  depositNominal: number;
  depositPaid: boolean;
  status: 'Lunas' | 'Sebagian' | 'Proses Verifikasi' | 'Belum Bayar';
  contractStatus: 'Aktif' | 'Proses Verifikasi' | 'Selesai' | 'Batal';
  ktpData?: string; // base64 or drive link
  buktiData?: string; // base64 or drive link
  ktpDriveUrl?: string;
  buktiDriveUrl?: string;
  driveFolderUrl?: string;
  createdAt?: string;
  catatan?: string;
}

export interface Expense {
  id: number;
  tanggal: string;
  kategori: 'Listrik & Air' | 'Perbaikan & Renovasi' | 'Kebersihan' | 'Keamanan' | 'Pajak & Retribusi' | 'Operasional Lainnya';
  ket: string;
  nominal: number;
  pencatat?: string;
}

export interface UnitDefinition {
  id: string;
  name: string;
  category: 'Ruko' | 'Rumah 5 Kamar' | 'Rumah 2 Kamar' | 'Apartemen Depok' | 'Apartemen Salemba' | 'Lahan Parkir' | 'Gudang' | string;
  defaultTarif: number;
  satuan: 'Tahun' | 'Bulan';
  defaultDeposit: number;
  icon: string;
  description: string;
  nomorUrut?: string;
}

export const ALL_UNITS: UnitDefinition[] = [
  {
    id: 'ruko-1',
    name: 'Ruko Unit 1',
    category: 'Ruko',
    defaultTarif: 25000000,
    satuan: 'Tahun',
    defaultDeposit: 12000000,
    icon: '🏢',
    description: 'Ruko 2 Lantai pinggir jalan raya, cocok untuk usaha / kantor.',
    nomorUrut: 'Ruko 01',
  },
  {
    id: 'rumah5-a',
    name: 'Rumah 5 Kamar - Unit A',
    category: 'Rumah 5 Kamar',
    defaultTarif: 20000000,
    satuan: 'Tahun',
    defaultDeposit: 7000000,
    icon: '🏡',
    description: 'Rumah keluarga 5 kamar tidur luas, ruang tamu, dapur, garasi.',
    nomorUrut: 'Rumah 5K - A',
  },
  {
    id: 'rumah5-b',
    name: 'Rumah 5 Kamar - Unit B',
    category: 'Rumah 5 Kamar',
    defaultTarif: 20000000,
    satuan: 'Tahun',
    defaultDeposit: 7000000,
    icon: '🏡',
    description: 'Rumah keluarga 5 kamar tidur luas, halaman depan luas.',
    nomorUrut: 'Rumah 5K - B',
  },
  {
    id: 'rumah2-1',
    name: 'Rumah 2 Kamar - Rumah No. 01',
    category: 'Rumah 2 Kamar',
    defaultTarif: 12000000,
    satuan: 'Tahun',
    defaultDeposit: 5000000,
    icon: '🏠',
    description: 'Rumah 2 kamar tidur keluarga (Nomor Urut: Rumah No. 01), ruang santai, dapur pribadi, meteran mandiri.',
    nomorUrut: 'Rumah No. 01',
  },
  {
    id: 'rumah2-2',
    name: 'Rumah 2 Kamar - Rumah No. 02',
    category: 'Rumah 2 Kamar',
    defaultTarif: 12000000,
    satuan: 'Tahun',
    defaultDeposit: 5000000,
    icon: '🏠',
    description: 'Rumah 2 kamar tidur keluarga (Nomor Urut: Rumah No. 02), ruang santai, dapur pribadi, meteran mandiri.',
    nomorUrut: 'Rumah No. 02',
  },
  {
    id: 'rumah2-3',
    name: 'Rumah 2 Kamar - Rumah No. 03',
    category: 'Rumah 2 Kamar',
    defaultTarif: 12000000,
    satuan: 'Tahun',
    defaultDeposit: 5000000,
    icon: '🏠',
    description: 'Rumah 2 kamar tidur keluarga (Nomor Urut: Rumah No. 03), ruang santai, dapur pribadi, meteran mandiri.',
    nomorUrut: 'Rumah No. 03',
  },
  {
    id: 'rumah2-4',
    name: 'Rumah 2 Kamar - Rumah No. 04',
    category: 'Rumah 2 Kamar',
    defaultTarif: 12000000,
    satuan: 'Tahun',
    defaultDeposit: 5000000,
    icon: '🏠',
    description: 'Rumah 2 kamar tidur keluarga (Nomor Urut: Rumah No. 04), ruang santai, dapur pribadi, meteran mandiri.',
    nomorUrut: 'Rumah No. 04',
  },
  {
    id: 'rumah2-5',
    name: 'Rumah 2 Kamar - Rumah No. 05',
    category: 'Rumah 2 Kamar',
    defaultTarif: 12000000,
    satuan: 'Tahun',
    defaultDeposit: 5000000,
    icon: '🏠',
    description: 'Rumah 2 kamar tidur keluarga (Nomor Urut: Rumah No. 05), ruang santai, dapur pribadi, meteran mandiri.',
    nomorUrut: 'Rumah No. 05',
  },
  {
    id: 'apt-depok-1',
    name: 'Apartemen Depok Unit 1',
    category: 'Apartemen Depok',
    defaultTarif: 3500000,
    satuan: 'Bulan',
    defaultDeposit: 3500000,
    icon: '🏙️',
    description: 'Apartemen Studio Full Furnished Margonda Depok, akses KRL.',
    nomorUrut: 'Apt Depok 01',
  },
  {
    id: 'apt-salemba-1',
    name: 'Apartemen Salemba Unit 1',
    category: 'Apartemen Salemba',
    defaultTarif: 4000000,
    satuan: 'Bulan',
    defaultDeposit: 4000000,
    icon: '🏢',
    description: 'Apartemen Salemba Jakarta Pusat dekat RSCM & UI Salemba.',
    nomorUrut: 'Apt Salemba 01',
  },
  {
    id: 'parkir-1',
    name: 'Slot Parkir 1',
    category: 'Lahan Parkir',
    defaultTarif: 400000,
    satuan: 'Bulan',
    defaultDeposit: 500000,
    icon: '🚗',
    description: 'Slot parkir kendaraan roda 4 beratap, security & CCTV.',
    nomorUrut: 'Parkir 01',
  },
  {
    id: 'parkir-2',
    name: 'Slot Parkir 2',
    category: 'Lahan Parkir',
    defaultTarif: 400000,
    satuan: 'Bulan',
    defaultDeposit: 500000,
    icon: '🚗',
    description: 'Slot parkir kendaraan roda 4 beratap, security & CCTV.',
    nomorUrut: 'Parkir 02',
  },
  {
    id: 'gudang-1',
    name: 'Gudang Unit 1',
    category: 'Gudang',
    defaultTarif: 15000000,
    satuan: 'Tahun',
    defaultDeposit: 5000000,
    icon: '📦',
    description: 'Ruang gudang penyimpanan material / inventaris tertutup aman.',
    nomorUrut: 'Gudang 01',
  },
];

export const CATEGORY_INFO = [
  { category: 'Ruko', total: 1, icon: '🏢', color: 'blue' },
  { category: 'Rumah 5 Kamar', total: 2, icon: '🏡', color: 'indigo' },
  { category: 'Rumah 2 Kamar', total: 5, icon: '🏠', color: 'sky' },
  { category: 'Apartemen Depok', total: 1, icon: '🏙️', color: 'purple' },
  { category: 'Apartemen Salemba', total: 1, icon: '🏢', color: 'violet' },
  { category: 'Lahan Parkir', total: 2, icon: '🚗', color: 'emerald' },
  { category: 'Gudang', total: 1, icon: '📦', color: 'amber' },
] as const;

export interface HomeSettings {
  namaProperti: string;
  tagline: string;
  deskripsiHero: string;
  lokasi: string;
  noWhatsapp: string;
  whatsappLink: string;
  pesanWaDefault: string;
  namaBank: string;
  cabangBank: string;
  nomorRekening: string;
  atasNamaRekening: string;
  namaPengelola: string;
  kontakPengelola: string;
}

export const DEFAULT_HOME_SETTINGS: HomeSettings = {
  namaProperti: 'MM Space',
  tagline: 'Sewa Rumah & Properti MM Space',
  deskripsiHero: 'Pilihan hunian keluarga nyaman, ruko komersial tepi jalan raya, gudang aman, dan lahan parkir tertata di Manokwari. Fasilitas lengkap, meteran air & listrik mandiri, serta perjanjian resmi yang aman dan terpercaya.',
  lokasi: 'Jl. Pertanian Wosi, Manokwari, Papua Barat',
  noWhatsapp: '0812 888 19743',
  whatsappLink: '6281288819743',
  pesanWaDefault: 'Halo Pengelola MM Space, saya tertarik dan ingin bertanya mengenai sewa unit',
  namaBank: 'BANK BRI',
  cabangBank: 'KC Manokwari',
  nomorRekening: '035301000763566',
  atasNamaRekening: 'Meinatri Cykitta Mandacan',
  namaPengelola: 'MEINATRI CYKITTA MANDACAN',
  kontakPengelola: '0812 888 19743',
};

