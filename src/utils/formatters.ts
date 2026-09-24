import { Tenant } from '../types';

export function formatRupiah(angka: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(angka || 0);
}

export function terbilang(angka: number): string {
  const nominal = Math.floor(Math.abs(angka || 0));
  const bil = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  if (nominal < 12) return bil[nominal];
  if (nominal < 20) return terbilang(nominal - 10) + ' Belas';
  if (nominal < 100) return terbilang(Math.floor(nominal / 10)) + ' Puluh ' + terbilang(nominal % 10);
  if (nominal < 200) return 'Seratus ' + terbilang(nominal - 100);
  if (nominal < 1000) return terbilang(Math.floor(nominal / 100)) + ' Ratus ' + terbilang(nominal % 100);
  if (nominal < 2000) return 'Seribu ' + terbilang(nominal - 1000);
  if (nominal < 1000000)
    return terbilang(Math.floor(nominal / 1000)) + ' Ribu ' + terbilang(nominal % 1000);
  if (nominal < 1000000000)
    return terbilang(Math.floor(nominal / 1000000)) + ' Juta ' + terbilang(nominal % 1000000);
  if (nominal < 1000000000000)
    return terbilang(Math.floor(nominal / 1000000000)) + ' Miliar ' + terbilang(nominal % 1000000000);

  return nominal.toString();
}

export function calculateJatuhTempo(
  tglMulaiStr: string,
  durasi: number,
  satuan: 'Tahun' | 'Bulan'
): string {
  if (!tglMulaiStr) return '-';
  const d = new Date(tglMulaiStr);
  if (isNaN(d.getTime())) return '-';
  if (satuan === 'Bulan') {
    d.setMonth(d.getMonth() + Number(durasi));
  } else {
    d.setFullYear(d.getFullYear() + Number(durasi));
  }
  return d.toISOString().split('T')[0];
}

export function getDaysRemaining(targetDateStr: string): number | null {
  if (!targetDateStr || targetDateStr === '-') return null;
  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatIndoDate(dateStr: string): string {
  if (!dateStr || dateStr === '-') return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function normalizePhone(rawPhone: string): string {
  let p = rawPhone.replace(/\D/g, '');
  if (p.startsWith('0')) {
    p = '62' + p.substring(1);
  } else if (!p.startsWith('62')) {
    p = '62' + p;
  }
  return p;
}

export async function hashPassword(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateKwitansiNumber(id: number): string {
  const year = new Date().getFullYear();
  const seq = (id % 10000).toString().padStart(4, '0');
  return `KW/MMS/${year}/${seq}`;
}

export function createWhatsAppReminderUrl(tenant: Tenant): string {
  const phone = normalizePhone(tenant.noHp);
  const jatuhTempo = formatIndoDate(tenant.jatuhTempo);
  const daysLeft = getDaysRemaining(tenant.jatuhTempo);

  let statusHeader = '📋 *PENGINGAT JADWAL JATUH TEMPO SEWA PROPERTI*\n\n';
  if (daysLeft !== null) {
    if (daysLeft < 0) {
      statusHeader = `🚨 *PEMBERITAHUAN: MASA SEWA TELAH JATUH TEMPO (LEWAT ${Math.abs(daysLeft)} HARI)*\n\n`;
    } else if (daysLeft === 0) {
      statusHeader = `⚡ *PEMBERITAHUAN: MASA SEWA JATUH TEMPO HARI INI (${jatuhTempo})*\n\n`;
    } else if (daysLeft <= 7) {
      statusHeader = `⚠️ *PERINGATAN: JATUH TEMPO SEWA KURANG DARI 7 HARI (${daysLeft} HARI LAGI)*\n\n`;
    }
  }

  const statusDepo = tenant.depositPaid
    ? `Sudah Dibayar (${formatRupiah(tenant.depositNominal)})`
    : `Belum Dibayar (${formatRupiah(tenant.depositNominal)})`;

  const infoKurang =
    tenant.kurangBayar > 0
      ? `⚠️ *Sisa Kurang Bayar:* ${formatRupiah(tenant.kurangBayar)}\n`
      : `✅ *Status Pembayaran:* Lunas\n`;

  const infoSisaWaktu =
    daysLeft !== null
      ? daysLeft < 0
        ? `⚠️ *Keterangan Waktu:* Telah lewat ${Math.abs(daysLeft)} hari\n`
        : daysLeft === 0
        ? `⚡ *Keterangan Waktu:* Jatuh tempo hari ini\n`
        : daysLeft <= 7
        ? `⏳ *Sisa Waktu:* ${daysLeft} hari lagi menuju jatuh tempo\n`
        : `⏳ *Sisa Waktu:* ${daysLeft} hari\n`
      : '';

  const pesan =
    statusHeader +
    `Halo Bapak/Ibu *${tenant.nama}*,\n\n` +
    `Semoga sehat dan sukses selalu. 🙏\n\n` +
    `Kami dari pengelola *MM SPACE* ingin menginformasikan rincian status sewa unit Anda:\n\n` +
    `📌 *Unit:* ${tenant.unit}\n` +
    `⏱️ *Durasi:* ${tenant.durasi} ${tenant.satuan}\n` +
    `📅 *Jatuh Tempo:* ${jatuhTempo}\n` +
    infoSisaWaktu +
    `💰 *Total Biaya Sewa:* ${formatRupiah(tenant.tarif)}\n` +
    infoKurang +
    `🛡️ *Status Deposit:* ${statusDepo}\n\n` +
    `💳 *Rekening Resmi Pembayaran:*\n` +
    `Bank: *BRI*\n` +
    `No. Rekening: *035301000763566*\n` +
    `Atas Nama: *Meinatri Cykitta Mandacan*\n\n` +
    `Mohon melakukan konfirmasi perpanjangan sewa dan bukti transfer pembayaran jika telah melakukan transaksi. Terima kasih banyak atas kerja sama yang baik. ✨\n\n` +
    `Salam hormat,\n` +
    `*Meinatri Cykitta Mandacan* - MM Space`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`;
}

export function createWhatsAppReceiptUrl(tenant: Tenant): string {
  const phone = normalizePhone(tenant.noHp);
  const noKw = generateKwitansiNumber(tenant.id);
  const tgl = formatIndoDate(new Date().toISOString().split('T')[0]);
  const statusDepo = tenant.depositPaid
    ? `Lunas (${formatRupiah(tenant.depositNominal)})`
    : `Belum Dibayar (${formatRupiah(tenant.depositNominal)})`;

  const pesan =
    `*MM SPACE - KWITANSI RESMI PEMBAYARAN*\n` +
    `Jl. Pertanian Wosi, Manokwari, Papua Barat\n` +
    `WhatsApp: 0812 888 19743\n` +
    `No: *${noKw}*\n` +
    `----------------------------------------\n` +
    `*Telah Diterima Dari:* Bapak/Ibu ${tenant.nama}\n` +
    `*Uang Sejumlah:* "${terbilang(tenant.tarif).trim()} Rupiah"\n` +
    `*Untuk Pembayaran:* Sewa ${tenant.unit} (${tenant.durasi} ${tenant.satuan})\n` +
    `*Periode Sewa:* ${formatIndoDate(tenant.tglMulai)} s/d ${formatIndoDate(tenant.jatuhTempo)}\n` +
    `*Status Deposit:* ${statusDepo}\n` +
    `*Sisa Kurang Bayar:* ${formatRupiah(tenant.kurangBayar)}\n` +
    `*Total Biaya Sewa:* ${formatRupiah(tenant.tarif)},-\n` +
    `----------------------------------------\n` +
    `Manokwari, ${tgl}\n` +
    `*Penerima / Pengelola:* Meinatri C. Mandacan\n\n` +
    `Terima kasih atas pembayaran dan kepercayaan Anda di MM Space. 🙏✨`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`;
}
