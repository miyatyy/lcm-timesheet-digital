# LCM TimeSheet Digital - PT. LAZ COAL MANDIRI
### Site Arutmin Indonesia, Kintap, Kalimantan Selatan

Aplikasi web modern, responsif, dan siap pakai untuk pencatatan jam kerja (*Hour Meter / HM*), kegiatan operasional, dan ritase alat berat (*Heavy Equipment*) serta *Dump Truck*.

---

## 🛠️ Tech Stack & Library
- **Frontend Framework:** React 19 (Vite) + Tailwind CSS v4 + Lucide Icons.
- **Database:** Supabase (PostgreSQL Free Tier) dengan mode hibrida *Offline LocalStorage Fallback* (dapat langsung dites tanpa konfigurasi awal).
- **Client-Side OCR:** `tesseract.js` (memproses foto KTP/ID Card langsung di browser HP tanpa upload gambar ke server database untuk menghemat storage & menjaga privasi).
- **Export & Cetak Laporan:**
  - `jspdf` & `jspdf-autotable`: Cetak lembar PDF harian ber-kop surat resmi & buku arsip PDF bulanan.
  - `xlsx` (SheetJS): Export tabel `DATABASE HM UNIT` dan rekap ritase ke Excel `.xlsx`.
  - `docx`: Export laporan resmi ke Microsoft Word `.docx`.
  - `canvas-confetti`: Efek visual interaktif saat login & simpan form.

---

## 🚀 Cara Menjalankan Aplikasi

1. **Jalankan Aplikasi Development:**
   ```bash
   npm run dev
   ```
   Buka URL: `http://localhost:5173/` di browser PC atau HP (pastikan satu jaringan WiFi yang sama untuk akses dari HP).

2. **Build Versi Produksi:**
   ```bash
   npm run build
   npm run preview
   ```

---

## 🔑 Akun Demo Siap Pakai

Tersedia tombol demo 1-klik di halaman login untuk pengujian cepat:
- **Operator Alat Berat:** NIK `6301010101880001` / Password: `fauzi123` (Ahmad Fauzi)
- **Driver Dump Truck:** NIK `6301010202890002` / Password: `bambang123` (Bambang Sugiono)
- **Super Admin Site:** NIK `ADMIN01` / Password: `admin123`

---

## 📋 Fitur Utama Aplikasi

### 1. Registrasi Mandiri Karyawan (Self-Registration) & Validasi OCR
- Karyawan tidak perlu diinput satu per satu oleh Admin.
- Karyawan memfoto KTP / ID Card menggunakan kamera HP.
- `tesseract.js` membaca dan mengekstrak **NIK** dan **Nama Lengkap** secara otomatis (dapat dikoreksi manual jika foto kurang fokus).
- Karyawan memilih jabatan (`Operator Alat Berat` atau `Driver Dump Truck`) dan membuat password sendiri.
- Kolom NIK di tabel `employees` terkunci unik (`UNIQUE`), menolak pendaftaran ganda.

### 2. Dua Metode Login
- **Metode 1: Scan Kartu Identitas (OCR Cepat - Langsung Masuk Tanpa Password):**
  Karyawan memfoto kartu identitas -> sistem membaca NIK -> mencocokkan ke database -> langsung masuk otomatis ke lembar time sheet tanpa perlu mengetik password.
- **Metode 2: Login Manual:**
  Karyawan memasukkan NIK dan Password buatan sendiri.

### 3. Form Time Sheet Alat Berat
- Header: Tanggal, Shift (Siang/Malam), Nama Operator (auto-fill), Model Unit (`DX530LC-7M`, `PC2000-8`, dll), Unit Code (`EX-623`), HM Awal, HM Akhir, Total HM (otomatis terhitung `HM Akhir - HM Awal`), Jam Kerja Unit, Jam Kerja Man Power, Pengawas, Office.
- Tabel Jam Kerja (WH): 12 jam per shift, pilihan kegiatan standar tambang (*P2H, Loading OB, Cleaning, Stok Batu, Standby, Breakdown*), keterangan lokasi front pit, dan centang *Check Hour*.
- Tombol Cetak Lembar Harian PDF langsung berformat resmi siap tanda tangan.

### 4. Form Time Sheet Dump Truck
- Header: Pilihan Pergantian Shift (`I`, `II`, `III`), Tanggal, Shift, Nama Driver (auto-fill), Unit Code (`DT 145`), Model Unit, HM Awal, HM Akhir, Total HM otomatis, Jam Kerja Unit & MP, Pengawas, Office.
- Tabel Ritase Unit: Baris jam `07-08` s/d `17-18`, input kode Excavator pemuat (`EX-623`, `EXA 612`), input ritase per jam, dan kalkulasi otomatis `Total Ritase` (TTL).
- Tabel Jam Kerja (WH) aktivitas hauling batubara / OB.

### 5. Dashboard Admin & Monitoring
- **Tabel Rekap Harian Per Kolom (Format `DATABASE HM UNIT`):**
  Kolom: `Date | Shift | Model Unit | No Unit | HM Awal | HM Akhir | Total HM | Operator 1 | HM Opt 1 | Operator 2 | HM Opt 2 | Operator 3 | HM Opt 3`.
- **Fitur Ekspor Lengkap:**
  - 📄 **Print Out PDF Harian:** Lembar time sheet individual resmi ber-kop PT. LAZ COAL MANDIRI Site Arutmin Kintap.
  - 📊 **Export Excel (`.xlsx`):** Sheet DATABASE HM UNIT dan Rekap Ritase Dump Truck.
  - 📝 **Export Word (`.docx`):** Dokumen laporan formal Microsoft Word.
- **Daftar Karyawan:** Monitoring seluruh karyawan terdaftar dan fitur reset password jika karyawan lupa password.

### 6. Auto-Backup PDF & Auto-Reset Database Setiap Tanggal 1
- **Setiap tanggal 1 awal bulan:**
  1. Sistem mengunduh otomatis 1 file **PDF Rekapan Bulanan Singkat** berisi rekapitulasi seluruh unit HE dan DT bulan lalu.
  2. Menghapus otomatis data lembar kerja bulan sebelumnya (`he_timesheets` dan `dt_timesheets`) agar database Supabase tetap bersih dan ringan.
  3. **PENTING:** Tabel akun karyawan (`employees`) **TIDAK PERNAH DIHAPUS** sehingga 200+ karyawan tidak perlu mendaftar ulang setiap bulan.

---

## 🗄️ Menghubungkan ke Supabase (PostgreSQL Free Tier)

1. Buat proyek baru di [supabase.com](https://supabase.com).
2. Buka menu **SQL Editor**, salin seluruh isi file [`supabase_schema.sql`](file:///d:/project-miya/Website/supabase_schema.sql), lalu klik **Run**.
3. Buka menu **Project Settings &rarr; Data API**, salin **Project URL** dan **Anon public key**.
4. Di aplikasi web:
   - Klik badge **"Local Demo Mode"** di pojok kanan atas navbar (atau tombol Konfigurasi di tab Admin).
   - Masukkan Project URL dan Anon Key &rarr; klik **Tes Koneksi** &rarr; klik **Simpan Konfigurasi**.
   - Sistem akan langsung tersinkronisasi online secara real-time!
