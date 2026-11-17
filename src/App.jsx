import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PublicDashboard } from './components/PublicDashboard';
import { AuthView } from './components/AuthView';
import { HeavyEquipmentForm } from './components/HeavyEquipmentForm';
import { DumpTruckForm } from './components/DumpTruckForm';
import { AdminDashboard } from './components/AdminDashboard';
import { MonthlyNotificationBanner } from './components/MonthlyNotificationBanner';

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
  const [authViewMode, setAuthViewMode] = useState('dashboard'); // 'dashboard' | 'auth'
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [autoTriggerOcr, setAutoTriggerOcr] = useState(false);

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

  // Kembali ke Dashboard Beranda
  const handleBackToDashboard = () => {
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
    setAuthViewMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cek otorisasi tampilan
  const isOperator = currentUser?.role === 'operator' || currentUser?.jabatan?.includes('Alat Berat');
  const isDriver = currentUser?.role === 'driver' || currentUser?.jabatan?.includes('Dump Truck');
  const isAdmin = currentUser?.role === 'admin' || currentUser?.jabatan?.includes('Admin');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-blue-100 selection:text-[#1e3a8a]">
      
      {/* Monthly Day 1 Alert Banner */}
      <MonthlyNotificationBanner />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        authViewMode={authViewMode}
        onNavigateToAuth={handleNavigateToAuth}
        onBackToDashboard={handleBackToDashboard}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {!currentUser ? (
          <div>
            {authViewMode === 'dashboard' ? (
              <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
                <PublicDashboard onNavigateToAuth={handleNavigateToAuth} />
              </div>
            ) : (
              <AuthView 
                onLoginSuccess={handleLoginSuccess}
                initialTab={authTab}
                initialTriggerOcr={autoTriggerOcr}
                onBackToDashboard={handleBackToDashboard}
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
