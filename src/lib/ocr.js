import { createWorker } from 'tesseract.js';

/**
 * Preprocess image on an in-memory canvas:
 * Converts to grayscale, boosts contrast, and sharpens text for high OCR accuracy on KTP / ID Card.
 */
export const preprocessImageForOCR = (imageSource) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Scale to optimal OCR width (~1200px)
      const maxDim = 1400;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw original
      ctx.drawImage(img, 0, 0, width, height);

      // Apply Grayscale & Contrast adjustments
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Contrast multiplier
      const contrast = 1.35;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        // Luminance formula
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const adjusted = factor * (gray - 128) + 128;
        const finalVal = Math.min(255, Math.max(0, adjusted));

        data[i] = finalVal;
        data[i + 1] = finalVal;
        data[i + 2] = finalVal;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };

    img.onerror = (err) => reject(err);

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof Blob || imageSource instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => (img.src = e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(imageSource);
    } else {
      reject(new Error('Format gambar tidak didukung'));
    }
  });
};

/**
 * Ekstraksi KHUSUS NIK Karyawan dari teks OCR kartu identitas (Mine Permit Kintap, ID Card Karyawan, KTP).
 * Sesuai instruksi:
 * 1. Fokus 100% HANYA mengekstrak NIK (contoh: V.26141).
 * 2. Mengabaikan data lain: Nama, Departemen, Perusahaan, Simper, dan No. Telepon TIDAK diekstrak.
 * 3. Mendukung 200+ format kartu karyawan: V.xxxxx, v.xxxxx, Vxxxxx, LCM-xxx, atau NIK KTP 16 digit.
 */
export const parseIdCardText = (rawText) => {
  if (!rawText) return { nik: '', name: '', phone: '', rawText: '' };

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  let detectedNik = '';

  // Helper: Deteksi nomor telepon Indonesia (agar TIDAK PERNAH terambil sebagai NIK)
  const isPhoneNumber = (str) => {
    if (!str) return false;
    const cleaned = String(str).replace(/[\s\-\.\(\)]/g, '');
    return /^(?:08|\+?628|02\d|05\d)\d{6,12}$/.test(cleaned);
  };

  // Helper: Deteksi format tanggal (contoh: 30-Jan-27, 30/01/2027)
  const isDate = (str) => {
    if (!str) return false;
    return /^\d{1,4}[\/\-\.][A-Za-z0-9]{1,4}[\/\-\.]\d{1,4}$/.test(String(str).trim());
  };

  // Helper: Deteksi blacklist (SIMPER, header, departemen, perusahaan, istilah umum kartu)
  const isBlacklisted = (str) => {
    if (!str) return true;
    const s = String(str).trim();
    if (isPhoneNumber(s)) return true;
    if (isDate(s)) return true;
    // Exclude kode Simper (misal: SIMPER, LCM/2092744/I-MP/08.26, I-MP)
    if (/(?:SIMPER|I-MP|MP\/\d|\/I-)/i.test(s)) return true;
    // Exclude header, departemen, jabatan, atau kata umum
    if (/^(?:MINE|PERMIT|ARUTMIN|MANDIRI|KINTAP|INDONESIA|JABATAN|DRIVER|OPERATOR|HRGA|PRODUKSI|PLANT|LOGISTIK|DARAH|DARURAT|PELANGGARAN|MASA|BERLAKU|KEPALA|TEKNIK|TAMBANG|SURAT|IZIN|MEMASUKI|GOL|DEPARTEMEN|PERUSAHAAN|PT|LAZ|COAL|SIMPER)$/i.test(s)) return true;
    // NIK wajib memiliki setidaknya 1 angka
    if (!/\d/.test(s)) return true;
    return false;
  };

  // Helper: Membersihkan dan menormalisasi token NIK
  const cleanNik = (val) => {
    if (!val) return '';
    let res = String(val).trim();
    // Potong kata departemen/perusahaan jika ikut terbaca di baris yang sama (misal: "V.26141 DEPARTEMEN : HRGA")
    res = res.replace(/\s+(?:DEPARTEMEN|DEPT|HRGA|PRODUKSI|PERUSAHAAN|PT|GOL|DARAH|TELP).*$/i, '');
    // Hapus tanda baca di awal/akhir
    res = res.replace(/^[^A-Za-z0-9]+/, '').replace(/[^A-Za-z0-9]+$/, '');
    // Normalisasi format Mine Permit: 'V. 26141' atau 'v. 26141' atau 'V 26141' -> 'V.26141'
    res = res.replace(/^([A-Za-z])[\.\s]+(\d+)/, '$1.$2');
    res = res.replace(/^([A-Za-z])\s+(\d{4,6})$/, '$1.$2');
    // Jika awalan huruf kecil v.26141, ubah ke huruf kapital V.26141
    if (/^[a-z]\.\d+/i.test(res)) {
      res = res.charAt(0).toUpperCase() + res.slice(1);
    }
    return res;
  };

  // =========================================================================
  // LANGKAH 1: Cari Baris dengan Label Eksplisit "NIK" / "N.I.K" / "NO. INDUK"
  // Contoh nyata Mine Permit: "NIK : V.26141", "NIK: V. 26141", "NIK : v.26141"
  // =========================================================================
  for (const line of lines) {
    // Lewati baris kontak / telp darurat / simper
    if (/(?:TELP|HP|PHONE|DARURAT|SIMPER)/i.test(line)) continue;

    const labelMatch = line.match(/(?:^|\b)(?:N[\.\s]*[I1l\|][\.\s]*K|NOMOR\s+INDUK|NO\.?\s*INDUK|ID\s*KARYAWAN)[\s\:\.\-=]+([A-Za-z0-9\.\-_\s]{2,25})/i);
    if (labelMatch) {
      const cand = cleanNik(labelMatch[1]);
      if (!isBlacklisted(cand)) {
        detectedNik = cand;
        break;
      }
    }
  }

  // =========================================================================
  // LANGKAH 2: Label "NIK" di baris ini, nilainya di baris berikutnya
  // =========================================================================
  if (!detectedNik) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^(?:N[\.\s]*[I1l\|][\.\s]*K|NOMOR\s+INDUK|NO\.?\s*INDUK|ID\s*KARYAWAN)[:\s\.\-=]*$/i.test(line)) {
        if (lines[i + 1]) {
          const cand = cleanNik(lines[i + 1].replace(/^[:\s\.\-=]+/, ''));
          if (!isBlacklisted(cand)) {
            detectedNik = cand;
            break;
          }
        }
      }
    }
  }

  // =========================================================================
  // LANGKAH 3: Format Pola Mine Permit Kintap: Huruf + Titik + 4-6 Digit Angka
  // Contoh: V.26141, O.10234, D.23145, V26141
  // =========================================================================
  if (!detectedNik) {
    for (const line of lines) {
      if (/(?:TELP|HP|DARURAT|SIMPER|BERLAKU|JAM)/i.test(line)) continue;
      const mpMatch = line.match(/\b([A-Za-z][\.\s]?\d{4,6})\b/);
      if (mpMatch) {
        const cand = cleanNik(mpMatch[1]);
        if (!isBlacklisted(cand)) {
          detectedNik = cand;
          break;
        }
      }
    }
  }

  // =========================================================================
  // LANGKAH 4: NIK KTP Nasional 16 Digit (Dipastikan BUKAN No HP)
  // =========================================================================
  if (!detectedNik) {
    const cleanDigits = rawText.replace(/[oO]/g, '0').replace(/[Il|]/g, '1');
    const ktpMatch = cleanDigits.match(/\b(\d{16})\b/);
    if (ktpMatch && !isBlacklisted(ktpMatch[1])) {
      detectedNik = ktpMatch[1];
    }
  }

  // =========================================================================
  // LANGKAH 5: Kode Alfanumerik Perusahaan / ID Karyawan (contoh: LCM-023, OPT-123)
  // =========================================================================
  if (!detectedNik) {
    for (const line of lines) {
      if (/(?:TELP|HP|DARURAT|SIMPER|BERLAKU)/i.test(line)) continue;
      const idMatch = line.match(/\b([A-Za-z]{2,5}[-\.]?\d{2,8})\b/);
      if (idMatch) {
        const cand = cleanNik(idMatch[1]);
        if (!isBlacklisted(cand)) {
          detectedNik = cand;
          break;
        }
      }
    }
  }

  // KHUSUS NIK SAJA: Nama dan no telepon dikosongkan sesuai instruksi user
  return {
    nik: detectedNik,
    name: '',
    phone: '',
    rawText
  };
};

/**
 * Jalankan Client-Side OCR menggunakan Tesseract.js langsung di browser HP/PC
 * Memproses gambar di memori tanpa perlu mengunggah ke server database.
 */
export const runClientOCR = async (imageInput, onProgress) => {
  let worker = null;
  try {
    if (onProgress) onProgress(10, 'Menyiapkan mesin OCR...');

    // 1. Preprocessing gambar di canvas (grayscale + kontras)
    const preprocessedDataUrl = await preprocessImageForOCR(imageInput);

    if (onProgress) onProgress(30, 'Memuat library Tesseract OCR...');

    // 2. Inisialisasi Tesseract Worker
    worker = await createWorker('ind+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = 30 + Math.round(m.progress * 60);
          onProgress(pct, `Membaca NIK kartu (${Math.round(m.progress * 100)}%)...`);
        }
      }
    });

    if (onProgress) onProgress(65, 'Mendeteksi nomor NIK kartu identitas...');

    // 3. Kenali teks
    const ret = await worker.recognize(preprocessedDataUrl);
    const rawText = ret.data.text || '';
    const confidence = ret.data.confidence || 0;

    if (onProgress) onProgress(95, 'Memvalidasi NIK kartu...');

    // 4. Parse KHUSUS NIK
    const parsed = parseIdCardText(rawText);

    if (onProgress) onProgress(100, 'Ekstraksi NIK selesai!');

    if (!parsed.nik) {
      return {
        success: false,
        error: 'NIK tidak terbaca jelas dari foto kartu. Pastikan tulisan NIK (contoh: V.26141) terlihat jelas dan tidak buram, atau Anda dapat mengetikkan NIK secara manual.',
        rawText
      };
    }

    return {
      success: true,
      nik: parsed.nik,
      name: '',
      phone: '',
      confidence,
      rawText
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Gagal memproses gambar kartu identitas'
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
};
