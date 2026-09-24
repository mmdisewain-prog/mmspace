import React, { useState } from 'react';
import { Tenant, CATEGORY_INFO } from '../types';
import {
  formatRupiah,
  formatIndoDate,
  getDaysRemaining,
  createWhatsAppReminderUrl,
} from '../utils/formatters';
import {
  Search,
  Filter,
  Plus,
  FileText,
  MessageCircle,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderOpen,
  Table as TableIcon,
  RefreshCw,
  Eye,
  ShieldCheck,
  Users,
} from 'lucide-react';

interface TenantTableProps {
  tenants: Tenant[];
  isAdmin: boolean;
  onEditTenant: (tenant: Tenant) => void;
  onDeleteTenant: (id: number, name: string) => void;
  onToggleStatus: (id: number) => void;
  onOpenKwitansi: (tenant: Tenant) => void;
  onOpenSuratPerjanjian?: (tenant: Tenant) => void;
  onPreviewDoc: (title: string, src: string, driveUrl?: string) => void;
  onAddNew: () => void;
  onSyncGoogle?: () => void;
  isSyncing?: boolean;
  spreadsheetUrl?: string | null;
  driveFolderUrl?: string | null;
  lastSyncTime?: string | null;
}

export const TenantTable: React.FC<TenantTableProps> = ({
  tenants,
  isAdmin,
  onEditTenant,
  onDeleteTenant,
  onToggleStatus,
  onOpenKwitansi,
  onOpenSuratPerjanjian,
  onPreviewDoc,
  onAddNew,
  onSyncGoogle,
  isSyncing = false,
  spreadsheetUrl,
  driveFolderUrl,
  lastSyncTime,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Compute urgent tenants (< 7 days or overdue)
  const activeTenants = tenants.filter((t) => t.contractStatus === 'Aktif');
  const overdueTenants = activeTenants.filter((t) => {
    const days = getDaysRemaining(t.jatuhTempo);
    return days !== null && days < 0;
  });
  const dueTodayTenants = activeTenants.filter((t) => {
    const days = getDaysRemaining(t.jatuhTempo);
    return days === 0;
  });
  const dueSoon7Tenants = activeTenants.filter((t) => {
    const days = getDaysRemaining(t.jatuhTempo);
    return days !== null && days > 0 && days <= 7;
  });
  const totalCritical7Tenants = overdueTenants.length + dueTodayTenants.length + dueSoon7Tenants.length;

  // Filtering
  const filteredTenants = tenants.filter((t) => {
    const q = search.toLowerCase();
    const matchQuery =
      t.nama.toLowerCase().includes(q) ||
      t.unit.toLowerCase().includes(q) ||
      (t.noHp && t.noHp.includes(q)) ||
      (t.plat && t.plat.toLowerCase().includes(q));

    if (!matchQuery) return false;

    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) {
      return false;
    }

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CRITICAL_7') {
      const days = getDaysRemaining(t.jatuhTempo);
      return days !== null && days <= 7 && t.contractStatus === 'Aktif';
    }
    if (statusFilter === 'AKTIF') return t.contractStatus === 'Aktif';
    if (statusFilter === 'VERIF') return t.status === 'Proses Verifikasi';
    if (statusFilter === 'LUNAS') return t.status === 'Lunas';
    if (statusFilter === 'KURANG') return t.kurangBayar > 0;
    if (statusFilter === 'SELESAI') return t.contractStatus === 'Selesai';
    if (statusFilter === 'OVERDUE') {
      const days = getDaysRemaining(t.jatuhTempo);
      return days !== null && days < 0 && t.contractStatus === 'Aktif';
    }
    if (statusFilter === 'SOON') {
      const days = getDaysRemaining(t.jatuhTempo);
      return days !== null && days >= 0 && days <= 14 && t.contractStatus === 'Aktif';
    }

    return true;
  });

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Hapus data penyewa "${name}"? Tindakan ini akan menghapus data dari daftar.`)) {
      onDeleteTenant(id, name);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden space-y-4 p-5">
      {/* HEADER & FILTER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Daftar Status Penyewa Unit MM Space</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {filteredTenants.length} Data
            </span>
            {totalCritical7Tenants > 0 && (
              <span className="bg-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1 shadow-2xs">
                <AlertTriangle className="w-3 h-3" />
                {totalCritical7Tenants} Perlu Tindak Lanjut (&lt; 7 Hari)
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Daftar lengkap penyewa, status pembayaran, jatuh tempo, serta arsip dokumen KTP & Bukti di Google Drive.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              {onSyncGoogle && (
                <button
                  onClick={onSyncGoogle}
                  disabled={isSyncing}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                  title="Sinkronkan data ke Google Drive dan Google Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                  {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan ke Google'}
                </button>
              )}

              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                  title="Buka Spreadsheet di Google Sheets"
                >
                  <TableIcon className="w-3.5 h-3.5 text-emerald-600" />
                  Buka Google Sheet
                </a>
              )}

              {driveFolderUrl && (
                <a
                  href={driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                  title="Buka Folder Berkas di Google Drive"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-purple-600" />
                  Folder Drive
                </a>
              )}

              <button
                onClick={onAddNew}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Tambah Penyewa
              </button>
            </>
          )}
        </div>
      </div>

      {/* ALERT NOTIFIKASI KHUSUS ADMIN: JATUH TEMPO < 7 HARI & MENUNGGAK */}
      {isAdmin && totalCritical7Tenants > 0 && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm">
                  Peringatan Jatuh Tempo: {totalCritical7Tenants} Penyewa Memerlukan Tindak Lanjut Segera
                </h3>
                <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Urgent
                </span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {overdueTenants.length > 0 && (
                  <span className="font-bold text-rose-700 mr-2">
                    ⚠️ {overdueTenants.length} telah lewat tempo (menunggak)
                  </span>
                )}
                {dueTodayTenants.length > 0 && (
                  <span className="font-bold text-amber-700 mr-2">
                    ⚡ {dueTodayTenants.length} jatuh tempo hari ini
                  </span>
                )}
                {dueSoon7Tenants.length > 0 && (
                  <span className="font-medium text-amber-900">
                    ⏱️ {dueSoon7Tenants.length} jatuh tempo dalam &lt; 7 hari
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setStatusFilter(statusFilter === 'CRITICAL_7' ? 'ALL' : 'CRITICAL_7')}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 ${
                statusFilter === 'CRITICAL_7'
                  ? 'bg-gray-900 text-white hover:bg-black'
                  : 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                {statusFilter === 'CRITICAL_7'
                  ? 'Tampilkan Semua Penyewa'
                  : `Tampilkan ${totalCritical7Tenants} Penyewa Kritis (< 7 Hari)`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* FILTER & PENCARIAN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, unit, no HP, plat..."
            className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-2.5 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-medium"
          >
            <option value="ALL">Semua Status Sewa</option>
            {totalCritical7Tenants > 0 && (
              <option value="CRITICAL_7" className="font-bold text-rose-600 bg-rose-50">
                🚨 Jatuh Tempo &lt; 7 Hari / Menunggak ({totalCritical7Tenants})
              </option>
            )}
            <option value="AKTIF">Sedang Aktif Menyewa</option>
            <option value="SOON">Segera Jatuh Tempo (≤ 14 Hari)</option>
            <option value="OVERDUE">Lewat Jatuh Tempo / Menunggak</option>
            <option value="KURANG">Memiliki Sisa Kurang Bayar</option>
            <option value="VERIF">Menunggu Verifikasi</option>
            <option value="LUNAS">Pembayaran Lunas</option>
            <option value="SELESAI">Kontrak Selesai / Berakhir</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-2.5 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-medium"
          >
            <option value="ALL">Semua Kategori Unit</option>
            {CATEGORY_INFO.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.icon} {cat.category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {lastSyncTime && (
        <div className="text-[11px] text-gray-500 flex items-center justify-end gap-1 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Terakhir tersinkron Google: {lastSyncTime}
        </div>
      )}

      {/* TABEL RESPONSIVE */}
      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-100">
              <th className="p-3.5">Unit / Lahan</th>
              <th className="p-3.5">Penyewa</th>
              {isAdmin && <th className="p-3.5">Kontak WhatsApp</th>}
              <th className="p-3.5">Jatuh Tempo</th>
              {isAdmin && (
                <>
                  <th className="p-3.5">Total Biaya</th>
                  <th className="p-3.5">Sisa Tagihan</th>
                  <th className="p-3.5">Deposit Jaminan</th>
                  <th className="p-3.5">Berkas (Drive)</th>
                </>
              )}
              <th className="p-3.5">Status Bayar</th>
              {isAdmin && <th className="p-3.5 text-center">Aksi / Pengingat</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTenants.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 10 : 4}
                  className="p-10 text-center text-gray-500 font-medium"
                >
                  {tenants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-xs">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-gray-800 text-sm">Belum Ada Data Penyewa Terdaftar</p>
                      <p className="text-xs text-gray-500 max-w-sm">
                        Database penyewa dalam keadaan bersih untuk penggunaan resmi (live/production).
                      </p>
                      {isAdmin && onAddNew && (
                        <button
                          onClick={onAddNew}
                          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Catat Penyewa Baru</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    'Tidak ada data penyewa yang sesuai filter atau pencarian.'
                  )}
                </td>
              </tr>
            ) : (
              filteredTenants.map((item) => {
                const daysLeft = getDaysRemaining(item.jatuhTempo);
                const waReminderUrl = createWhatsAppReminderUrl(item);

                const isUrgentDue = item.contractStatus === 'Aktif' && daysLeft !== null && daysLeft <= 7;
                const isOverdue = item.contractStatus === 'Aktif' && daysLeft !== null && daysLeft < 0;
                const isDueToday = item.contractStatus === 'Aktif' && daysLeft === 0;

                const rowBgClass = isOverdue
                  ? 'bg-rose-50/60 hover:bg-rose-100/60 border-l-4 border-l-rose-600'
                  : isDueToday
                  ? 'bg-orange-50/80 hover:bg-orange-100/70 border-l-4 border-l-orange-500'
                  : isUrgentDue
                  ? 'bg-amber-50/60 hover:bg-amber-100/60 border-l-4 border-l-amber-500'
                  : 'hover:bg-blue-50/20';

                return (
                  <tr key={item.id} className={`${rowBgClass} transition`}>
                    {/* UNIT */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="font-bold text-gray-900">{item.unit}</div>
                        {isOverdue && (
                          <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                            Overdue
                          </span>
                        )}
                        {isDueToday && (
                          <span className="text-[9px] bg-orange-600 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-bounce">
                            Hari Ini
                          </span>
                        )}
                        {!isOverdue && !isDueToday && isUrgentDue && (
                          <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                            &lt; 7 Hari
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-semibold">
                          {item.category}
                        </span>
                        {item.contractStatus === 'Selesai' && (
                          <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                            Selesai
                          </span>
                        )}
                      </div>
                    </td>

                    {/* NAMA PENYEWA */}
                    <td className="p-3.5">
                      <div className="font-bold text-gray-900">{item.nama}</div>
                      {isAdmin && item.nik && (
                        <div className="text-[10px] font-mono text-gray-400">NIK: {item.nik}</div>
                      )}
                      {item.plat && item.plat !== '-' && (
                        <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                          Ket / Plat: <span className="font-mono font-bold text-gray-700">{item.plat}</span>
                        </div>
                      )}
                    </td>

                    {/* KONTAK (ADMIN ONLY) */}
                    {isAdmin && (
                      <td className="p-3.5 font-mono">
                        <a
                          href={`https://wa.me/${item.noHp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          {item.noHp}
                        </a>
                      </td>
                    )}

                    {/* JATUH TEMPO */}
                    <td className="p-3.5">
                      <div className="font-mono text-gray-800 font-medium">
                        {formatIndoDate(item.jatuhTempo)}
                      </div>
                      <div className="mt-1">
                        {item.contractStatus === 'Selesai' ? (
                          <span className="text-[10px] text-gray-500 font-semibold">Kontrak Berakhir</span>
                        ) : daysLeft !== null ? (
                          daysLeft < 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-black inline-flex items-center gap-1 shadow-2xs w-fit">
                                <AlertTriangle className="w-3 h-3 text-white animate-pulse" />
                                LEWAT {Math.abs(daysLeft)} HARI
                              </span>
                              <span className="text-[9px] text-rose-700 font-bold">Harap Hubungi Penyewa</span>
                            </div>
                          ) : daysLeft === 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded-full font-black inline-flex items-center gap-1 shadow-2xs w-fit animate-pulse">
                                <Clock className="w-3 h-3 text-white" />
                                HARI INI JATUH TEMPO
                              </span>
                              <span className="text-[9px] text-orange-700 font-bold">Konfirmasi Pembayaran</span>
                            </div>
                          ) : daysLeft <= 7 ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-400 px-2 py-0.5 rounded-full font-black inline-flex items-center gap-1 shadow-2xs w-fit">
                                <Clock className="w-3 h-3 text-amber-700" />
                                ⚠️ &lt; 7 HARI ({daysLeft} Hari Lagi)
                              </span>
                              <span className="text-[9px] text-amber-800 font-bold">Segera Kirim Pengingat</span>
                            </div>
                          ) : daysLeft <= 14 ? (
                            <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5 text-blue-600" /> {daysLeft} Hari Lagi
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> {daysLeft} Hari
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-gray-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* KEUANGAN (ADMIN ONLY) */}
                    {isAdmin && (
                      <>
                        <td className="p-3.5 font-medium font-mono text-gray-900">
                          <div>{formatRupiah(item.tarif)}</div>
                          <div className="text-[10px] text-gray-400">
                            {item.durasi} {item.satuan}
                          </div>
                        </td>

                        <td className="p-3.5 font-mono">
                          {item.kurangBayar > 0 ? (
                            <div className="font-bold text-rose-600">
                              {formatRupiah(item.kurangBayar)}
                              <span className="block text-[10px] text-rose-500 font-normal">Belum Lunas</span>
                            </div>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              Lunas
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit ${
                                item.depositPaid
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {item.depositPaid ? '✓ Lunas' : '✕ Belum'}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500">
                              {formatRupiah(item.depositNominal)}
                            </span>
                          </div>
                        </td>

                        {/* BERKAS GOOGLE DRIVE */}
                        <td className="p-3.5">
                          <div className="flex flex-col gap-1">
                            {item.ktpData || item.ktpDriveUrl ? (
                              <button
                                onClick={() =>
                                  onPreviewDoc(
                                    `Foto KTP - ${item.nama}`,
                                    item.ktpData || item.ktpDriveUrl || '',
                                    item.ktpDriveUrl
                                  )
                                }
                                className="inline-flex items-center gap-1 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-1 rounded border border-blue-200 transition"
                              >
                                <Eye className="w-3 h-3 text-blue-600" />
                                KTP
                                {item.ktpDriveUrl && <span className="text-blue-900 font-bold">☁️</span>}
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400">KTP: -</span>
                            )}

                            {item.buktiData || item.buktiDriveUrl ? (
                              <button
                                onClick={() =>
                                  onPreviewDoc(
                                    `Bukti Transfer - ${item.nama}`,
                                    item.buktiData || item.buktiDriveUrl || '',
                                    item.buktiDriveUrl
                                  )
                                }
                                className="inline-flex items-center gap-1 text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold px-2 py-1 rounded border border-purple-200 transition"
                              >
                                <Eye className="w-3 h-3 text-purple-600" />
                                Bukti
                                {item.buktiDriveUrl && <span className="text-purple-900 font-bold">☁️</span>}
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400">Bukti: -</span>
                            )}
                          </div>
                        </td>
                      </>
                    )}

                    {/* STATUS BAYAR */}
                    <td className="p-3.5">
                      {item.status === 'Lunas' ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Lunas
                        </span>
                      ) : item.status === 'Sebagian' ? (
                        <span className="bg-sky-100 text-sky-800 text-[10px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> DP / Sebagian
                        </span>
                      ) : item.status === 'Proses Verifikasi' ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Verifikasi
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-800 text-[10px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Belum Bayar
                        </span>
                      )}
                    </td>

                    {/* AKSI (ADMIN ONLY) */}
                    {isAdmin && (
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <a
                            href={waReminderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition shadow-2xs ${
                              isOverdue
                                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-300'
                                : isDueToday
                                ? 'bg-orange-600 hover:bg-orange-700 text-white ring-2 ring-orange-300 animate-pulse'
                                : isUrgentDue
                                ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-300'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                            title={
                              isOverdue
                                ? `PERINGATAN: Lewat tempo ${Math.abs(daysLeft!)} hari! Klik untuk kirim tagihan WhatsApp`
                                : isDueToday
                                ? 'PERINGATAN: Jatuh tempo hari ini! Klik untuk konfirmasi via WhatsApp'
                                : isUrgentDue
                                ? `Jatuh tempo tinggal ${daysLeft} hari! Klik untuk kirim pengingat WhatsApp`
                                : 'Kirim pengingat WhatsApp ke penyewa'
                            }
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>
                              {isOverdue ? 'Tagih Overdue' : isDueToday ? 'Tagih Hari Ini' : isUrgentDue ? 'Remind (<7 Hari)' : 'Remind'}
                            </span>
                          </a>

                          <button
                            onClick={() => onOpenKwitansi(item)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition"
                            title="Buka Kwitansi Resmi Pembayaran"
                          >
                            <FileText className="w-3 h-3 text-blue-600" />
                            Kwitansi
                          </button>

                          {onOpenSuratPerjanjian && (
                            <button
                              onClick={() => onOpenSuratPerjanjian(item)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition"
                              title="Buka & Cetak Surat Perjanjian Sewa (PDF)"
                            >
                              <FileText className="w-3 h-3 text-indigo-600" />
                              Surat SPK
                            </button>
                          )}

                          <button
                            onClick={() => onEditTenant(item)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] p-1.5 rounded-lg font-semibold transition"
                            title="Edit Data Lengkap Penyewa"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => onToggleStatus(item.id)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] px-1.5 py-1 rounded-lg font-semibold transition"
                            title="Ubah Cepat Status Lunas / Belum"
                          >
                            Status
                          </button>

                          <button
                            onClick={() => handleDelete(item.id, item.nama)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition"
                            title="Hapus Data Penyewa"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
