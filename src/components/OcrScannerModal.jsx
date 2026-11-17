import React, { useState, useRef, useEffect } from 'react';
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
  Sparkles
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

  // Stop camera when closing
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setOcrResult(null);
      setErrorMessage('');
      setProgress(0);
    }
  }, [isOpen]);

  // Start Camera
  const startCamera = async () => {
    try {
      setErrorMessage('');
      stopCamera();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' }, // Camera belakang HP
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Gagal akses kamera langsung, gunakan upload foto:', err);
      setErrorMessage('Kamera langsung tidak dapat diakses (izin ditolak atau di desktop). Silakan pilih opsi "Upload / Foto via Galeri HP".');
      setIsCameraActive(false);
    }
  };

  // Capture Frame from Video
  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();
    setCapturedImage(dataUrl);
    processOCR(dataUrl);
  };

  // Handle File Input (From phone camera / storage)
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
          setErrorMessage('NIK tidak terbaca jelas secara otomatis. Anda dapat mengetikkan atau memperbaiki NIK secara manual di kotak bawah.');
        }
      } else {
        setErrorMessage(result.error || 'Gagal membaca kartu identitas. Pastikan foto terang dan tidak silau.');
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="bg-[#0F5132] px-5 py-4 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-amber-400">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{title}</h3>
              <p className="text-[11px] text-emerald-200">
                Pemrosesan aman Client-Side Tesseract.js (Tanpa simpan foto)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Instruksi Pengambilan Foto */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Tips Hasil Scan Jelas:</span> Posisikan Kartu Karyawan atau KTP pas di dalam frame, hindari pantulan cahaya/lampu, dan pastikan deretan angka NIK terlihat fokus.
            </div>
          </div>

          {/* Action Buttons: Live Camera or Upload */}
          {!isCameraActive && !capturedImage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={startCamera}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-[#0F5132]/40 bg-emerald-50/50 hover:bg-emerald-50 text-[#0F5132] font-semibold text-xs transition cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-[#0F5132] text-white flex items-center justify-center mb-2 group-hover:scale-105 transition shadow-sm">
                  <Camera className="w-6 h-6 text-amber-400" />
                </div>
                <span>Buka Kamera Langsung</span>
                <span className="text-[10px] text-slate-500 mt-1">Kamera HP / Webcam</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition shadow-sm">
                  <Upload className="w-6 h-6 text-emerald-300" />
                </div>
                <span>Pilih Foto dari Galeri</span>
                <span className="text-[10px] text-slate-500 mt-1">Unggah KTP / ID Card</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {/* Live Video Camera Stream */}
          {isCameraActive && (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-[#0F5132]">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
              />
              
              {/* ID Card Target Frame Overlay */}
              <div className="absolute inset-x-8 inset-y-6 border-2 border-dashed border-amber-400 rounded-xl pointer-events-none flex flex-col justify-between p-2 shadow-inner">
                <span className="text-[10px] text-amber-300 bg-black/60 px-2 py-0.5 rounded self-start font-mono">
                  Area Kartu Identitas
                </span>
                <span className="text-[10px] text-white bg-black/60 px-2 py-0.5 rounded self-center">
                  Sejajarkan NIK di dalam kotak ini
                </span>
              </div>

              {/* Bottom Snap Button */}
              <div className="absolute bottom-3 inset-x-0 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={captureFrame}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs px-5 py-2.5 rounded-full flex items-center space-x-1.5 shadow-lg active:scale-95 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-2 rounded-full transition"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Captured Preview & Processing Status */}
          {capturedImage && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-slate-100 max-h-48 border border-slate-200 flex items-center justify-center">
                <img 
                  src={capturedImage} 
                  alt="Kartu Identitas" 
                  className="w-full h-48 object-contain" 
                />
                {!ocrLoading && (
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      setOcrResult(null);
                      setErrorMessage('');
                    }}
                    className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded-lg flex items-center space-x-1 backdrop-blur-xs transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Foto Ulang</span>
                  </button>
                )}
              </div>

              {/* OCR Progress Bar */}
              {ocrLoading && (
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span className="flex items-center space-x-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0F5132]" />
                      <span>{progressStatus || 'Sedang memproses OCR...'}</span>
                    </span>
                    <span className="text-[#0F5132] font-mono">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-[#0F5132] h-2.5 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Hasil Deteksi & Kolom Validasi / Edit Manual */}
          {ocrResult && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#0F5132]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Hasil Ekstraksi OCR (Bisa Diedit Jika Ada Huruf Kurang Pas):</span>
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
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-xl transition"
          >
            Tutup
          </button>

          {ocrResult && (
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-[#0F5132] hover:bg-[#0a3622] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition cursor-pointer"
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
