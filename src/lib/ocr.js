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
 * Ekstraksi NIK dan Nama dari teks OCR kartu identitas / KTP / ID Card karyawan
 */
export const parseIdCardText = (rawText) => {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  let detectedNik = '';
  let detectedName = '';

  // 1. Regex pencarian NIK (16 digit angka KTP atau kode karyawan seperti OPT-62301 / DT-14501 / digit 6-16)
  // Menghandle OCR yang salah membaca O jadi 0, I/l jadi 1, B jadi 8
  const cleanForDigits = rawText.replace(/[oO]/g, '0').replace(/[Il|]/g, '1');
  
  // 16 digit KTP standar
  const nik16Match = cleanForDigits.match(/\b(\d{16})\b/);
  if (nik16Match) {
    detectedNik = nik16Match[1];
  } else {
    // Cari baris yang mengandung kata 'NIK' atau 'NO'
    for (const line of lines) {
      const nikLineMatch = line.match(/(?:NIK|NOMOR|NO|ID)[^\d]*(\d{6,16})/i);
      if (nikLineMatch) {
        detectedNik = nikLineMatch[1];
        break;
      }
      // Kode ID Card karyawan misal OPT-123 atau DT-456
      const empCodeMatch = line.match(/\b(OPT-\d+|DT-\d+|LCM-\d+|EX-\d+)\b/i);
      if (empCodeMatch) {
        detectedNik = empCodeMatch[1].toUpperCase();
        break;
      }
    }
    // Jika masih belum ketemu, cari deretan angka 8-16 digit terpanjang
    if (!detectedNik) {
      const anyNumber = cleanForDigits.match(/\b(\d{8,16})\b/);
      if (anyNumber) {
        detectedNik = anyNumber[1];
      }
    }
  }

  // 2. Pencarian Nama
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pola "Nama : [Nama Lengkap]"
    const nameMatch = line.match(/(?:NAMA|NAME)[^\w\s]*\s*([A-Za-z\s.,'\-]{3,})/i);
    if (nameMatch) {
      detectedName = nameMatch[1].trim();
      break;
    }

    // Jika baris berisi kata NIK, seringkali baris berikutnya adalah nama
    if (line.match(/\bNIK\b/i) && lines[i + 1]) {
      const nextLine = lines[i + 1].trim();
      if (!nextLine.match(/\b(Tempat|Lahir|Jenis|Kelamin|Alamat|Agama|Gol)\b/i) && nextLine.length > 3) {
        // Bersihkan karakter non-huruf
        const cleaned = nextLine.replace(/[^A-Za-z\s.,'-]/g, '').trim();
        if (cleaned.length >= 3 && !detectedName) {
          detectedName = cleaned;
        }
      }
    }
  }

  // Jika nama masih kosong, cari baris huruf kapital yang bukan judul KTP/Provinsi
  if (!detectedName) {
    const ignoredKeywords = ['PROVINSI', 'KABUPATEN', 'KOTA', 'REPUBLIK', 'INDONESIA', 'KARTU', 'TANDA', 'PENDUDUK', 'GOL', 'DARAH', 'AGAMA', 'STATUS', 'PERKAWINAN', 'PEKERJAAN', 'KEWARGANEGARAAN', 'BERLAKU', 'HINGGA'];
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
