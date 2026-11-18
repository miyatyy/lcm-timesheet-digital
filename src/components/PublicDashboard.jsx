import React from 'react';
import { 
  LogIn, 
  Camera, 
  UserPlus, 
  HardHat, 
  Truck, 
  ShieldCheck, 
  MapPin, 
  ArrowRight
} from 'lucide-react';

export const PublicDashboard = ({ onNavigateToAuth }) => {
  return (
    <div className="flex-1 flex items-center justify-center px-3.5 py-4 sm:px-6 sm:py-8 bg-[#F8FAFC]">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-in fade-in duration-300">
        
        {/* ========================================================================= */}
        {/* BAGIAN VISUAL OPERASIONAL (ATAS RINGKAS DI HP, KIRI PENUH DI LAPTOP)      */}
        {/* ========================================================================= */}
        <div className="relative lg:col-span-6 h-44 sm:h-56 lg:h-auto lg:min-h-[440px] bg-slate-950 overflow-hidden flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-white">
          <img 
            src="/excavator-mining.webp" 
            alt="Operasional Tambang PT. LAZ COAL MANDIRI Site Arutmin Kintap" 
            className="absolute inset-0 w-full h-full object-cover object-center opacity-50 scale-105 select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#1e3a8a]/55 to-[#0f172a]/70" />

          {/* Top Brand Identity */}
          <div className="relative flex items-center space-x-2.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white p-1 shadow-lg border border-amber-400/70 shrink-0 flex items-center justify-center">
              <img 
                src="/lcm-logo.png" 
                alt="Logo PT. LAZ COAL MANDIRI" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block leading-none">
                Kontraktor Tambang Batubara
              </span>
              <h2 className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-white truncate mt-0.5">
                PT. LAZ COAL MANDIRI
              </h2>
            </div>
          </div>

          {/* Bottom Location & Info Chips */}
          <div className="relative space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-white/15 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20 text-[11px] font-semibold text-blue-100">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Site Arutmin Indonesia • Kintap, Kalsel</span>
            </div>
            <p className="hidden lg:block text-xs text-blue-100/90 leading-relaxed max-w-md">
              Beroperasi sejak 2013 dengan komitmen K3LH & Good Mining Practice dalam pengupasan tanah penutup, pemuatan, dan angkutan hauling batubara.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BAGIAN AKSI & PORTAL MASUK (SEDERHANA, PAS 1 LAYAR HP & RAPI DI LAPTOP)   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 p-5 sm:p-7 lg:p-10 flex flex-col justify-center space-y-5">
          
          {/* Headline */}
          <div className="space-y-2 text-center lg:text-left">
            <span className="inline-flex items-center space-x-1.5 bg-blue-50 text-[#1e3a8a] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>Portal Resmi 1 Pintu</span>
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              LCM TimeSheet Digital
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Pencatatan jam kerja (HM), ritase hauling, dan bukti kertas HM fisik secara realtime langsung ke Admin Site.
            </p>
          </div>

          {/* 3 Compact Role Indicators (Tanpa Akun Dummy) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-blue-100 text-[#1e3a8a] flex items-center justify-center">
                <HardHat className="w-4 h-4" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-800 block leading-tight">
                Operator HE
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-800 block leading-tight">
                Driver DT
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-800 block leading-tight">
                Admin Site
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => onNavigateToAuth('login')}
              className="w-full bg-[#1e3a8a] hover:bg-[#172554] active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm py-3.5 px-5 rounded-2xl shadow-md shadow-blue-900/15 flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>Masuk ke Sistem (Login)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onNavigateToAuth('ocr')}
                className="bg-amber-50 hover:bg-amber-100 active:scale-[0.98] text-amber-950 font-extrabold text-xs py-3 px-3 rounded-2xl border border-amber-300/80 flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Scan NIK (OCR)</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToAuth('register')}
                className="bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 font-extrabold text-xs py-3 px-3 rounded-2xl border border-slate-200 flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#1e3a8a] shrink-0" />
                <span>Daftar Akun</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
