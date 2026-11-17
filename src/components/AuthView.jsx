import React, { useState } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { employeeRepo } from '../lib/supabase';
import { OcrScannerModal } from './OcrScannerModal';
import heavyBannerSvg from '../assets/heavy-equipment-banner.svg';
import lcmLogoSvg from '../assets/lcm-logo.svg';

export const AuthView = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // OCR Modal State
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [ocrMode, setOcrMode] = useState('login'); // 'login' | 'register'

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

  // Tangani callback scan OCR
  const handleScanComplete = (data) => {
    if (ocrMode === 'login') {
      if (data.nik) {
        handleOcrFastLogin(data.nik);
      } else {
        setErrorMsg('NIK tidak terdeteksi dari hasil scan. Silakan coba kembali atau gunakan login manual.');
      }
    } else {
      // Mode registrasi
      if (data.nik) setRegNik(data.nik);
      if (data.name) setRegName(data.name);
      setSuccessMsg('Data kartu identitas berhasil diekstrak! Silakan lengkapi jabatan dan buat password.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-3 sm:p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        
        {/* ============================================================================== */}
        {/* BANNER ATAS DENGAN GAMBAR ALAT BERAT GELAP TRANSPARAN & LOGO PERUSAHAAN        */}
        {/* ============================================================================== */}
        <div className="relative h-48 sm:h-52 overflow-hidden bg-[#0a3622]">
          <img 
            src={heavyBannerSvg} 
            alt="Heavy Equipment Mining Background" 
            className="w-full h-full object-cover opacity-85 select-none"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#0a3622] via-[#0a3622]/40 to-transparent" />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/60 mb-2 max-w-[90%]">
              <img 
                src={lcmLogoSvg} 
                alt="PT. LAZ COAL MANDIRI" 
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>
            <div className="inline-flex items-center space-x-1.5 bg-black/50 backdrop-blur-xs text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
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
                ? 'bg-[#0F5132] text-white shadow-sm'
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
                ? 'bg-[#0F5132] text-white shadow-sm'
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
            <div className="bg-emerald-50 border border-emerald-200 text-[#0F5132] text-xs p-3.5 rounded-2xl flex items-start space-x-2.5 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-bold">{successMsg}</div>
            </div>
          )}

          {/* ============================================================================== */}
          {/* TAB 1: MASUK (LOGIN)                                                           */}
          {/* ============================================================================== */}
          {activeTab === 'login' && (
            <div className="space-y-6">
              
              {/* METODE 1: FAST SCAN OCR BUTTON (LANGSUNG LOGIN TANPA PASSWORD) */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 shadow-xs relative overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="inline-block bg-[#0F5132] text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
                      Metode 1: Rekomendasi Cepat
                    </span>
                    <h4 className="text-sm font-black text-[#0F5132]">
                      Scan Kartu Identitas (OCR) Tanpa Password
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Foto KTP atau ID Card karyawan Anda di HP &rarr; NIK dicocokkan otomatis &rarr; langsung masuk sesuai role pekerjaan Anda!
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#0F5132] text-amber-400 flex items-center justify-center shrink-0 shadow-md">
                    <ScanLine className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOcrMode('login');
                    setIsOcrOpen(true);
                  }}
                  disabled={loading}
                  className="w-full bg-[#0F5132] hover:bg-[#0a3622] text-white text-xs sm:text-sm font-extrabold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <ScanLine className="w-4 h-4 text-amber-400" />
                  <span>Scan Kartu Identitas (Langsung Masuk)</span>
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
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132] outline-none transition"
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
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132] outline-none transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0F5132] hover:bg-[#0a3622] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
                </button>
              </form>

              {/* Catatan Privasi & Keamanan Hak Akses */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[11px] text-slate-600 flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
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
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 space-y-2">
                <div className="font-bold flex items-center space-x-1.5 text-[#0F5132]">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Validasi Otomatis via OCR Tesseract:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-900">
                  Gunakan kamera HP untuk memfoto KTP / ID Card karyawan. Sistem mengekstrak NIK dan Nama Anda secara otomatis. Data langsung terdaftar resmi di sistem Admin PT. LAZ COAL MANDIRI.
                </p>
                
                <button
                  type="button"
                  onClick={() => {
                    setOcrMode('register');
                    setIsOcrOpen(true);
                  }}
                  className="w-full bg-[#0F5132] hover:bg-[#0a3622] text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition cursor-pointer"
                >
                  <ScanLine className="w-4 h-4 text-amber-400" />
                  <span>Foto & Scan Kartu Identitas (OCR)</span>
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132] outline-none"
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Pilihan Jabatan (Strict 1 Role) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Jabatan Pekerjaan (Dibatasi 1 Role Kerja): <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegJabatan('Operator Alat Berat')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                      regJabatan === 'Operator Alat Berat'
                        ? 'bg-[#0F5132] text-white border-[#0F5132] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <HardHat className="w-3.5 h-3.5 text-amber-400" />
                    <span>Operator Alat Berat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegJabatan('Driver Dump Truck')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                      regJabatan === 'Driver Dump Truck'
                        ? 'bg-[#0F5132] text-white border-[#0F5132] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Driver Dump Truck</span>
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0F5132] outline-none"
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
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0F5132] outline-none"
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
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0F5132] outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Simpan Registrasi */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0F5132] hover:bg-[#0a3622] text-white text-xs sm:text-sm font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
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
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#0F5132] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>

            <div className="text-center space-y-1">
              <span className="bg-emerald-100 text-[#0F5132] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
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
                <span className="font-bold text-[#0F5132] flex items-center space-x-1">
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
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ✓ Langsung Terdata di Admin
                </span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-950">
              <strong>Batasan Hak Akses:</strong> Akun Anda secara otomatis hanya berhak membuka <strong>Time Sheet {registeredUserConfirmation.jabatan}</strong> demi ketertiban data site.
            </div>

            <button
              type="button"
              onClick={() => {
                const user = registeredUserConfirmation;
                setRegisteredUserConfirmation(null);
                onLoginSuccess(user);
              }}
              className="w-full bg-[#0F5132] hover:bg-[#0a3622] text-white text-xs sm:text-sm font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Lanjut Buka Lembar Kerja</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* OCR Scanner Modal Component */}
      <OcrScannerModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onScanComplete={handleScanComplete}
        mode={ocrMode}
        title={ocrMode === 'login' ? 'Scan Kartu Identitas (Login Cepat)' : 'Scan KTP / ID Card Registrasi'}
      />
    </div>
  );
};
