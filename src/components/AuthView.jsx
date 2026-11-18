import React, { useState, useRef, useEffect } from 'react';
import { 
  UserPlus, 
  LogIn, 
  CreditCard, 
  User, 
  Lock, 
  Phone, 
  CheckCircle, 
  AlertTriangle,
  HardHat,
  Truck,
  ArrowRight,
  Camera,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { employeeRepo } from '../lib/supabase';
import { runClientOCR } from '../lib/ocr';

export const AuthView = ({ 
  onLoginSuccess, 
  initialTab = 'login', 
  ocrTriggerCount = 0
}) => {
  const [activeTab, setActiveTab] = useState(initialTab === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Direct Camera OCR State (Kamera Bawaan HP Langsung - Khusus NIK)
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

  // Sinkronisasi tab jika prop berubah
  useEffect(() => {
    if (initialTab === 'register' || initialTab === 'login') {
      setActiveTab(initialTab);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [initialTab]);

  // Otomatis buka kamera bawaan HP jika dipicu dari tombol/menu Scan OCR
  useEffect(() => {
    if (ocrTriggerCount > 0 && cameraInputRef.current) {
      const timer = setTimeout(() => {
        setOcrMode('login');
        cameraInputRef.current?.click();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [ocrTriggerCount]);

  // 1. LOGIN CEPAT VIA OCR (KHUSUS NIK)
  const handleOcrFastLogin = async (nik) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const employee = await employeeRepo.findByNik(nik);
      if (!employee) {
        setErrorMsg(`NIK ${nik} belum terdaftar. Silakan klik tab 'Daftar Akun' terlebih dahulu.`);
        return;
      }

      setSuccessMsg(`Selamat datang, ${employee.name}! Membuka lembar kerja...`);
      setTimeout(() => {
        onLoginSuccess(employee);
      }, 450);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses login cepat via OCR');
    } finally {
      setLoading(false);
    }
  };

  // 2. LOGIN MANUAL (NIK + PASSWORD) - 1 PINTU SEMUA ROLE
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

      if (employee.password_hash !== loginPassword) {
        setErrorMsg('Password salah. Periksa kembali atau hubungi Admin Site.');
        return;
      }

      setSuccessMsg(`Berhasil masuk. Halo, ${employee.name}!`);
      setTimeout(() => {
        onLoginSuccess(employee);
      }, 350);
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
      setErrorMsg('NIK wajib diisi (scan kartu atau ketik manual).');
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
      const targetRole = regJabatan.includes('Dump Truck') ? 'driver' : 'operator';

      const newEmployee = await employeeRepo.register({
        nik: regNik.trim(),
        name: regName.trim(),
        jabatan: regJabatan,
        phone: regPhone.trim(),
        password: regPassword,
        role: targetRole
      });

      setRegisteredUserConfirmation(newEmployee);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  };

  // 4. PEMOTRETAN KAMERA BAWAAN HP LANGSUNG & PROSES OCR KHUSUS NIK
  const handleDirectCameraCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setOcrProcessing(true);
    setOcrProgress(15);
    setOcrStatusText('Membuka foto dari kamera...');
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
              await handleOcrFastLogin(result.nik);
            } else {
              // KHUSUS NIK SAJA sesuai permintaan user
              setRegNik(result.nik);
              setSuccessMsg(`NIK terdeteksi: ${result.nik}. Silakan lengkapi Nama, Jabatan, & Password.`);
            }
          } else {
            setErrorMsg(
              result.error ||
              'NIK tidak terbaca jelas. Pastikan cahaya terang & fokus, atau ketik NIK secara manual.'
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
    <div className="flex-1 flex items-center justify-center px-3.5 py-4 sm:px-6 sm:py-8 bg-[#F8FAFC]">
      <div className="w-full max-w-md lg:max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-in fade-in duration-300">
        
        {/* ========================================================================= */}
        {/* PANEL KIRI DESKTOP (VISUAL PERUSAHAAN RINGKAS & PROFESIONAL)              */}
        {/* ========================================================================= */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-slate-950 overflow-hidden flex-col justify-between p-8 text-white">
          <img 
            src="/excavator-mining.webp" 
            alt="Operasional Tambang PT. LAZ COAL MANDIRI" 
            className="absolute inset-0 w-full h-full object-cover object-center opacity-45 scale-105 select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#1e3a8a]/65 to-[#0f172a]/75" />

          <div className="relative flex items-center space-x-3">
            <div className="w-11 h-11 rounded-full bg-white p-1 shadow-lg border border-amber-400/70 shrink-0">
              <img 
                src="/lcm-logo.png" 
                alt="PT. LAZ COAL MANDIRI" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                Akses 1 Pintu
              </span>
              <h2 className="text-base font-black text-white leading-tight">
                PT. LAZ COAL MANDIRI
              </h2>
            </div>
          </div>

          <div className="relative space-y-3">
            <h3 className="text-xl font-black leading-snug text-white">
              Sistem TimeSheet Digital Terpadu
            </h3>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Masuk dengan NIK atau scan Mine Permit / ID Card untuk mencatat jam kerja (HM), ritase hauling, dan unggah foto bukti kertas HM secara realtime.
            </p>
            <div className="inline-flex items-center space-x-1.5 bg-white/15 backdrop-blur-xs px-3 py-1 rounded-full border border-white/20 text-[11px] font-semibold text-blue-100">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Site Arutmin Indonesia • Kintap</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANEL FORM MASUK & DAFTAR (PAS 1 LAYAR HP, RAPI DI LAPTOP)               */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col">
          
          {/* Mini Header Khusus Mobile (Ringkas, tidak memakan layar) */}
          <div className="lg:hidden bg-gradient-to-r from-[#1e3a8a] to-[#172554] px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <img 
                src="/lcm-logo.png" 
                alt="Logo LCM" 
                className="w-9 h-9 rounded-full bg-white p-0.5 object-contain shadow-sm shrink-0"
              />
              <div className="min-w-0">
                <h2 className="text-xs font-black tracking-wide truncate">
                  PT. LAZ COAL MANDIRI
                </h2>
                <p className="text-[10px] text-blue-200 truncate">
                  Portal TimeSheet • Site Arutmin Kintap
                </p>
              </div>
            </div>
            <span className="bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
              1 Pintu
            </span>
          </div>

          {/* Segmented Tab Toggle: Masuk vs Daftar */}
          <div className="p-3.5 pb-0 sm:px-7 sm:pt-6">
            <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2.5 text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-[#1e3a8a] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk (Login)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2.5 text-xs font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-[#1e3a8a] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Daftar Akun</span>
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-4 sm:px-7 sm:py-5 space-y-3.5 flex-1">
            
            {/* Alert Messages */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-[11px] sm:text-xs p-3 rounded-2xl flex items-start space-x-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="bg-blue-50 border border-blue-200 text-[#1e3a8a] text-[11px] sm:text-xs p-3 rounded-2xl flex items-start space-x-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-bold">{successMsg}</div>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 1: MASUK (LOGIN) - SEDERHANA & PAS 1 LAYAR HP                 */}
            {/* ================================================================= */}
            {activeTab === 'login' && (
              <div className="space-y-3.5">
                {/* 1-Tap Scan OCR NIK Button (Ringkas 1 Baris) */}
                <button
                  type="button"
                  onClick={() => {
                    setOcrMode('login');
                    cameraInputRef.current?.click();
                  }}
                  disabled={loading || ocrProcessing}
                  className="w-full bg-amber-50 hover:bg-amber-100 active:scale-[0.98] text-amber-950 font-extrabold text-xs py-3 px-4 rounded-2xl border border-amber-300/90 shadow-2xs transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Scan Kartu Identitas (Login Cepat OCR NIK)</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    atau masuk dengan NIK
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Manual Login Form */}
                <form onSubmit={handleManualLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      NIK Karyawan / Mine Permit
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={loginNik}
                        onChange={(e) => setLoginNik(e.target.value)}
                        placeholder="Contoh: V.26141"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-100 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Masukkan password Anda"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-100 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1e3a8a] hover:bg-[#172554] active:scale-[0.98] text-white text-xs sm:text-sm font-extrabold py-3 px-4 rounded-2xl shadow-md shadow-blue-900/15 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-1"
                  >
                    <LogIn className="w-4 h-4 text-amber-300" />
                    <span>{loading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 2: REGISTRASI AKUN BARU (RINGKAS & BERSIH)                    */}
            {/* ================================================================= */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* 1-Tap OCR Khusus NIK */}
                <button
                  type="button"
                  onClick={() => {
                    setOcrMode('register');
                    cameraInputRef.current?.click();
                  }}
                  disabled={loading || ocrProcessing}
                  className="w-full bg-blue-50 hover:bg-blue-100 active:scale-[0.98] text-[#1e3a8a] font-extrabold text-xs py-2.5 px-4 rounded-xl border border-blue-200 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Scan Kartu untuk Isi NIK Otomatis</span>
                </button>

                {/* NIK & Nama Lengkap */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      NIK Karyawan <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={regNik}
                        onChange={(e) => setRegNik(e.target.value)}
                        placeholder="Contoh: V.26141"
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Sesuai kartu identitas"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Pilihan Jabatan (Strict Role Lock) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jabatan / Role Kerja <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegJabatan('Operator Alat Berat')}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2 cursor-pointer ${
                        regJabatan === 'Operator Alat Berat'
                          ? 'bg-blue-50 border-[#1e3a8a] text-[#1e3a8a] ring-1 ring-[#1e3a8a]'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <HardHat className="w-4 h-4 shrink-0 text-[#1e3a8a]" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-extrabold truncate">Operator HE</div>
                        <div className="text-[9px] text-slate-500 truncate">Alat Berat</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegJabatan('Driver Dump Truck')}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2 cursor-pointer ${
                        regJabatan === 'Driver Dump Truck'
                          ? 'bg-amber-50 border-amber-500 text-amber-950 ring-1 ring-amber-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Truck className="w-4 h-4 shrink-0 text-amber-600" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-extrabold truncate">Driver DT</div>
                        <div className="text-[9px] text-slate-500 truncate">Dump Truck</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* No. Telepon (Opsional) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    No. WhatsApp / HP <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] outline-none"
                    />
                  </div>
                </div>

                {/* Buat Password & Konfirmasi */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Buat sandi"
                        className="w-full pl-8 pr-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ulangi <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi sandi"
                        className="w-full pl-8 pr-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Tombol Submit Daftar */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e3a8a] hover:bg-[#172554] active:scale-[0.98] text-white text-xs sm:text-sm font-extrabold py-3 px-4 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>{loading ? 'Mendaftarkan...' : 'Daftar Akun Sekarang'}</span>
                </button>
              </form>
            )}

          </div>
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
                <span className="text-slate-500">Status Admin:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  ✓ Langsung Terdata
                </span>
              </div>
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

      {/* Input Kamera Default Bawaan HP (capture="environment") */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleDirectCameraCapture}
      />

      {/* Loading Overlay Saat OCR Membaca NIK dari Kamera HP */}
      {ocrProcessing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-[#1e3a8a]">
              <RefreshCw className="w-7 h-7 text-[#1e3a8a] animate-spin" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Membaca NIK Kartu</h3>
              <p className="text-xs text-slate-500 mt-1">{ocrStatusText || 'Mengekstrak NIK...'}</p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-[#1e3a8a] h-2.5 rounded-full transition-all duration-300 ease-out" 
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
