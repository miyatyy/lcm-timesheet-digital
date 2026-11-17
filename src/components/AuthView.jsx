import React, { useState, useRef, useEffect } from 'react';
import { 
  ScanLine, 
  KeyRound, 
  UserPlus, 
  LogIn, 
  ShieldCheck, 
  CreditCard, 
  User, 
  Lock, 
  Phone, 
  CheckCircle, 
  AlertTriangle,
  HardHat,
  Truck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Camera,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { employeeRepo } from '../lib/supabase';
import { runClientOCR } from '../lib/ocr';

export const AuthView = ({ 
  onLoginSuccess, 
  initialTab = 'login', 
  initialTriggerOcr = false, 
  onBackToDashboard,
  isInstalledPWA = false,
  isDesktop = true
}) => {
  const [activeTab, setActiveTab] = useState(initialTab === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sinkronisasi tab jika prop berubah
  useEffect(() => {
    if (initialTab === 'register' || initialTab === 'login') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Otomatis buka kamera jika dipicu dari tombol OCR di dashboard
  useEffect(() => {
    if (initialTriggerOcr && cameraInputRef.current) {
      const timer = setTimeout(() => {
        setOcrMode('login');
        cameraInputRef.current?.click();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [initialTriggerOcr]);

  // Direct Camera OCR State (Menggunakan Kamera Bawaan HP Langsung)
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [ocrMode, setOcrMode] = useState('login'); // 'login' | 'register'
  const cameraInputRef = useRef(null);

  // Manual Login Form State
  const [loginNik, setLoginNik] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration Form State
  const [regNik, setRegNik] = useState('');
  const [regName, setRegName] = useState('');
  const [regJabatan, setRegJabatan] = useState('Operator Alat Berat');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Registration Confirmation Modal State
  const [registeredUserConfirmation, setRegisteredUserConfirmation] = useState(null);

  // 1. LOGIN METHOD 1: FAST SCAN OCR (Tanpa Password)
  const handleOcrFastLogin = async (nik) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const employee = await employeeRepo.findByNik(nik);
      if (!employee) {
        setErrorMsg(`NIK ${nik} belum terdaftar di sistem. Silakan klik tab 'Registrasi Akun Baru' untuk mendaftar terlebih dahulu.`);
        return;
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSuccessMsg(`Selamat datang kembali, ${employee.name}! Membuka lembar kerja (${employee.jabatan})...`);
      setTimeout(() => {
        onLoginSuccess(employee);
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses login cepat via OCR');
    } finally {
      setLoading(false);
    }
  };

  // 2. LOGIN METHOD 2: MANUAL (NIK + Password)
  const handleManualLogin = async (e) => {
    e.preventDefault();
    if (!loginNik.trim() || !loginPassword.trim()) {
      setErrorMsg('Harap masukkan NIK dan Password Anda.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const employee = await employeeRepo.findByNik(loginNik.trim());
      if (!employee) {
        setErrorMsg('NIK tidak ditemukan. Pastikan Anda sudah registrasi mandiri.');
        return;
      }

      // Validasi Password
      if (employee.password_hash !== loginPassword) {
        setErrorMsg('Password salah! Periksa kembali atau hubungi Admin Site jika lupa password.');
        return;
      }

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      setSuccessMsg(`Login berhasil. Halo, ${employee.name} (${employee.jabatan})!`);
      setTimeout(() => {
        onLoginSuccess(employee);
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat masuk');
    } finally {
      setLoading(false);
    }
  };

  // 3. REGISTRASI MANDIRI KARYAWAN
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regNik.trim()) {
      setErrorMsg('NIK wajib diisi (bisa scan KTP atau ketik manual).');
      return;
    }
    if (!regName.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (!regPassword) {
      setErrorMsg('Password wajib dibuat.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      // Role otomatis ditentukan strictly: hanya 1 role per akun
      const targetRole = regJabatan.includes('Dump Truck') ? 'driver' : 'operator';

      const newEmployee = await employeeRepo.register({
        nik: regNik.trim(),
        name: regName.trim(),
        jabatan: regJabatan,
        phone: regPhone.trim(),
        password: regPassword,
        role: targetRole
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Tampilkan Modal Konfirmasi Pendaftaran Lengkap
      setRegisteredUserConfirmation(newEmployee);

    } catch (err) {
      setErrorMsg(err.message || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  };

  // 4. PEMOTRETAN KAMERA BAWAAN HP LANGSUNG & PROSES OCR
  const handleDirectCameraCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input agar pemotretan berikutnya dapat dipicu ulang
    e.target.value = '';

    setOcrProcessing(true);
    setOcrProgress(15);
    setOcrStatusText('Membuka foto dari kamera HP...');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        try {
          const result = await runClientOCR(dataUrl, (pct, status) => {
            setOcrProgress(pct);
            setOcrStatusText(status);
          });

          if (result.success && result.nik) {
            if (ocrMode === 'login') {
              // Langsung login via NIK kartu
              await handleOcrFastLogin(result.nik);
            } else {
              // Mode registrasi: KHUSUS NIK SAJA sesuai instruksi user
              setRegNik(result.nik);
              setSuccessMsg(`Kartu berhasil dipindai! NIK: ${result.nik} berhasil terisi otomatis. Silakan lengkapi Nama, Jabatan, No. Telepon (jika ada), dan buat Password.`);
            }
          } else {
            setErrorMsg(
              result.error || 
              'NIK tidak terbaca jelas dari foto kartu. Pastikan cahaya cukup terang dan tidak buram, atau Anda dapat mengetikkan NIK secara manual di bawah.'
            );
          }
        } catch (err) {
          setErrorMsg('Gagal memproses OCR: ' + err.message);
        } finally {
          setOcrProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setOcrProcessing(false);
      setErrorMsg('Gagal membaca berkas kamera: ' + err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-3 sm:p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-xl space-y-3">
        {/* Tombol Kembali ke Dashboard Beranda (Khusus Browser Desktop Saja & Bukan PWA Terinstal) */}
        {onBackToDashboard && !isInstalledPWA && isDesktop && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#1e3a8a] hover:text-blue-700 bg-white hover:bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-200 shadow-2xs transition cursor-pointer active:scale-98"
          >
            <ArrowLeft className="w-4 h-4 text-[#1e3a8a]" />
            <span>← Kembali ke Beranda Profil PT. LCM</span>
          </button>
        )}

        <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        
        {/* ============================================================================== */}
        {/* BANNER ATAS DENGAN FOTO OPERASIONAL TAMBANG & LOGO RESMI LCM                   */}
        {/* ============================================================================== */}
        <div className="relative h-52 sm:h-56 overflow-hidden bg-black">
          <img 
            src="/excavator-mining.webp" 
            alt="Operasional Tambang PT. LAZ COAL MANDIRI" 
            className="w-full h-full object-cover opacity-60 scale-105 select-none"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#1e3a8a]/40 to-black/70" />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="bg-white/95 backdrop-blur-md p-2 rounded-full shadow-2xl border-2 border-amber-400 mb-2 flex items-center justify-center">
              <img 
                src="/lcm-logo.png" 
                alt="PT. LAZ COAL MANDIRI" 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full"
              />
            </div>
            <h2 className="text-white font-extrabold text-base sm:text-lg tracking-wide drop-shadow-md">
              PT. LAZ COAL MANDIRI
            </h2>
            <div className="inline-flex items-center space-x-1.5 bg-black/60 backdrop-blur-xs text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-400/40 mt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sistem TimeSheet Digital Resmi Site Arutmin Kintap</span>
            </div>
          </div>
        </div>

        {/* Tab Selector: Masuk vs Registrasi */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-2xl transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-[#1e3a8a] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk (Login)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-2xl transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-[#1e3a8a] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Registrasi Akun Baru</span>
          </button>
        </div>

        {/* Feedback Alert Boxes */}
        <div className="p-6 pt-5 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-2xl flex items-start space-x-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="bg-blue-50 border border-blue-200 text-[#1e3a8a] text-xs p-3.5 rounded-2xl flex items-start space-x-2.5 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-bold">{successMsg}</div>
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 1: MASUK (LOGIN)                                                           */}
          {/* ============================================================================== */}
          {activeTab === 'login' && (
            <div className="space-y-6">
              
              {/* METODE 1: FAST SCAN OCR BUTTON (LANGSUNG LOGIN TANPA PASSWORD) */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 p-4 sm:p-5 rounded-2xl border-2 border-blue-300 shadow-xs relative overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="inline-block bg-[#1e3a8a] text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
                      Metode 1: Rekomendasi Cepat
                    </span>
                    <h4 className="text-sm font-black text-[#1e3a8a]">
                      Scan Kartu Identitas (OCR) Tanpa Password
                    </h4>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      Foto kartu Mine Permit / KTP di HP &rarr; Sistem membaca khusus NIK (misal: V.26141) &rarr; Langsung masuk sesuai role!
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#1e3a8a] text-amber-400 flex items-center justify-center shrink-0 shadow-md">
                    <ScanLine className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOcrMode('login');
                    cameraInputRef.current?.click();
                  }}
                  disabled={loading || ocrProcessing}
                  className="w-full bg-[#1e3a8a] hover:bg-[#172554] text-white text-xs sm:text-sm font-extrabold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <Camera className="w-5 h-5 text-amber-400" />
                  <span>Buka Kamera HP (Foto & Langsung Masuk)</span>
                </button>
              </div>

              {/* PEMBATAS "ATAU" */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
                  Atau Gunakan NIK & Password
                </span>
              </div>

              {/* METODE 2: LOGIN MANUAL (NIK + PASSWORD) */}
              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Induk Kependudukan (NIK) / No ID:
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={loginNik}
                      onChange={(e) => setLoginNik(e.target.value)}
                      placeholder="Masukkan NIK Anda"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Password:
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Password buatan sendiri
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Masukkan password Anda"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e3a8a] hover:bg-[#172554] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
                </button>
              </form>

              {/* Catatan Privasi & Keamanan Hak Akses */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[11px] text-slate-600 flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Batasan Hak Akses:</strong> Setiap akun terikat pada 1 role operasional (Operator Alat Berat hanya membuka lembar HE, Driver Dump Truck hanya membuka lembar DT, dan Admin membuka Dashboard).
                </p>
              </div>

            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 2: REGISTRASI MANDIRI KARYAWAN (SELF-REGISTRATION)                          */}
          {/* ============================================================================== */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 space-y-2">
                <div className="font-bold flex items-center space-x-1.5 text-[#1e3a8a]">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Validasi Otomatis via OCR Tesseract:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-900">
                  Gunakan kamera HP untuk memfoto Mine Permit / KTP Anda. Sistem otomatis memindai <strong>khusus NIK Karyawan</strong> (seperti contoh: V.26141) agar pendaftaran cepat & tepat.
                </p>
                
                <button
                  type="button"
                  onClick={() => {
                    setOcrMode('register');
                    cameraInputRef.current?.click();
                  }}
                  disabled={ocrProcessing}
                  className="w-full bg-[#1e3a8a] hover:bg-[#172554] active:scale-98 text-white font-bold py-3 px-3 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Buka Kamera HP (Pindai Khusus NIK Kartu)</span>
                </button>
              </div>

              {/* NIK Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Induk Kependudukan (NIK) / No ID Karyawan: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regNik}
                    onChange={(e) => setRegNik(e.target.value)}
                    placeholder="16 digit NIK atau kode identitas"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  * Kolom NIK terkunci unik (UNIQUE) di database untuk mencegah duplikasi akun.
                </span>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Karyawan: <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Nama lengkap sesuai KTP / ID Card"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Pilihan Jabatan (Strict 1 Role) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Jabatan Pekerjaan (Dibatasi 1 Role Kerja): <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegJabatan('Operator Alat Berat')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between overflow-hidden cursor-pointer ${
                      regJabatan === 'Operator Alat Berat'
                        ? 'bg-blue-50 border-[#1e3a8a] ring-2 ring-[#1e3a8a] shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="h-20 w-full rounded-xl overflow-hidden mb-2 bg-slate-100">
                      <img src="/excavator-mining.webp" alt="Operator Alat Berat" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <HardHat className="w-4 h-4 text-[#1e3a8a] shrink-0" />
                      <span className="text-xs font-black text-slate-900 leading-tight">Operator Alat Berat</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5">Excavator / Bulldozer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegJabatan('Driver Dump Truck')}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between overflow-hidden cursor-pointer ${
                      regJabatan === 'Driver Dump Truck'
                        ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-600 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="h-20 w-full rounded-xl overflow-hidden mb-2 bg-slate-100">
                      <img src="/dumptruck-cat777e.jpg" alt="Driver Dump Truck" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Truck className="w-4 h-4 text-amber-700 shrink-0" />
                      <span className="text-xs font-black text-slate-900 leading-tight">Driver Dump Truck</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5">DT Hauling & Ritase</span>
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  * Akun hanya berhak mengakses lembar time sheet sesuai jabatan yang dipilih.
                </span>
              </div>

              {/* No WhatsApp / HP (Opsional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. Handphone / WhatsApp:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] outline-none"
                  />
                </div>
              </div>

              {/* Buat Password Sendiri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Buat Password Sendiri: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Password baru"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ulangi Password: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Ulangi password"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Simpan Registrasi */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1e3a8a] hover:bg-[#172554] text-white text-xs sm:text-sm font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Akun Saya Sekarang'}</span>
              </button>

            </form>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI PENDAFTARAN & TERDATA DI ADMIN                           */}
      {/* ========================================================================= */}
      {registeredUserConfirmation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-[#1e3a8a] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>

            <div className="text-center space-y-1">
              <span className="bg-blue-100 text-[#1e3a8a] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Registrasi Mandiri Berhasil
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Akun Terdaftar Resmi!
              </h3>
              <p className="text-xs text-slate-500">
                PT. LAZ COAL MANDIRI • Site Arutmin Kintap
              </p>
            </div>

            {/* Rincian Data Karyawan */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2 font-medium">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Nama Lengkap:</span>
                <span className="font-bold text-slate-900">{registeredUserConfirmation.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">NIK (Terkunci):</span>
                <span className="font-mono font-bold text-slate-900">{registeredUserConfirmation.nik}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Jabatan & Role:</span>
                <span className="font-bold text-[#1e3a8a] flex items-center space-x-1">
                  {registeredUserConfirmation.jabatan.includes('Dump Truck') ? <Truck className="w-3.5 h-3.5 text-amber-500" /> : <HardHat className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{registeredUserConfirmation.jabatan}</span>
                </span>
              </div>
              {registeredUserConfirmation.phone && (
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">No. WhatsApp:</span>
                  <span className="font-mono text-slate-800">{registeredUserConfirmation.phone}</span>
                </div>
              )}
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500">Status Data Admin:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  ✓ Langsung Terdata di Admin
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-950">
              <strong>Batasan Hak Akses:</strong> Akun Anda secara otomatis hanya berhak membuka <strong>Time Sheet {registeredUserConfirmation.jabatan}</strong> demi ketertiban data site.
            </div>

            <button
              type="button"
              onClick={() => {
                const user = registeredUserConfirmation;
                setRegisteredUserConfirmation(null);
                onLoginSuccess(user);
              }}
              className="w-full bg-[#1e3a8a] hover:bg-[#172554] text-white text-xs sm:text-sm font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Lanjut Buka Lembar Kerja</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Input Kamera Default Bawaan HP (capture="environment") */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleDirectCameraCapture}
      />

      {/* Loading Overlay Saat OCR Membaca Foto dari Kamera HP */}
      {ocrProcessing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-[#1e3a8a]">
              <RefreshCw className="w-8 h-8 text-[#1e3a8a] animate-spin" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Membaca Kartu Identitas</h3>
              <p className="text-xs text-slate-500 mt-1">{ocrStatusText || 'Mengekstrak NIK & Nama...'}</p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-[#1e3a8a] h-3 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-[#1e3a8a]">{ocrProgress}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
