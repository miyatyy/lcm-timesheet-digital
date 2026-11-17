/**
 * Helper pemrosesan & validasi foto bukti kertas HM fisik.
 * Ketentuan:
 * 1. Mendukung kamera HP langsung dan unggah dari galeri/berkas.
 * 2. Membatasi ukuran berkas maksimum 4 MB (sesuai instruksi user).
 * 3. Mengompresi gambar di memori canvas secara otomatis agar tulisan pena/pensil tetap tajam
 *    namun ukuran berkas ringan dan cepat dimuat oleh Admin.
 */
export const processPaperHMPhoto = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Berkas foto tidak ditemukan'));
    }

    // Validasi format gambar
    if (!file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Format berkas tidak valid. Harap pilih berkas foto (JPG, PNG, atau WEBP).'));
    }

    // Batas maksimum upload: 4 MB (4 * 1024 * 1024 bytes)
    const MAX_SIZE_BYTES = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return reject(new Error(`Ukuran foto (${sizeMB} MB) melebihi batas maksimum 4 MB. Silakan gunakan foto yang lebih kecil atau potret langsung dengan kamera HP.`));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Optimal dimensi maksimal 1600px: menjaga setiap angka dan tanda tangan jelas terbaca
        const maxDim = 1600;
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

        // Render ke canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke format JPEG dengan kualitas tinggi 0.82 (tulisan kertas tajam)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const approxSizeBytes = Math.round((compressedDataUrl.length * 3) / 4);

        resolve({
          dataUrl: compressedDataUrl,
          originalName: file.name,
          originalSize: file.size,
          compressedSize: approxSizeBytes
        });
      };

      img.onerror = () => reject(new Error('Gagal memproses gambar foto. Pastikan berkas foto tidak rusak.'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Gagal membaca berkas dari perangkat.'));
    reader.readAsDataURL(file);
  });
};
