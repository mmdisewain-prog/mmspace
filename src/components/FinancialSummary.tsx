import React, { useState } from 'react';
import { Tenant, Expense } from '../types';
import { formatRupiah } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  ShieldCheck,
  PlusCircle,
  Trash2,
} from 'lucide-react';

interface FinancialSummaryProps {
  tenants: Tenant[];
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: number) => void;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  tenants,
  expenses,
  onAddExpense,
  onDeleteExpense,
}) => {
  // Financial Calculations
  const totalPemasukan = tenants.reduce(
    (sum, t) => sum + Math.max(0, t.tarif - (t.kurangBayar || 0)),
    0
  );
  const totalPengeluaran = expenses.reduce((sum, e) => sum + (e.nominal || 0), 0);
  const totalBersih = totalPemasukan - totalPengeluaran;
  const totalPiutang = tenants.reduce((sum, t) => sum + (t.kurangBayar || 0), 0);
  const totalDeposit = tenants.reduce(
    (sum, t) => (t.depositPaid ? sum + (t.depositNominal || 0) : sum),
    0
  );

  // Form state
  const [ket, setKet] = useState('');
  const [nominal, setNominal] = useState<number | ''>('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [kategori, setKategori] = useState<Expense['kategori']>('Perbaikan & Renovasi');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ket || !nominal || Number(nominal) <= 0) {
      alert('Keterangan dan nominal pengeluaran wajib diisi!');
      return;
    }

    const newExpense: Expense = {
      id: Date.now(),
      tanggal,
      kategori,
      ket,
      nominal: Number(nominal),
      pencatat: 'Admin MM Space',
    };

    onAddExpense(newExpense);
    setKet('');
    setNominal('');
  };

  const handleDelete = (id: number, desc: string) => {
    if (window.confirm(`Hapus catatan pengeluaran "${desc}"?`)) {
      onDeleteExpense(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 5 KARTU INDIKATOR KEUANGAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-center text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pemasukan Diterima</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <p className="text-xl font-black font-mono text-emerald-950">
              {formatRupiah(totalPemasukan)}
            </p>
            <p className="text-[10px] text-emerald-700 mt-0.5">Dari pembayaran sewa</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200/80 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-center text-rose-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Pengeluaran</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <p className="text-xl font-black font-mono text-rose-950">
              {formatRupiah(totalPengeluaran)}
            </p>
            <p className="text-[10px] text-rose-700 mt-0.5">Biaya operasional & perbaikan</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200/80 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-center text-blue-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sisa Bersih (Net)</span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <p className={`text-xl font-black font-mono ${totalBersih >= 0 ? 'text-blue-950' : 'text-rose-700'}`}>
              {formatRupiah(totalBersih)}
            </p>
            <p className="text-[10px] text-blue-700 mt-0.5">Pemasukan - Pengeluaran</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-center text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sisa Piutang / Kurang</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <p className="text-xl font-black font-mono text-amber-950">
              {formatRupiah(totalPiutang)}
            </p>
            <p className="text-[10px] text-amber-700 mt-0.5">Tagihan belum dilunasi penyewa</p>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200/80 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-center text-indigo-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Deposit Ditahan</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <p className="text-xl font-black font-mono text-indigo-950">
              {formatRupiah(totalDeposit)}
            </p>
            <p className="text-[10px] text-indigo-700 mt-0.5">Uang jaminan penyewa lunas</p>
          </div>
        </div>
      </div>

      {/* INPUT PENGELUARAN & TABEL PENGELUARAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM INPUT PENGELUARAN */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <PlusCircle className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-gray-900">Catat Pengeluaran Unit</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                Kategori Pengeluaran
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as any)}
                className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
              >
                <option value="Perbaikan & Renovasi">Perbaikan & Renovasi Unit</option>
                <option value="Listrik & Air">Listrik & Air</option>
                <option value="Kebersihan">Kebersihan Lingkungan</option>
                <option value="Keamanan">Keamanan & Parkir</option>
                <option value="Pajak & Retribusi">Pajak & Retribusi</option>
                <option value="Operasional Lainnya">Operasional Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                Keterangan / Keperluan
              </label>
              <input
                type="text"
                required
                value={ket}
                onChange={(e) => setKet(e.target.value)}
                placeholder="Contoh: Beli cat tembok & perbaikan pompa air Ruko"
                className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                Nominal (Rp)
              </label>
              <input
                type="number"
                min="1"
                required
                value={nominal}
                onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 750000"
                className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                Tanggal Pengeluaran
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
            >
              + Simpan Catatan Pengeluaran
            </button>
          </form>
        </div>

        {/* TABEL RIWAYAT PENGELUARAN */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                Riwayat Pengeluaran Operasional ({expenses.length} Transaksi)
              </h3>
              <span className="text-xs font-mono font-bold text-rose-700">
                Total: {formatRupiah(totalPengeluaran)}
              </span>
            </div>

            {expenses.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Belum ada pengeluaran operasional yang dicatat.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[340px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-100">
                    <tr>
                      <th className="p-2.5">Tanggal</th>
                      <th className="p-2.5">Kategori</th>
                      <th className="p-2.5">Keterangan</th>
                      <th className="p-2.5 text-right">Nominal</th>
                      <th className="p-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-gray-50/60">
                        <td className="p-2.5 font-mono text-gray-600 whitespace-nowrap">
                          {exp.tanggal}
                        </td>
                        <td className="p-2.5">
                          <span className="bg-gray-100 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            {exp.kategori}
                          </span>
                        </td>
                        <td className="p-2.5 text-gray-800 font-medium">{exp.ket}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                          {formatRupiah(exp.nominal)}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleDelete(exp.id, exp.ket)}
                            className="text-gray-400 hover:text-rose-600 p-1 transition"
                            title="Hapus Pengeluaran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
