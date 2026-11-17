import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Cek apakah sudah berjalan di mode standalone (PWA terinstal)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Cek apakah perangkat adalah iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Cek apakah user pernah menutup banner di sesi ini
    const dismissed = sessionStorage.getItem('lcm_pwa_dismissed');
    if (dismissed) return;

    if (isIosDevice) {
      // Tampilkan petunjuk Add to Home Screen untuk iOS
      setShowPrompt(true);
    }

    // 3. Listener untuk event instalasi Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!sessionStorage.getItem('lcm_pwa_dismissed')) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listener saat aplikasi berhasil diinstal
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Trigger dialog instalasi bawaan browser
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('lcm_pwa_dismissed', 'true');
  };

  // Jangan tampilkan jika sudah terinstal atau prompt ditutup
  if (isInstalled || !showPrompt) return null;

  return (
    <div className="bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#1e3a8a] text-white border-b border-blue-400/30 px-3 sm:px-4 py-2 shadow-md animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        
        {/* Info & Icon */}
        <div className="flex items-center space-x-2.5 text-center sm:text-left">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <span className="text-xs font-black tracking-tight text-white">
                Pasang Aplikasi LCM TimeSheet di HP
              </span>
              <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-blue-100">
              {isIOS 
                ? 'Ketuk tombol Bagikan ⎋ lalu pilih "Tambah ke Layar Utama" ➕ untuk akses langsung.'
                : 'Instal aplikasi untuk akses cepat 1-klik langsung ke Halaman Login tanpa buka browser.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          {!isIOS && deferredPrompt && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instal Sekarang</span>
            </button>
          )}

          {isIOS && (
            <div className="flex items-center space-x-1 text-[11px] bg-white/10 px-2.5 py-1 rounded-xl border border-white/20">
              <Share className="w-3.5 h-3.5 text-amber-300" />
              <span>Pilih "Add to Home Screen"</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-blue-200 hover:text-white transition cursor-pointer"
            title="Tutup pemberitahuan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
