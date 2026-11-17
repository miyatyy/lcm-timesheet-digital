import React from 'react';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Award, 
  Truck, 
  HardHat, 
  Camera, 
  LogIn, 
  UserPlus, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  ExternalLink, 
  Globe, 
  Activity, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Users,
  Compass,
  Zap,
  TrendingUp,
  Briefcase
} from 'lucide-react';

export const PublicDashboard = ({ onNavigateToAuth }) => {
  return (
    <div className="space-y-10 sm:space-y-14 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: COMPANY PROFILE & SITE OVERVIEW                          */}
      {/* ========================================================================= */}
      <section className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 text-white">
        {/* Background Image Carousel / Overlay */}
        <div className="absolute inset-0">
          <img 
            src="/excavator-mining.webp" 
            alt="Operasional Tambang PT. LAZ COAL MANDIRI Site Arutmin Kintap" 
            className="w-full h-full object-cover object-center opacity-35 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-blue-950/60" />
          <div className="absolute inset-0 bg-radial from-transparent via-slate-950/50 to-slate-950/90" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 py-10 sm:py-16 sm:px-8 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          
          {/* Left Column: Brand & LinkedIn Profile Content */}
          <div className="space-y-5 text-center lg:text-left flex-1">
            
            {/* Top Badge: Verified LinkedIn Mining Contractor */}
            <div className="inline-flex items-center space-x-2 bg-blue-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-blue-500/40 text-blue-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span className="font-extrabold uppercase tracking-wider text-amber-300">PT. LAZ COAL MANDIRI</span>
              <span className="text-blue-300">|</span>
              <span className="hidden sm:inline">Mitra Kontraktor PT. Arutmin Indonesia</span>
              <span className="sm:hidden">Site Kintap</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight sm:leading-none text-white drop-shadow-md">
                Kontraktor Penambangan & Armada Tambang Batubara
              </h1>
              <p className="text-base sm:text-lg text-blue-100/90 font-medium">
                Site Arutmin Indonesia, Kintap • Kabupaten Tanah Laut, Kalimantan Selatan
              </p>
            </div>

            {/* LinkedIn Metadata Pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs text-slate-300">
              <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Didirikan 2013</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Kintap, Kalimantan Selatan</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>K3LH & Good Mining Practice</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10">
                <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>200+ Personel Terlatih (FGDP)</span>
              </div>
            </div>

            {/* Description from LinkedIn Profile */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-normal">
              PT. LAZ Coal Mandiri (LCM) adalah perusahaan kontraktor penambangan batubara nasional terkemuka yang beroperasi di Site Arutmin Indonesia Kintap. Menyediakan layanan terintegrasi pengupasan tanah penutup (overburden removal), pemuatan batubara (coal getting), manajemen armada alat berat berkapasitas besar, dan angkutan hauling pit-to-port dengan standar keselamatan operasional tinggi.
            </p>

            {/* Primary Action Buttons (Desktop & Mobile) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigateToAuth('login')}
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-blue-500/25 flex items-center justify-center space-x-2 transition cursor-pointer active:scale-98"
              >
                <LogIn className="w-4 h-4 text-amber-300" />
                <span>Masuk ke Sistem TimeSheet</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToAuth('ocr')}
                className="bg-white/15 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-5 py-3.5 rounded-2xl border border-white/20 flex items-center justify-center space-x-2 transition cursor-pointer active:scale-98"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Scan KTP / ID Card (OCR Cepat)</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToAuth('register')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-md flex items-center justify-center space-x-2 transition cursor-pointer active:scale-98"
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>Registrasi Karyawan</span>
              </button>
            </div>

          </div>

          {/* Right Column: Circular Official Logo & Company Badge Card */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="relative p-3 rounded-full bg-gradient-to-tr from-amber-500 via-blue-600 to-sky-400 shadow-2xl animate-in zoom-in duration-500">
              <div className="bg-white rounded-full p-4 sm:p-5 shadow-inner">
                <img 
                  src="/lcm-logo.png" 
                  alt="Official Logo PT. LAZ COAL MANDIRI" 
                  className="w-32 h-32 sm:w-44 sm:h-44 object-contain rounded-full select-none"
                />
              </div>
              <div className="absolute -bottom-2 bg-slate-900 border border-amber-400 text-amber-300 text-[11px] font-black uppercase px-3.5 py-1 rounded-full shadow-lg left-1/2 -translate-x-1/2 whitespace-nowrap">
                Site Arutmin Kintap
              </div>
            </div>

            <div className="mt-5 text-center space-y-1">
              <a 
                href="https://id.linkedin.com/company/lazcoal" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 transition font-bold"
              >
                <span>Lihat Profil Resmi di LinkedIn</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <p className="text-[11px] text-slate-400">
                Pencatatan Jam Kerja (HM) & Ritase Digital Terverifikasi
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. LIVE OPERATIONAL METRICS & SITE STATS                                  */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Ringkasan Operasional Tambang Site Kintap
            </h2>
            <p className="text-xs text-slate-500">
              Data terintegrasi sistem TimeSheet Digital PT. LAZ COAL MANDIRI
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#1e3a8a] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 self-start sm:self-auto">
            <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Operasional Aktif 2 Shift (24 Jam)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1 */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center font-bold">
              <HardHat className="w-5 h-5 text-[#1e3a8a]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Armada Alat Berat</span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">Excavator & Dozer</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Doosan DX530LC-7M, Komatsu PC2000, CAT 390D, D85ESS-2
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Armada Angkut Hauling</span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">Heavy Dump Truck</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Caterpillar 777E, Hino 500 Series, & Uji Coba Hybrid DT
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Siklus Kerja Operasi</span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">12 Jam per Shift</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Shift 1 (06:00-18:00) & Shift 2 (18:00-06:00 WITA)
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tenaga Kerja Lokal</span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">Program FGDP</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Pemberdayaan operator & mekanik muda lulusan lokal Kintap
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SHOWCASE ARMADA & GALERI OPERASIONAL TAMBANG (FOTO ASLI USER)          */}
      {/* ========================================================================= */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Galeri Armada & Aktivitas Penambangan Batubara
            </h2>
            <p className="text-xs text-slate-500">
              Dokumentasi nyata unit alat berat dan dump truck di pit Site Arutmin Indonesia, Kintap
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Site: Arutmin Indonesia - Kintap (KalSel)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Photo 1: Heavy Equipment Excavator Pit Loading */}
          <div className="group bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-card hover:shadow-card-hover transition flex flex-col">
            <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-900">
              <img 
                src="/excavator-mining.webp" 
                alt="Coal Getting & Loading Pit Arutmin Kintap" 
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500 select-none"
              />
              <div className="absolute top-3 left-3 bg-[#1e3a8a] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                Coal Getting & Loading
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                Doosan / PC2000 Pit Operation
              </div>
            </div>
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Operasi Pemuatan Batubara di Pit Tambang
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Excavator kelas berat memuat batubara murni langsung ke unit dump truck di bench pit tambang Kintap untuk diteruskan ke jalur hauling.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#1e3a8a]">
                <span>Pencatatan Jam Kerja (HM)</span>
                <span className="text-slate-400 font-mono">12 WH / Shift</span>
              </div>
            </div>
          </div>

          {/* Photo 2: Heavy Dump Truck CAT 777E */}
          <div className="group bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-card hover:shadow-card-hover transition flex flex-col">
            <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-900">
              <img 
                src="/dumptruck-cat777e.jpg" 
                alt="CAT 777E Dump Truck PT LAZ COAL MANDIRI" 
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500 select-none"
              />
              <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                Hauling Heavy Fleet
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                Caterpillar 777E Hauler
              </div>
            </div>
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Dump Truck Berkapasitas Raksasa (CAT 777E)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Unit pengangkut material overburden dan batubara bertonase besar. Dilengkapi sistem pemantauan ritase per jam dan mechanical availability optimal.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-amber-700">
                <span>Pencatatan Ritase & Hauling</span>
                <span className="text-slate-400 font-mono">Rit Counter Aktif</span>
              </div>
            </div>
          </div>

          {/* Photo 3: Mining Operations & Pit Area */}
          <div className="group bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-card hover:shadow-card-hover transition flex flex-col">
            <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-900">
              <img 
                src="/mining-operations.jpg" 
                alt="Mining Operations PT LAZ COAL MANDIRI Site Kintap" 
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500 select-none"
              />
              <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                Good Mining Practices
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                Site Arutmin Kintap
              </div>
            </div>
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Operasional Jalur Hauling & Area Penambangan
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Kombinasi armada pengupasan tanah, pemeliharaan jalur hauling, serta kepatuhan keselamatan kerja tambang (K3LH) berstandar nasional.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-800">
                <span>Zero Accident Commitment</span>
                <span className="text-slate-400 font-mono">K3LH Terpadu</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TIGA PINTU MASUK PORTAL ROLE (OPERATOR, DRIVER, ADMIN)                 */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-br from-blue-900 via-[#1e3a8a] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-6 sm:mb-8">
          <span className="inline-flex items-center space-x-1.5 bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-amber-400/40">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pintu Masuk Terintegrasi</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black">
            Pilih Akses Sesuai Role Kerja Anda
          </h2>
          <p className="text-xs sm:text-sm text-blue-200">
            Setiap personel terikat pada hak akses resmi untuk menjaga integritas data penambangan batubara Site Kintap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Role 1: Operator HE */}
          <div 
            onClick={() => onNavigateToAuth('login')}
            className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/15 transition cursor-pointer hover:scale-102 flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/30 text-amber-400 flex items-center justify-center font-bold">
                <HardHat className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                Operator Alat Berat
              </h3>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                Pencatatan Jam Kerja (HM Awal & HM Akhir), kalkulasi otomatis, dan rincian pekerjaan per jam unit Excavator / Bulldozer di pit.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-amber-300 group-hover:translate-x-1 transition">
              <span>Buka Time Sheet HE</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Role 2: Driver DT */}
          <div 
            onClick={() => onNavigateToAuth('login')}
            className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/15 transition cursor-pointer hover:scale-102 flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                Driver Dump Truck
              </h3>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                Pencatatan HM unit DT, live counter ritase hauling per jam, kode excavator pemuat, dan rute pit menuju ke stockpile ROM.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-amber-300 group-hover:translate-x-1 transition">
              <span>Buka Time Sheet DT</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Role 3: Admin & Pengawas */}
          <div 
            onClick={() => onNavigateToAuth('login')}
            className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/15 transition cursor-pointer hover:scale-102 flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/30 text-sky-300 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                Pengawas & Admin Site
              </h3>
              <p className="text-xs text-blue-100/80 leading-relaxed">
                Dashboard monitoring database HM seluruh unit per kolom, manajemen karyawan mandiri, dan ekspor resmi format Excel, Word, & PDF.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-amber-300 group-hover:translate-x-1 transition">
              <span>Masuk Dashboard Admin</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TENTANG PT. LAZ COAL MANDIRI (LINKEDIN SUMMARY & VALUES)               */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-extrabold text-[#1e3a8a] uppercase tracking-wider block">
              Tentang Perusahaan
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Profil PT. LAZ COAL MANDIRI (LCM)
            </h2>
          </div>
          <a
            href="https://id.linkedin.com/company/lazcoal"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 bg-[#0a66c2] hover:bg-[#004182] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Kunjungi LinkedIn @lazcoal</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-[#1e3a8a]" />
              <span>Komitmen Kinerja Penambangan Batubara</span>
            </h3>
            <p>
              Berdiri sejak tahun 2013, PT. LAZ Coal Mandiri telah dipercaya menjadi mitra strategis utama PT. Arutmin Indonesia di Site Kintap, Tanah Laut, Kalimantan Selatan. Fokus utama kami adalah pencapaian target produksi batubara secara efisien dengan ketersediaan mekanis unit yang tinggi.
            </p>
            <p>
              Didukung oleh armada alat berat modern seperti excavator kelas 50 hingga 200 ton dan dump truck raksasa CAT 777E, operasional kami dikelola dengan standar Good Mining Practice yang ketat.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Inovasi Lingkungan & Tenaga Kerja Lokal</span>
            </h3>
            <p>
              Kami aktif melaksanakan program Fresh Graduate Development Program (FGDP) guna mendidik dan menyerap pemuda-pemudi lokal Kintap menjadi operator dan mekanik alat berat profesional dan berlisensi.
            </p>
            <p>
              Selain itu, komitmen terhadap lingkungan hidup diwujudkan melalui reklamasi progresif pascatambang dan penerapan uji coba armada dump truck hybrid hemat bahan bakar untuk menurunkan jejak emisi karbon di area tambang.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">Sertifikasi & Kepatuhan K3LH Tambang</span>
          </div>
          <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">Pencatatan TimeSheet Real-time Supabase</span>
          </div>
          <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">Laporan Ekspor Resmi PDF, Word & Excel</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BOTTOM CTA BAR                                                         */}
      {/* ========================================================================= */}
      <section className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-center text-white space-y-4 border border-slate-800 shadow-xl">
        <h3 className="text-lg sm:text-2xl font-black">
          Siap Mencatat Jam Kerja atau Mengakses Laporan Tambang?
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Gunakan kamera HP Anda untuk scan kartu KTP / Mine Permit karyawan secara instan tanpa perlu repot mengetik, atau masuk dengan password Anda.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigateToAuth('login')}
            className="w-full sm:w-auto bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-amber-300" />
            <span>Masuk ke Sistem Sekarang</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToAuth('register')}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl border border-slate-700 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Registrasi Karyawan Baru</span>
          </button>
        </div>
      </section>

    </div>
  );
};
