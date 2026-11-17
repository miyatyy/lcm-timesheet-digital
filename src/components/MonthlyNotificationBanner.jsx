import React, { useState } from 'react';
import { RotateCcw, Download, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { monthlyResetService, heTimesheetRepo, dtTimesheetRepo } from '../lib/supabase';
import { exportMonthlyBackupPDF } from '../lib/exportPdf';

export const MonthlyNotificationBanner = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');

  // Check if today is day 1 of the month
  const isFirstDay = new Date().getDate() === 1;

  if (!isFirstDay || isDismissed) {
    return null;
  }

  const handleBackupNow = async () => {
    setDownloading(true);
    try {
      const [heData, dtData] = await Promise.all([
        heTimesheetRepo.getAll(),
        dtTimesheetRepo.getAll()
      ]);

      const prevMonth = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      exportMonthlyBackupPDF(heData, dtData, prevMonth);

      const res = await monthlyResetService.executeReset();
      setDoneMsg(`Backup PDF bulanan telah diunduh. Database bulan lalu telah dibersihkan. Akun karyawan tetap aman!`);
    } catch (err) {
      alert('Gagal memproses auto-backup: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-medium border-b border-amber-600 shadow-sm animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-slate-900 shrink-0" />
          <span>
            <strong>Jadwal Awal Bulan (Tanggal 1):</strong> Waktunya auto-backup rekapan bulanan PDF dan pembersihan transaksi bulan lalu (Akun karyawan tetap aman).
          </span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {doneMsg ? (
            <span className="font-bold text-blue-950 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{doneMsg}</span>
            </span>
          ) : (
            <button
              onClick={handleBackupNow}
              disabled={downloading}
              className="bg-slate-950 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-sm transition text-[11px] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{downloading ? 'Mengunduh...' : 'Unduh Backup PDF & Bersihkan'}</span>
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-800 hover:text-black p-1"
            title="Tutup pengingat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
