import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { PublicDashboard } from './components/PublicDashboard';
import { AuthView } from './components/AuthView';
import { HeavyEquipmentForm } from './components/HeavyEquipmentForm';
import { DumpTruckForm } from './components/DumpTruckForm';
import { AdminDashboard } from './components/AdminDashboard';
import { MonthlyNotificationBanner } from './components/MonthlyNotificationBanner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

// Helper deteksi apakah aplikasi berjalan di mode PWA (sudah diinstal)
const checkIsInstalledPWA = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://') ||
    new URLSearchParams(window.location.search).get('source') === 'pwa'
  );
};

// Helper deteksi apakah tampilan adalah desktop (lebar layar >= 1024px)
const checkIsDesktop = () => {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= 1024;
};

export function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lcm_logged_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('alat-berat'); // 'alat-berat' | 'dump-truck' | 'admin'
  const [isInstalled, setIsInstalled] = useState(checkIsInstalledPWA);
  const [isDesktop, setIsDesktop] = useState(checkIsDesktop);

  // Aturan Tampilan Sesuai Permintaan:
  // 1. Kalo sudah diinstal PWA -> Langsung halaman login saja ('auth')
  // 2. Dashboard publik profil perusahaan KHUSUS di browser desktop saja
  // 3. Di mobile / installed -> Langsung halaman login ('auth')
  const [authViewMode, setAuthViewMode] = useState(() => {
    const installed = checkIsInstalledPWA();
    const desktop = checkIsDesktop();
    if (installed || !desktop) return 'auth';
    return 'dashboard';
  });

  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [autoTriggerOcr, setAutoTriggerOcr] = useState(false);
  const [cloudSyncedToast, setCloudSyncedToast] = useState(false);

  // State Sidebar Menu Samping Kiri untuk Admin (Desktop terbuka default, HP tertutup default)
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });

  // Deteksi perubahan ukuran layar & event instalasi PWA
  useEffect(() => {
    const updateEnvironment = () => {
      const installed = checkIsInstalledPWA();
      const desktop = checkIsDesktop();
      setIsInstalled(installed);
      setIsDesktop(desktop);

      // Kalo sudah diinstal PWA atau layar mobile: pastikan selalu di halaman login saja
      if (installed || !desktop) {
        setAuthViewMode((prev) => (prev === 'dashboard' ? 'auth' : prev));
      }
    };

    window.addEventListener('resize', updateEnvironment);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setAuthViewMode('auth');
      setAuthTab('login');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cek parameter query URL (misal: /?source=pwa&view=login atau sinkronisasi ?sb_url=...)
    const params = new URLSearchParams(window.location.search);
    if (params.get('source') === 'pwa' || params.get('view') === 'login') {
      setIsInstalled(true);
      setAuthViewMode('auth');
      setAuthTab('login');
      if (params.get('view') === 'ocr') {
        setAutoTriggerOcr(true);
      }
    }

    if (params.get('sb_url') && params.get('sb_key')) {
      setCloudSyncedToast(true);
      setTimeout(() => setCloudSyncedToast(false), 6000);
      try {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (e) {}
    }

    return () => {
      window.removeEventListener('resize', updateEnvironment);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // =========================================================================
  // ENFORCE STRICT SINGLE ROLE ACCESS RESTRICTION
  // 1 Akun HANYA boleh mengakses 1 jenis lembar kerja / dashboard sesuai role
  // =========================================================================
  useEffect(() => {
    if (currentUser) {
      const role = currentUser.role || '';
      const jabatan = currentUser.jabatan || '';

      if (role === 'admin' || jabatan.includes('Admin')) {
        setActiveTab('admin');
      } else if (role === 'driver' || jabatan.includes('Dump Truck')) {
        setActiveTab('dump-truck');
      } else {
        // Operator Alat Berat
        setActiveTab('alat-berat');
      }
    }
  }, [currentUser]);

  // Navigasi dari Dashboard ke Auth Portal
  const handleNavigateToAuth = (tab = 'login') => {
    if (tab === 'ocr') {
      setAuthTab('login');
      setAutoTriggerOcr(true);
    } else {
      setAuthTab(tab);
      setAutoTriggerOcr(false);
    }
    setAuthViewMode('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Kembali ke Dashboard Beranda (Khusus Browser Desktop Saja & Bukan PWA Terinstal)
  const handleBackToDashboard = () => {
    // Jika PWA sudah diinstal atau bukan desktop, jangan izinkan ke landing dashboard (tetap di login)
    if (isInstalled || !isDesktop) {
      setAuthViewMode('auth');
      setAuthTab('login');
      return;
    }
    setAuthViewMode('dashboard');
    setAutoTriggerOcr(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Login
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('lcm_logged_user', JSON.stringify(user));
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lcm_logged_user');

    // Jika PWA terinstal atau bukan desktop: langsung tetap di halaman login saja
    if (isInstalled || !isDesktop) {
      setAuthViewMode('auth');
      setAuthTab('login');
    } else {
      // Khusus browser desktop biasa: kembali ke dashboard beranda
      setAuthViewMode('dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cek otorisasi tampilan
  const isOperator = currentUser?.role === 'operator' || currentUser?.jabatan?.includes('Alat Berat');
  const isDriver = currentUser?.role === 'driver' || currentUser?.jabatan?.includes('Dump Truck');
  const isAdmin = currentUser?.role === 'admin' || currentUser?.jabatan?.includes('Admin');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-blue-100 selection:text-[#1e3a8a]">
      
      {/* Toast Notifikasi Sinkronisasi Cloud Supabase */}
      {cloudSyncedToast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-[#1e3a8a] text-white p-4 rounded-2xl shadow-2xl border border-blue-400 animate-in fade-in slide-in-from-top-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-xs">
            <strong className="block font-black text-sm text-emerald-300">Database Cloud Terhubung!</strong>
            <span className="text-blue-100">Perangkat HP ini telah tersambung secara realtime ke server Site LCM. Laporan & foto langsung masuk ke laptop Admin.</span>
          </div>
        </div>
      )}

      {/* Monthly Day 1 Alert Banner */}
      <MonthlyNotificationBanner />

      {/* PWA Install Prompt Banner */}
      <PWAInstallPrompt />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        authViewMode={authViewMode}
        onNavigateToAuth={handleNavigateToAuth}
        onBackToDashboard={handleBackToDashboard}
        isInstalled={isInstalled}
        isDesktop={isDesktop}
        adminSidebarOpen={adminSidebarOpen}
        onToggleAdminSidebar={() => setAdminSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className={`flex-1 ${isAdmin && currentUser ? 'pb-0' : 'pb-12'}`}>
        {!currentUser ? (
          <div>
            {/* Dashboard Publik Profil HANYA TAMPIL di Desktop Browser & Belum Diinstal */}
            {authViewMode === 'dashboard' && isDesktop && !isInstalled ? (
              <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
                <PublicDashboard onNavigateToAuth={handleNavigateToAuth} />
              </div>
            ) : (
              <AuthView 
                onLoginSuccess={handleLoginSuccess}
                initialTab={authTab}
                initialTriggerOcr={autoTriggerOcr}
                onBackToDashboard={handleBackToDashboard}
                isInstalledPWA={isInstalled}
                isDesktop={isDesktop}
              />
            )}
          </div>
        ) : (
          <div>
            {/* JIKA OPERATOR: HANYA FORM ALAT BERAT */}
            {isOperator && (
              <HeavyEquipmentForm currentUser={currentUser} onLogout={handleLogout} />
            )}

            {/* JIKA DRIVER: HANYA FORM DUMP TRUCK */}
            {isDriver && (
              <DumpTruckForm currentUser={currentUser} onLogout={handleLogout} />
            )}

            {/* JIKA ADMIN: HANYA DASHBOARD MONITORING & REKAP ADMIN (DIBATASI, TIDAK BISA BUKA FORM KARYAWAN) */}
            {isAdmin && (
              <AdminDashboard 
                currentUser={currentUser}
                isSidebarOpen={adminSidebarOpen}
                setIsSidebarOpen={setAdminSidebarOpen}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-extrabold text-[#1e3a8a]">
            LCM TimeSheet Digital • PT. LAZ COAL MANDIRI
          </p>
          <p className="text-[11px] text-slate-400">
            Site Arutmin Indonesia - Kintap, Kalimantan Selatan • Sistem Pencatatan Jam Kerja & Ritase Tambang Batubara
          </p>
        </div>
      </footer>

    </div>
  );
}

export default App;
