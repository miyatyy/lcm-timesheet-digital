import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  ScanLine, 
  User, 
  CreditCard,
  Sparkles,
  SwitchCamera,
  HelpCircle
} from 'lucide-react';
import { runClientOCR } from '../lib/ocr';

export const OcrScannerModal = ({ 
  isOpen, 
  onClose, 
  onScanComplete, 
  title = 'Scan Kartu Identitas (OCR)',
  mode = 'login' // 'login' | 'register'
}) => {
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (belakang) | 'user' (depan)
  const [capturedImage, setCapturedImage] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [ocrResult, setOcrResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Editable fields after scan
  const [nikInput, setNikInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  // Stop camera tracks safely
  const stopCamera = useCallback(() => {
    if (stream) {
      try {
        stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn('Error stopping track:', e);
      }
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  // Start Camera with resilient fallback constraints
  const startCamera = useCallback(async (targetFacing = 'environment') => {
    try {
      setErrorMessage('');
      
      // Stop existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung WebRTC kamera. Silakan gunakan tombol "Buka Kamera HP (Native)".');
      }

      let newStream = null;
      try {
        // Coba dengan facingMode ideal (belakang untuk scan kartu)
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: targetFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (firstErr) {
        console.warn('Constraint ideal gagal, mencoba akses video generic:', firstErr);
        // Fallback generic video stream
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      setStream(newStream);
      setIsCameraActive(true);
      setFacingMode(targetFacing);
    } catch (err) {
      console.error('Kamera gagal diakses:', err);
      let msg = 'Kamera langsung belum aktif. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Izin kamera ditolak browser. Klik ikon gembok 🔒 di samping link website pada browser Anda, lalu ubah Kamera menjadi "Izinkan / Allow". Atau gunakan tombol Kamera HP di bawah.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Kamera tidak terdeteksi pada perangkat Anda.';
      } else {
        msg += (err.message || '');
      }
      setErrorMessage(msg);
      setIsCameraActive(false);
    }
  }, [stream]);

  // Auto-start camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      // Delay sedikit agar DOM modal siap
      const timer = setTimeout(() => {
        startCamera('environment');
      }, 250);
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setOcrResult(null);
      setErrorMessage('');
      setProgress(0);
    }
  }, [isOpen]);

  // Hubungkan stream ke elemen video saat stream atau isCameraActive berubah
  useEffect(() => {
    if (videoRef.current && stream && isCameraActive) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.warn('Video auto-play suppressed:', e));
    }
  }, [stream, isCameraActive]);

  // Flip Camera (Belakang <-> Depan)
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  };

  // Capture Frame from Video
  const captureFrame = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      stopCamera();
      setCapturedImage(dataUrl);
      processOCR(dataUrl);
    } catch (e) {
      console.error('Gagal mengambil frame foto:', e);
      setErrorMessage('Gagal mengambil foto dari kamera. Silakan coba lagi.');
    }
  };

  // Handle File Input (From native camera or gallery)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCapturedImage(dataUrl);
      processOCR(dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset file input agar bisa dipilih kembali jika perlu
    e.target.value = '';
  };

  // Run Tesseract OCR Process
  const processOCR = async (imageSource) => {
    setOcrLoading(true);
    setErrorMessage('');
    setProgress(5);
    setProgressStatus('Memulai pemrosesan kartu identitas...');

    try {
      const result = await runClientOCR(imageSource, (pct, status) => {
        setProgress(pct);
        setProgressStatus(status);
      });

      if (result.success) {
        setOcrResult(result);
        setNikInput(result.nik || '');
        setNameInput(result.name || '');
        if (!result.nik) {
          setErrorMessage('NIK tidak terbaca otomatis dengan tajam. Anda dapat langsung mengetikkan NIK pada kolom di bawah.');
        }
      } else {
        setErrorMessage(result.error || 'Gagal membaca kartu identitas. Pastikan foto cukup terang.');
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan saat memproses OCR: ' + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  // Submit result back
  const handleConfirm = () => {
    if (!nikInput.trim()) {
      setErrorMessage('NIK wajib terisi!');
      return;
    }
    onScanComplete({
      nik: nikInput.trim(),
      name: nameInput.trim(),
      rawText: ocrResult?.rawText || ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="bg-[#0F5132] px-4 sm:px-5 py-3.5 text-white flex justify-between items-center shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700/80 flex items-center justify-center text-amber-400 shadow-inner">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">{title}</h3>
              <p className="text-[10px] sm:text-[11px] text-emerald-200">
                Deteksi Otomatis NIK KTP / Kartu Pegawai
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1.5 rounded-xl hover:bg-emerald-800 transition cursor-pointer"
            title="Tutup Scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          
          {/* Instruksi Pengambilan Foto */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] sm:text-xs">
              <span className="font-bold text-[#0F5132]">Tips Cepat:</span> Posisikan kartu KTP/ID pas di dalam bingkai kotak kuning, pastikan pencahayaan cukup dan angka NIK terlihat tajam.
            </div>
          </div>

          {/* Area Kamera Langsung (Live Viewfinder) */}
          {isCameraActive && (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-[#0F5132] shadow-md">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
              />
              
              {/* ID Card Target Frame Overlay */}
              <div className="absolute inset-x-6 inset-y-4 sm:inset-x-8 sm:inset-y-6 border-2 border-dashed border-amber-400 rounded-2xl pointer-events-none flex flex-col justify-between p-2 shadow-inner">
                <span className="text-[9px] sm:text-[10px] text-amber-300 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-md self-start font-mono font-bold">
                  BINGKAI KARTU IDENTITAS
                </span>
                <span className="text-[9px] sm:text-[10px] text-white bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-md self-center font-semibold">
                  Arahkan NIK ke tengah kotak ini
                </span>
              </div>

              {/* Top Controls: Flip Camera Button */}
              <div className="absolute top-2 right-2 flex space-x-1.5">
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-xl backdrop-blur-xs transition flex items-center space-x-1 text-[11px] font-bold cursor-pointer"
                  title="Ganti Kamera Depan / Belakang"
                >
                  <SwitchCamera className="w-4 h-4 text-amber-300" />
                  <span className="hidden sm:inline">Putar Kamera</span>
                </button>
              </div>

              {/* Bottom Snap Controls */}
              <div className="absolute bottom-2.5 inset-x-0 flex justify-center items-center space-x-2.5 px-3">
                <button
                  type="button"
                  onClick={captureFrame}
                  className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-900 font-black text-xs sm:text-sm px-6 py-2.5 rounded-full flex items-center space-x-2 shadow-xl transition cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-slate-900" />
                  <span>Ambil Foto</span>
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="bg-black/70 hover:bg-black/90 text-white text-xs px-3.5 py-2.5 rounded-full backdrop-blur-xs transition cursor-pointer font-bold"
                >
                  Tutup Kamera
                </button>
              </div>
            </div>
          )}

          {/* Fallback & Option Buttons jika Kamera belum aktif atau ditutup */}
          {!isCameraActive && !capturedImage && (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* 1. Buka Kamera Langsung WebRTC */}
                <button
                  type="button"
                  onClick={() => startCamera('environment')}
                  className="flex items-center space-x-3 p-3.5 rounded-2xl border-2 border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-[#0F5132] font-bold text-xs transition cursor-pointer shadow-xs active:scale-98"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0F5132] text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-black">Buka Kamera Langsung</span>
                    <span className="text-[10px] text-emerald-800 font-normal">Kamera HP / Webcam</span>
                  </div>
                </button>

                {/* 2. Shutter Kamera Asli HP (Paling Stabil di HP Android & iPhone) */}
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="flex items-center space-x-3 p-3.5 rounded-2xl border-2 border-amber-500 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs transition cursor-pointer shadow-xs active:scale-98"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center shrink-0 shadow-sm">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-black">Foto dengan Kamera HP</span>
                    <span className="text-[10px] text-amber-800 font-normal">Buka aplikasi kamera bawaan</span>
                  </div>
                </button>

              </div>

              {/* 3. Tombol Galeri */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>Pilih Foto KTP yang Sudah Ada di Galeri HP</span>
              </button>

              {/* Hidden Inputs untuk File & Native Camera */}
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {/* Captured Preview & Processing Status */}
          {capturedImage && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 max-h-52 border border-slate-200 flex items-center justify-center">
                <img 
                  src={capturedImage} 
                  alt="Kartu Identitas" 
                  className="w-full h-52 object-contain" 
                />
                {!ocrLoading && (
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      setOcrResult(null);
                      setErrorMessage('');
                      startCamera('environment');
                    }}
                    className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 backdrop-blur-xs transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Foto Ulang</span>
                  </button>
                )}
              </div>

              {/* OCR Progress Bar */}
              {ocrLoading && (
                <div className="space-y-2 bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-950">
                    <span className="flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0F5132]" />
                      <span>{progressStatus || 'Menganalisis NIK Kartu...'}</span>
                    </span>
                    <span className="text-[#0F5132] font-mono text-sm">{progress}%</span>
                  </div>
                  <div className="w-full bg-emerald-200/60 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-[#0F5132] h-3 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Hasil Deteksi & Kolom Validasi / Edit Manual */}
          {ocrResult && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-extrabold text-[#0F5132]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Hasil Ekstraksi OCR (Bisa Diedit Jika Ada Angka Kurang Pas):</span>
              </div>

              {/* Input NIK */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nomor Induk Kependudukan (NIK) / No ID Karyawan:
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={nikInput}
                    onChange={(e) => setNikInput(e.target.value)}
                    placeholder="Contoh: 6301010101880001 atau OPT-62301"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold bg-white rounded-xl border border-slate-300 focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132] outline-none"
                  />
                </div>
              </div>

              {/* Input Nama Lengkap (Terutama saat registrasi) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Lengkap Sesuai Kartu:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Nama Lengkap Karyawan"
                      className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white rounded-xl border border-slate-300 focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-4 sm:px-5 py-3 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>

          {ocrResult && (
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-[#0F5132] hover:bg-[#0a3622] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>{mode === 'login' ? 'Gunakan NIK & Masuk' : 'Gunakan Data Ini'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
