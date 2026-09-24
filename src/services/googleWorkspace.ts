import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Tenant, Expense } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

// In-memory token cache (Do NOT store in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token must be refreshed via interactive sign-in or cached credential
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token Google Workspace.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const signOutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// ==================== GOOGLE DRIVE SERVICE ====================

const FOLDER_NAME = 'MM Space - Berkas Penyewa';
let cachedFolderId: string | null = null;

export const getOrCreateDriveFolder = async (token: string): Promise<{ folderId: string; folderUrl: string }> => {
  if (cachedFolderId) {
    return {
      folderId: cachedFolderId,
      folderUrl: `https://drive.google.com/drive/folders/${cachedFolderId}`,
    };
  }

  // Search for existing folder
  const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${FOLDER_NAME}' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) {
    throw new Error('Gagal memeriksa folder di Google Drive: ' + searchRes.statusText);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    cachedFolderId = searchData.files[0].id;
    return {
      folderId: searchData.files[0].id,
      folderUrl: searchData.files[0].webViewLink || `https://drive.google.com/drive/folders/${cachedFolderId}`,
    };
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Folder penyimpanan berkas identitas dan bukti transfer MM Space',
    }),
  });

  if (!createRes.ok) {
    throw new Error('Gagal membuat folder di Google Drive: ' + createRes.statusText);
  }

  const createdData = await createRes.json();
  cachedFolderId = createdData.id;
  return {
    folderId: createdData.id,
    folderUrl: createdData.webViewLink || `https://drive.google.com/drive/folders/${cachedFolderId}`,
  };
};

export const uploadBase64ToDrive = async (
  token: string,
  base64Data: string,
  filename: string,
  folderId?: string
): Promise<{ fileId: string; webViewLink: string }> => {
  let targetFolderId = folderId;
  if (!targetFolderId) {
    const folder = await getOrCreateDriveFolder(token);
    targetFolderId = folder.folderId;
  }

  // Parse mime type and decode base64
  let mimeType = 'image/jpeg';
  let pureBase64 = base64Data;
  if (base64Data.startsWith('data:')) {
    const parts = base64Data.split(',');
    const match = parts[0].match(/:(.*?);/);
    if (match) mimeType = match[1];
    pureBase64 = parts[1];
  }

  const byteCharacters = atob(pureBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  // Multipart upload
  const metadata = {
    name: filename,
    parents: [targetFolderId],
    mimeType: mimeType,
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', blob);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }
  );

  if (!uploadRes.ok) {
    const errorDetail = await uploadRes.text();
    throw new Error(`Gagal upload berkas ke Google Drive: ${errorDetail}`);
  }

  const fileData = await uploadRes.json();

  // Allow anyone with link to view
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Set permission warning:', permErr);
  }

  return {
    fileId: fileData.id,
    webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
  };
};

// ==================== GOOGLE SHEETS SERVICE ====================

const SHEET_TITLE = 'MM Space - Database Penyewaan & Keuangan';
let cachedSpreadsheetId: string | null = null;

export const getOrCreateSpreadsheet = async (token: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  if (cachedSpreadsheetId) {
    return {
      spreadsheetId: cachedSpreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cachedSpreadsheetId}`,
    };
  }

  // Check existing spreadsheet file in Drive
  const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.spreadsheet' and name = '${SHEET_TITLE}' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      cachedSpreadsheetId = searchData.files[0].id;
      return {
        spreadsheetId: searchData.files[0].id,
        spreadsheetUrl: searchData.files[0].webViewLink || `https://docs.google.com/spreadsheets/d/${cachedSpreadsheetId}`,
      };
    }
  }

  // Create new Spreadsheet with two tabs: 'Penyewa' and 'Pengeluaran'
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: SHEET_TITLE,
      },
      sheets: [
        {
          properties: {
            title: 'Penyewa',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Pengeluaran',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat Google Sheet: ${errText}`);
  }

  const sheetData = await createRes.json();
  cachedSpreadsheetId = sheetData.spreadsheetId;

  // Initialize Headers
  await initSheetHeaders(token, cachedSpreadsheetId!);

  return {
    spreadsheetId: sheetData.spreadsheetId,
    spreadsheetUrl: sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${cachedSpreadsheetId}`,
  };
};

const initSheetHeaders = async (token: string, spreadsheetId: string) => {
  const tenantHeaders = [
    [
      'ID',
      'Tanggal Input',
      'Kategori Unit',
      'Nama Unit',
      'Nama Penyewa',
      'NIK / No ID',
      'Nomor WhatsApp',
      'Plat / Keterangan',
      'Tanggal Mulai',
      'Durasi',
      'Satuan',
      'Jatuh Tempo',
      'Total Biaya (Rp)',
      'Sisa Kurang Bayar (Rp)',
      'Status Deposit',
      'Nominal Deposit (Rp)',
      'Status Pembayaran',
      'Status Kontrak',
      'Link KTP (Drive)',
      'Link Bukti Bayar (Drive)',
      'Catatan',
    ],
  ];

  const expenseHeaders = [
    ['ID', 'Tanggal', 'Kategori', 'Keterangan / Keperluan', 'Nominal (Rp)', 'Dicatat Oleh'],
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Penyewa!A1:U1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: tenantHeaders }),
    }
  );

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pengeluaran!A1:F1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: expenseHeaders }),
    }
  );
};

export const syncAllToGoogleSheet = async (
  token: string,
  spreadsheetId: string,
  tenants: Tenant[],
  expenses: Expense[]
) => {
  // 1. Prepare Tenant Rows
  const tenantRows = [
    [
      'ID',
      'Tanggal Input',
      'Kategori Unit',
      'Nama Unit',
      'Nama Penyewa',
      'NIK / No ID',
      'Nomor WhatsApp',
      'Plat / Keterangan',
      'Tanggal Mulai',
      'Durasi',
      'Satuan',
      'Jatuh Tempo',
      'Total Biaya (Rp)',
      'Sisa Kurang Bayar (Rp)',
      'Status Deposit',
      'Nominal Deposit (Rp)',
      'Status Pembayaran',
      'Status Kontrak',
      'Link KTP (Drive)',
      'Link Bukti Bayar (Drive)',
      'Catatan',
    ],
    ...tenants.map((t) => [
      t.id,
      t.createdAt || new Date(t.id).toISOString().split('T')[0],
      t.category,
      t.unit,
      t.nama,
      t.nik || '-',
      t.noHp,
      t.plat || '-',
      t.tglMulai,
      t.durasi,
      t.satuan,
      t.jatuhTempo,
      t.tarif,
      t.kurangBayar,
      t.depositPaid ? 'Lunas' : 'Belum',
      t.depositNominal,
      t.status,
      t.contractStatus,
      t.ktpDriveUrl || '-',
      t.buktiDriveUrl || '-',
      t.catatan || '-',
    ]),
  ];

  // 2. Prepare Expense Rows
  const expenseRows = [
    ['ID', 'Tanggal', 'Kategori', 'Keterangan / Keperluan', 'Nominal (Rp)', 'Dicatat Oleh'],
    ...expenses.map((e) => [
      e.id,
      e.tanggal,
      e.kategori,
      e.ket,
      e.nominal,
      e.pencatat || 'Admin',
    ]),
  ];

  // Clear existing sheet contents first to prevent ghost rows
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Penyewa!A1:U500:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pengeluaran!A1:F500:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  // Write updated data
  const tenantRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Penyewa!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: tenantRows }),
    }
  );

  const expenseRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pengeluaran!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: expenseRows }),
    }
  );

  if (!tenantRes.ok || !expenseRes.ok) {
    throw new Error('Gagal mengupdate data ke Google Sheets');
  }

  return true;
};

export const fetchAllFromGoogleSheet = async (
  token: string,
  spreadsheetId: string
): Promise<{ tenants: Tenant[]; expenses: Expense[] } | null> => {
  try {
    const tenantRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Penyewa!A2:U1000`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const expenseRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Pengeluaran!A2:F1000`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!tenantRes.ok && !expenseRes.ok) return null;

    const tenantData = await tenantRes.json();
    const expenseData = await expenseRes.json();

    const tenants: Tenant[] = (tenantData.values || []).map((row: any[]) => ({
      id: Number(row[0]) || Date.now(),
      createdAt: row[1] || '',
      category: row[2] || '',
      unit: row[3] || '',
      nama: row[4] || '',
      nik: row[5] !== '-' ? row[5] : '',
      noHp: row[6] || '',
      plat: row[7] !== '-' ? row[7] : '',
      tglMulai: row[8] || '',
      durasi: Number(row[9]) || 1,
      satuan: (row[10] as any) || 'Tahun',
      jatuhTempo: row[11] || '',
      tarif: Number(row[12]) || 0,
      kurangBayar: Number(row[13]) || 0,
      depositPaid: row[14] === 'Lunas',
      depositNominal: Number(row[15]) || 0,
      status: (row[16] as any) || 'Proses Verifikasi',
      contractStatus: (row[17] as any) || 'Aktif',
      ktpDriveUrl: row[18] !== '-' ? row[18] : '',
      buktiDriveUrl: row[19] !== '-' ? row[19] : '',
      catatan: row[20] !== '-' ? row[20] : '',
    }));

    const expenses: Expense[] = (expenseData.values || []).map((row: any[]) => ({
      id: Number(row[0]) || Date.now(),
      tanggal: row[1] || '',
      kategori: (row[2] as any) || 'Operasional Lainnya',
      ket: row[3] || '',
      nominal: Number(row[4]) || 0,
      pencatat: row[5] || 'Admin',
    }));

    return { tenants, expenses };
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    return null;
  }
};
