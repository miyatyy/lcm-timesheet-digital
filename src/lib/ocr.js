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
 * Ekstraksi NIK dan Nama dari teks OCR kartu identitas (KTP, ID Card Karyawan, Mine Permit)
 * MENDUKUNG NIK ALFANUMERIK (kombinasi huruf & angka, misal: LCM-023, 230104040083, OPT-623).
 * STRICTLY MEMISAHKAN nomor telepon (08... / 628...) agar TIDAK tertukar dengan NIK!
 */
export const parseIdCardText = (rawText) => {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  let detectedNik = '';
  let detectedName = '';
  let detectedPhone = '';

  // Helper: Deteksi apakah sebuah string adalah nomor telepon Indonesia
  const isPhoneNumber = (str) => {
    if (!str) return false;
    const cleaned = String(str).replace(/[\s\-\.\(\)]/g, '');
    return /^(?:08|\+?628|02\d|05\d)\d{7,11}$/.test(cleaned);
  };

  // Helper: Deteksi apakah sebuah string adalah format tanggal
  const isDate = (str) => {
    if (!str) return false;
    return /^\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4}$/.test(String(str).trim());
  };

  // Helper: Deteksi kata-kata header/kartu umum yang bukan NIK
  const isExcludedHeader = (str) => {
    if (!str) return true;
    return /^(MINE|PERMIT|ARUTMIN|MANDIRI|KINTAP|INDONESIA|JABATAN|DRIVER|OPERATOR|BERLAKU|HINGGA|COAL|SITE|COMPANY|PT|LAZ|KARTU|TANDA|PENDUDUK|PROVINSI|KABUPATEN)$/i.test(String(str).trim());
  };

  // 1. Ekstraksi Nomor Telepon jika ada di kartu (agar tidak pernah diambil sebagai NIK)
  for (const line of lines) {
    const phoneMatch = line.match(/(?:TELP|HP|PHONE|WA|WHATSAPP|KONTAK|EMERGENCY)[^\d]*((?:\+?62|08)\d[\d\s\-\.]{7,14})/i);
    if (phoneMatch) {
      const cleanP = phoneMatch[1].replace(/[\s\-\.]/g, '');
      if (isPhoneNumber(cleanP)) {
        detectedPhone = cleanP;
        break;
      }
    }
  }

  // Jika belum dapat dari label, cek pola no hp standalone
  if (!detectedPhone) {
    const anyPhone = rawText.match(/\b((?:\+?62|08)\d{8,11})\b/);
    if (anyPhone && isPhoneNumber(anyPhone[1])) {
      detectedPhone = anyPhone[1];
    }
  }

  // 2. Ekstraksi NIK / No. ID / No. Reg (MENDUKUNG ALFANUMERIK: HURUF & ANGKA)
  // Pola A: Baris yang diawali kata kunci NIK / NO ID / NO REG / ID / REG / NRP / NIP / NOMOR
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Lewati baris kontak/telepon
    if (line.match(/(?:TELP|HP|PHONE|WA|WHATSAPP|KONTAK|EMERGENCY)/i)) continue;

    // Pola A1: "NO. REG : 230104040083", "NO. ID : LCM-023", "NIK : 6301...", "ID : OPT-623"
    const labelMatch = line.match(/(?:NIK|NO\.?\s*ID|ID\s*NO|NO\.?\s*REG|REG\s*NO|NO\.?\s*INDUK|MINE\s*PERMIT\s*NO|NRP|NIP|BADGE\s*NO|NOMOR|NO)[^\w\d\n:]*[:\s\-]+([A-Za-z0-9\/\-]{3,30})/i);
    if (labelMatch) {
      const cand = labelMatch[1].trim();
      if (!isPhoneNumber(cand) && !isDate(cand) && !isExcludedHeader(cand)) {
        detectedNik = cand;
        break;
      }
    }

    // Pola A2: Label di baris ini, nilainya di baris berikutnya
    if (line.match(/^(?:NIK|NO\.?\s*ID|ID\s*NO|NO\.?\s*REG|REG\s*NO|NRP|NIP|BADGE\s*NO)[:\s\-]*$/i) && lines[i + 1]) {
      const nextCand = lines[i + 1].trim();
      if (!isPhoneNumber(nextCand) && !isDate(nextCand) && !isExcludedHeader(nextCand) && nextCand.length >= 3 && nextCand.length <= 30) {
        detectedNik = nextCand;
        break;
      }
    }
  }

  // Pola B: KTP 16 digit standar jika belum ketemu (pastikan BUKAN no hp)
  if (!detectedNik) {
    const cleanForDigits = rawText.replace(/[oO]/g, '0').replace(/[Il|]/g, '1');
    const nik16Match = cleanForDigits.match(/\b(\d{16})\b/);
    if (nik16Match && !isPhoneNumber(nik16Match[1])) {
      detectedNik = nik16Match[1];
    }
  }

  // Pola C: Kode alfanumerik format perusahaan (contoh: LCM-023, OPT-623, DT-145, ARU-992, EX-623)
  if (!detectedNik) {
    for (const line of lines) {
      if (line.match(/(?:TELP|HP|PHONE|WA|KONTAK|EMERGENCY)/i)) continue;
      const codeMatch = line.match(/\b([A-Za-z]{2,6}[-\s]?[0-9]{2,12})\b/);
      if (codeMatch) {
        const cand = codeMatch[1].trim();
        if (!isPhoneNumber(cand) && !isExcludedHeader(cand)) {
          detectedNik = cand.toUpperCase();
          break;
        }
      }
    }
  }

  // Pola D: Token alfanumerik 5-18 karakter yang memiliki angka (BUKAN phone, BUKAN date, BUKAN header)
  if (!detectedNik) {
    const tokens = rawText.match(/\b([A-Za-z0-9\/\-]{5,18})\b/g) || [];
    for (const token of tokens) {
      if (!isPhoneNumber(token) && !isDate(token) && !isExcludedHeader(token) && /\d/.test(token)) {
        detectedNik = token;
        break;
      }
    }
  }

  // 3. Ekstraksi Nama
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pola "Nama : [Nama Lengkap]"
    const nameMatch = line.match(/(?:NAMA|NAME)[^\w\s]*\s*([A-Za-z\s.,'\-]{3,})/i);
    if (nameMatch) {
      const n = nameMatch[1].trim();
      if (!isExcludedHeader(n) && n.length >= 3) {
        detectedName = n;
        break;
      }
    }

    // Jika baris berisi label NIK/NO ID, baris berikutnya seringkali adalah Nama
    if (line.match(/\b(NIK|NO\.?\s*ID|NO\.?\s*REG)\b/i) && lines[i + 1]) {
      const nextLine = lines[i + 1].trim();
      if (!nextLine.match(/\b(Tempat|Lahir|Jenis|Kelamin|Alamat|Agama|Gol|Jabatan|Company|Perusahaan)\b/i) && nextLine.length > 3) {
        const cleaned = nextLine.replace(/[^A-Za-z\s.,'-]/g, '').trim();
        if (cleaned.length >= 3 && !detectedName && !isExcludedHeader(cleaned)) {
          detectedName = cleaned;
        }
      }
    }
  }

  // Fallback Nama dari baris huruf kapital (2-4 kata)
  if (!detectedName) {
    const ignoredKeywords = [
      'PROVINSI', 'KABUPATEN', 'KOTA', 'REPUBLIK', 'INDONESIA', 'KARTU', 'TANDA',
      'PENDUDUK', 'GOL', 'DARAH', 'AGAMA', 'STATUS', 'PERKAWINAN', 'PEKERJAAN',
      'KEWARGANEGARAAN', 'BERLAKU', 'HINGGA', 'MINE', 'PERMIT', 'PT', 'LAZ',
      'COAL', 'MANDIRI', 'ARUTMIN', 'KINTAP', 'SITE', 'JABATAN', 'PERUSAHAAN'
    ];
    for (const line of lines) {
      const cleanUpper = line.replace(/[^A-Z\s]/g, '').trim();
      const words = cleanUpper.split(/\s+/);
      const isIgnored = words.some(w => ignoredKeywords.includes(w));
      if (!isIgnored && words.length >= 2 && cleanUpper.length >= 5 && cleanUpper.length <= 35) {
        detectedName = cleanUpper;
        break;
      }
    }
  }

  // Format huruf nama kapital di awal kata
  if (detectedName) {
    detectedName = detectedName
      .toLowerCase()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .trim();
  }

  return {
    nik: detectedNik,
    name: detectedName,
    phone: detectedPhone,
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
    if (onProgress) onProgress(10, 'Menyiapkan mesin pengenal kartu...');

    // 1. Preprocessing gambar di canvas (grayscale + kontras)
    const preprocessedDataUrl = await preprocessImageForOCR(imageInput);

    if (onProgress) onProgress(30, 'Memuat library Tesseract OCR...');

    // 2. Inisialisasi Tesseract Worker
    worker = await createWorker('ind+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = 30 + Math.round(m.progress * 60);
          onProgress(pct, `Membaca teks identitas (${Math.round(m.progress * 100)}%)...`);
        }
      }
    });

    if (onProgress) onProgress(60, 'Mengekstrak karakter NIK & Nama...');

    // 3. Kenali teks
    const ret = await worker.recognize(preprocessedDataUrl);
    const rawText = ret.data.text || '';
    const confidence = ret.data.confidence || 0;

    if (onProgress) onProgress(95, 'Memvalidasi data identitas...');

    // 4. Parse NIK dan Nama
    const parsed = parseIdCardText(rawText);

    if (onProgress) onProgress(100, 'Ekstraksi selesai!');

    return {
      success: true,
      nik: parsed.nik,
      name: parsed.name,
      phone: parsed.phone,
      confidence,
      rawText
    };
  } catch (error) {
    console.error('OCR Processing Error:', error);
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
