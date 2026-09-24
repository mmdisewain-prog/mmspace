import React, { useState, useEffect, useCallback } from 'react';
import { Tenant, Expense, ALL_UNITS, UnitDefinition, HomeSettings, DEFAULT_HOME_SETTINGS } from './types';
import {
  initGoogleAuth,
  signInWithGoogle,
  signOutGoogle,
  getAccessToken,
  getOrCreateDriveFolder,
  getOrCreateSpreadsheet,
  uploadBase64ToDrive,
  syncAllToGoogleSheet,
  fetchAllFromGoogleSheet,
} from './services/googleWorkspace';
import { UnitAvailabilityDashboard } from './components/UnitAvailabilityDashboard';
import { RentalForm } from './components/RentalForm';
import { TenantTable } from './components/TenantTable';
import { FinancialSummary } from './components/FinancialSummary';
import { KwitansiModal } from './components/KwitansiModal';
import { TenantModal } from './components/TenantModal';
import { PreviewModal } from './components/PreviewModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SuratPerjanjianModal } from './components/SuratPerjanjianModal';
import { TenantPropertyMap } from './components/TenantPropertyMap';
import { HomeSettingsModal } from './components/HomeSettingsModal';
import { hashPassword } from './utils/formatters';
import {
  Building2,
  Lock,
  Unlock,
  Cloud,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Table as TableIcon,
  RefreshCw,
  LogOut,
  Sparkles,
  MapPin,
  FileText,
  Plus,
  Trash2,
  Settings,
} from 'lucide-react';
import { User } from 'firebase/auth';

const ADMIN_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; // admin123
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzX41niY5PCewO1EwBbWxwA_Dl5576KVpl2AIlpibH_L3jN_-sUb_kUv3gGw6uLJ_0/exec';

// Initial clean state for production publication (0 dummy/sample records)
const INITIAL_TENANTS: Tenant[] = [];
const INITIAL_EXPENSES: Expense[] = [];

export default function App() {
  const [activeTab, setActiveTab] = useState<'beranda' | 'pemetaan' | 'perjanjian' | 'manajemen'>('beranda');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('mm_space_is_admin') === 'true';
  });

  // Data states
  const [units, setUnits] = useState<UnitDefinition[]>(() => {
    const saved = localStorage.getItem('mm_space_units_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse cached units', e);
      }
    }
    return ALL_UNITS;
  });

  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('mm_space_tenants');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Clean out previous dummy sample tenants (IDs 1715000001 - 1715000006)
          const liveData = parsed.filter((t: any) => t.id < 1715000001 || t.id > 1715000006);
          if (liveData.length !== parsed.length) {
            localStorage.setItem('mm_space_tenants', JSON.stringify(liveData));
          }
          return liveData;
        }
      } catch (e) {
        console.error('Failed to parse cached tenants', e);
      }
    }
    return INITIAL_TENANTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('mm_space_expenses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Clean out previous dummy sample expenses (IDs 1715000101 - 1715000103)
          const liveExpenses = parsed.filter((e: any) => e.id < 1715000101 || e.id > 1715000103);
          if (liveExpenses.length !== parsed.length) {
            localStorage.setItem('mm_space_expenses', JSON.stringify(liveExpenses));
          }
          return liveExpenses;
        }
      } catch (e) {
        console.error('Failed to parse cached expenses', e);
      }
    }
    return INITIAL_EXPENSES;
  });

  // Google Workspace integration state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    return localStorage.getItem('mm_space_sheet_url');
  });
  const [driveFolderUrl, setDriveFolderUrl] = useState<string | null>(() => {
    return localStorage.getItem('mm_space_drive_url');
  });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('mm_space_last_sync');
  });

  // Modals state
  const [selectedUnitForBooking, setSelectedUnitForBooking] = useState<string>(units[0]?.name || ALL_UNITS[0].name);
  const [kwitansiTenant, setKwitansiTenant] = useState<Tenant | null>(null);
  const [suratPerjanjianTenant, setSuratPerjanjianTenant] = useState<Tenant | null>(null);
  const [isSuratModalOpen, setIsSuratModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    imageUrl: string;
    driveUrl?: string;
  } | null>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('mm_space_units_v2', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('mm_space_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('mm_space_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('mm_space_is_admin', isAdmin ? 'true' : 'false');
  }, [isAdmin]);

  // Restrict guest mode strictly to beranda tab
  useEffect(() => {
    if (!isAdmin && activeTab !== 'beranda') {
      setActiveTab('beranda');
    }
  }, [isAdmin, activeTab]);

  // Unit management handlers
  const handleAddUnit = (newUnit: UnitDefinition) => {
    setUnits((prev) => [...prev, newUnit]);
    setToastMessage(`✓ Unit baru "${newUnit.name}" berhasil ditambahkan!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateUnit = (updatedUnit: UnitDefinition) => {
    setUnits((prev) => prev.map((u) => (u.id === updatedUnit.id ? updatedUnit : u)));
    setToastMessage(`✓ Biaya sewa & data unit "${updatedUnit.name}" otomatis diperbarui!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteUnit = (unitId: string) => {
    const unitToDelete = units.find((u) => u.id === unitId);
    if (!unitToDelete) return;

    const isOccupied = tenants.some(
      (t) =>
        t.unit === unitToDelete.name &&
        (t.contractStatus === 'Aktif' || t.contractStatus === 'Proses Verifikasi')
    );

    if (isOccupied) {
      setToastMessage(`⚠️ Tidak dapat menghapus "${unitToDelete.name}" karena masih ada penyewa aktif.`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    setUnits((prev) => prev.filter((u) => u.id !== unitId));
    setToastMessage(`✓ Unit "${unitToDelete.name}" berhasil dihapus.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        // Automatically grant admin if owner email
        if (user.email === 'mm.disewain@gmail.com') {
          setIsAdmin(true);
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync with Google Drive & Google Sheets
  const syncToGoogle = useCallback(
    async (tokenToUse?: string) => {
      const token = tokenToUse || googleToken || (await getAccessToken());
      if (!token) {
        alert('Silakan login dengan Google terlebih dahulu untuk menghubungkan ke Google Drive & Sheets.');
        return;
      }

      setIsSyncing(true);
      try {
        // 1. Get or create Drive Folder
        const folder = await getOrCreateDriveFolder(token);
        setDriveFolderUrl(folder.folderUrl);
        localStorage.setItem('mm_space_drive_url', folder.folderUrl);

        // 2. Get or create Google Spreadsheet
        const sheet = await getOrCreateSpreadsheet(token);
        setSpreadsheetUrl(sheet.spreadsheetUrl);
        localStorage.setItem('mm_space_sheet_url', sheet.spreadsheetUrl);

        // 3. Upload any pending base64 docs to Drive
        const updatedTenants = [...tenants];
        let hasNewUploads = false;

        for (let i = 0; i < updatedTenants.length; i++) {
          const t = updatedTenants[i];
          // Upload KTP if local base64 exists but no drive url yet
          if (t.ktpData && t.ktpData.startsWith('data:') && !t.ktpDriveUrl) {
            try {
              const res = await uploadBase64ToDrive(
                token,
                t.ktpData,
                `KTP_${t.nama.replace(/\s+/g, '_')}_${t.id}.jpg`,
                folder.folderId
              );
              t.ktpDriveUrl = res.webViewLink;
              hasNewUploads = true;
            } catch (upErr) {
              console.warn('Failed to upload KTP for ' + t.nama, upErr);
            }
          }

          // Upload Bukti if local base64 exists but no drive url yet
          if (t.buktiData && t.buktiData.startsWith('data:') && !t.buktiDriveUrl) {
            try {
              const res = await uploadBase64ToDrive(
                token,
                t.buktiData,
                `Bukti_${t.nama.replace(/\s+/g, '_')}_${t.id}.jpg`,
                folder.folderId
              );
              t.buktiDriveUrl = res.webViewLink;
              hasNewUploads = true;
            } catch (upErr) {
              console.warn('Failed to upload Bukti for ' + t.nama, upErr);
            }
          }
        }

        if (hasNewUploads) {
          setTenants(updatedTenants);
        }

        // 4. Sync rows to Google Sheets
        await syncAllToGoogleSheet(token, sheet.spreadsheetId, updatedTenants, expenses);

        const nowStr = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setLastSyncTime(nowStr);
        localStorage.setItem('mm_space_last_sync', nowStr);

        alert('Berhasil disinkronkan ke Google Drive dan Google Sheets!');
      } catch (err: any) {
        console.error('Sync error:', err);
        alert('Gagal menyinkronkan ke Google: ' + (err.message || 'Error tidak diketahui'));
      } finally {
        setIsSyncing(false);
      }
    },
    [googleToken, tenants, expenses]
  );

  // Handle Google Login
  const handleGoogleSignIn = async () => {
    try {
      const { user, accessToken } = await signInWithGoogle();
      setGoogleUser(user);
      setGoogleToken(accessToken);
      if (user.email === 'mm.disewain@gmail.com') {
        setIsAdmin(true);
      }
      // Auto sync once connected
      await syncToGoogle(accessToken);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      alert('Login Google gagal: ' + (err.message || ''));
    }
  };

  const handleGoogleSignOut = async () => {
    await signOutGoogle();
    setGoogleUser(null);
    setGoogleToken(null);
  };

  // Admin login via dedicated modal
  const handleLoginAdmin = () => {
    setIsAdminModalOpen(true);
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    setToastMessage('Anda telah keluar dari mode Admin.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClearAllTenants = () => {
    if (
      window.confirm(
        'PERINGATAN: Apakah Anda yakin ingin mengosongkan SELURUH data penyewa? Tindakan ini akan mengembalikan data ke keadaan bersih 0 penyewa.'
      )
    ) {
      setTenants([]);
      localStorage.setItem('mm_space_tenants', JSON.stringify([]));
      setToastMessage('Seluruh data penyewa telah dibersihkan.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Submit new rental from public form
  const handleFormSubmit = async (
    newTenantData: Omit<Tenant, 'id'>,
    ktpFile?: File,
    buktiFile?: File
  ) => {
    const id = Date.now();
    let ktpDriveUrl = '';
    let buktiDriveUrl = '';

    // If connected to Google, upload straight to Google Drive
    const token = googleToken || (await getAccessToken());
    if (token) {
      try {
        const folder = await getOrCreateDriveFolder(token);
        if (newTenantData.ktpData) {
          const res = await uploadBase64ToDrive(
            token,
            newTenantData.ktpData,
            `KTP_${newTenantData.nama.replace(/\s+/g, '_')}_${id}.jpg`,
            folder.folderId
          );
          ktpDriveUrl = res.webViewLink;
        }
        if (newTenantData.buktiData) {
          const res = await uploadBase64ToDrive(
            token,
            newTenantData.buktiData,
            `Bukti_${newTenantData.nama.replace(/\s+/g, '_')}_${id}.jpg`,
            folder.folderId
          );
          buktiDriveUrl = res.webViewLink;
        }
      } catch (uploadErr) {
        console.warn('Direct drive upload warning:', uploadErr);
      }
    }

    const completedTenant: Tenant = {
      ...newTenantData,
      id,
      ktpDriveUrl,
      buktiDriveUrl,
    };

    const updated = [completedTenant, ...tenants];
    setTenants(updated);

    // If token available, sync update to Sheet in background
    if (token && spreadsheetUrl) {
      getOrCreateSpreadsheet(token).then((sheet) => {
        syncAllToGoogleSheet(token, sheet.spreadsheetId, updated, expenses).catch((e) =>
          console.warn('Background sync error', e)
        );
      });
    }

    // If admin, switch to management tab to see submission
    if (isAdmin) {
      setActiveTab('manajemen');
    } else {
      setActiveTab('beranda');
    }
  };

  // Select unit from availability dashboard
  const handleSelectUnitFromDashboard = (unitName: string) => {
    setSelectedUnitForBooking(unitName);
    setActiveTab('beranda');
    setTimeout(() => {
      const formEl = document.getElementById('rentalBookingSection');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Edit / Save Tenant
  const handleSaveTenant = (savedTenant: Tenant) => {
    const index = tenants.findIndex((t) => t.id === savedTenant.id);
    let updated: Tenant[];
    if (index >= 0) {
      updated = [...tenants];
      updated[index] = savedTenant;
    } else {
      updated = [savedTenant, ...tenants];
    }
    setTenants(updated);

    // Auto sync to sheet if connected
    if (googleToken && spreadsheetUrl) {
      getOrCreateSpreadsheet(googleToken).then((sheet) => {
        syncAllToGoogleSheet(googleToken, sheet.spreadsheetId, updated, expenses);
      });
    }
  };

  // Delete Tenant
  const handleDeleteTenant = (id: number, name: string) => {
    const updated = tenants.filter((t) => t.id !== id);
    setTenants(updated);

    if (googleToken && spreadsheetUrl) {
      getOrCreateSpreadsheet(googleToken).then((sheet) => {
        syncAllToGoogleSheet(googleToken, sheet.spreadsheetId, updated, expenses);
      });
    }
  };

  // Toggle Payment Status
  const handleTogglePaymentStatus = (id: number) => {
    const updated = tenants.map((t) => {
      if (t.id === id) {
        if (t.status === 'Lunas') {
          return {
            ...t,
            status: 'Belum Bayar' as const,
            kurangBayar: t.tarif,
          };
        } else {
          return {
            ...t,
            status: 'Lunas' as const,
            kurangBayar: 0,
          };
        }
      }
      return t;
    });
    setTenants(updated);

    if (googleToken && spreadsheetUrl) {
      getOrCreateSpreadsheet(googleToken).then((sheet) => {
        syncAllToGoogleSheet(googleToken, sheet.spreadsheetId, updated, expenses);
      });
    }
  };

  // Add Expense
  const handleAddExpense = (expense: Expense) => {
    const updated = [expense, ...expenses];
    setExpenses(updated);

    if (googleToken && spreadsheetUrl) {
      getOrCreateSpreadsheet(googleToken).then((sheet) => {
        syncAllToGoogleSheet(googleToken, sheet.spreadsheetId, tenants, updated);
      });
    }
  };

  // Delete Expense
  const handleDeleteExpense = (id: number) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);

    if (googleToken && spreadsheetUrl) {
      getOrCreateSpreadsheet(googleToken).then((sheet) => {
        syncAllToGoogleSheet(googleToken, sheet.spreadsheetId, tenants, updated);
      });
    }
  };

  return (
    <div className="bg-gray-100/90 text-gray-800 font-sans min-h-screen flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* TOP NAVBAR */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* BRAND */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1.5 rounded-xl shadow-sm flex items-center justify-center">
                <svg
                  className="h-8 w-auto"
                  viewBox="0 0 500 300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M70 170 L220 80 L300 130 L300 70 L350 70 L350 160 L420 160"
                    stroke="#C59B6C"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M100 240 V130 L160 210 L220 130 V240 M260 240 V130 L320 210 L380 130 V240"
                    stroke="#1E293B"
                    strokeWidth="28"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="60"
                    y1="240"
                    x2="430"
                    y2="240"
                    stroke="#1E293B"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <div className="font-extrabold text-lg md:text-xl tracking-tight leading-none flex items-center gap-1.5">
                  MM SPACE
                  <span className="text-[10px] bg-white/20 text-white font-semibold px-2 py-0.5 rounded-full">
                    Rental & Management
                  </span>
                </div>
                <p className="text-[10px] text-blue-100 tracking-wide mt-0.5 font-medium">
                  Manokwari, Papua Barat
                </p>
              </div>
            </div>

            {/* MOBILE QUICK ADMIN TOGGLE */}
            <div className="flex md:hidden items-center gap-1">
              {!isAdmin ? (
                <button
                  onClick={handleLoginAdmin}
                  className="p-1.5 bg-black/20 hover:bg-black/30 rounded-lg text-xs font-bold"
                  title="Login Admin"
                >
                  <Lock className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleLogoutAdmin}
                  className="p-1.5 bg-rose-600 rounded-lg text-xs font-bold"
                  title="Logout Admin"
                >
                  <Unlock className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* NAV CONTROLS & GOOGLE SYNC STATUS */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin ? (
              <>
                {/* TAB BUTTONS (ADMIN: ALL 4 TABS) */}
                <div className="bg-blue-900/40 p-1 rounded-xl flex items-center gap-1 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('beranda')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      activeTab === 'beranda'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Beranda / Form Sewa
                  </button>
                  <button
                    onClick={() => setActiveTab('pemetaan')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'pemetaan'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Pemetaan Unit</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('perjanjian');
                      setIsSuratModalOpen(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'perjanjian'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Surat Perjanjian (PDF)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('manajemen')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                      activeTab === 'manajemen'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>Status & Keuangan</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </button>
                </div>

                {/* GOOGLE DRIVE & SHEETS STATUS / LOGIN (ADMIN ONLY) */}
                {googleUser ? (
                  <div className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-xl border border-white/20 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-[11px] font-medium hidden sm:inline">
                      Google: {googleUser.email?.split('@')[0]}
                    </span>
                    <button
                      onClick={handleGoogleSignOut}
                      className="text-[10px] text-blue-200 hover:text-white ml-1 underline"
                      title="Logout Google"
                    >
                      <LogOut className="w-3 h-3 inline" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    className="bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
                    title="Hubungkan Google Drive & Sheets"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27A7.16 7.16 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                      />
                    </svg>
                    <span>Google Drive & Sheet</span>
                  </button>
                )}
              </>
            ) : (
              /* GUEST MODE: NO GOOGLE BUTTONS, SIMPLE CLEAR VIEW */
              <div className="flex items-center gap-2">
                <span className="text-xs bg-white/15 border border-white/20 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Portal Tamu & Penyewa</span>
                </span>
              </div>
            )}

            {/* ADMIN LOGIN/LOGOUT (DESKTOP) */}
            <div className="hidden md:flex items-center">
              {!isAdmin ? (
                <button
                  onClick={handleLoginAdmin}
                  className="bg-gray-900/80 hover:bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Login Admin</span>
                </button>
              ) : (
                <button
                  onClick={handleLogoutAdmin}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Logout Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CLOUD STORAGE STATUS BANNER (ADMIN ONLY) */}
      {isAdmin && (
        <div className="bg-blue-50/80 border-b border-blue-100 text-xs px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-blue-900 font-medium">
              <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Penyimpanan Google Workspace:
                {googleUser ? (
                  <strong className="text-emerald-700 ml-1">
                    ✓ Terhubung (Google Drive & Google Sheets Aktif)
                  </strong>
                ) : (
                  <span className="text-gray-600 ml-1">
                    Penyimpanan Lokal Aktif. Klik "Google Drive & Sheet" untuk menghubungkan sinkronisasi cloud online.
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <TableIcon className="w-3.5 h-3.5" /> Google Sheets
                </a>
              )}
              {driveFolderUrl && (
                <a
                  href={driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-purple-700 hover:underline flex items-center gap-1 ml-2"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> Folder Drive
                </a>
              )}
              {googleUser && (
                <button
                  onClick={() => syncToGoogle()}
                  disabled={isSyncing}
                  className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 ml-2"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 flex-grow w-full">
        {activeTab === 'beranda' && (
          <div className="space-y-6">
            {/* HERO PROPERTI MM SPACE */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-lg">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-200 border border-white/15">
                    <MapPin className="w-3.5 h-3.5 text-blue-300" />
                    <span>Jl. Pertanian Wosi, Manokwari, Papua Barat</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                    Sewa Rumah & Properti <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">MM Space</span>
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Pilihan hunian keluarga nyaman, ruko komersial tepi jalan raya, gudang aman, dan lahan parkir tertata di Manokwari. Fasilitas lengkap, meteran air & listrik mandiri, serta perjanjian resmi yang aman dan terpercaya.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        document.getElementById('unitAvailabilitySection')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <span>Lihat Unit Tersedia</span>
                      <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                        {units.filter((u) => !tenants.some((t) => t.unit === u.name && (t.contractStatus === 'Aktif' || t.contractStatus === 'Proses Verifikasi'))).length} Unit
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        document.getElementById('rentalBookingSection')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition border border-white/20 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Formulir Sewa Online</span>
                    </button>

                    <a
                      href="https://wa.me/6281288819743?text=Halo%20Pengelola%20MM%20Space,%20saya%20tertarik%20dengan%20unit%20sewa%20di%20Wosi%20Manokwari"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-200 hover:text-white font-semibold flex items-center gap-1.5 transition ml-1"
                    >
                      <span>💬 Tanya Pengelola via WA</span>
                    </a>
                  </div>
                </div>

                {/* HIGHLIGHT BADGES */}
                <div className="grid grid-cols-2 gap-2.5 shrink-0 sm:w-80">
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
                    <span className="text-xl block mb-1">🏠</span>
                    <span className="text-[11px] font-bold text-white block">Rumah 2 Kamar</span>
                    <span className="text-[10px] text-blue-200">Urut Rumah No. 01-05</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
                    <span className="text-xl block mb-1">🏡</span>
                    <span className="text-[11px] font-bold text-white block">Rumah 5 Kamar</span>
                    <span className="text-[10px] text-blue-200">2 Unit Luas Keluarga</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
                    <span className="text-xl block mb-1">🏢</span>
                    <span className="text-[11px] font-bold text-white block">Ruko Tepi Jalan</span>
                    <span className="text-[10px] text-blue-200">Akses Jl. Pertanian Wosi</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
                    <span className="text-xl block mb-1">🚗</span>
                    <span className="text-[11px] font-bold text-white block">Parkir & Gudang</span>
                    <span className="text-[10px] text-blue-200">Keamanan Terjamin</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STATUS KETERSEDIAAN UNIT MM SPACE (DIPERBAIKI & DENGAN KUOTA REAL-TIME) */}
            <div id="unitAvailabilitySection" className="scroll-mt-6">
              <UnitAvailabilityDashboard
                tenants={tenants}
                units={units}
                onSelectUnit={handleSelectUnitFromDashboard}
                isAdmin={isAdmin}
              />
            </div>

            {/* FORMULIR PENDAFTARAN & KONFIRMASI BAYAR */}
            <div id="rentalBookingSection" className="scroll-mt-6">
              <RentalForm
                tenants={tenants}
                units={units}
                selectedUnitName={selectedUnitForBooking}
                onSubmitTenant={handleFormSubmit}
              />
            </div>
          </div>
        )}

        {activeTab === 'pemetaan' && (
          <div className="space-y-6">
            <TenantPropertyMap
              tenants={tenants}
              units={units}
              onSelectUnitToRent={(unitName) => {
                setSelectedUnitForBooking(unitName);
                setActiveTab('beranda');
                setTimeout(() => {
                  document.getElementById('rentalBookingSection')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              onOpenKwitansi={(tenant) => setKwitansiTenant(tenant)}
              onOpenSuratPerjanjian={(tenant) => {
                setSuratPerjanjianTenant(tenant);
                setIsSuratModalOpen(true);
              }}
              onAddUnit={handleAddUnit}
              onUpdateUnit={handleUpdateUnit}
              onDeleteUnit={handleDeleteUnit}
              isAdmin={isAdmin}
            />
          </div>
        )}

        {activeTab === 'perjanjian' && (
          <div className="space-y-6">
            {/* HEADER PERJANJIAN */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                  <FileText className="w-3.5 h-3.5" />
                  Surat Perjanjian Sewa Menyewa (SPK)
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  Formulir Surat Perjanjian Sewa Resmi MM Space
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 max-w-2xl leading-relaxed">
                  Generate dan cetak surat perjanjian sewa menyewa properti resmi berkop MM Space. Dokumen otomatis siap diunduh/diekspor langsung ke format PDF dengan materai 10.000, identitas para pihak, dan pasal-pasal hukum properti.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSuratPerjanjianTenant(tenants[0] || null);
                    setIsSuratModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>Buka Editor & Ekspor PDF</span>
                </button>
              </div>
            </div>

            {/* TABEL PENYEWA DENGAN TOMBOL CEPAT BIKIN SURAT */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">
                  Pilih Penyewa Untuk Dibuatkan Surat Perjanjian
                </h3>
                <span className="text-xs text-gray-500">
                  Total {tenants.length} Penyewa Terdata
                </span>
              </div>

              {tenants.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50/50 space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-800">Database Penyewa Masih Kosong</p>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Semua data contoh telah dibersihkan. Anda tetap dapat langsung membuat dan mencetak Surat Perjanjian (SPK) baru menggunakan formulir manual, atau mencatat data penyewa terlebih dahulu.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSuratPerjanjianTenant(null);
                        setIsSuratModalOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Buat Surat Perjanjian Baru (Manual)</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('beranda');
                        setIsTenantModalOpen(true);
                      }}
                      className="bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Catat Penyewa di Beranda</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tenants.map((t) => {
                    const isPark = t.category === 'Lahan Parkir' || t.unit.toLowerCase().includes('parkir');
                    return (
                      <div
                        key={t.id}
                        className="p-4 rounded-2xl border border-gray-200 hover:border-blue-400 bg-gray-50/50 hover:bg-blue-50/30 transition flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-extrabold text-gray-900">{t.nama}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                t.status === 'Lunas'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-blue-700 font-semibold">{t.unit}</p>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isPark
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-blue-100 text-blue-900'
                              }`}
                            >
                              {isPark ? '🚗 Slot Parkir' : '🏢 Properti'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Periode: {t.tglMulai} s/d {t.jatuhTempo} ({t.durasi} {t.satuan})
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setSuratPerjanjianTenant(t);
                            setIsSuratModalOpen(true);
                          }}
                          className="w-full bg-white hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-300 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Buat / Cetak Surat SPK ({isPark ? 'Parkir' : 'Properti'})</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'manajemen' && (
          <div className="space-y-6">
            {/* STATUS HEADER MANAJEMEN & NOTICE */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-gray-100 gap-4">
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Status Properti & Laporan Keuangan MM Space
                </h1>
                {!isAdmin ? (
                  <p className="text-xs text-amber-700 font-medium mt-1 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Moda Tamu: Anda dapat melihat daftar ketersediaan dan status unit. Login admin untuk melihat detail keuangan, nomor kontak, berkas, dan kuitansi.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Moda Admin Aktif: Anda memiliki akses penuh mengelola penyewa, kuitansi, pengeluaran, dan sinkronisasi data Google.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {!isAdmin && (
                  <button
                    onClick={handleLoginAdmin}
                    className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Login Admin
                  </button>
                )}
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    {tenants.length > 0 && (
                      <button
                        onClick={handleClearAllTenants}
                        className="bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-700 border border-gray-200 hover:border-rose-200 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        title="Kosongkan seluruh data penyewa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Kosongkan Data</span>
                      </button>
                    )}
                    <button
                      onClick={handleLogoutAdmin}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Keluar Admin
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RINGKASAN KEUANGAN (HANYA KHUSUS ADMIN) */}
            {isAdmin && (
              <FinancialSummary
                tenants={tenants}
                expenses={expenses}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            )}

            {/* DAFTAR STATUS PENYEWA UNIT (DIPERBAIKI & DILENGKAPI) */}
            <TenantTable
              tenants={tenants}
              isAdmin={isAdmin}
              onEditTenant={(tenant) => {
                setEditingTenant(tenant);
                setIsTenantModalOpen(true);
              }}
              onDeleteTenant={handleDeleteTenant}
              onToggleStatus={handleTogglePaymentStatus}
              onOpenKwitansi={(tenant) => setKwitansiTenant(tenant)}
              onOpenSuratPerjanjian={(tenant) => {
                setSuratPerjanjianTenant(tenant);
                setIsSuratModalOpen(true);
              }}
              onPreviewDoc={(title, imageUrl, driveUrl) => {
                setPreviewDoc({ title, imageUrl, driveUrl });
              }}
              onAddNew={() => {
                setEditingTenant(null);
                setIsTenantModalOpen(true);
              }}
              onSyncGoogle={() => syncToGoogle()}
              isSyncing={isSyncing}
              spreadsheetUrl={spreadsheetUrl}
              driveFolderUrl={driveFolderUrl}
              lastSyncTime={lastSyncTime}
            />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 mt-auto py-5 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 MM Space (Meinatri Cykitta Mandacan). All Rights Reserved.</p>
          <p className="text-gray-400">
            Terintegrasi dengan Google Drive & Google Sheets | Manokwari, Papua Barat
          </p>
        </div>
      </footer>

      {/* MODAL KWITANSI PEMBAYARAN */}
      <KwitansiModal
        tenant={kwitansiTenant}
        onClose={() => setKwitansiTenant(null)}
      />

      {/* MODAL SURAT PERJANJIAN SEWA (PDF) */}
      <SuratPerjanjianModal
        isOpen={isSuratModalOpen}
        onClose={() => {
          setIsSuratModalOpen(false);
          setSuratPerjanjianTenant(null);
        }}
        tenant={suratPerjanjianTenant}
        allTenants={tenants}
      />

      {/* MODAL EDIT / TAMBAH PENYEWA (ADMIN) */}
      <TenantModal
        isOpen={isTenantModalOpen}
        tenant={editingTenant}
        units={units}
        onClose={() => {
          setIsTenantModalOpen(false);
          setEditingTenant(null);
        }}
        onSave={handleSaveTenant}
      />

      {/* MODAL PREVIEW BERKAS (KTP / BUKTI BAYAR) */}
      {previewDoc && (
        <PreviewModal
          title={previewDoc.title}
          imageUrl={previewDoc.imageUrl}
          driveUrl={previewDoc.driveUrl}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* MODAL LOGIN ADMIN */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={() => {
          setIsAdmin(true);
          setActiveTab('manajemen');
          setToastMessage('✓ Berhasil masuk sebagai Admin MM Space!');
          setTimeout(() => setToastMessage(null), 4000);
        }}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
      />

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900/95 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-gray-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
