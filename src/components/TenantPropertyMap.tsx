import React, { useState } from 'react';
import { Tenant, ALL_UNITS, UnitDefinition } from '../types';
import {
  formatRupiah,
  formatIndoDate,
  getDaysRemaining,
} from '../utils/formatters';
import {
  MapPin,
  Building2,
  Home,
  Car,
  Warehouse,
  FileText,
  Receipt,
  MessageCircle,
  PlusCircle,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  Edit2,
  Trash2,
  Plus,
  DollarSign,
  X,
} from 'lucide-react';

interface TenantPropertyMapProps {
  tenants: Tenant[];
  units?: UnitDefinition[];
  onSelectUnitToRent?: (unitName: string) => void;
  onOpenKwitansi?: (tenant: Tenant) => void;
  onOpenSuratPerjanjian?: (tenant: Tenant) => void;
  onAddUnit?: (newUnit: UnitDefinition) => void;
  onUpdateUnit?: (updatedUnit: UnitDefinition) => void;
  onDeleteUnit?: (unitId: string) => void;
  isAdmin?: boolean;
}

export const TenantPropertyMap: React.FC<TenantPropertyMapProps> = ({
  tenants,
  units = ALL_UNITS,
  onSelectUnitToRent,
  onOpenKwitansi,
  onOpenSuratPerjanjian,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  isAdmin = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedUnitDetail, setSelectedUnitDetail] = useState<UnitDefinition | null>(null);

  // Modals for unit management
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitDefinition | null>(null);

  // Form states for Add Unit
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Rumah 2 Kamar');
  const [newNomorUrut, setNewNomorUrut] = useState('');
  const [newTarif, setNewTarif] = useState<number>(12000000);
  const [newSatuan, setNewSatuan] = useState<'Tahun' | 'Bulan'>('Tahun');
  const [newDeposit, setNewDeposit] = useState<number>(5000000);
  const [newIcon, setNewIcon] = useState('🏠');
  const [newDescription, setNewDescription] = useState('');

  // Form states for Edit Unit
  const [editTarif, setEditTarif] = useState<number>(0);
  const [editDeposit, setEditDeposit] = useState<number>(0);
  const [editSatuan, setEditSatuan] = useState<'Tahun' | 'Bulan'>('Tahun');
  const [editName, setEditName] = useState('');
  const [editNomorUrut, setEditNomorUrut] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Map active tenants
  const activeTenants = tenants.filter(
    (t) => t.contractStatus === 'Aktif' || t.contractStatus === 'Proses Verifikasi'
  );

  const unitOccupancyMap = new Map<string, Tenant>();
  activeTenants.forEach((t) => {
    unitOccupancyMap.set(t.unit, t);
  });

  const totalUnits = units.length;
  const occupiedCount = units.filter((u) => unitOccupancyMap.has(u.name)).length;
  const availableCount = Math.max(0, totalUnits - occupiedCount);
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedCount / totalUnits) * 100) : 0;

  // Filter units
  const filteredUnits = units.filter((u) => {
    if (selectedCategory === 'Semua') return true;
    return u.category === selectedCategory;
  });

  // Zones for spatial layout
  const rukoUnits = units.filter((u) => u.category === 'Ruko');
  const parkirUnits = units.filter((u) => u.category === 'Lahan Parkir');
  const rumah5Units = units.filter((u) => u.category === 'Rumah 5 Kamar');
  const rumah2Units = units.filter((u) => u.category === 'Rumah 2 Kamar');
  const gudangUnits = units.filter((u) => u.category === 'Gudang');
  const apartemenUnits = units.filter(
    (u) => u.category === 'Apartemen Depok' || u.category === 'Apartemen Salemba'
  );
  const otherUnits = units.filter(
    (u) =>
      !['Ruko', 'Lahan Parkir', 'Rumah 5 Kamar', 'Rumah 2 Kamar', 'Gudang', 'Apartemen Depok', 'Apartemen Salemba'].includes(
        u.category
      )
  );

  const distinctCategories = ['Semua', ...Array.from(new Set(units.map((u) => u.category)))];

  const handleOpenEdit = (unit: UnitDefinition, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingUnit(unit);
    setEditName(unit.name);
    setEditNomorUrut(unit.nomorUrut || '');
    setEditTarif(unit.defaultTarif);
    setEditDeposit(unit.defaultDeposit);
    setEditSatuan(unit.satuan);
    setEditDescription(unit.description);
  };

  const handleSaveEditUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit || !onUpdateUnit) return;

    const updated: UnitDefinition = {
      ...editingUnit,
      name: editName,
      nomorUrut: editNomorUrut || undefined,
      defaultTarif: Number(editTarif),
      defaultDeposit: Number(editDeposit),
      satuan: editSatuan,
      description: editDescription,
    };

    onUpdateUnit(updated);
    setEditingUnit(null);
    if (selectedUnitDetail?.id === updated.id) {
      setSelectedUnitDetail(updated);
    }
  };

  const handleSaveAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !onAddUnit) return;

    const id = 'unit-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const created: UnitDefinition = {
      id,
      name: newName,
      category: newCategory,
      nomorUrut: newNomorUrut || undefined,
      defaultTarif: Number(newTarif) || 0,
      defaultDeposit: Number(newDeposit) || 0,
      satuan: newSatuan,
      icon: newIcon || '🏠',
      description: newDescription || `${newName} properti MM Space.`,
    };

    onAddUnit(created);
    setIsAddUnitModalOpen(false);

    // Reset
    setNewName('');
    setNewNomorUrut('');
    setNewTarif(12000000);
    setNewDeposit(5000000);
    setNewDescription('');
  };

  const handleDeleteClick = (unit: UnitDefinition, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onDeleteUnit) return;

    const isOccupied = unitOccupancyMap.has(unit.name);
    if (isOccupied) {
      alert(`Unit "${unit.name}" masih berstatus disewa oleh ${unitOccupancyMap.get(unit.name)?.nama}. Harap selesaikan sewa sebelum menghapus.`);
      return;
    }

    if (window.confirm(`Yakin ingin menghapus unit "${unit.name}" dari sistem MM Space?`)) {
      onDeleteUnit(unit.id);
      if (selectedUnitDetail?.id === unit.id) {
        setSelectedUnitDetail(null);
      }
    }
  };

  const renderUnitCard = (unit: UnitDefinition, isCompact = false) => {
    const occupant = unitOccupancyMap.get(unit.name);
    const isOccupied = !!occupant;
    const daysLeft = occupant ? getDaysRemaining(occupant.jatuhTempo) : null;
    const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;

    return (
      <div
        key={unit.id}
        onClick={() => setSelectedUnitDetail(unit)}
        className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer border-2 text-left flex flex-col justify-between ${
          isOccupied
            ? 'bg-gradient-to-br from-white to-blue-50/40 border-blue-200 hover:border-blue-400 hover:shadow-md'
            : 'bg-gradient-to-br from-white to-emerald-50/40 border-emerald-300 hover:border-emerald-500 hover:shadow-md'
        } ${isExpiringSoon ? 'ring-2 ring-amber-400' : ''}`}
      >
        {/* HEADER CARD */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xl p-1.5 bg-gray-50 rounded-xl border border-gray-100 shrink-0">
              {unit.icon}
            </span>
            <div className="flex flex-col items-end">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isOccupied
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isOccupied ? '🔴 Terisi' : '🟢 Tersedia'}
              </span>
              {unit.nomorUrut && (
                <span className="text-[9px] font-extrabold text-gray-500 font-mono mt-0.5">
                  {unit.nomorUrut}
                </span>
              )}
            </div>
          </div>

          <h4 className="font-extrabold text-xs text-gray-900 leading-tight group-hover:text-blue-700 transition line-clamp-1">
            {unit.name}
          </h4>

          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {unit.description}
          </p>
        </div>

        {/* FOOTER CARD */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-500">Biaya Sewa:</span>
            <span className="font-bold font-mono text-gray-900">
              {formatRupiah(unit.defaultTarif)} / {unit.satuan}
            </span>
          </div>

          {isOccupied && occupant && (
            <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-200/60 text-[10px] space-y-0.5">
              <div className="flex justify-between items-center text-amber-900 font-semibold">
                <span>Penyewa:</span>
                <span className="font-bold">{isAdmin ? occupant.nama : 'Penyewa Aktif'}</span>
              </div>
              <div className="flex justify-between items-center text-amber-800">
                <span>Jatuh Tempo:</span>
                <span className="font-mono font-bold">{formatIndoDate(occupant.jatuhTempo)}</span>
              </div>
              {daysLeft !== null && (
                <div
                  className={`text-[9px] font-bold ${
                    daysLeft <= 14 ? 'text-rose-600' : 'text-amber-700'
                  }`}
                >
                  {daysLeft <= 0 ? '⚠️ Masa sewa telah berakhir' : `⏳ Sisa: ${daysLeft} hari lagi`}
                </div>
              )}
            </div>
          )}

          {/* ADMIN QUICK ACTIONS */}
          {isAdmin && (
            <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-dashed border-gray-200">
              <button
                type="button"
                onClick={(e) => handleOpenEdit(unit, e)}
                className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition"
                title="Edit Biaya Sewa & Detail Unit"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Biaya</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteClick(unit, e)}
                className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold p-1 rounded-lg transition"
                title="Hapus Unit Ini"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER PEMETAAN */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>Denah & Pemetaan Properti Spasial</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Pemetaan Status Unit & Kelola Biaya Sewa
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-2xl mt-1">
            Visualisasi spasial properti MM Space di Jl. Pertanian Wosi, Manokwari, Papua Barat.
            {isAdmin && ' Anda dapat menambah, menghapus unit, dan mengedit tarif sewa secara langsung.'}
          </p>
        </div>

        {/* ADMIN ADD UNIT BUTTON */}
        {isAdmin && (
          <button
            onClick={() => setIsAddUnitModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Unit Baru</span>
          </button>
        )}
      </div>

      {/* STATISTIK OKUPANSI PEMETAAN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Total Unit
          </span>
          <span className="text-2xl font-black font-mono text-gray-900 mt-1 block">
            {totalUnits}
          </span>
          <span className="text-[10px] text-gray-400">Seluruh kategori</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Unit Tersedia
          </span>
          <span className="text-2xl font-black font-mono text-emerald-700 mt-1 block">
            {availableCount}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">Siap Disewa</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            Unit Terisi
          </span>
          <span className="text-2xl font-black font-mono text-blue-800 mt-1 block">
            {occupiedCount}
          </span>
          <span className="text-[10px] text-blue-600 font-semibold">Sedang Disewa</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
            Tingkat Okupansi
          </span>
          <span className="text-2xl font-black font-mono text-indigo-900 mt-1 block">
            {occupancyRate}%
          </span>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${occupancyRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* FILTER KATEGORI */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-2 overflow-x-auto">
        <Filter className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
        <span className="text-xs font-bold text-gray-700 shrink-0">Filter:</span>
        <div className="flex items-center gap-1.5">
          {distinctCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* TAMPILAN DENAH SPASIAL (ZONE VIEW) */}
      {selectedCategory === 'Semua' ? (
        <div className="space-y-6">
          {/* ZONA 1: DEPAN JL. PERTANIAN WOSI (KOMERSIAL & PARKIR) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md uppercase">
                    Zona 1 - Tepi Jalan Raya
                  </span>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Area Komersial & Lahan Parkir Utama
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Jl. Pertanian Wosi, Manokwari (Akses langsung jalan raya, strategis untuk toko/kantor)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rukoUnits.map((u) => renderUnitCard(u))}
              {parkirUnits.map((u) => renderUnitCard(u))}
            </div>
          </div>

          {/* ZONA 2: AREA HUNIAN MM SPACE (RUMAH 5K & RUMAH 2K) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md uppercase">
                    Zona 2 - Kompleks Hunian MM Space
                  </span>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Klaster Rumah Sewa Keluarga (7 Unit)
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Lingkungan asri, tenang, pagar keliling, meteran listrik & air mandiri
                </p>
              </div>
            </div>

            {/* SUB-SECTION RUMAH 5 KAMAR */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span>🏡</span> Rumah 5 Kamar Tidur (2 Unit Luas)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rumah5Units.map((u) => renderUnitCard(u))}
              </div>
            </div>

            {/* SUB-SECTION RUMAH 2 KAMAR */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span>🏠</span> Rumah 2 Kamar Tidur (Nomor Urut Rumah: No. 01 s/d 05)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rumah2Units.map((u) => renderUnitCard(u))}
              </div>
            </div>
          </div>

          {/* ZONA 3: LOGISTIK & GUDANG */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-md uppercase">
                    Zona 3 - Logistik & Penyimpanan
                  </span>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Gudang Tertutup MM Space
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Akses bongkar muat kendaraan pick up / truk
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gudangUnits.map((u) => renderUnitCard(u))}
            </div>
          </div>

          {/* ZONA 4: APARTEMEN LUAR KOTA */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-sky-100 text-sky-900 font-bold px-2 py-0.5 rounded-md uppercase">
                    Zona 4 - Portofolio Apartemen Luar Kota
                  </span>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Unit Apartemen Margonda Depok & Salemba Jakarta
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Unit full furnished dekat kampus UI & RSCM
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {apartemenUnits.map((u) => renderUnitCard(u))}
            </div>
          </div>

          {/* OTHER UNITS JIKA DITAMBAH ADMIN */}
          {otherUnits.length > 0 && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-gray-900">
                Unit Properti Tambahan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherUnits.map((u) => renderUnitCard(u))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* GRID FILTERED VIEW */
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-base text-gray-900">
              Kategori: {selectedCategory} ({filteredUnits.length} Unit)
            </h3>
            <button
              onClick={() => setSelectedCategory('Semua')}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Lihat Seluruh Denah
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnits.map((u) => renderUnitCard(u))}
          </div>
        </div>
      )}

      {/* MODAL DETAIL UNIT PROPERTI */}
      {selectedUnitDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-gray-50 rounded-2xl border border-gray-100">
                  {selectedUnitDetail.icon}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                    {selectedUnitDetail.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-bold text-gray-500">
                      {selectedUnitDetail.category}
                    </span>
                    {selectedUnitDetail.nomorUrut && (
                      <span className="text-[10px] bg-sky-50 text-sky-800 font-bold px-1.5 py-0.5 rounded border border-sky-200">
                        {selectedUnitDetail.nomorUrut}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUnitDetail(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              {selectedUnitDetail.description}
            </p>

            {/* STATUS TERISI ATAU TERSEDIA */}
            {unitOccupancyMap.has(selectedUnitDetail.name) ? (
              <div className="space-y-3">
                <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-900 uppercase text-[10px]">
                      🔴 Unit Sedang Disewa
                    </span>
                    <span className="bg-blue-200/70 text-blue-900 font-bold px-2 py-0.5 rounded text-[10px]">
                      {unitOccupancyMap.get(selectedUnitDetail.name)?.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-gray-700">
                    <div className="flex justify-between">
                      <span>Penyewa:</span>
                      <strong className="text-gray-900">
                        {isAdmin
                          ? unitOccupancyMap.get(selectedUnitDetail.name)?.nama
                          : 'Penyewa Terverifikasi'}
                      </strong>
                    </div>
                    {isAdmin && unitOccupancyMap.get(selectedUnitDetail.name)?.noHp && (
                      <div className="flex justify-between font-mono">
                        <span>WhatsApp:</span>
                        <span>{unitOccupancyMap.get(selectedUnitDetail.name)?.noHp}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-mono">
                      <span>Masa Sewa s/d:</span>
                      <strong>
                        {formatIndoDate(unitOccupancyMap.get(selectedUnitDetail.name)?.jatuhTempo || '')}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {onOpenSuratPerjanjian && (
                    <button
                      onClick={() => {
                        const t = unitOccupancyMap.get(selectedUnitDetail.name);
                        if (t) {
                          setSelectedUnitDetail(null);
                          onOpenSuratPerjanjian(t);
                        }
                      }}
                      className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Surat Perjanjian (SPK)</span>
                    </button>
                  )}

                  {onOpenKwitansi && (
                    <button
                      onClick={() => {
                        const t = unitOccupancyMap.get(selectedUnitDetail.name);
                        if (t) {
                          setSelectedUnitDetail(null);
                          onOpenKwitansi(t);
                        }
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Kwitansi Resmi</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
                  <span className="font-bold text-emerald-900 uppercase text-[10px] block">
                    🟢 Unit Siap Huni & Tersedia
                  </span>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tarif Standar:</span>
                    <strong className="text-emerald-800 font-mono text-sm">
                      {formatRupiah(selectedUnitDetail.defaultTarif)} / {selectedUnitDetail.satuan}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Deposit Jaminan:</span>
                    <span className="font-mono text-gray-800">
                      {formatRupiah(selectedUnitDetail.defaultDeposit)}
                    </span>
                  </div>
                </div>

                {onSelectUnitToRent && (
                  <button
                    onClick={() => {
                      const name = selectedUnitDetail.name;
                      setSelectedUnitDetail(null);
                      onSelectUnitToRent(name);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Lanjutkan Isi Formulir Sewa Untuk Unit Ini</span>
                  </button>
                )}
              </div>
            )}

            {/* ADMIN ACTIONS IN DETAIL MODAL */}
            {isAdmin && (
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedUnitDetail)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Biaya Sewa / Detail</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteClick(selectedUnitDetail)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Unit</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL EDIT BIAYA SEWA & DETAIL UNIT (ADMIN ONLY) */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editingUnit.icon}</span>
                <h3 className="font-extrabold text-gray-900 text-base">
                  Edit Biaya Sewa & Detail Unit
                </h3>
              </div>
              <button
                onClick={() => setEditingUnit(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUnit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Unit Properti *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nomor Urut Rumah / Slot (Opsional)
                </label>
                <input
                  type="text"
                  value={editNomorUrut}
                  onChange={(e) => setEditNomorUrut(e.target.value)}
                  placeholder="Contoh: Rumah No. 01"
                  className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tarif Sewa (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editTarif}
                    onChange={(e) => setEditTarif(Number(e.target.value))}
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Satuan Waktu *
                  </label>
                  <select
                    value={editSatuan}
                    onChange={(e) => setEditSatuan(e.target.value as 'Tahun' | 'Bulan')}
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="Tahun">Per Tahun</option>
                    <option value="Bulan">Per Bulan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Deposit Jaminan (Rp) *
                </label>
                <input
                  type="number"
                  required
                  value={editDeposit}
                  onChange={(e) => setEditDeposit(Number(e.target.value))}
                  className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Deskripsi & Fasilitas
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs"
                >
                  Simpan Biaya Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH UNIT BARU (ADMIN ONLY) */}
      {isAddUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-gray-900 text-base">
                  Tambah Unit Properti Baru
                </h3>
              </div>
              <button
                onClick={() => setIsAddUnitModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddUnit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Unit *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Rumah 2 Kamar - Rumah No. 06"
                  className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Kategori *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="Rumah 2 Kamar">Rumah 2 Kamar</option>
                    <option value="Rumah 5 Kamar">Rumah 5 Kamar</option>
                    <option value="Ruko">Ruko</option>
                    <option value="Lahan Parkir">Lahan Parkir</option>
                    <option value="Gudang">Gudang</option>
                    <option value="Apartemen Depok">Apartemen Depok</option>
                    <option value="Apartemen Salemba">Apartemen Salemba</option>
                    <option value="Kios / Toko">Kios / Toko</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nomor Urut Rumah
                  </label>
                  <input
                    type="text"
                    value={newNomorUrut}
                    onChange={(e) => setNewNomorUrut(e.target.value)}
                    placeholder="Contoh: Rumah No. 06"
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tarif Standar (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newTarif}
                    onChange={(e) => setNewTarif(Number(e.target.value))}
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Satuan *
                  </label>
                  <select
                    value={newSatuan}
                    onChange={(e) => setNewSatuan(e.target.value as 'Tahun' | 'Bulan')}
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="Tahun">Per Tahun</option>
                    <option value="Bulan">Per Bulan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Deposit Jaminan (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newDeposit}
                    onChange={(e) => setNewDeposit(Number(e.target.value))}
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Ikon Emoji
                  </label>
                  <input
                    type="text"
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    placeholder="🏠, 🏢, 🚗, 📦"
                    className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Deskripsi Singkat Fasilitas
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Fasilitas kamar, dapur, air mandiri, dll."
                  className="w-full border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUnitModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs"
                >
                  Tambahkan Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
