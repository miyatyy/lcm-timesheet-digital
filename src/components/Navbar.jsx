import React from 'react';
import { 
  HardHat, 
  Truck, 
  ShieldCheck, 
  LogOut, 
  Lock,
  UserCheck
} from 'lucide-react';

export const Navbar = ({ 
  currentUser, 
  onLogout, 
  activeTab, 
  setActiveTab
}) => {
  const isOperator = currentUser?.role === 'operator' || currentUser?.jabatan?.includes('Alat Berat');
  const isDriver = currentUser?.role === 'driver' || currentUser?.jabatan?.includes('Dump Truck');
  const isAdmin = currentUser?.role === 'admin' || currentUser?.jabatan?.includes('Admin');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Blue Brand Banner */}
      <div className="bg-[#1e3a8a] text-white px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs flex justify-between items-center">
        <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
          <span className="font-extrabold tracking-wider uppercase">PT. LAZ COAL MANDIRI</span>
          <span className="text-blue-300">|</span>
          <span className="text-blue-100 hidden sm:inline">Site Arutmin Indonesia, Kintap</span>
          <span className="text-blue-100 sm:hidden truncate">Site Kintap</span>
        </div>
        
        {/* Status Sistem Operasional (Aman & Tidak Membuka Konfigurasi Database) */}
        <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] shrink-0">
          <div className="flex items-center space-x-1 sm:space-x-1.5 bg-blue-950/70 px-2 sm:px-2.5 py-0.5 rounded-full border border-blue-700/50 select-none">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-sky-400"></span>
            <span className="text-blue-100 font-medium">
              Sistem Aktif
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          
          {/* Logo & System Title */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src="/lcm-logo.png" 
              alt="Logo PT. LAZ COAL MANDIRI" 
              className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-full shadow-sm border border-slate-200 shrink-0"
            />
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h1 className="text-sm sm:text-lg font-black text-[#1e3a8a] tracking-tight leading-tight">
                  LCM TimeSheet
                </h1>
                <span className="bg-blue-100 text-[#1e3a8a] text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded border border-blue-200">
                  DIGITAL
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[170px] sm:max-w-none">
                Pencatatan Jam Kerja & Ritase Operasional
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* NAVIGATION DENGAN BATASAN KETAT (1 ROLE PER AKUN)                         */}
          {/* ========================================================================= */}
          {currentUser && (
            <nav className="hidden md:flex space-x-1 items-center">
              
              {/* JIKA OPERATOR: HANYA MUNCUL TIME SHEET ALAT BERAT */}
              {isOperator && (
                <div className="flex items-center space-x-2 bg-blue-50 text-[#1e3a8a] px-3.5 py-1.5 rounded-xl border border-blue-300 shadow-xs">
                  <img src="/excavator-mining.webp" alt="Excavator" className="w-6 h-6 rounded-md object-cover border border-blue-400 shadow-xs" />
                  <span className="text-xs font-black">Time Sheet Alat Berat (Role Terkunci)</span>
                  <Lock className="w-3.5 h-3.5 text-blue-600 ml-1" title="Akses dibatasi hanya untuk Operator Alat Berat" />
                </div>
              )}

              {/* JIKA DRIVER: HANYA MUNCUL TIME SHEET DUMP TRUCK */}
              {isDriver && (
                <div className="flex items-center space-x-2 bg-amber-50 text-amber-950 px-3.5 py-1.5 rounded-xl border border-amber-300 shadow-xs">
                  <img src="/dumptruck-cat777e.jpg" alt="Dump Truck" className="w-6 h-6 rounded-md object-cover border border-amber-400 shadow-xs" />
                  <span className="text-xs font-black">Time Sheet Dump Truck (Role Terkunci)</span>
                  <Lock className="w-3.5 h-3.5 text-amber-600 ml-1" title="Akses dibatasi hanya untuk Driver Dump Truck" />
                </div>
              )}

              {/* JIKA ADMIN: HANYA DASHBOARD ADMIN (DIBATASI, TIDAK BISA BUKA FORM KERJA KARYAWAN) */}
              {isAdmin && (
                <div className="flex items-center space-x-2 bg-blue-900/10 text-[#1e3a8a] px-3.5 py-1.5 rounded-xl border border-blue-300 shadow-xs">
                  <img src="/lcm-logo.png" alt="LCM Admin" className="w-6 h-6 rounded-full object-contain" />
                  <span className="text-xs font-black">Dashboard Monitoring Admin (Role Terkunci)</span>
                  <Lock className="w-3.5 h-3.5 text-blue-700 ml-1" title="Akses dibatasi hanya untuk Dashboard Admin" />
                </div>
              )}

            </nav>
          )}

          {/* User Profile & Logout */}
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

              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-[#1e3a8a] font-bold text-xs sm:text-sm shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>

              <button
                onClick={onLogout}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-xl border border-red-200 transition cursor-pointer shadow-2xs touch-manipulation"
                title="Keluar dari akun Anda sekarang"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 shrink-0" />
                <span className="hidden sm:inline">Keluar (Logout)</span>
                <span className="sm:hidden font-bold">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-xs text-slate-500 hidden sm:inline">Belum masuk?</span>
              <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold text-[#1e3a8a] bg-blue-50 px-2 sm:px-2.5 py-1 rounded-lg border border-blue-200">
                <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                <span>Self-Reg Karyawan</span>
              </span>
            </div>
          )}

        </div>
      </div>

      {/* Mobile Single Role Banner for Employees */}
      {currentUser && !isAdmin && (
        <div className="md:hidden flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs">
          <div className="flex items-center space-x-2 font-bold text-slate-800">
            {isOperator ? <HardHat className="w-4 h-4 text-[#1e3a8a]" /> : <Truck className="w-4 h-4 text-amber-600" />}
            <span>{currentUser.jabatan}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono flex items-center space-x-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Role Terkunci</span>
          </span>
        </div>
      )}

      {/* Mobile Single Role Banner for Admin */}
      {currentUser && isAdmin && (
        <div className="md:hidden flex items-center justify-between border-t border-slate-200 bg-purple-50/70 px-4 py-2 text-xs">
          <div className="flex items-center space-x-2 font-bold text-purple-950">
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <span>Dashboard Admin Site</span>
          </div>
          <span className="text-[11px] text-purple-700 font-mono flex items-center space-x-1">
            <Lock className="w-3 h-3 text-purple-500" />
            <span>Role Terkunci</span>
          </span>
        </div>
      )}
    </header>
  );
};
