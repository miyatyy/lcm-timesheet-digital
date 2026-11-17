import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  ZoomIn, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FileText
} from 'lucide-react';
import { processPaperHMPhoto } from '../lib/imageUpload';

export const PaperHMPhotoUpload = ({ 
  photoValue, 
  onPhotoChange, 
  title = "Bukti Foto Kertas HM Fisik",
  subtitle = "Lampirkan foto kertas timesheet HM / slip ritase fisik Anda agar Admin Site dapat memverifikasi pekerjaan.",
  disabled = false 
}) => {
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [photoInfo, setPhotoInfo] = useState(null);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input agar pemotretan/pemilihan berikutnya bisa dipicu lagi
    e.target.value = '';

    setProcessing(true);
    setErrorMsg('');

    try {
      const res = await processPaperHMPhoto(file);
      onPhotoChange(res.dataUrl);
      setPhotoInfo({
        name: res.originalName,
        origSizeKB: Math.round(res.originalSize / 1024),
        compSizeKB: Math.round(res.compressedSize / 1024)
      });
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses foto.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemovePhoto = () => {
    onPhotoChange('');
    setPhotoInfo(null);
    setErrorMsg('');
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-start space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#1e3a8a] flex items-center justify-center font-bold shrink-0 mt-0.5">
            <FileText className="w-5 h-5 text-[#1e3a8a]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                {title}
              </h4>
              <span className="bg-blue-100 text-[#1e3a8a] text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                Maks 4 MB
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        {photoValue && (
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 self-start sm:self-auto shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Foto Terlampir</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-2xl flex items-start space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Hidden File Inputs */}
      {/* 1. Kamera HP Langsung */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
        disabled={disabled || processing}
      />

      {/* 2. Galeri / File Picker */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
        disabled={disabled || processing}
      />

      {/* Tampilan Jika Belum Ada Foto */}
      {!photoValue ? (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center space-y-3 bg-white/70 hover:bg-white transition">
            <div className="flex items-center justify-center space-x-3 text-slate-400">
              <Camera className="w-7 h-7 text-blue-600" />
              <span className="text-slate-300">|</span>
              <ImageIcon className="w-7 h-7 text-amber-500" />
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-extrabold text-slate-800">
                Pilih Metode Pengambilan Bukti Fisik HM
              </p>
              <p className="text-[11px] text-slate-500">
                Bisa potret langsung lembar kertas HM dengan kamera HP atau pilih dari galeri berkas.
              </p>
            </div>

            {/* Tombol Kamera & Galeri */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={disabled || processing}
                className="bg-[#1e3a8a] hover:bg-[#172554] active:scale-98 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Camera className="w-4 h-4 text-amber-300" />
                )}
                <span>Ambil Foto (Kamera HP)</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={disabled || processing}
                className="bg-white hover:bg-slate-100 active:scale-98 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 shadow-2xs transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Pilih dari Galeri (Maks 4 MB)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Tampilan Jika Foto Sudah Terpilih */
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* Thumbnail */}
            <div 
              onClick={() => setPreviewOpen(true)}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs cursor-pointer group shrink-0"
              title="Klik untuk melihat foto ukuran penuh"
            >
              <img 
                src={photoValue} 
                alt="Pratinjau Kertas HM" 
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                <ZoomIn className="w-5 h-5" />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <span>Foto Kertas HM Berhasil Diunggah</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </h5>
              <p className="text-[11px] text-slate-500">
                {photoInfo ? `Ukuran: ${photoInfo.compSizeKB} KB (Asli: ${photoInfo.origSizeKB} KB)` : 'Format JPEG terkompresi'}
              </p>
              <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono inline-block">
                Tersimpan & Siap Dipantau Admin
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="bg-blue-50 hover:bg-blue-100 text-[#1e3a8a] font-bold text-xs px-3 py-2 rounded-xl border border-blue-200 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Lihat Foto</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
              title="Ganti dengan foto lain"
            >
              Ganti
            </button>

            <button
              type="button"
              onClick={handleRemovePhoto}
              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs p-2 rounded-xl border border-red-200 transition cursor-pointer"
              title="Hapus foto ini"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Pratinjau Foto Ukuran Penuh */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#1e3a8a] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-300" />
                <h4 className="font-extrabold text-xs sm:text-sm">
                  Pratinjau Bukti Foto Kertas HM Fisik
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="p-4 bg-slate-950 flex items-center justify-center overflow-auto flex-1 max-h-[70vh]">
              <img 
                src={photoValue} 
                alt="Foto Kertas HM Fisik" 
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg select-none"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>Pastikan tulisan jam kerja, nomor unit, dan tanda tangan terbaca jelas.</span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="bg-[#1e3a8a] text-white font-bold px-4 py-1.5 rounded-xl hover:bg-[#172554] transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
