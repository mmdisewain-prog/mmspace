import React, { useState } from 'react';
import { Tenant, ALL_UNITS, CATEGORY_INFO, UnitDefinition } from '../types';
import { formatRupiah, formatIndoDate } from '../utils/formatters';
import { Building2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, ArrowRight, UserCheck } from 'lucide-react';

interface UnitAvailabilityDashboardProps {
  tenants: Tenant[];
  units?: UnitDefinition[];
  onSelectUnit?: (unitName: string) => void;
  isAdmin?: boolean;
}

export const UnitAvailabilityDashboard: React.FC<UnitAvailabilityDashboardProps> = ({
  tenants,
  units = ALL_UNITS,
  onSelectUnit,
  isAdmin = false,
}) => {
  const [showDetailGrid, setShowDetailGrid] = useState(false);

  // Active tenants occupying units
  const activeTenants = tenants.filter(
    (t) => t.contractStatus === 'Aktif' || t.contractStatus === 'Proses Verifikasi'
  );

  // Map unit name to active tenant
  const unitOccupancyMap = new Map<string, Tenant>();
  activeTenants.forEach((t) => {
    unitOccupancyMap.set(t.unit, t);
  });

  // Calculate stats dynamically based on current units
  const distinctCategories = Array.from(new Set(units.map((u) => u.category)));
  const categoryStats = distinctCategories.map((catName) => {
    const defaultInfo = CATEGORY_INFO.find((c) => c.category === catName);
    const unitsInCat = units.filter((u) => u.category === catName);
    const total = unitsInCat.length;
    const occupied = unitsInCat.filter((u) => unitOccupancyMap.has(u.name)).length;
    const available = Math.max(0, total - occupied);

    return {
      category: catName,
      icon: defaultInfo?.icon || unitsInCat[0]?.icon || '🏠',
      description: `${total} unit properti (${available} tersedia)`,
      total,
      occupied,
      available,
    };
  });

  const totalAllUnits = units.length;
  const totalOccupied = units.filter((u) => unitOccupancyMap.has(u.name)).length;
  const totalAvailable = Math.max(0, totalAllUnits - totalOccupied);

  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Status Ketersediaan Unit MM Space</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Informasi ketersediaan unit sewa, ruko, rumah, apartemen, gudang, dan slot parkir secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Total Kuota: <span className="font-bold">{totalAvailable} / {totalAllUnits}</span> Tersedia
          </div>
          <button
            onClick={() => setShowDetailGrid(!showDetailGrid)}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition"
          >
            {showDetailGrid ? (
              <>
                Sembunyikan Detail <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Rincian Tiap Pintu <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* SUMMARY GRID 7 KATEGORI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {categoryStats.map((item) => {
          const isFull = item.available === 0;
          const isPartial = item.available > 0 && item.occupied > 0;

          return (
            <div
              key={item.category}
              className={`p-4 rounded-xl border transition hover:shadow-md flex flex-col justify-between ${
                isFull
                  ? 'bg-rose-50/70 border-rose-200'
                  : isPartial
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-blue-50/60 border-blue-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    {item.category}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span
                      className={`text-2xl font-black font-mono ${
                        isFull ? 'text-rose-700' : isPartial ? 'text-amber-800' : 'text-blue-900'
                      }`}
                    >
                      {item.available}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      / {item.total} {item.category === 'Lahan Parkir' ? 'Slot' : 'Unit'} Tersedia
                    </span>
                  </div>
                </div>
                <span className="text-2xl select-none">{item.icon}</span>
              </div>

              {/* BAR PROGRES KUOTA */}
              <div className="mt-3">
                <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-rose-500' : isPartial ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${(item.available / item.total) * 100}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-semibold mt-1.5">
                  <span className={item.available > 0 ? 'text-green-700 font-bold' : 'text-rose-600'}>
                    {item.available > 0 ? `✓ ${item.available} Siap Huni` : '✕ Penuh'}
                  </span>
                  <span className="text-gray-500">
                    {item.occupied} Disewa
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL GRID PER PINTU / SLOT (INTERAKTIF) */}
      {showDetailGrid && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <span>📋</span> Rincian Status Setiap Unit & Slot Properti ({units.length} Unit)
            </h3>
            <span className="text-[11px] text-gray-500">Klik unit yang tersedia untuk mengisi form pendaftaran langsung</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {units.map((unit) => {
              const activeTenant = unitOccupancyMap.get(unit.name);
              const isOccupied = !!activeTenant;

              return (
                <div
                  key={unit.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
                    isOccupied
                      ? 'bg-gray-50/90 border-gray-200'
                      : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{unit.icon}</span>
                        <div>
                          <span className="font-bold text-xs text-gray-900 block">{unit.name}</span>
                          {unit.nomorUrut && (
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 inline-block mt-0.5">
                              {unit.nomorUrut}
                            </span>
                          )}
                        </div>
                      </div>
                      {isOccupied ? (
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Disewa
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Tersedia
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-2">
                      {unit.description}
                    </p>

                    <div className="mt-2 text-xs flex justify-between items-center text-gray-700 bg-white/80 p-2 rounded-lg border border-gray-100">
                      <span>Tarif Standar:</span>
                      <span className="font-bold text-gray-900 font-mono">
                        {formatRupiah(unit.defaultTarif)} / {unit.satuan}
                      </span>
                    </div>

                    {isOccupied && activeTenant && (
                      <div className="mt-2 text-[11px] bg-amber-50/90 p-2 rounded-lg border border-amber-200/60 text-amber-900 space-y-0.5">
                        <div className="flex items-center gap-1 font-semibold">
                          <UserCheck className="w-3 h-3 text-amber-700" />
                          <span>Status: Sedang Disewa {isAdmin ? `(${activeTenant.nama})` : ''}</span>
                        </div>
                        <div className="text-[10px] text-amber-800">
                          Masa Sewa s/d: <span className="font-bold">{formatIndoDate(activeTenant.jatuhTempo)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      Deposit: {formatRupiah(unit.defaultDeposit)}
                    </span>
                    {!isOccupied && onSelectUnit && (
                      <button
                        onClick={() => onSelectUnit(unit.name)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                      >
                        Sewa Unit Ini <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
