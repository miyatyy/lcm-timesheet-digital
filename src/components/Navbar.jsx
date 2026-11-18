import React, { useState, useRef, useEffect } from 'react';
import { 
  HardHat, 
  Truck, 
  LogOut, 
  Lock,
  Home,
  LogIn,
  UserPlus,
  Menu,
  X,
  Camera,
  ChevronRight,
  MapPin
} from 'lucide-react';

export const Navbar = ({ 
  currentUser, 
  onLogout, 
  authViewMode = 'dashboard',
  authTab = 'login',
  onNavigateToAuth,
  onBackToDashboard,
  isInstalled = false,
  adminSidebarOpen = false,
  onToggleAdminSidebar
}) => {
  const isOperator = currentUser?.role === 'operator' || currentUser?.jabatan?.includes('Alat Berat');
  const isDriver = currentUser?.role === 'driver' || currentUser?.jabatan?.includes('Dump Truck');
  const isAdmin = currentUser?.role === 'admin' || currentUser?.jabatan?.includes('Admin');

  // Drawer menu garis tiga untuk halaman publik (Dashboard & Login)
  const [publicMenuOpen, setPublicMenuOpen] = useState(false);
  const touchStartXRef = useRef(null);

  useEffect(() => {
    if (!publicMenuOpen) return;
    document.body.style.overflow = 'hidden';
    const handleEsc = (e) => {
      if (e.key === 'Escape') setPublicMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [publicMenuOpen]);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (deltaX < -55) setPublicMenuOpen(false);
  };

  const handlePublicNav = (action) => {
    setPublicMenuOpen(false);
    if (action === 'dashboard') {
      onBackToDashboard && onBackToDashboard();
    } else if (action === 'login') {
      onNavigateToAuth && onNavigateToAuth('login');
    } else if (action === 'register') {
      onNavigateToAuth && onNavigateToAuth('register');
    } else if (action === 'ocr') {
      onNavigateToAuth && onNavigateToAuth('ocr');
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        {/* Slim Top Royal Blue Brand Strip */}
        <div className="bg-[#1e3a8a] text-white px-3 sm:px-5 py-1 text-[10px] sm:text-xs flex justify-between items-center">
          <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
            <span className="font-extrabold tracking-wider uppercase">PT. LAZ COAL MANDIRI</span>
            <span className="text-blue-300">|</span>
            <span className="text-blue-100 hidden sm:inline">Site Arutmin Indonesia, Kintap</span>
            <span className="text-blue-100 sm:hidden truncate">Site Kintap</span>
          </div>
          
          <div className="flex items-center space-x-1.5 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-700/50 select-none shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            <span className="text-blue-100 font-medium text-[10px]">Sistem Aktif</span>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className={currentUser && isAdmin ? 'w-full px-3 sm:px-5 lg:px-6' : 'max-w-6xl mx-auto px-3 sm:px-6'}>
          <div className="flex justify-between items-center h-13 sm:h-15">
            
            {/* Left Group: Single Hamburger Icon (Admin OR Public Dashboard/Login) + Brand Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              {/* 1. Tombol Garis Tiga untuk Admin */}
              {currentUser && isAdmin && onToggleAdminSidebar && (
                <button
                  type="button"
                  onClick={onToggleAdminSidebar}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 active:scale-95 touch-manipulation border shadow-2xs ${
                    adminSidebarOpen
                      ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] hover:bg-[#172554]'
                      : 'bg-blue-50 text-[#1e3a8a] border-blue-200 hover:bg-blue-100'
                  }`}
                  title={adminSidebarOpen ? 'Tutup Menu Samping' : 'Buka Menu Samping'}
                  aria-label="Toggle Menu Samping Admin"
                  aria-expanded={adminSidebarOpen}
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              {/* 2. Tombol Garis Tiga untuk Dashboard & Login (Belum Masuk) */}
              {!currentUser && (
                <button
                  type="button"
                  onClick={() => setPublicMenuOpen((prev) => !prev)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 active:scale-95 touch-manipulation border shadow-2xs ${
                    publicMenuOpen
                      ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                      : 'bg-blue-50 text-[#1e3a8a] border-blue-200 hover:bg-blue-100'
                  }`}
                  title="Buka Menu Navigasi & Login"
                  aria-label="Buka Menu Navigasi"
                  aria-expanded={publicMenuOpen}
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <div 
                onClick={!currentUser && !isInstalled && onBackToDashboard ? onBackToDashboard : undefined}
                className={`flex items-center space-x-2 sm:space-x-2.5 select-none min-w-0 ${!currentUser && !isInstalled ? 'cursor-pointer hover:opacity-90 transition' : ''}`}
              >
                <img 
                  src="/lcm-logo.png" 
                  alt="Logo PT. LAZ COAL MANDIRI" 
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-full shadow-xs border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h1 className="text-sm sm:text-base font-black text-[#1e3a8a] tracking-tight leading-tight truncate">
                      LCM TimeSheet
                    </h1>
                    <span className="bg-blue-100 text-[#1e3a8a] text-[9px] font-bold px-1.5 py-0.2 rounded border border-blue-200 shrink-0">
                      DIGITAL
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium truncate hidden sm:block">
                    Pencatatan Jam Kerja & Ritase Operasional
                  </p>
                </div>
              </div>
            </div>

            {/* Center Role Indicator (Desktop Logged In) */}
            {currentUser && (
              <nav className="hidden md:flex space-x-1 items-center">
                {isOperator && (
                  <div className="flex items-center space-x-2 bg-blue-50 text-[#1e3a8a] px-3.5 py-1.5 rounded-xl border border-blue-200 shadow-2xs">
                    <img src="/excavator-mining.webp" alt="Excavator" className="w-5 h-5 rounded-md object-cover border border-blue-300" />
                    <span className="text-xs font-black">Time Sheet Alat Berat</span>
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                )}

                {isDriver && (
                  <div className="flex items-center space-x-2 bg-amber-50 text-amber-950 px-3.5 py-1.5 rounded-xl border border-amber-300 shadow-2xs">
                    <img src="/dumptruck-cat777e.jpg" alt="Dump Truck" className="w-5 h-5 rounded-md object-cover border border-amber-400" />
                    <span className="text-xs font-black">Time Sheet Dump Truck</span>
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                )}

                {isAdmin && (
                  <div className="flex items-center space-x-2 bg-blue-900/10 text-[#1e3a8a] px-3.5 py-1.5 rounded-xl border border-blue-300 shadow-2xs">
                    <img src="/lcm-logo.png" alt="LCM Admin" className="w-5 h-5 rounded-full object-contain" />
                    <span className="text-xs font-black">Dashboard Monitoring Admin</span>
                    <Lock className="w-3.5 h-3.5 text-blue-700" />
                  </div>
                )}
              </nav>
            )}

            {/* Right Actions */}
            {currentUser ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-end space-x-1">
                    <span>{currentUser.name}</span>
                    {isAdmin && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {currentUser.jabatan} • NIK: {currentUser.nik}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-[#1e3a8a] font-bold text-xs shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-xl border border-red-200 transition cursor-pointer shadow-2xs touch-manipulation"
                  title="Keluar dari akun Anda"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span className="hidden sm:inline">Keluar</span>
                  <span className="sm:hidden">Keluar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Tombol Cepat Masuk / Beranda yang Super Ringkas */}
                {authViewMode === 'dashboard' ? (
                  <button
                    type="button"
                    onClick={() => onNavigateToAuth && onNavigateToAuth('login')}
                    className="flex items-center space-x-1.5 text-xs font-extrabold px-3.5 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#172554] text-white transition cursor-pointer shadow-xs active:scale-95"
                  >
                    <LogIn className="w-3.5 h-3.5 text-amber-300" />
                    <span>Masuk</span>
                  </button>
                ) : (
                  !isInstalled && (
                    <button
                      type="button"
                      onClick={onBackToDashboard}
                      className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer active:scale-95"
                    >
                      <Home className="w-3.5 h-3.5 text-[#1e3a8a]" />
                      <span>Beranda</span>
                    </button>
                  )
                )}
              </div>
            )}

          </div>
        </div>

        {/* Mobile Single Role Banner for Employees (Operator / Driver) */}
        {currentUser && !isAdmin && (
          <div className="md:hidden flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-1.5 text-xs">
            <div className="flex items-center space-x-2 font-bold text-slate-800">
              {isOperator ? <HardHat className="w-4 h-4 text-[#1e3a8a]" /> : <Truck className="w-4 h-4 text-amber-600" />}
              <span>{currentUser.jabatan}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Role Terkunci</span>
            </span>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* SMOOTH SLIDE-OVER MENU SAMPING KIRI UNTUK DASHBOARD & LOGIN (GARIS TIGA)  */}
      {/* ========================================================================= */}
      {!currentUser && (
        <>
          {/* Backdrop Blur Smooth Fade */}
          <div
            onClick={() => setPublicMenuOpen(false)}
            className={`fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out ${
              publicMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden="true"
          />

          {/* Slide-Over Sidebar Drawer */}
          <aside
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-white border-r border-slate-200 shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col ${
              publicMenuOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
            }`}
            aria-label="Menu Navigasi LCM"
          >
            {/* Drawer Header */}
            <div className="p-4 bg-gradient-to-br from-[#1e3a8a] via-[#1e3a8a] to-[#172554] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <img
                  src="/lcm-logo.png"
                  alt="Logo LCM"
                  className="w-10 h-10 rounded-full object-contain bg-white p-0.5 shadow-md shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-xs font-black tracking-wide uppercase truncate">
                    PT. LAZ COAL MANDIRI
                  </h2>
                  <p className="text-[10px] text-blue-200 truncate">
                    LCM TimeSheet Digital
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPublicMenuOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition cursor-pointer shrink-0"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Navigation List */}
            <div className="p-3.5 flex-1 space-y-2 overflow-y-auto">
              <div className="px-2 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Navigasi Utama
                </span>
                <span className="text-[9px] font-bold text-slate-400 sm:hidden">
                  Geser kiri tutup
                </span>
              </div>

              {!isInstalled && (
                <button
                  type="button"
                  onClick={() => handlePublicNav('dashboard')}
                  className={`w-full text-left px-3 py-3 rounded-2xl transition-all duration-200 flex items-center justify-between cursor-pointer active:scale-[0.98] ${
                    authViewMode === 'dashboard'
                      ? 'bg-[#1e3a8a] text-white shadow-md shadow-blue-900/15'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      authViewMode === 'dashboard' ? 'bg-white/15 text-amber-300' : 'bg-blue-50 text-[#1e3a8a]'
                    }`}>
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold">Beranda / Dashboard</div>
                      <div className={`text-[10px] ${authViewMode === 'dashboard' ? 'text-blue-200' : 'text-slate-400'}`}>
                        Ringkasan sistem site
                      </div>
                    </div>
                  </div>
                  {authViewMode === 'dashboard' && <ChevronRight className="w-4 h-4 text-amber-300" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => handlePublicNav('login')}
                className={`w-full text-left px-3 py-3 rounded-2xl transition-all duration-200 flex items-center justify-between cursor-pointer active:scale-[0.98] ${
                  authViewMode === 'auth' && authTab === 'login'
                    ? 'bg-[#1e3a8a] text-white shadow-md shadow-blue-900/15'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    authViewMode === 'auth' && authTab === 'login' ? 'bg-white/15 text-amber-300' : 'bg-blue-50 text-[#1e3a8a]'
                  }`}>
                    <LogIn className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold">Masuk (Login)</div>
                    <div className={`text-[10px] ${authViewMode === 'auth' && authTab === 'login' ? 'text-blue-200' : 'text-slate-400'}`}>
                      Akses 1 pintu semua role
                    </div>
                  </div>
                </div>
                {authViewMode === 'auth' && authTab === 'login' && <ChevronRight className="w-4 h-4 text-amber-300" />}
              </button>

              <button
                type="button"
                onClick={() => handlePublicNav('ocr')}
                className="w-full text-left px-3 py-3 rounded-2xl transition-all duration-200 flex items-center justify-between cursor-pointer active:scale-[0.98] bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200/80"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xs">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold">Scan Kartu (OCR NIK)</div>
                    <div className="text-[10px] text-amber-800">
                      Login cepat pakai kamera HP
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-700" />
              </button>

              <button
                type="button"
                onClick={() => handlePublicNav('register')}
                className={`w-full text-left px-3 py-3 rounded-2xl transition-all duration-200 flex items-center justify-between cursor-pointer active:scale-[0.98] ${
                  authViewMode === 'auth' && authTab === 'register'
                    ? 'bg-[#1e3a8a] text-white shadow-md shadow-blue-900/15'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    authViewMode === 'auth' && authTab === 'register' ? 'bg-white/15 text-amber-300' : 'bg-blue-50 text-[#1e3a8a]'
                  }`}>
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold">Registrasi Akun Baru</div>
                    <div className={`text-[10px] ${authViewMode === 'auth' && authTab === 'register' ? 'text-blue-200' : 'text-slate-400'}`}>
                      Daftar mandiri Operator / Driver
                    </div>
                  </div>
                </div>
                {authViewMode === 'auth' && authTab === 'register' && <ChevronRight className="w-4 h-4 text-amber-300" />}
              </button>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-[#1e3a8a]">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Site Arutmin Indonesia, Kintap</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Kabupaten Tanah Laut, Kalimantan Selatan
              </p>
            </div>
          </aside>
        </>
      )}
    </>
  );
};
