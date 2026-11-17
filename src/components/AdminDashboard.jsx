import React, { useState, useEffect } from 'react';
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
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  heTimesheetRepo, 
  dtTimesheetRepo, 
  employeeRepo, 
  monthlyResetService, 
  isSupabaseConfigured
} from '../lib/supabase';
import { exportDatabaseHMToExcel } from '../lib/exportExcel';
import { exportDatabaseHMToWord } from '../lib/exportWord';
import { printHEDailyPDF, printDTDailyPDF, exportMonthlyBackupPDF } from '../lib/exportPdf';

export const AdminDashboard = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('rekap'); // 'rekap' | 'karyawan' | 'backup'
  const [loading, setLoading] = useState(true);
  const [heList, setHeList] = useState([]);
  const [dtList, setDtList] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filter States
  const [filterDate, setFilterDate] = useState('');
  const [filterShift, setFilterShift] = useState('ALL');
  const [searchUnit, setSearchUnit] = useState('');
  const [searchEmployee, setSearchEmployee] = useState('');

  // Password Reset Modal State
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Auto-Reset Confirmation Modal
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(null);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [heData, dtData, empData] = await Promise.all([
        heTimesheetRepo.getAll(),
        dtTimesheetRepo.getAll(),
        employeeRepo.getAll()
      ]);
      setHeList(heData || []);
      setDtList(dtData || []);
      setEmployees(empData || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
          operators: [
            { name: item.nama_opt, hm: Number(item.total_hm || 0) }
          ]
        };
      } else {
        unitMap[key].hmAwal = Math.min(unitMap[key].hmAwal, Number(item.hm_awal || 0));
        unitMap[key].hmAkhir = Math.max(unitMap[key].hmAkhir, Number(item.hm_akhir || 0));
        unitMap[key].totalHm = unitMap[key].hmAkhir - unitMap[key].hmAwal;
        unitMap[key].operators.push({ name: item.nama_opt, hm: Number(item.total_hm || 0) });
      }
    };

    heList.forEach(item => processItem(item, false));
    dtList.forEach(item => processItem(item, true));

    return Object.values(unitMap);
  };

  const hmUnitRows = computeDatabaseHMRows();

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

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      
      {/* Role Visual Banner: Admin Dashboard (Site Management & Fleet Overview) */}
      <div className="relative h-40 sm:h-48 rounded-3xl overflow-hidden shadow-lg border border-slate-200">
        <img 
          src="/excavator-mining.webp" 
          alt="Operasional Tambang PT. LAZ COAL MANDIRI" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent flex items-center p-5 sm:p-7">
          <div className="text-white space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="bg-[#0F5132] text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-amber-400/40 shadow-xs">
                Role: Administrator Site
              </span>
              <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full backdrop-blur-xs">
                Site Arutmin Kintap
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
              Dashboard Monitoring & Database HM Unit
            </h2>
            <p className="text-xs text-emerald-100 font-medium max-w-lg">
              Rekapitulasi Jam Kerja (HM) Alat Berat, Hauling Dump Truck, Ekspor Excel/Word/PDF, dan Manajemen Akun Karyawan
            </p>
          </div>
        </div>
      </div>

      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <img 
            src="/lcm-logo.png" 
            alt="Logo LCM" 
            className="w-12 h-12 rounded-full object-contain shadow-md border border-slate-200"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                PT. LAZ COAL MANDIRI
              </h2>
              <span className="bg-emerald-100 text-[#0F5132] text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                DATABASE HM UNIT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Site Arutmin Indonesia, Kintap (Kalimantan Selatan) • Pusat Kendali Data Operasional
            </p>
          </div>
        </div>

        {/* Tab Buttons Admin */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('rekap')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'rekap'
                ? 'bg-[#0F5132] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Database HM Unit</span>
          </button>

          <button
            onClick={() => setActiveTab('karyawan')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'karyawan'
                ? 'bg-[#0F5132] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Karyawan ({employees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-[#0F5132] text-white shadow-xs'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Auto-Backup & Reset Tgl 1</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0F5132] flex items-center justify-center font-bold">
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
            <span className="text-lg font-black font-mono text-[#0F5132]">{totalHMAll.toFixed(1)} <span className="text-xs font-normal text-slate-500">Jam</span></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
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
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                title="Export seluruh tabel ke file Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Export Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleExportWord}
                className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                title="Export rekap dokumen ke Microsoft Word (.docx)"
              >
                <FileText className="w-4 h-4 text-blue-200" />
                <span>Export Word (.docx)</span>
              </button>
            </div>

          </div>

          {/* TABEL DATABASE HM UNIT (FORMAT PER KOLOM) */}
          <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-3.5 bg-[#0F5132] text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Table className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  DATABASE HM UNIT PT. LAZ COAL MANDIRI
                </h3>
              </div>
              <span className="text-[11px] text-emerald-200 font-mono">
                {hmUnitRows.length} Unit Tercatat
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Shift</th>
                    <th className="py-3 px-3">Model Unit</th>
                    <th className="py-3 px-3 font-mono">No Unit</th>
                    <th className="py-3 px-3 text-right">HM Awal</th>
                    <th className="py-3 px-3 text-right">HM Akhir</th>
                    <th className="py-3 px-3 text-right font-extrabold text-[#0F5132]">Total HM</th>
                    <th className="py-3 px-3 border-l border-slate-200">Operator 1</th>
                    <th className="py-3 px-3 text-right">HM Opt 1</th>
                    <th className="py-3 px-3 border-l border-slate-200">Operator 2</th>
                    <th className="py-3 px-3 text-right">HM Opt 2</th>
                    <th className="py-3 px-3 border-l border-slate-200">Operator 3</th>
                    <th className="py-3 px-3 text-right">HM Opt 3</th>
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
                          <td className="py-2.5 px-3 font-mono font-extrabold text-[#0F5132]">{row.noUnit}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{row.hmAwal.toFixed(1)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{row.hmAkhir.toFixed(1)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-[#0F5132] bg-emerald-50/80">
                            {row.totalHm.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 border-l border-slate-200 font-semibold">{opt1.name}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{opt1.hm > 0 ? opt1.hm.toFixed(1) : '-'}</td>
                          <td className="py-2.5 px-3 border-l border-slate-200 text-slate-600">{opt2.name}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{opt2.hm > 0 ? opt2.hm.toFixed(1) : '-'}</td>
                          <td className="py-2.5 px-3 border-l border-slate-200 text-slate-600">{opt3.name}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{opt3.hm > 0 ? opt3.hm.toFixed(1) : '-'}</td>
                          
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
                              className="p-1.5 text-[#0F5132] hover:bg-emerald-100 rounded-lg transition"
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
                      <td colSpan="14" className="text-center py-8 text-slate-400">
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
            <div className="bg-emerald-50 border border-emerald-300 text-[#0F5132] text-xs p-3.5 rounded-2xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{resetSuccess}</span>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#0F5132] text-white">
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
                              : (emp.jabatan.includes('Admin') ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300')
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
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Terdaftar Resmi</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedEmp(emp)}
                            className="bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#0F5132] font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 transition flex items-center space-x-1 mx-auto cursor-pointer"
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
            <div className="flex items-center space-x-3 text-[#0F5132]">
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
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-xs text-emerald-950 space-y-2">
              <div className="font-extrabold flex items-center space-x-1.5 text-[#0F5132] text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>JAMINAN KEAMANAN: Akun Karyawan (Tabel employees) TIDAK AKAN PERNAH DIHAPUS</span>
              </div>
              <p className="leading-relaxed text-emerald-900">
                Pembersihan berkala bulanan hanya menghapus transaksi laporan jam kerja bulan lalu (<code>he_timesheets</code> dan <code>dt_timesheets</code>) agar database Supabase selalu ringan dan tidak melampaui batas free tier. 
                Seluruh <strong>200+ akun karyawan yang sudah terdaftar mandiri tetap tersimpan permanen</strong> dan dapat terus login menggunakan NIK masing-masing setiap bulan.
              </p>
            </div>

            {/* Status Feedback */}
            {resetFeedback && (
              <div className={`p-4 rounded-2xl text-xs flex items-start space-x-2.5 border ${
                resetFeedback.success 
                  ? 'bg-emerald-50 border-emerald-300 text-[#0F5132]' 
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                {resetFeedback.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <div className="font-bold">{resetFeedback.message}</div>
              </div>
            )}

            {/* Penjelasan 2 Jalur Eksekusi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="bg-[#0F5132] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
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
              <div className="flex items-center space-x-2 text-[#0F5132]">
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
                  className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0F5132] outline-none"
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
                  className="bg-[#0F5132] hover:bg-[#0a3622] text-white text-xs font-bold px-4 py-2 rounded-xl transition"
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
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-[11px] text-emerald-900 font-bold">
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
                className="bg-[#0F5132] hover:bg-[#0a3622] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition"
              >
                {resetLoading ? 'Memproses...' : 'Ya, Unduh PDF & Bersihkan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
