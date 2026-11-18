import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Table, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Download, 
  RotateCcw, 
  Users, 
  Search, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle,
  HardHat,
  Truck,
  Database,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Camera,
  ZoomIn,
  Eye,
  Image as ImageIcon,
  ExternalLink,
  X,
  Settings,
  Wifi,
  WifiOff,
  Copy,
  QrCode,
  RefreshCw,
  Radio,
  PanelLeftClose,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  heTimesheetRepo, 
  dtTimesheetRepo, 
  employeeRepo, 
  monthlyResetService, 
  isSupabaseConfigured,
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  supabase
} from '../lib/supabase';
import { exportDatabaseHMToExcel } from '../lib/exportExcel';
import { exportDatabaseHMToWord } from '../lib/exportWord';
import { printHEDailyPDF, printDTDailyPDF, exportMonthlyBackupPDF } from '../lib/exportPdf';

export const AdminDashboard = ({ currentUser, isSidebarOpen = true, setIsSidebarOpen }) => {
  const [activeTab, setActiveTab] = useState('rekap'); // 'rekap' | 'bukti' | 'karyawan' | 'backup'
  const touchStartXRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [heList, setHeList] = useState([]);
  const [dtList, setDtList] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filter States
  const [filterDate, setFilterDate] = useState('');
  const [filterShift, setFilterShift] = useState('ALL');
  const [searchUnit, setSearchUnit] = useState('');
  const [searchEmployee, setSearchEmployee] = useState('');

  // Paper HM Photo Proof Modal & Filters
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);
  const [photoRoleFilter, setPhotoRoleFilter] = useState('ALL'); // 'ALL' | 'HE' | 'DT'
  const [photoStatusFilter, setPhotoStatusFilter] = useState('ALL'); // 'ALL' | 'HAS_PHOTO' | 'NO_PHOTO'
  const [photoSearch, setPhotoSearch] = useState('');

  // Password Reset Modal State
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Auto-Reset Confirmation Modal
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(null);

  // Cloud Database (Supabase) Connection & Realtime Sync State
  const [isCloudConnected, setIsCloudConnected] = useState(isSupabaseConfigured());
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [cfgUrl, setCfgUrl] = useState(getSupabaseConfig().url || '');
  const [cfgKey, setCfgKey] = useState(getSupabaseConfig().anonKey || '');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date().toLocaleTimeString('id-ID'));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load Data (mendukung silent refresh agar tidak flicker saat auto-poll realtime)
  const loadData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    setIsRefreshing(true);
    try {
      const [heData, dtData, empData] = await Promise.all([
        heTimesheetRepo.getAll(),
        dtTimesheetRepo.getAll(),
        employeeRepo.getAll()
      ]);
      setHeList(heData || []);
      setDtList(dtData || []);
      setEmployees(empData || []);
      setIsCloudConnected(isSupabaseConfigured());
      setLastRefreshedAt(new Date().toLocaleTimeString('id-ID'));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      if (showLoadingSpinner) setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Realtime Live Subscription & Auto-Polling (Setiap 4 Detik)
  useEffect(() => {
    loadData(true);

    // 1. Supabase WebSocket Realtime Channel
    let channel = null;
    if (isSupabaseConfigured() && supabase) {
      try {
        channel = supabase
          .channel('realtime_admin_dashboard_sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'he_timesheets' }, () => {
            loadData(false);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'dt_timesheets' }, () => {
            loadData(false);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
            loadData(false);
          })
          .subscribe();
      } catch (err) {
        console.warn('Realtime channel subscription error:', err);
      }
    }

    // 2. Auto-polling interval: data dari HP otomatis masuk ke laptop admin setiap 4 detik tanpa reload!
    const pollInterval = setInterval(() => {
      loadData(false);
    }, 4000);

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      clearInterval(pollInterval);
    };
  }, []);

  // Kunci scroll halaman saat drawer sidebar terbuka di HP & tutup via tombol Escape
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.innerWidth < 1024;
    if (isSidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedPhotoModal) setSelectedPhotoModal(null);
        else if (configModalOpen) setConfigModalOpen(false);
        else if (isSidebarOpen && window.innerWidth < 1024 && setIsSidebarOpen) setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen, selectedPhotoModal, configModalOpen, setIsSidebarOpen]);

  // Handler Tes Koneksi Supabase
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(cfgUrl, cfgKey);
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Gagal tes koneksi' });
    } finally {
      setTestingConnection(false);
    }
  };

  // Handler Simpan Konfigurasi Supabase
  const handleSaveConnection = () => {
    if (!cfgUrl.trim() || !cfgKey.trim()) {
      alert('Harap isi URL Supabase dan Anon Key');
      return;
    }
    const success = saveSupabaseConfig(cfgUrl, cfgKey);
    setIsCloudConnected(isSupabaseConfigured());
    if (success) {
      setTestResult({ success: true, message: 'Konfigurasi berhasil disimpan! Memuat ulang data...' });
      loadData(true);
      setTimeout(() => {
        setConfigModalOpen(false);
      }, 1500);
    } else {
      setTestResult({ success: false, message: 'Gagal inisialisasi client Supabase dengan URL/Key tersebut.' });
    }
  };

  // URL Sinkronisasi HP
  const hpSyncUrl = typeof window !== 'undefined' && cfgUrl && cfgKey
    ? `${window.location.origin}/?sb_url=${encodeURIComponent(cfgUrl)}&sb_key=${encodeURIComponent(cfgKey)}`
    : '';

  const handleCopyHpSyncUrl = () => {
    if (!hpSyncUrl) return;
    navigator.clipboard.writeText(hpSyncUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleClearConnection = () => {
    if (window.confirm('Apakah Anda yakin ingin memutuskan koneksi Supabase dan kembali ke mode LocalStorage offline?')) {
      clearSupabaseConfig();
      setCfgUrl('');
      setCfgKey('');
      setIsCloudConnected(false);
      setTestResult(null);
      loadData(true);
      setConfigModalOpen(false);
    }
  };

  // Format Data HM Unit sesuai spesifikasi:
  // Date | Shift | Model Unit | No Unit | HM Awal | HM Akhir | Total HM | Operator 1 | HM Opt 1 | Operator 2 | HM Opt 2 | Operator 3 | HM Opt 3
  const computeDatabaseHMRows = () => {
    const unitMap = {};

    const processItem = (item, isDT = false) => {
      // Filter logic
      if (filterDate && item.tanggal !== filterDate) return;
      if (filterShift !== 'ALL' && !item.shift.includes(filterShift)) return;
      if (searchUnit && !item.unit_code.toLowerCase().includes(searchUnit.toLowerCase())) return;

      const key = `${item.tanggal}_${item.shift}_${item.unit_code}`;
      if (!unitMap[key]) {
        unitMap[key] = {
          rawItem: item,
          isDT,
          date: item.tanggal,
          shift: item.shift,
          modelUnit: item.model_unit || (isDT ? 'Hino 500' : '-'),
          noUnit: item.unit_code,
          hmAwal: Number(item.hm_awal || 0),
          hmAkhir: Number(item.hm_akhir || 0),
          totalHm: Number(item.total_hm || 0),
          fotoKertasHm: item.foto_kertas_hm || '',
          operators: [
            { name: item.nama_opt, hm: Number(item.total_hm || 0), nik: item.nik, fotoKertasHm: item.foto_kertas_hm || '' }
          ]
        };
      } else {
        unitMap[key].hmAwal = Math.min(unitMap[key].hmAwal, Number(item.hm_awal || 0));
        unitMap[key].hmAkhir = Math.max(unitMap[key].hmAkhir, Number(item.hm_akhir || 0));
        unitMap[key].totalHm = unitMap[key].hmAkhir - unitMap[key].hmAwal;
        unitMap[key].operators.push({ 
          name: item.nama_opt, 
          hm: Number(item.total_hm || 0), 
          nik: item.nik, 
          fotoKertasHm: item.foto_kertas_hm || '' 
        });
        if (!unitMap[key].fotoKertasHm && item.foto_kertas_hm) {
          unitMap[key].fotoKertasHm = item.foto_kertas_hm;
        }
      }
    };

    heList.forEach(item => processItem(item, false));
    dtList.forEach(item => processItem(item, true));

    return Object.values(unitMap).sort((a, b) => {
      const dateDiff = String(b.date || '').localeCompare(String(a.date || ''));
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.rawItem?.created_at || 0) - new Date(a.rawItem?.created_at || 0);
    });
  };

  const hmUnitRows = computeDatabaseHMRows();

  // All individual timesheet reports for Admin monitoring (terbaru paling atas)
  const allOperationalReports = [
    ...heList.map(h => ({ ...h, isDT: false, roleName: 'Operator Alat Berat', roleBadge: 'HE' })),
    ...dtList.map(d => ({ ...d, isDT: true, roleName: 'Driver Dump Truck', roleBadge: 'DT' }))
  ].sort((a, b) => new Date(b.created_at || b.tanggal || 0) - new Date(a.created_at || a.tanggal || 0));

  const totalReportsWithPhoto = allOperationalReports.filter(r => !!r.foto_kertas_hm).length;

  // Stats
  const totalUnits = new Set([...heList.map(h => h.unit_code), ...dtList.map(d => d.unit_code)]).size;
  const totalHMAll = [...heList, ...dtList].reduce((acc, c) => acc + Number(c.total_hm || 0), 0);
  const totalRitaseAll = dtList.reduce((acc, c) => acc + Number(c.total_ritase || 0), 0);

  // Export Handlers
  const handleExportExcel = () => {
    exportDatabaseHMToExcel(heList, dtList, filterDate);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  const handleExportWord = async () => {
    await exportDatabaseHMToWord(heList, dtList, filterDate);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  // Reset Password Handler
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmp || !newPassword.trim()) return;

    try {
      await employeeRepo.resetPassword(selectedEmp.nik, newPassword.trim());
      setResetSuccess(`Password untuk ${selectedEmp.name} (NIK: ${selectedEmp.nik}) berhasil direset!`);
      setNewPassword('');
      loadData();
      setTimeout(() => {
        setResetSuccess('');
        setSelectedEmp(null);
      }, 3000);
    } catch (err) {
      alert('Gagal mereset password: ' + err.message);
    }
  };

  // Monthly Backup & Auto-Reset Handler
  const handleTriggerMonthlyReset = async () => {
    setResetLoading(true);
    setResetFeedback(null);
    try {
      // 1. Download Backup PDF Bulanan Terlebih Dahulu
      const lastMonthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      exportMonthlyBackupPDF(heList, dtList, lastMonthName);

      // 2. Jalankan pembersihan database (HANYA menghapus he_timesheets dan dt_timesheets)
      const res = await monthlyResetService.executeReset();

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });

      setResetFeedback({
        success: true,
        message: `Auto-Backup PDF bulan ${res.month} berhasil diunduh. Database berhasil diringankan (HE: -${res.deletedHE} lembar, DT: -${res.deletedDT} lembar). Akun seluruh karyawan tetap AMAN!`
      });

      // Reload data
      await loadData();
    } catch (err) {
      setResetFeedback({
        success: false,
        message: 'Gagal menjalankan pembersihan bulanan: ' + err.message
      });
    } finally {
      setResetLoading(false);
      setIsResetConfirmOpen(false);
    }
  };

  // Handler pilih menu sidebar (otomatis tutup drawer di HP agar rapi)
  const handleSelectSidebarTab = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && setIsSidebarOpen) {
      setIsSidebarOpen(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler gesture geser (swipe left) untuk tutup sidebar mulus di HP
  const handleSidebarTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleSidebarTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (deltaX < -55 && setIsSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  // Judul dinamis halaman aktif di area konten utama
  const activeSectionMeta = {
    rekap: {
      title: 'Database HM Unit',
      subtitle: 'Rekapitulasi jam kerja (HM) alat berat & hauling dump truck secara realtime'
    },
    bukti: {
      title: 'Bukti Kertas HM Fisik',
      subtitle: 'Inspeksi langsung foto kertas timesheet & slip ritase seluruh karyawan'
    },
    karyawan: {
      title: 'Daftar Karyawan Mandiri',
      subtitle: 'Manajemen akun karyawan terdaftar resmi & kontrol reset sandi'
    },
    backup: {
      title: 'Auto-Backup & Reset Bulanan',
      subtitle: 'Arsipkan laporan bulanan PDF & optimalkan kapasitas database setiap tanggal 1'
    }
  }[activeTab] || { title: 'Dashboard Admin', subtitle: 'Pusat Kendali Operasional Site Kintap' };

  const sidebarNavItems = [
    {
      id: 'rekap',
      label: 'Database HM Unit',
      desc: 'Tabel rekap & ekspor',
      icon: Table,
      badge: null,
      accent: 'blue'
    },
    {
      id: 'bukti',
      label: 'Bukti Kertas HM',
      desc: 'Inspeksi foto fisik',
      icon: Camera,
      badge: totalReportsWithPhoto,
      accent: 'emerald'
    },
    {
      id: 'karyawan',
      label: 'Daftar Karyawan',
      desc: 'Akun & reset sandi',
      icon: Users,
      badge: employees.length,
      accent: 'blue'
    },
    {
      id: 'backup',
      label: 'Auto-Backup & Reset',
      desc: 'Arsip PDF tgl 1',
      icon: RotateCcw,
      badge: 'Tgl 1',
      accent: 'amber'
    }
  ];

  return (
    <div className="flex min-h-[calc(100vh-92px)] relative bg-[#F8FAFC]">
      
      {/* ========================================================================= */}
      {/* BACKDROP OVERLAY MOBILE (SMOOTH FADE)                                     */}
      {/* ========================================================================= */}
      <div
        onClick={() => setIsSidebarOpen && setIsSidebarOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] lg:hidden transition-opacity duration-300 ease-in-out ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* LEFT COLLAPSIBLE SIDEBAR (SMOOTH SLIDE BUKA/TUTUP DESKTOP & MOBILE)       */}
      {/* ========================================================================= */}
      <aside
        onTouchStart={handleSidebarTouchStart}
        onTouchEnd={handleSidebarTouchEnd}
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 shadow-2xl lg:shadow-none lg:sticky lg:top-[92px] lg:h-[calc(100vh-92px)] lg:z-30 overflow-hidden shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isSidebarOpen
            ? 'w-[280px] max-w-[85vw] lg:w-72 translate-x-0 opacity-100 pointer-events-auto'
            : 'w-[280px] max-w-[85vw] -translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:border-r-0 pointer-events-none'
        }`}
        aria-label="Menu Samping Admin"
      >
        <div className="w-[280px] max-w-[85vw] lg:w-72 h-full flex flex-col bg-white overflow-y-auto">
          
          {/* Sidebar Brand Header */}
          <div className="p-4 border-b border-slate-200/80 bg-gradient-to-br from-[#1e3a8a] via-[#1e3a8a] to-[#172554] text-white flex items-center justify-between">
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
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                    Admin Panel
                  </span>
                  <span className="text-[10px] text-blue-200 truncate">Site Kintap</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen && setIsSidebarOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition cursor-pointer shrink-0"
              title="Tutup Menu Samping"
            >
              <X className="w-4 h-4 lg:hidden" />
              <PanelLeftClose className="w-4 h-4 hidden lg:block" />
            </button>
          </div>

          {/* Sidebar Navigation Menu */}
          <div className="p-3.5 flex-1 space-y-5">
            <div className="space-y-1.5">
              <div className="px-2.5 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Menu Navigasi
                </span>
                <span className="text-[9px] font-bold text-slate-400 lg:hidden">
                  Geser kiri tutup
                </span>
              </div>

              {sidebarNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSidebarTab(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-2xl transition-all duration-200 flex items-center justify-between group cursor-pointer active:scale-[0.98] ${
                      isActive
                        ? 'bg-[#1e3a8a] text-white shadow-md shadow-blue-900/15'
                        : item.accent === 'amber'
                          ? 'bg-amber-50/70 hover:bg-amber-100/80 text-amber-950 border border-amber-200/70'
                          : 'text-slate-700 hover:bg-slate-100/90'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                        isActive
                          ? 'bg-white/15 text-amber-300'
                          : item.accent === 'amber'
                            ? 'bg-amber-200/70 text-amber-800'
                            : item.accent === 'emerald'
                              ? 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100'
                              : 'bg-blue-50 text-[#1e3a8a] group-hover:bg-blue-100'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-extrabold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                          {item.label}
                        </div>
                        <div className={`text-[10px] truncate ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                          {item.desc}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      {item.badge !== null && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-amber-400 text-slate-950'
                            : item.accent === 'amber'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-slate-200/80 text-slate-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-300" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ================================================================= */}
            {/* WIDGET STATUS DATABASE CLOUD & SINKRONISASI REALTIME DI SIDEBAR   */}
            {/* ================================================================= */}
            <div className="space-y-2 pt-2 border-t border-slate-200/80">
              <span className="px-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Database Cloud Realtime
              </span>

              <div className={`p-3.5 rounded-2xl border space-y-3 transition ${
                isCloudConnected
                  ? 'bg-gradient-to-br from-emerald-50 via-teal-50/70 to-blue-50/50 border-emerald-200'
                  : 'bg-gradient-to-br from-amber-50 via-orange-50/80 to-red-50/50 border-amber-300'
              }`}>
                <div className="flex items-start space-x-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    isCloudConnected ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {isCloudConnected ? <Radio className="w-4 h-4 animate-pulse" /> : <WifiOff className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                      <span className={`text-[11px] font-black truncate ${isCloudConnected ? 'text-emerald-950' : 'text-amber-950'}`}>
                        {isCloudConnected ? 'Live Sync Aktif' : 'Mode Offline Lokal'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                      {isCloudConnected
                        ? `Auto-Poll 4s • Update: ${lastRefreshedAt}`
                        : 'Data masih tersimpan lokal di perangkat. Hubungkan Supabase.'}
                    </p>
                  </div>
                </div>

                {/* Tombol Aksi Cloud */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => loadData(true)}
                    disabled={isRefreshing}
                    className="bg-white hover:bg-slate-50 active:scale-95 text-slate-800 text-[11px] font-bold py-2 px-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    title="Segarkan data terbaru"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Segarkan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfigModalOpen(true);
                      if (typeof window !== 'undefined' && window.innerWidth < 1024 && setIsSidebarOpen) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`text-[11px] font-extrabold py-2 px-2.5 rounded-xl shadow-xs flex items-center justify-center space-x-1 transition cursor-pointer active:scale-95 ${
                      isCloudConnected
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950 animate-pulse'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{isCloudConnected ? 'Kelola DB' : 'Hubungkan'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Footer: Profil Admin Singkat */}
          <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/80">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1e3a8a] text-amber-300 flex items-center justify-center font-black text-xs shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-extrabold text-slate-900 truncate">
                  {currentUser?.name || 'Admin Site'}
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate">
                  NIK: {currentUser?.nik || 'ADMIN01'} • Role Terkunci
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* AREA KONTEN UTAMA DASHBOARD ADMIN (BERSIH, LEGA, RESPONSIF)               */}
      {/* ========================================================================= */}
      <div className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 pb-12 space-y-5 transition-all duration-300">
        
        {/* Compact Clean Section Header */}
        <div className="bg-white rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {activeSectionMeta.title}
                </h2>
                <span className="hidden sm:inline-block bg-blue-50 text-[#1e3a8a] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                  PT. LCM Kintap
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {activeSectionMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Indikator Live Sync Ringkas di Pojok Kanan Header */}
          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setConfigModalOpen(true)}
              className={`inline-flex items-center space-x-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer active:scale-95 ${
                isCloudConnected
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
              }`}
              title="Pengaturan Database Cloud & QR Sinkronisasi HP"
            >
              <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span>{isCloudConnected ? `Live • ${lastRefreshedAt}` : 'Offline • Hubungkan'}</span>
            </button>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer active:scale-95"
              title="Segarkan Data Terbaru"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center font-bold">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Laporan HE</span>
            <span className="text-lg font-black text-slate-900">{heList.length} <span className="text-xs font-normal text-slate-500">Lembar</span></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Laporan DT</span>
            <span className="text-lg font-black text-slate-900">{dtList.length} <span className="text-xs font-normal text-slate-500">Lembar</span></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Akumulasi HM</span>
            <span className="text-lg font-black font-mono text-[#1e3a8a]">{totalHMAll.toFixed(1)} <span className="text-xs font-normal text-slate-500">Jam</span></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Camera className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Bukti Kertas HM</span>
            <span className="text-lg font-black text-slate-900">{totalReportsWithPhoto} <span className="text-xs font-normal text-slate-500">/{allOperationalReports.length}</span></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Karyawan Mandiri</span>
            <span className="text-lg font-black text-slate-900">{employees.length} <span className="text-xs font-normal text-slate-500">Orang</span></span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REKAPITULASI TABEL DATABASE HM UNIT (FORMAT RESMI)                 */}
      {/* ========================================================================= */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          
          {/* Action & Filter Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-card border border-slate-200/80 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
            
            {/* Filter Inputs */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  title="Filter berdasarkan tanggal"
                />
              </div>

              <div>
                <select
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  className="text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                >
                  <option value="ALL">Semua Shift</option>
                  <option value="Siang">Shift 1 (Siang)</option>
                  <option value="Malam">Shift 2 (Malam)</option>
                </select>
              </div>

              <div className="relative flex-1 min-w-[150px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchUnit}
                  onChange={(e) => setSearchUnit(e.target.value)}
                  placeholder="Cari No Unit (EX-623, DT 145)..."
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none uppercase font-mono"
                />
              </div>

              {(filterDate || filterShift !== 'ALL' || searchUnit) && (
                <button
                  onClick={() => {
                    setFilterDate('');
                    setFilterShift('ALL');
                    setSearchUnit('');
                  }}
                  className="text-xs text-red-600 hover:underline px-2 py-1"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Export Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportExcel}
                className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                title="Export seluruh tabel ke file Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-sky-300" />
                <span>Export Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleExportWord}
                className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                title="Export rekap dokumen ke Microsoft Word (.docx)"
              >
                <FileText className="w-4 h-4 text-blue-200" />
                <span>Export Word (.docx)</span>
              </button>
            </div>

          </div>

          {/* TABEL DATABASE HM UNIT (FORMAT PER KOLOM) */}
          <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-3.5 bg-[#1e3a8a] text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Table className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  DATABASE HM UNIT PT. LAZ COAL MANDIRI
                </h3>
              </div>
              <span className="text-[11px] text-blue-200 font-mono">
                {hmUnitRows.length} Unit Tercatat
              </span>
            </div>

            {/* Mobile Scroll Hint */}
            <div className="lg:hidden flex items-center justify-between text-[11px] text-slate-600 bg-slate-100 px-3 py-1.5 border-b border-slate-200">
              <span className="font-semibold">👉 Geser tabel ke samping untuk melihat seluruh operator & HM</span>
              <span className="font-mono text-[10px] text-slate-500">15 Kolom</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[950px]">
                <thead className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Shift</th>
                    <th className="py-3 px-3">Model Unit</th>
                    <th className="py-3 px-3 font-mono">No Unit</th>
                    <th className="py-3 px-3 text-right">HM Awal</th>
                    <th className="py-3 px-3 text-right">HM Akhir</th>
                    <th className="py-3 px-3 text-right font-extrabold text-[#1e3a8a]">Total HM</th>
                    <th className="py-3 px-3 border-l border-slate-200">Operator 1</th>
                    <th className="py-3 px-3 text-right">HM Opt 1</th>
                    <th className="py-3 px-3 border-l border-slate-200">Operator 2</th>
                    <th className="py-3 px-3 text-right">HM Opt 2</th>
                    <th className="py-3 px-3 border-l border-slate-200">Operator 3</th>
                    <th className="py-3 px-3 text-right">HM Opt 3</th>
                    <th className="py-3 px-3 text-center">Bukti Kertas HM</th>
                    <th className="py-3 px-3 text-center">Print Lembar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {hmUnitRows.length > 0 ? (
                    hmUnitRows.map((row, idx) => {
                      const opt1 = row.operators[0] || { name: '-', hm: 0 };
                      const opt2 = row.operators[1] || { name: '-', hm: 0 };
                      const opt3 = row.operators[2] || { name: '-', hm: 0 };

                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{row.date}</td>
                          <td className="py-2.5 px-3">{row.shift}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">{row.modelUnit}</td>
                          <td className="py-2.5 px-3 font-mono font-extrabold text-[#1e3a8a]">{row.noUnit}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{row.hmAwal.toFixed(1)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{row.hmAkhir.toFixed(1)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-[#1e3a8a] bg-blue-50/80">
                            {row.totalHm.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 border-l border-slate-200 font-semibold">{opt1.name}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{opt1.hm > 0 ? opt1.hm.toFixed(1) : '-'}</td>
                          <td className="py-2.5 px-3 border-l border-slate-200 text-slate-600">{opt2.name}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{opt2.hm > 0 ? opt2.hm.toFixed(1) : '-'}</td>
                          <td className="py-2.5 px-3 border-l border-slate-200 text-slate-600">{opt3.name}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{opt3.hm > 0 ? opt3.hm.toFixed(1) : '-'}</td>
                          
                          {/* Bukti Foto Kertas HM */}
                          <td className="py-2.5 px-3 text-center">
                            {row.fotoKertasHm ? (
                              <button
                                type="button"
                                onClick={() => setSelectedPhotoModal({
                                  photoUrl: row.fotoKertasHm,
                                  operatorName: row.operators.map(o => o.name).filter(Boolean).join(', ') || row.rawItem.nama_opt,
                                  nik: row.operators.map(o => o.nik).filter(Boolean).join(', ') || row.rawItem.nik || '-',
                                  unitCode: row.noUnit,
                                  modelUnit: row.modelUnit,
                                  date: row.date,
                                  shift: row.shift,
                                  totalHm: row.totalHm,
                                  type: row.isDT ? 'Dump Truck' : 'Alat Berat (HE)',
                                  rawItem: row.rawItem
                                })}
                                className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] text-[11px] font-bold px-2.5 py-1 rounded-xl border border-blue-200 transition cursor-pointer"
                                title="Klik untuk meninjau foto lembar kertas HM fisik"
                              >
                                <Camera className="w-3.5 h-3.5 text-[#1e3a8a]" />
                                <span>Lihat Foto</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs italic">-</span>
                            )}
                          </td>

                          {/* Print Out PDF Harian Per Karyawan / Unit */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                if (row.isDT) {
                                  printDTDailyPDF(row.rawItem);
                                } else {
                                  printHEDailyPDF(row.rawItem);
                                }
                              }}
                              className="p-1.5 text-[#1e3a8a] hover:bg-blue-100 rounded-lg transition"
                              title="Cetak Lembar Time Sheet PDF Resmi"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="15" className="text-center py-8 text-slate-400">
                        Tidak ada catatan unit yang sesuai dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: PEMANTAUAN BUKTI FOTO KERTAS HM FISIK SELURUH KARYAWAN               */}
      {/* ========================================================================= */}
      {activeTab === 'bukti' && (() => {
        // Filter operational reports
        const filteredReports = allOperationalReports.filter(rep => {
          // Filter Role (HE / DT)
          if (photoRoleFilter === 'HE' && rep.isDT) return false;
          if (photoRoleFilter === 'DT' && !rep.isDT) return false;

          // Filter Status Foto
          if (photoStatusFilter === 'HAS_PHOTO' && !rep.foto_kertas_hm) return false;
          if (photoStatusFilter === 'NO_PHOTO' && rep.foto_kertas_hm) return false;

          // Filter Tanggal
          if (filterDate && rep.tanggal !== filterDate) return false;

          // Filter Shift
          if (filterShift !== 'ALL' && !rep.shift.includes(filterShift)) return false;

          // Search Operator / NIK / Unit
          if (photoSearch.trim()) {
            const q = photoSearch.toLowerCase();
            const matchNik = (rep.nik || '').toLowerCase().includes(q);
            const matchName = (rep.nama_opt || '').toLowerCase().includes(q);
            const matchUnit = (rep.unit_code || '').toLowerCase().includes(q);
            if (!matchNik && !matchName && !matchUnit) return false;
          }

          return true;
        });

        const withPhotoCount = allOperationalReports.filter(r => !!r.foto_kertas_hm).length;
        const withoutPhotoCount = allOperationalReports.length - withPhotoCount;

        return (
          <div className="space-y-4">
            {/* Header & Controls Toolbar */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-card border border-slate-200/80 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Camera className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Pemantauan Bukti Foto Kertas HM & Slip Ritase Fisik
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pantau dan verifikasi keaslian lembar kerja fisik yang dipotret langsung oleh operator & driver (Maks 4 MB).
                    </p>
                  </div>
                </div>

                {/* Counter Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{withPhotoCount} Foto Terlampir</span>
                  </span>
                  {withoutPhotoCount > 0 && (
                    <span className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{withoutPhotoCount} Belum Ada Foto</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
                {/* Search */}
                <div className="relative sm:col-span-2 lg:col-span-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={photoSearch}
                    onChange={(e) => setPhotoSearch(e.target.value)}
                    placeholder="Cari Operator, NIK, No Unit..."
                    className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>

                {/* Filter Role */}
                <div>
                  <select
                    value={photoRoleFilter}
                    onChange={(e) => setPhotoRoleFilter(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  >
                    <option value="ALL">Semua Role</option>
                    <option value="HE">Operator Alat Berat (HE)</option>
                    <option value="DT">Driver Dump Truck (DT)</option>
                  </select>
                </div>

                {/* Filter Status Foto */}
                <div>
                  <select
                    value={photoStatusFilter}
                    onChange={(e) => setPhotoStatusFilter(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="HAS_PHOTO">✓ Ada Bukti Foto</option>
                    <option value="NO_PHOTO">✕ Belum Ada Foto</option>
                  </select>
                </div>

                {/* Filter Tanggal */}
                <div>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>
              </div>

              {(photoSearch || photoRoleFilter !== 'ALL' || photoStatusFilter !== 'ALL' || filterDate) && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setPhotoSearch('');
                      setPhotoRoleFilter('ALL');
                      setPhotoStatusFilter('ALL');
                      setFilterDate('');
                    }}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Reset Filter Pencarian
                  </button>
                </div>
              )}
            </div>

            {/* Grid List Laporan & Foto Bukti Fisik */}
            {filteredReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-lg transition flex flex-col overflow-hidden"
                  >
                    {/* Top Header Card */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          item.isDT ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-[#1e3a8a]'
                        }`}>
                          {item.isDT ? <Truck className="w-4 h-4" /> : <HardHat className="w-4 h-4" />}
                        </span>
                        <div>
                          <h4 className="font-mono font-black text-sm text-[#1e3a8a]">
                            {item.unit_code}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            {item.model_unit || (item.isDT ? 'Hino 500' : 'Excavator')}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        item.isDT 
                          ? 'bg-amber-50 text-amber-900 border-amber-200' 
                          : 'bg-blue-50 text-[#1e3a8a] border-blue-200'
                      }`}>
                        {item.roleBadge}
                      </span>
                    </div>

                    {/* Foto Bukti / Placeholder */}
                    <div className="p-4 bg-slate-50/60 flex-1 flex flex-col justify-center">
                      {item.foto_kertas_hm ? (
                        <div 
                          onClick={() => setSelectedPhotoModal({
                            photoUrl: item.foto_kertas_hm,
                            operatorName: item.nama_opt,
                            nik: item.nik,
                            unitCode: item.unit_code,
                            modelUnit: item.model_unit,
                            date: item.tanggal,
                            shift: item.shift,
                            totalHm: item.total_hm,
                            type: item.isDT ? 'Dump Truck' : 'Alat Berat (HE)',
                            rawItem: item
                          })}
                          className="relative h-44 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs cursor-pointer group"
                        >
                          <img 
                            src={item.foto_kertas_hm} 
                            alt={`Bukti Kertas ${item.unit_code}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white space-y-1">
                            <ZoomIn className="w-6 h-6 text-amber-300" />
                            <span className="text-xs font-bold">Periksa Ukuran Penuh</span>
                          </div>
                          <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-xs flex items-center space-x-1 shadow-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Foto Terlampir</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-44 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-4 text-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <Camera className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">Belum Ada Bukti Foto</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Karyawan mengisi data formulir tanpa melampirkan lembar fisik.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Detail Operator & Jam Kerja */}
                      <div className="mt-3 bg-white p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Karyawan:</span>
                          <span className="font-bold text-slate-900">{item.nama_opt} <span className="font-mono text-slate-500 font-normal">({item.nik})</span></span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Waktu:</span>
                          <span className="text-slate-700">{item.tanggal} • {item.shift}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-100 pt-1">
                          <span className="text-slate-500 font-medium">Jam Kerja (HM):</span>
                          <span className="font-mono font-black text-[#1e3a8a]">{Number(item.total_hm || 0).toFixed(2)} Jam</span>
                        </div>
                        {item.isDT && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Ritase:</span>
                            <span className="font-mono font-bold text-amber-700">{item.total_ritase || 0} Rit</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-end space-x-2">
                      {item.foto_kertas_hm && (
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoModal({
                            photoUrl: item.foto_kertas_hm,
                            operatorName: item.nama_opt,
                            nik: item.nik,
                            unitCode: item.unit_code,
                            modelUnit: item.model_unit,
                            date: item.tanggal,
                            shift: item.shift,
                            totalHm: item.total_hm,
                            type: item.isDT ? 'Dump Truck' : 'Alat Berat (HE)',
                            rawItem: item
                          })}
                          className="bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] font-bold text-xs px-3 py-1.5 rounded-xl border border-blue-200 flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5 text-[#1e3a8a]" />
                          <span>Inspeksi</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (item.isDT) {
                            printDTDailyPDF(item);
                          } else {
                            printHEDailyPDF(item);
                          }
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
                        title="Cetak lembar PDF (termasuk lampiran foto jika ada)"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-800">
                  Tidak Ada Bukti Kertas HM Ditemukan
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Belum ada laporan yang sesuai dengan kriteria filter. Silakan ubah filter tanggal, status foto, atau kata kunci pencarian.
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* TAB 2: DAFTAR KARYAWAN HASIL SELF-REGISTRATION                            */}
      {/* ========================================================================= */}
      {activeTab === 'karyawan' && (
        <div className="space-y-4">
          
          <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-card border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Daftar Karyawan Terdaftar Mandiri (Self-Registration)
              </h3>
              <p className="text-xs text-slate-500">
                Akun karyawan yang melakukan registrasi mandiri via OCR / Manual KTP. NIK bersifat unik.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                placeholder="Cari NIK / Nama karyawan..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
              />
            </div>
          </div>

          {resetSuccess && (
            <div className="bg-blue-50 border border-blue-300 text-[#1e3a8a] text-xs p-3.5 rounded-2xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold">{resetSuccess}</span>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
            {/* Mobile Scroll Hint */}
            <div className="md:hidden flex items-center justify-between text-[11px] text-slate-600 bg-slate-100 px-3 py-1.5 border-b border-slate-200">
              <span className="font-semibold">👉 Geser ke samping untuk melihat detail karyawan</span>
              <span className="font-mono text-[10px] text-slate-500">{employees.length} Orang</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[850px]">
                <thead className="bg-[#1e3a8a] text-white">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 font-mono">NIK Karyawan</th>
                    <th className="py-3 px-4">Nama Lengkap Karyawan</th>
                    <th className="py-3 px-4">Jabatan Pekerjaan</th>
                    <th className="py-3 px-4">Hak Akses Role (Terkunci)</th>
                    <th className="py-3 px-4">No. WhatsApp / HP</th>
                    <th className="py-3 px-4">Tanggal Daftar</th>
                    <th className="py-3 px-4 text-center">Status Data Admin</th>
                    <th className="py-3 px-4 text-center">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {employees
                    .filter(emp => 
                      emp.nik.toLowerCase().includes(searchEmployee.toLowerCase()) || 
                      emp.name.toLowerCase().includes(searchEmployee.toLowerCase())
                    )
                    .map((emp, idx) => (
                      <tr key={emp.id || idx} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 bg-slate-50/50">{emp.nik}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{emp.name}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            emp.jabatan.includes('Dump Truck')
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : (emp.jabatan.includes('Admin') ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-blue-100 text-blue-900 border border-blue-300')
                          }`}>
                            {emp.jabatan.includes('Dump Truck') ? <Truck className="w-3 h-3 mr-0.5" /> : <HardHat className="w-3 h-3 mr-0.5" />}
                            <span>{emp.jabatan}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {emp.role === 'operator' ? 'Hanya Time Sheet HE' : (emp.role === 'driver' ? 'Hanya Time Sheet DT' : 'Dashboard Admin')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {emp.phone || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {emp.created_at ? new Date(emp.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-blue-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Terdaftar Resmi</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedEmp(emp)}
                            className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1e3a8a] font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 transition flex items-center space-x-1 mx-auto cursor-pointer"
                            title="Reset password jika karyawan lupa password"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                            <span>Reset Password</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FITUR AUTO-BACKUP PDF & AUTO-RESET TANGGAL 1                        */}
      {/* ========================================================================= */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-200/80 space-y-4">
            <div className="flex items-center space-x-3 text-[#1e3a8a]">
              <RotateCcw className="w-6 h-6 text-amber-500" />
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Mekanisme Auto-Backup PDF & Auto-Reset Database Setiap Tanggal 1
                </h3>
                <p className="text-xs text-slate-500">
                  Sesuai SOP PT. LAZ COAL MANDIRI Site Arutmin Kintap
                </p>
              </div>
            </div>

            {/* Kotak Peringatan Perlindungan Akun Karyawan */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 text-xs text-blue-950 space-y-2">
              <div className="font-extrabold flex items-center space-x-1.5 text-[#1e3a8a] text-sm">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span>JAMINAN KEAMANAN: Akun Karyawan (Tabel employees) TIDAK AKAN PERNAH DIHAPUS</span>
              </div>
              <p className="leading-relaxed text-blue-900">
                Pembersihan berkala bulanan hanya menghapus transaksi laporan jam kerja bulan lalu (<code>he_timesheets</code> dan <code>dt_timesheets</code>) agar database Supabase selalu ringan dan tidak melampaui batas free tier. 
                Seluruh <strong>200+ akun karyawan yang sudah terdaftar mandiri tetap tersimpan permanen</strong> dan dapat terus login menggunakan NIK masing-masing setiap bulan.
              </p>
            </div>

            {/* Status Feedback */}
            {resetFeedback && (
              <div className={`p-4 rounded-2xl text-xs flex items-start space-x-2.5 border ${
                resetFeedback.success 
                  ? 'bg-blue-50 border-blue-300 text-[#1e3a8a]' 
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                {resetFeedback.success ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <div className="font-bold">{resetFeedback.message}</div>
              </div>
            )}

            {/* Penjelasan 2 Jalur Eksekusi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="bg-[#1e3a8a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Otomatis (Server-Side)
                </span>
                <h4 className="font-bold text-xs text-slate-900">Jadwal PostgreSQL pg_cron</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Pada database Supabase yang telah diaktifkan pg_cron, fungsi <code>clean_monthly_timesheets()</code> dieksekusi tepat tanggal 1 setiap jam 00:05 WITA secara otomatis.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="bg-amber-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Manual / On-Demand Admin
                </span>
                <h4 className="font-bold text-xs text-slate-900">Download Backup PDF & Bersihkan Sekarang</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Admin dapat menekan tombol di bawah untuk langsung mengenerate arsip PDF bulanan seluruh unit sekaligus mereset data transaksi bulan sebelumnya.
                </p>
              </div>

            </div>

            {/* Tombol Eksekusi Manual */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                disabled={resetLoading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-900" />
                <span>Unduh File PDF Rekapan Bulanan & Reset Data Bulan Lalu</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL RESET PASSWORD KARYAWAN                                             */}
      {/* ========================================================================= */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-[#1e3a8a]">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm">Reset Password Karyawan</h3>
              </div>
              <button
                onClick={() => setSelectedEmp(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div><span className="font-bold text-slate-500">Nama:</span> <span className="font-extrabold text-slate-900">{selectedEmp.name}</span></div>
              <div><span className="font-bold text-slate-500">NIK:</span> <span className="font-mono font-bold text-slate-800">{selectedEmp.nik}</span></div>
              <div><span className="font-bold text-slate-500">Jabatan:</span> <span className="text-slate-700">{selectedEmp.jabatan}</span></div>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Baru Buatan Admin:
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ketik password baru untuk karyawan"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] outline-none"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Beritahukan password baru ini kepada karyawan bersangkutan untuk login manual.
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEmp(null)}
                  className="text-xs font-semibold text-slate-600 px-4 py-2 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#1e3a8a] hover:bg-[#172554] text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  Simpan Password Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI RESET BULANAN                                            */}
      {/* ========================================================================= */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6 animate-spin" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Konfirmasi Auto-Backup & Reset Data
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sistem akan mengunduh <strong>1 file PDF Rekap Bulanan</strong>, lalu menghapus data lembar kerja bulan lalu agar database tetap ringan.
              </p>
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-[11px] text-blue-900 font-bold">
                ✓ Akun seluruh karyawan TIDAK AKAN DIHAPUS.
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="text-xs font-semibold text-slate-600 px-4 py-2.5 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleTriggerMonthlyReset}
                disabled={resetLoading}
                className="bg-[#1e3a8a] hover:bg-[#172554] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition"
              >
                {resetLoading ? 'Memproses...' : 'Ya, Unduh PDF & Bersihkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INSPEKSI FOTO KERTAS HM UKURAN PENUH                                */}
      {/* ========================================================================= */}
      {selectedPhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setSelectedPhotoModal(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#1e3a8a] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Camera className="w-5 h-5 text-amber-300" />
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm">
                    Inspeksi Bukti Foto Kertas HM Fisik
                  </h4>
                  <p className="text-[10px] text-blue-200">
                    Unit: {selectedPhotoModal.unitCode} ({selectedPhotoModal.modelUnit || '-'}) • {selectedPhotoModal.type}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Meta Strip */}
            <div className="bg-slate-100 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-slate-600">
                  Operator/Driver: <strong className="text-slate-900">{selectedPhotoModal.operatorName}</strong> ({selectedPhotoModal.nik})
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">
                  Tanggal: <strong className="text-slate-900">{selectedPhotoModal.date}</strong> ({selectedPhotoModal.shift})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-[#1e3a8a] font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-lg border border-blue-200">
                  Total HM: {Number(selectedPhotoModal.totalHm || 0).toFixed(2)} Jam
                </span>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="p-4 bg-slate-950 flex items-center justify-center overflow-auto flex-1 max-h-[70vh]">
              <img 
                src={selectedPhotoModal.photoUrl} 
                alt={`Bukti Fisik HM ${selectedPhotoModal.unitCode}`}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl select-none"
              />
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 text-[11px]">
                Validasi kesesuaian HM awal, HM akhir, tanda tangan pengawas, dan tanggal di kertas.
              </span>
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <a
                  href={selectedPhotoModal.photoUrl}
                  download={`Bukti_HM_${selectedPhotoModal.unitCode}_${selectedPhotoModal.date}.jpg`}
                  className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-300 shadow-2xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Unduh Foto</span>
                </a>

                {selectedPhotoModal.rawItem && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPhotoModal.rawItem.isDT || selectedPhotoModal.type.includes('Dump Truck')) {
                        printDTDailyPDF(selectedPhotoModal.rawItem);
                      } else {
                        printHEDailyPDF(selectedPhotoModal.rawItem);
                      }
                    }}
                    className="bg-[#1e3a8a] hover:bg-[#172554] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-300" />
                    <span>Cetak PDF Resmi</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedPhotoModal(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PENGATURAN SUPABASE & SINKRONISASI REALTIME HP                     */}
      {/* ========================================================================= */}
      {configModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setConfigModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full my-auto overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#1e3a8a] text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base">
                    Pengaturan Database Cloud & Sinkronisasi HP
                  </h4>
                  <p className="text-[11px] text-blue-200">
                    Koneksi realtime agar laporan & foto kertas HM dari HP karyawan langsung tampil di laptop admin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfigModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 ${
                isCloudConnected 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}>
                {isCloudConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <span className="font-extrabold block text-xs sm:text-sm">
                    {isCloudConnected ? 'Database Cloud Supabase Terhubung' : 'Aplikasi Berjalan dalam Mode Offline (LocalStorage)'}
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    {isCloudConnected
                      ? 'Laporan baru dan foto kertas HM dari HP karyawan akan tersinkronisasi otomatis ke dashboard ini dalam hitungan detik (Auto-poll 4s).'
                      : 'Data di HP operator/driver saat ini terisolasi di memori HP masing-masing dan tidak sampai ke laptop admin. Silakan masukkan URL & Anon Key Supabase untuk mengaktifkan sinkronisasi antar perangkat.'}
                  </p>
                </div>
              </div>

              {/* Form Input URL & Anon Key */}
              <div className="space-y-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <h5 className="font-extrabold text-xs text-slate-900 flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <span>Kredensial Database Supabase</span>
                </h5>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Project URL Supabase (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="text"
                    value={cfgUrl}
                    onChange={(e) => setCfgUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Anon / Public API Key (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <textarea
                    rows={3}
                    value={cfgKey}
                    onChange={(e) => setCfgKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full text-xs font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>

                {/* Feedback Hasil Tes */}
                {testResult && (
                  <div className={`p-3 rounded-xl text-xs font-medium border flex items-center space-x-2 ${
                    testResult.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}

                {/* Tombol Aksi */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !cfgUrl || !cfgKey}
                    className="bg-white hover:bg-slate-100 active:scale-98 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 shadow-2xs flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${testingConnection ? 'animate-spin' : ''}`} />
                    <span>{testingConnection ? 'Menguji...' : 'Tes Koneksi'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveConnection}
                    disabled={!cfgUrl || !cfgKey}
                    className="bg-[#1e3a8a] hover:bg-[#172554] active:scale-98 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    Simpan & Aktifkan Cloud
                  </button>

                  {isCloudConnected && (
                    <button
                      type="button"
                      onClick={handleClearConnection}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer ml-auto"
                    >
                      Putuskan Koneksi (Offline)
                    </button>
                  )}
                </div>
              </div>

              {/* Tautan & QR Code Sinkronisasi HP */}
              <div className="space-y-3 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 p-4 sm:p-5 rounded-2xl border border-blue-200/80">
                <div className="flex items-center space-x-2">
                  <QrCode className="w-4 h-4 text-[#1e3a8a]" />
                  <h5 className="font-extrabold text-xs text-[#1e3a8a]">
                    Tautan & QR Code Sinkronisasi HP Karyawan (1 Kali Buka)
                  </h5>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Karyawan tidak perlu mengisi URL atau Key manual di HP. Cukup bagikan tautan ini via WhatsApp grup atau minta karyawan scan QR Code ini dari kamera HP sekali saja saat pertama kali membuka website.
                </p>

                {hpSyncUrl ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-2xl border border-blue-200 shadow-2xs">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(hpSyncUrl)}`}
                      alt="QR Code Sinkronisasi HP"
                      className="w-32 h-32 rounded-xl border border-slate-200 p-1 shrink-0 bg-white"
                      loading="lazy"
                    />
                    <div className="space-y-2 w-full">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        Tautan Sinkronisasi Otomatis
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={hpSyncUrl}
                        className="w-full text-[11px] font-mono p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 select-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyHpSyncUrl}
                        className="bg-[#1e3a8a] hover:bg-[#172554] active:scale-98 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center space-x-2 transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-300" />
                        <span>{copiedLink ? 'Tautan Berhasil Disalin!' : 'Salin Tautan untuk WA Grup'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium">
                    Masukkan URL Supabase dan Anon Key di atas terlebih dahulu untuk membuat QR Code & Tautan sinkronisasi HP.
                  </p>
                )}
              </div>

              {/* Panduan Skrip SQL */}
              <div className="p-3.5 bg-slate-100 rounded-xl text-[11px] text-slate-600 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Tips Setup Supabase: </span>
                  Pastikan tabel <code className="font-mono bg-white px-1 py-0.5 rounded text-blue-700">employees</code>, <code className="font-mono bg-white px-1 py-0.5 rounded text-blue-700">he_timesheets</code>, dan <code className="font-mono bg-white px-1 py-0.5 rounded text-blue-700">dt_timesheets</code> sudah dibuat. Skrip lengkap tersedia di file <code className="font-mono bg-white px-1 py-0.5 rounded text-slate-800">supabase_schema.sql</code> di proyek ini.
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setConfigModalOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
