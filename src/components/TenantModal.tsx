import React, { useState, useEffect } from 'react';
import { Tenant, ALL_UNITS, UnitDefinition } from '../types';
import { calculateJatuhTempo, formatRupiah } from '../utils/formatters';
import { X, Save, User, Phone, Calendar, CreditCard } from 'lucide-react';

interface TenantModalProps {
  tenant: Tenant | null; // null means adding new tenant
  units?: UnitDefinition[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (tenant: Tenant) => void;
}

export const TenantModal: React.FC<TenantModalProps> = ({
  tenant,
  units = ALL_UNITS,
  isOpen,
  onClose,
  onSave,
}) => {
  const currentUnits = units && units.length > 0 ? units : ALL_UNITS;

  const [formData, setFormData] = useState<Partial<Tenant>>({
    nama: '',
    nik: '',
    noHp: '',
    unit: currentUnits[0].name,
    category: currentUnits[0].category,
    tglMulai: new Date().toISOString().split('T')[0],
    durasi: 1,
    satuan: currentUnits[0].satuan,
    jatuhTempo: '',
    plat: '',
    tarif: currentUnits[0].defaultTarif,
    kurangBayar: 0,
    depositNominal: currentUnits[0].defaultDeposit,
    depositPaid: false,
    status: 'Lunas',
    contractStatus: 'Aktif',
    catatan: '',
  });

  useEffect(() => {
    if (tenant) {
      setFormData(tenant);
    } else {
      const defaultUnit = currentUnits[0];
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        id: Date.now(),
        nama: '',
        nik: '',
        noHp: '',
        unit: defaultUnit.name,
        category: defaultUnit.category,
        tglMulai: today,
        durasi: 1,
        satuan: defaultUnit.satuan,
        jatuhTempo: calculateJatuhTempo(today, 1, defaultUnit.satuan),
        plat: '',
        tarif: defaultUnit.defaultTarif,
        kurangBayar: 0,
        depositNominal: defaultUnit.defaultDeposit,
        depositPaid: false,
        status: 'Lunas',
        contractStatus: 'Aktif',
        catatan: '',
        createdAt: today,
      });
    }
  }, [tenant, isOpen]);

  // Recalculate jatuh tempo when tglMulai, durasi, or satuan changes
  const handleDateOrDurationChange = (
    tgl: string,
    durasi: number,
    satuan: 'Tahun' | 'Bulan'
  ) => {
    const jt = calculateJatuhTempo(tgl, durasi, satuan);
    setFormData((prev) => ({
      ...prev,
      tglMulai: tgl,
      durasi,
      satuan,
      jatuhTempo: jt,
    }));
  };

  const handleUnitChange = (unitName: string) => {
    const selected = currentUnits.find((u) => u.name === unitName);
    if (!selected) return;

    const newDurasi = formData.durasi || 1;
    const newSatuan = selected.satuan;
    const newTarif = selected.defaultTarif * newDurasi;
    const newJatuhTempo = calculateJatuhTempo(
      formData.tglMulai || new Date().toISOString().split('T')[0],
      newDurasi,
      newSatuan
    );

    setFormData((prev) => ({
      ...prev,
      unit: selected.name,
      category: selected.category,
      satuan: newSatuan,
      tarif: newTarif,
      depositNominal: selected.defaultDeposit,
      jatuhTempo: newJatuhTempo,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.noHp || !formData.unit) {
      alert('Nama, No HP, dan Unit wajib diisi!');
      return;
    }

    const completedTenant: Tenant = {
      id: formData.id || Date.now(),
      nama: formData.nama,
      nik: formData.nik || '',
      noHp: formData.noHp,
      unit: formData.unit || ALL_UNITS[0].name,
      category: formData.category || ALL_UNITS[0].category,
      plat: formData.plat || '-',
      tglMulai: formData.tglMulai || new Date().toISOString().split('T')[0],
      durasi: Number(formData.durasi) || 1,
      satuan: formData.satuan || 'Tahun',
      jatuhTempo:
        formData.jatuhTempo ||
        calculateJatuhTempo(
          formData.tglMulai || '',
          formData.durasi || 1,
          formData.satuan || 'Tahun'
        ),
      tarif: Number(formData.tarif) || 0,
      kurangBayar: Number(formData.kurangBayar) || 0,
      depositNominal: Number(formData.depositNominal) || 0,
      depositPaid: !!formData.depositPaid,
      status: formData.status || 'Lunas',
      contractStatus: formData.contractStatus || 'Aktif',
      ktpData: formData.ktpData || '',
      buktiData: formData.buktiData || '',
      ktpDriveUrl: formData.ktpDriveUrl || '',
      buktiDriveUrl: formData.buktiDriveUrl || '',
      createdAt: formData.createdAt || new Date().toISOString().split('T')[0],
      catatan: formData.catatan || '',
    };

    onSave(completedTenant);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-gray-200 my-auto">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900 text-base">
              {tenant ? 'Edit Data Penyewa' : 'Tambah Penyewa Baru (Admin)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* IDENTITAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={formData.nama || ''}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Nama penyewa"
                className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                Nomor WhatsApp / HP
              </label>
              <input
                type="text"
                required
                value={formData.noHp || ''}
                onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                placeholder="Contoh: 081288819743"
                className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                NIK / No. Identitas KTP (Opsional)
              </label>
              <input
                type="text"
                value={formData.nik || ''}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                placeholder="16 Digit NIK"
                className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                Plat Kendaraan / Keterangan Usaha
              </label>
              <input
                type="text"
                value={formData.plat || ''}
                onChange={(e) => setFormData({ ...formData, plat: e.target.value })}
                placeholder="Contoh: PB 1234 XX / Toko Elektronik"
                className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* UNIT & PERIODE */}
          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                Pilih Unit Properti
              </label>
              <select
                value={formData.unit || ''}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full border bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {currentUnits.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.icon} {u.name} ({formatRupiah(u.defaultTarif)} / {u.satuan})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  required
                  value={formData.tglMulai || ''}
                  onChange={(e) =>
                    handleDateOrDurationChange(
                      e.target.value,
                      formData.durasi || 1,
                      formData.satuan || 'Tahun'
                    )
                  }
                  className="w-full border bg-white rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Durasi & Satuan
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.durasi || 1}
                    onChange={(e) =>
                      handleDateOrDurationChange(
                        formData.tglMulai || '',
                        Number(e.target.value),
                        formData.satuan || 'Tahun'
                      )
                    }
                    className="w-1/2 border bg-white rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    readOnly
                    value={formData.satuan || 'Tahun'}
                    className="w-1/2 border bg-gray-100 rounded-xl p-2 text-center font-bold text-gray-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Jatuh Tempo (Selesai)
                </label>
                <input
                  type="date"
                  value={formData.jatuhTempo || ''}
                  onChange={(e) => setFormData({ ...formData, jatuhTempo: e.target.value })}
                  className="w-full border bg-white rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* KEUANGAN */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Total Biaya Sewa (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.tarif || 0}
                  onChange={(e) => setFormData({ ...formData, tarif: Number(e.target.value) })}
                  className="w-full border bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Sisa Kurang Bayar (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.kurangBayar || 0}
                  onChange={(e) => setFormData({ ...formData, kurangBayar: Number(e.target.value) })}
                  className="w-full border bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-red-600"
                />
                <span className="text-[10px] text-gray-500">Isi 0 jika sudah lunas</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Nominal Deposit Jaminan (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.depositNominal || 0}
                  onChange={(e) => setFormData({ ...formData, depositNominal: Number(e.target.value) })}
                  className="w-full border bg-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-gray-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Status Pembayaran Deposit
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-gray-800">
                    <input
                      type="radio"
                      name="depositPaid"
                      checked={formData.depositPaid === true}
                      onChange={() => setFormData({ ...formData, depositPaid: true })}
                      className="text-green-600"
                    />
                    <span>Sudah Dibayar (Lunas)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-gray-800">
                    <input
                      type="radio"
                      name="depositPaid"
                      checked={formData.depositPaid === false}
                      onChange={() => setFormData({ ...formData, depositPaid: false })}
                      className="text-red-600"
                    />
                    <span>Belum Dibayar</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* STATUS PEMBAYARAN & KONTRAK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                Status Pembayaran Sewa
              </label>
              <select
                value={formData.status || 'Lunas'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Lunas">Lunas</option>
                <option value="Sebagian">Sebagian (DP / Cicilan)</option>
                <option value="Proses Verifikasi">Proses Verifikasi</option>
                <option value="Belum Bayar">Belum Bayar</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">
                Status Kontrak Properti
              </label>
              <select
                value={formData.contractStatus || 'Aktif'}
                onChange={(e) => setFormData({ ...formData, contractStatus: e.target.value as any })}
                className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Aktif">Aktif (Sedang Menyewa)</option>
                <option value="Proses Verifikasi">Proses Verifikasi</option>
                <option value="Selesai">Selesai (Kontrak Berakhir & Unit Kosong)</option>
                <option value="Batal">Batal Sewa</option>
              </select>
            </div>
          </div>

          {/* CATATAN */}
          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">
              Catatan Khusus / Keperluan Sewa
            </label>
            <input
              type="text"
              value={formData.catatan || ''}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              placeholder="Contoh: Pembayaran tempo 2x transfer, unit disiapkan per 1 Okt"
              className="w-full border rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              Simpan Data Penyewa
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold px-5 py-2.5 rounded-xl transition"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
