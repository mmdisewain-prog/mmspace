import React, { useState } from 'react';
import { hashPassword } from '../utils/formatters';
import { Lock, Eye, EyeOff, ShieldCheck, X, AlertCircle, Mail, ExternalLink, KeyRound } from 'lucide-react';
import { User } from 'firebase/auth';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  googleUser?: User | null;
  onGoogleSignIn?: () => void;
}

const ADMIN_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; // admin123

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  googleUser,
  onGoogleSignIn,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setError('Masukkan password admin terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const trimmed = password.trim();
      const hashed = await hashPassword(trimmed);

      // Verify either against hash or accepted admin passwords
      if (
        hashed === ADMIN_HASH ||
        trimmed.toLowerCase() === 'admin123' ||
        trimmed.toLowerCase() === 'mandacan123' ||
        trimmed.toLowerCase() === 'mandacan' ||
        trimmed.toLowerCase() === 'admin'
      ) {
        onSuccess();
        setPassword('');
        setShowForgotPassword(false);
        onClose();
      } else {
        setError('Password admin salah! Silakan periksa kembali kata sandi Anda atau gunakan petunjuk lupa password.');
      }
    } catch (err: any) {
      console.error('Password hash error', err);
      if (password.trim() === 'admin123') {
        onSuccess();
        setPassword('');
        setShowForgotPassword(false);
        onClose();
      } else {
        setError('Terjadi kesalahan verifikasi password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-gray-100 my-auto animate-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Login Admin MM Space</h3>
              <p className="text-xs text-gray-500">
                Akses khusus pengelola untuk kelola penyewa & keuangan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* FORM PASSWORD */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Password Admin
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(!showForgotPassword)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>Lupa Password?</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Masukkan password admin MM Space"
                className="w-full pl-3 pr-10 py-2.5 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk sebagai Admin'}</span>
          </button>
        </form>

        {/* KETERANGAN LUPA PASSWORD */}
        {showForgotPassword && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs space-y-2 animate-in fade-in duration-150">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <Mail className="w-4 h-4 text-amber-700 shrink-0" />
              Petunjuk Pemulihan / Lupa Password:
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Silakan buka password terbaru yang telah dikirimkan melalui email ke{' '}
              <strong className="font-bold text-amber-950 underline">meina3cykytha@gmail.com</strong>.
            </p>
            <p className="text-[10px] text-amber-800">
              Periksa kotak masuk (inbox) atau folder spam pada email tersebut untuk mendapatkan kata sandi admin MM Space yang aktif.
            </p>
            <div className="pt-1 flex gap-2">
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-lg text-center flex items-center justify-center gap-1 transition"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Buka Gmail</span>
              </a>
              <a
                href="mailto:meina3cykytha@gmail.com?subject=Permintaan%20Password%20Admin%20MM%20Space"
                className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold py-1.5 px-2.5 rounded-lg text-center transition"
              >
                Kirim Pesan
              </a>
            </div>
          </div>
        )}

        {/* GOOGLE SIGN IN OPTION */}
        {onGoogleSignIn && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Atau Masuk dengan Akun Pengelola
              </span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Login dengan Google (mm.disewain@gmail.com)</span>
            </button>
            <p className="text-[11px] text-gray-500 text-center">
              Login dengan akun pemilik <strong className="text-gray-700">mm.disewain@gmail.com</strong> otomatis memberikan hak akses Admin dan menghubungkan Google Drive & Sheets.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

