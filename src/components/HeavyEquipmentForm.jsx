import React, { useState, useEffect } from 'react';
import { 
  HardHat, 
  Calendar, 
  Clock, 
  FileText, 
  Save, 
  Printer, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Calculator,
  UserCheck,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { heTimesheetRepo } from '../lib/supabase';
import { printHEDailyPDF } from '../lib/exportPdf';
import { PaperHMPhotoUpload } from './PaperHMPhotoUpload';

const DEFAULT_HOURS_SIANG = [
  '06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00',
  '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
];

const DEFAULT_HOURS_MALAM = [
  '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00',
  '22:00-23:00', '23:00-00:00', '00:00-01:00', '01:00-02:00',
  '02:00-03:00', '03:00-04:00', '04:00-05:00', '05:00-06:00'
];

const COMMON_ACTIVITIES = [
  'P2H & Safety Talk',
  'Loading OB (Overburden)',
  'Loading Batubara',
  'Cleaning & Dozing Front',
  'Stok Batu / ROM Pad',
  'Travel Unit / Relokasi',
  'Standby Antrian / Hujan',
  'Breakdown / Perbaikan',
  'Istirahat / Sholat'
];

export const HeavyEquipmentForm = ({ currentUser, onLogout }) => {
  const getToday = () => new Date().toISOString().split('T')[0];

  // Header State
  const [tanggal, setTanggal] = useState(getToday());
  const [shift, setShift] = useState('Shift 1 (Siang)');
  const [namaOpt, setNamaOpt] = useState(currentUser?.name || '');
  const [nikOpt, setNikOpt] = useState(currentUser?.nik || '');
  const [modelUnit, setModelUnit] = useState('DX530LC-7M');
  const [unitCode, setUnitCode] = useState('EX-623');
  const [hmAwal, setHmAwal] = useState('1450.0');
  const [hmAkhir, setHmAkhir] = useState('1460.5');
  const [jamKerjaUnit, setJamKerjaUnit] = useState('10.5');
  const [jamKerjaMp, setJamKerjaMp] = useState('11.0');
  const [pengawas, setPengawas] = useState('Supriyanto');
  const [office, setOffice] = useState('Dwi Lestari');

  // Work Hours Table State
  const [whLogs, setWhLogs] = useState([]);
  const [fotoKertasHm, setFotoKertasHm] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-Logout State
  const [autoLogoutModal, setAutoLogoutModal] = useState(false);
  const [countdown, setCountdown] = useState(4);

  // Sinkronisasi data user saat login
  useEffect(() => {
    if (currentUser) {
      setNamaOpt(currentUser.name);
      setNikOpt(currentUser.nik);
    }
  }, [currentUser]);

  // Setup initial table rows whenever shift changes
  useEffect(() => {
    const hours = shift.includes('Malam') ? DEFAULT_HOURS_MALAM : DEFAULT_HOURS_SIANG;
    const initialRows = hours.map((h, i) => ({
      time: h,
      kegiatan: i === 0 ? 'P2H & Safety Talk' : (i === 6 ? 'Istirahat / Sholat' : 'Loading OB (Overburden)'),
      keterangan: i === 6 ? 'Kantin / Rest area' : 'Front Pit Kintap',
      check_hour: i !== 6
    }));
    setWhLogs(initialRows);
  }, [shift]);

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

  // Hitung Total HM Otomatis
  const totalHm = Math.max(0, (parseFloat(hmAkhir) || 0) - (parseFloat(hmAwal) || 0));

  const handleRowChange = (index, field, value) => {
    setWhLogs(prev => {
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
      setErrorMsg('No Unit / Unit Code wajib diisi (contoh: EX-623).');
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
        tanggal,
        shift,
        model_unit: modelUnit,
        unit_code: unitCode.trim().toUpperCase(),
        hm_awal: parseFloat(hmAwal) || 0,
        hm_akhir: parseFloat(hmAkhir) || 0,
        total_hm: parseFloat(totalHm.toFixed(2)),
        jam_kerja_unit: parseFloat(jamKerjaUnit) || 0,
        jam_kerja_mp: parseFloat(jamKerjaMp) || 0,
        opt_name: namaOpt,
        pengawas,
        office,
        foto_kertas_hm: fotoKertasHm,
        wh_logs: whLogs
      };

      await heTimesheetRepo.create(payload);

      setSaveSuccess(true);
      setCountdown(4);
      setAutoLogoutModal(true);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan Time Sheet');
    } finally {
      setSaving(false);
    }
  };

  // Langsung cetak PDF saat ini
  const handlePrintCurrentPDF = () => {
    const record = {
      tanggal,
      shift,
      nama_opt: namaOpt,
      nik: nikOpt,
      model_unit: modelUnit,
      unit_code: unitCode.toUpperCase(),
      hm_awal: parseFloat(hmAwal) || 0,
      hm_akhir: parseFloat(hmAkhir) || 0,
      total_hm: parseFloat(totalHm.toFixed(2)),
      jam_kerja_unit: parseFloat(jamKerjaUnit) || 0,
      jam_kerja_mp: parseFloat(jamKerjaMp) || 0,
      pengawas,
      office,
      foto_kertas_hm: fotoKertasHm,
      wh_logs: whLogs
    };
    printHEDailyPDF(record);
  };

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-6">
      
      {/* Role Visual Banner: Operator Alat Berat (Excavator / Bulldozer) */}
      <div className="relative h-40 sm:h-48 rounded-3xl overflow-hidden shadow-lg border border-slate-200">
        <img 
          src="/excavator-mining.webp" 
          alt="Operasional Alat Berat Tambang Batubara PT. LAZ COAL MANDIRI" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent flex items-center p-5 sm:p-7">
          <div className="text-white space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs">
                Role: Operator Alat Berat
              </span>
              <span className="bg-amber-400 text-slate-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                Excavator / Dozer
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
              Time Sheet Heavy Equipment
            </h2>
            <p className="text-xs text-blue-100 font-medium max-w-md">
              Pencatatan Jam Kerja (HM) Excavator & Bulldozer • PT. LAZ COAL MANDIRI (Site Arutmin Kintap)
            </p>
          </div>
        </div>
      </div>

      {/* Title Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3.5">
          <img 
            src="/lcm-logo.png" 
            alt="Logo LCM" 
            className="w-12 h-12 rounded-full object-contain shadow-md border border-slate-200"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Lembar Jam Kerja Alat Berat
              </h2>
              <span className="bg-blue-100 text-[#1e3a8a] text-xs font-bold px-2 py-0.5 rounded-full border border-blue-300">
                DX530LC-7M / EX-623
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
            <Printer className="w-4 h-4 text-[#1e3a8a]" />
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
        <div className="bg-blue-50 border border-blue-300 text-[#1e3a8a] text-xs p-4 rounded-2xl flex items-center space-x-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="font-bold">
            Berhasil! Lembar Time Sheet Alat Berat telah tersimpan ke database & rekap harian.
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
            <Calendar className="w-4 h-4 text-[#1e3a8a]" />
            <h3 className="font-bold text-sm text-slate-800">
              1. Header Informasi Unit & Operator
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Tanggal */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tanggal Operasi:
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] outline-none"
                required
              />
            </div>

            {/* Shift */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Shift Kerja:
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] outline-none"
              >
                <option value="Shift 1 (Siang)">Shift 1 (Siang: 06:00 - 18:00)</option>
                <option value="Shift 2 (Malam)">Shift 2 (Malam: 18:00 - 06:00)</option>
              </select>
            </div>

            {/* Nama Opt (Auto-fill) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama Operator:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={namaOpt}
                  onChange={(e) => setNamaOpt(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-blue-50/60 border border-blue-300 rounded-xl text-[#1e3a8a] outline-none"
                  required
                />
                <UserCheck className="w-3.5 h-3.5 text-blue-600 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* NIK */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                NIK Operator:
              </label>
              <input
                type="text"
                value={nikOpt}
                readOnly
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 outline-none"
              />
            </div>

            {/* Model Unit */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Model Unit:
              </label>
              <input
                type="text"
                list="model-list"
                value={modelUnit}
                onChange={(e) => setModelUnit(e.target.value)}
                placeholder="Contoh: DX530LC-7M"
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] outline-none"
                required
              />
              <datalist id="model-list">
                <option value="DX530LC-7M" />
                <option value="PC2000-8" />
                <option value="CAT 390D" />
                <option value="ZX470LC-5G" />
                <option value="Komatsu D85ESS-2" />
              </datalist>
            </div>

            {/* No Unit / Code */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                No. Unit / Unit Code:
              </label>
              <input
                type="text"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                placeholder="Contoh: EX-623"
                className="w-full text-xs font-mono font-extrabold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#1e3a8a] text-[#1e3a8a] outline-none uppercase"
                required
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

          {/* ========================================================================= */}
          {/* HOUR METER (HM) & TOTAL HM KALKULASI OTOMATIS                             */}
          {/* ========================================================================= */}
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
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 outline-none"
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
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 outline-none"
                required
              />
            </div>

            {/* Kalkulasi Otomatis Total HM */}
            <div className="bg-[#1e3a8a] text-white p-2.5 rounded-xl text-center shadow-xs">
              <span className="block text-[10px] font-medium text-blue-200 uppercase tracking-wider">
                Total HM (Otomatis)
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
        {/* SECTION 2: TABEL JAM KERJA (WH)                                           */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-card border border-slate-200/80 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#1e3a8a]" />
              <h3 className="font-bold text-sm text-slate-800">
                2. Tabel Jam Kerja (WH) & Rincian Kegiatan
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              12 Jam Operasi ({shift})
            </span>
          </div>

          {/* Mobile Swipe Hint */}
          <div className="sm:hidden flex items-center justify-between text-[11px] text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
            <span className="font-semibold flex items-center">👉 Geser tabel ke samping untuk mengisi kolom</span>
            <span className="font-mono text-[10px] bg-blue-200/70 px-1.5 py-0.5 rounded">12 Jam</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-[#1e3a8a] text-white">
                <tr>
                  <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                  <th className="py-2.5 px-3 font-bold w-32">Jam Kerja (WH)</th>
                  <th className="py-2.5 px-3 font-bold">Uraian Kegiatan Operasi</th>
                  <th className="py-2.5 px-3 font-bold">Keterangan Lokasi / Job</th>
                  <th className="py-2.5 px-3 font-bold w-24 text-center">Check Hour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {whLogs.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-2 px-3 text-center font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {row.time}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          list={`act-${idx}`}
                          value={row.kegiatan}
                          onChange={(e) => handleRowChange(idx, 'kegiatan', e.target.value)}
                          placeholder="Pilih / ketik kegiatan"
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-[#1e3a8a] outline-none bg-white font-medium"
                        />
                        <datalist id={`act-${idx}`}>
                          {COMMON_ACTIVITIES.map((act, aIdx) => (
                            <option key={aIdx} value={act} />
                          ))}
                        </datalist>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.keterangan}
                        onChange={(e) => handleRowChange(idx, 'keterangan', e.target.value)}
                        placeholder="Area pit / bench"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-[#1e3a8a] outline-none bg-white"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.check_hour}
                        onChange={(e) => handleRowChange(idx, 'check_hour', e.target.checked)}
                        className="w-4 h-4 rounded text-[#1e3a8a] focus:ring-[#1e3a8a] border-slate-300 cursor-pointer accent-[#1e3a8a]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LAMPIRAN BUKTI FOTO KERTAS HM FISIK (MAKS 4 MB)                           */}
        {/* ========================================================================= */}
        <PaperHMPhotoUpload
          photoValue={fotoKertasHm}
          onPhotoChange={setFotoKertasHm}
          title="Bukti Foto Kertas HM Fisik (Operator Alat Berat)"
          subtitle="Potret lembar kertas timesheet HM fisik Anda atau unggah dari galeri (maks 4 MB) agar admin dapat memantau validitas jam kerja."
          disabled={saving}
        />

        {/* Action Buttons Footer */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrintCurrentPDF}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold py-3 px-6 rounded-2xl border border-slate-300 flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#1e3a8a]" />
            <span>Cetak PDF Lembar Kerja</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-[#1e3a8a] hover:bg-[#172554] text-white text-xs sm:text-sm font-bold py-3 px-8 rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Time Sheet Alat Berat'}</span>
          </button>
        </div>

      </form>

      {/* ========================================================================= */}
      {/* MODAL SUKSES SIMPAN & OTOMATIS LOGOUT                                     */}
      {/* ========================================================================= */}
      {autoLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-[#1e3a8a] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-blue-600 animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="bg-blue-100 text-[#1e3a8a] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Tersimpan Komplit & Terdata di Admin
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Time Sheet Berhasil Disimpan!
              </h3>
              <p className="text-xs text-slate-500">
                Terima kasih atas kerja keras Anda hari ini, <strong>{namaOpt}</strong>.
              </p>
            </div>

            {/* Ringkasan Data HM */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-left font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Unit:</span>
                <span className="font-mono font-bold text-[#1e3a8a]">{unitCode} ({modelUnit})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal & Shift:</span>
                <span className="font-semibold text-slate-800">{tanggal} • {shift}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hour Meter (HM):</span>
                <span className="font-mono font-bold text-slate-900">{hmAwal} &rarr; {hmAkhir}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                <span className="text-slate-700">Total HM Logika:</span>
                <span className="font-mono text-blue-700 text-sm">{totalHm.toFixed(2)} Jam</span>
              </div>
              {fotoKertasHm && (
                <div className="flex items-center justify-between text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200 text-[11px] font-bold">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bukti Kertas HM Terlampir</span>
                  </span>
                  <span className="text-[10px] text-emerald-700">Siap Ditinjau Admin</span>
                </div>
              )}
            </div>

            {/* Alert & Countdown Otomatis Logout */}
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs text-amber-950 space-y-1">
              <div className="font-bold flex items-center justify-center space-x-1.5 text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Otomatis Logout dalam: <strong className="text-base text-red-600 font-mono">{countdown}</strong> detik</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Sistem otomatis keluar ke halaman login agar HP aman dan siap digunakan oleh operator shift berikutnya.
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
                <Printer className="w-4 h-4 text-[#1e3a8a]" />
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
