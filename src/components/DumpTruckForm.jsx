import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Calendar, 
  Clock, 
  Save, 
  Printer, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  UserCheck,
  LogOut,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dtTimesheetRepo } from '../lib/supabase';
import { printDTDailyPDF } from '../lib/exportPdf';

const DEFAULT_HOURS_SIANG = [
  '06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00',
  '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
];

const DEFAULT_RITASE_SLOTS_SIANG = [
  { time: '07-08', ex_code: 'EX-623', count: 3 },
  { time: '08-09', ex_code: 'EX-623', count: 3 },
  { time: '09-10', ex_code: 'EX-623', count: 4 },
  { time: '10-11', ex_code: 'EX-623', count: 3 },
  { time: '11-12', ex_code: 'EX-623', count: 3 },
  { time: '12-13', ex_code: '-', count: 0 },
  { time: '13-14', ex_code: 'EXA 612', count: 2 },
  { time: '14-15', ex_code: 'EXA 612', count: 3 },
  { time: '15-16', ex_code: 'EXA 612', count: 2 },
  { time: '16-17', ex_code: 'EX-623', count: 3 },
  { time: '17-18', ex_code: 'EX-623', count: 2 }
];

export const DumpTruckForm = ({ currentUser, onLogout }) => {
  const getToday = () => new Date().toISOString().split('T')[0];

  // Header State
  const [pergantian, setPergantian] = useState('I'); // 'I' | 'II' | 'III'
  const [tanggal, setTanggal] = useState(getToday());
  const [shift, setShift] = useState('Shift 1 (Siang)');
  const [namaOpt, setNamaOpt] = useState(currentUser?.name || '');
  const [nikOpt, setNikOpt] = useState(currentUser?.nik || '');
  const [unitCode, setUnitCode] = useState('DT 145');
  const [modelUnit, setModelUnit] = useState('Hino 500 FM 260 JD');
  const [hmAwal, setHmAwal] = useState('8920.0');
  const [hmAkhir, setHmAkhir] = useState('8930.5');
  const [jamKerjaUnit, setJamKerjaUnit] = useState('10.0');
  const [jamKerjaMp, setJamKerjaMp] = useState('11.0');
  const [pengawas, setPengawas] = useState('Supriyanto');
  const [office, setOffice] = useState('Dwi Lestari');

  // Work Hours Table & Ritase Logs
  const [whLogs, setWhLogs] = useState([]);
  const [ritaseLogs, setRitaseLogs] = useState(DEFAULT_RITASE_SLOTS_SIANG);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-Logout State
  const [autoLogoutModal, setAutoLogoutModal] = useState(false);
  const [countdown, setCountdown] = useState(4);

  // Auto-logout countdown timer
  useEffect(() => {
    let timer;
    if (autoLogoutModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (autoLogoutModal && countdown === 0) {
      if (onLogout) onLogout();
    }
    return () => clearTimeout(timer);
  }, [autoLogoutModal, countdown, onLogout]);

  useEffect(() => {
    if (currentUser) {
      setNamaOpt(currentUser.name);
      setNikOpt(currentUser.nik);
    }
  }, [currentUser]);

  // Setup WH logs
  useEffect(() => {
    const rows = DEFAULT_HOURS_SIANG.map((h, i) => ({
      time: h,
      kegiatan: i === 0 ? 'P2H & Briefing' : (i === 6 ? 'Istirahat / Lunch' : 'Hauling OB (Pit to Disposal 2)'),
      keterangan: i === 6 ? 'Standby kantin' : 'Kondisi jalan baik',
      check_hour: i !== 6
    }));
    setWhLogs(rows);
  }, [shift]);

  // Total HM
  const totalHm = Math.max(0, (parseFloat(hmAkhir) || 0) - (parseFloat(hmAwal) || 0));

  // Hitung Total Ritase Otomatis
  const totalRitase = ritaseLogs.reduce((acc, curr) => acc + (parseInt(curr.count, 10) || 0), 0);

  const handleWhChange = (index, field, value) => {
    setWhLogs(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRitaseChange = (index, field, value) => {
    setRitaseLogs(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!unitCode.trim()) {
      setErrorMsg('Unit Code Dump Truck wajib diisi (contoh: DT 145).');
      return;
    }
    if (parseFloat(hmAkhir) < parseFloat(hmAwal)) {
      setErrorMsg('HM Akhir tidak boleh lebih kecil dari HM Awal!');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        employee_id: currentUser?.id,
        nik: nikOpt,
        nama_opt: namaOpt,
        pergantian,
        tanggal,
        shift,
        unit_code: unitCode.trim().toUpperCase(),
        model_unit: modelUnit,
        hm_awal: parseFloat(hmAwal) || 0,
        hm_akhir: parseFloat(hmAkhir) || 0,
        total_hm: parseFloat(totalHm.toFixed(2)),
        jam_kerja_unit: parseFloat(jamKerjaUnit) || 0,
        jam_kerja_mp: parseFloat(jamKerjaMp) || 0,
        opt_name: namaOpt,
        pengawas,
        office,
        wh_logs: whLogs,
        ritase_logs: ritaseLogs,
        total_ritase: totalRitase
      };

      await dtTimesheetRepo.create(payload);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      setSaveSuccess(true);
      setCountdown(4);
      setAutoLogoutModal(true);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan Time Sheet Dump Truck');
    } finally {
      setSaving(false);
    }
  };

  // Langsung cetak PDF saat ini
  const handlePrintCurrentPDF = () => {
    const record = {
      tanggal,
      shift,
      pergantian,
      nama_opt: namaOpt,
      nik: nikOpt,
      unit_code: unitCode.toUpperCase(),
      model_unit: modelUnit,
      hm_awal: parseFloat(hmAwal) || 0,
      hm_akhir: parseFloat(hmAkhir) || 0,
      total_hm: parseFloat(totalHm.toFixed(2)),
      jam_kerja_unit: parseFloat(jamKerjaUnit) || 0,
      jam_kerja_mp: parseFloat(jamKerjaMp) || 0,
      pengawas,
      office,
      wh_logs: whLogs,
      ritase_logs: ritaseLogs,
      total_ritase: totalRitase
    };
    printDTDailyPDF(record);
  };

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-6">
      
      {/* Title Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0F5132] flex items-center justify-center text-amber-400 shadow-md">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Time Sheet Dump Truck (DT)
              </h2>
              <span className="bg-emerald-100 text-[#0F5132] text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                Hauling & Ritase
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              PT. LAZ COAL MANDIRI • Site Arutmin Indonesia, Kintap
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrintCurrentPDF}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#0F5132]" />
            <span>Cetak PDF</span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-red-200 flex items-center space-x-1.5 transition cursor-pointer"
              title="Keluar dari akun Anda"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Banners */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-[#0F5132] text-xs p-4 rounded-2xl flex items-center space-x-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="font-bold">
            Berhasil! Lembar Time Sheet Dump Truck telah tersimpan beserta rekap ritase {totalRitase} Rit.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-300 text-red-800 text-xs p-4 rounded-2xl flex items-center space-x-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="font-semibold">{errorMsg}</div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ========================================================================= */}
        {/* SECTION 1: HEADER INFORMASI OPERASIONAL                                    */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-slate-200/80 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Calendar className="w-4 h-4 text-[#0F5132]" />
            <h3 className="font-bold text-sm text-slate-800">
              1. Header Informasi Unit DT & Driver
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Pergantian (I, II, III) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Pergantian Shift Driver:
              </label>
              <div className="flex space-x-1.5">
                {['I', 'II', 'III'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPergantian(p)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                      pergantian === p
                        ? 'bg-[#0F5132] text-white border-[#0F5132] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Shift {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tanggal:
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0F5132] outline-none"
                required
              />
            </div>

            {/* Shift */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Shift Waktu:
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0F5132] outline-none"
              >
                <option value="Shift 1 (Siang)">Shift 1 (Siang: 06:00 - 18:00)</option>
                <option value="Shift 2 (Malam)">Shift 2 (Malam: 18:00 - 06:00)</option>
              </select>
            </div>

            {/* Nama Opt (Auto-fill) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama Driver (Opt):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={namaOpt}
                  onChange={(e) => setNamaOpt(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-emerald-50/60 border border-emerald-300 rounded-xl text-[#0F5132] outline-none"
                  required
                />
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* Unit Code (Contoh: DT 145) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                No. Unit DT (Unit Code):
              </label>
              <input
                type="text"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                placeholder="Contoh: DT 145"
                className="w-full text-xs font-mono font-extrabold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0F5132] text-[#0F5132] outline-none uppercase"
                required
              />
            </div>

            {/* Model Unit */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Model Unit Dump Truck:
              </label>
              <input
                type="text"
                value={modelUnit}
                onChange={(e) => setModelUnit(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none"
              />
            </div>

            {/* Pengawas */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Pengawas Lapangan:
              </label>
              <input
                type="text"
                value={pengawas}
                onChange={(e) => setPengawas(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none"
              />
            </div>

            {/* Office */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Office / Checker TimeSheet:
              </label>
              <input
                type="text"
                value={office}
                onChange={(e) => setOffice(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none"
              />
            </div>

          </div>

          {/* HM Section */}
          <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                HM Awal:
              </label>
              <input
                type="number"
                step="0.1"
                value={hmAwal}
                onChange={(e) => setHmAwal(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                HM Akhir:
              </label>
              <input
                type="number"
                step="0.1"
                value={hmAkhir}
                onChange={(e) => setHmAkhir(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none"
                required
              />
            </div>

            {/* Total HM */}
            <div className="bg-[#0F5132] text-white p-2.5 rounded-xl text-center shadow-xs">
              <span className="block text-[10px] font-medium text-emerald-200 uppercase tracking-wider">
                Total HM DT
              </span>
              <span className="text-base font-extrabold font-mono text-amber-300">
                {totalHm.toFixed(2)} Jam
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Jam Kerja Unit:
              </label>
              <input
                type="number"
                step="0.1"
                value={jamKerjaUnit}
                onChange={(e) => setJamKerjaUnit(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Jam Kerja MP:
              </label>
              <input
                type="number"
                step="0.1"
                value={jamKerjaMp}
                onChange={(e) => setJamKerjaMp(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none"
              />
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: TABEL RITASE UNIT DUMP TRUCK & EXCAVATOR PEMUAT                 */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-slate-200/80 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Hash className="w-4 h-4 text-[#0F5132]" />
              <h3 className="font-bold text-sm text-slate-800">
                2. Tabel Ritase Unit DT (Per Jam & Excavator Pemuat)
              </h3>
            </div>
            
            {/* Total Ritase Live Counter Badge */}
            <div className="bg-amber-100 border border-amber-300 text-amber-900 px-3.5 py-1 rounded-xl flex items-center space-x-2">
              <span className="text-[11px] font-semibold">Total Ritase:</span>
              <span className="text-base font-black font-mono text-[#0F5132]">
                {totalRitase} Rit
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F5132] text-white">
                <tr>
                  <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                  <th className="py-2.5 px-3 font-bold w-28 text-center">Jam</th>
                  <th className="py-2.5 px-3 font-bold">Kode Excavator Pemuat</th>
                  <th className="py-2.5 px-3 font-bold w-36 text-center">Jumlah Ritase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ritaseLogs.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-2 px-3 text-center font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-700 text-center">
                      {row.time}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.ex_code}
                        onChange={(e) => handleRitaseChange(idx, 'ex_code', e.target.value)}
                        placeholder="Contoh: EX-623, EXA 612"
                        className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-300 focus:border-[#0F5132] outline-none uppercase bg-white"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={row.count}
                        onChange={(e) => handleRitaseChange(idx, 'count', e.target.value)}
                        className="w-24 text-xs font-mono font-black text-center px-3 py-1.5 rounded-lg border border-slate-300 focus:border-[#0F5132] outline-none bg-white text-[#0F5132]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-extrabold text-slate-800">
                <tr>
                  <td colSpan="3" className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    TOTAL RITASE KESELURUHAN (TTL):
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-sm text-[#0F5132] bg-amber-200/60">
                    {totalRitase} Rit
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: TABEL JAM KERJA (WH)                                           */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-slate-200/80 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#0F5132]" />
              <h3 className="font-bold text-sm text-slate-800">
                3. Tabel Jam Kerja (WH)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              12 Jam Operasi ({shift})
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F5132] text-white">
                <tr>
                  <th className="py-2 px-3 font-bold w-12 text-center">No</th>
                  <th className="py-2 px-3 font-bold w-28">Jam (WH)</th>
                  <th className="py-2 px-3 font-bold">Kegiatan Hauling</th>
                  <th className="py-2 px-3 font-bold">Keterangan / Rute</th>
                  <th className="py-2 px-3 font-bold w-20 text-center">Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {whLogs.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-2 px-3 text-center font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-700">
                      {row.time}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.kegiatan}
                        onChange={(e) => handleWhChange(idx, 'kegiatan', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-[#0F5132] outline-none bg-white font-medium"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.keterangan}
                        onChange={(e) => handleWhChange(idx, 'keterangan', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-[#0F5132] outline-none bg-white"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.check_hour}
                        onChange={(e) => handleWhChange(idx, 'check_hour', e.target.checked)}
                        className="w-4 h-4 rounded text-[#0F5132] focus:ring-[#0F5132] border-slate-300 cursor-pointer accent-[#0F5132]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrintCurrentPDF}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold py-3 px-6 rounded-2xl border border-slate-300 flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#0F5132]" />
            <span>Cetak PDF Lembar Kerja DT</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-[#0F5132] hover:bg-[#0a3622] text-white text-xs sm:text-sm font-bold py-3 px-8 rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Time Sheet Dump Truck'}</span>
          </button>
        </div>

      </form>

      {/* ========================================================================= */}
      {/* MODAL SUKSES SIMPAN & OTOMATIS LOGOUT DUMP TRUCK                          */}
      {/* ========================================================================= */}
      {autoLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0F5132] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="bg-emerald-100 text-[#0F5132] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Tersimpan Komplit & Terdata di Admin
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Time Sheet DT Berhasil Disimpan!
              </h3>
              <p className="text-xs text-slate-500">
                Terima kasih atas kerja keras hauling Anda hari ini, <strong>{namaOpt}</strong>.
              </p>
            </div>

            {/* Ringkasan Data Dump Truck */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-left font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Unit DT:</span>
                <span className="font-mono font-bold text-[#0F5132]">{unitCode} ({modelUnit})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal & Pergantian:</span>
                <span className="font-semibold text-slate-800">{tanggal} • Shift {pergantian} ({shift})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total HM:</span>
                <span className="font-mono font-bold text-slate-900">{totalHm.toFixed(2)} Jam</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                <span className="text-slate-700">Total Ritase Hauling:</span>
                <span className="font-mono text-amber-700 text-sm bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                  {totalRitase} Rit
                </span>
              </div>
            </div>

            {/* Alert & Countdown Otomatis Logout */}
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs text-amber-950 space-y-1">
              <div className="font-bold flex items-center justify-center space-x-1.5 text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Otomatis Logout dalam: <strong className="text-base text-red-600 font-mono">{countdown}</strong> detik</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Sistem otomatis keluar ke halaman login agar HP aman dan siap digunakan oleh driver shift berikutnya.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handlePrintCurrentPDF();
                  setTimeout(() => {
                    if (onLogout) onLogout();
                  }, 800);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-3 px-3 rounded-xl border border-slate-300 flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#0F5132]" />
                <span>Cetak PDF & Logout</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onLogout) onLogout();
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 px-3 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Sekarang</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
