-- ==============================================================================
-- LCM TIMESHEET DIGITAL - DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- PT. LAZ COAL MANDIRI (Site - Arutmin Indonesia, Kintap, Kalimantan Selatan)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Enable pg_cron for automated monthly maintenance (Available on Supabase dashboard)
-- CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- 2. TABLE: EMPLOYEES (Akun Karyawan Mandiri)
-- PENTING: Tabel ini TIDAK PERNAH DIHAPUS saat auto-reset tanggal 1
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nik VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('operator', 'driver', 'admin')),
    jabatan VARCHAR(100) NOT NULL, -- 'Operator Alat Berat' | 'Driver Dump Truck' | 'Admin Site'
    password_hash TEXT NOT NULL,
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Makassar', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Makassar', now())
);

-- Index for instant NIK lookups (Digunakan pada Fast Scan OCR & Login)
CREATE INDEX IF NOT EXISTS idx_employees_nik ON public.employees(nik);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);

-- 3. TABLE: HE_TIMESHEETS (Time Sheet Alat Berat / Heavy Equipment)
CREATE TABLE IF NOT EXISTS public.he_timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    nik VARCHAR(50) NOT NULL,
    nama_opt VARCHAR(255) NOT NULL,
    tanggal DATE NOT NULL,
    shift VARCHAR(50) NOT NULL, -- 'Shift 1 (Siang)' | 'Shift 2 (Malam)'
    model_unit VARCHAR(100) NOT NULL, -- Contoh: DX530LC-7M, PC2000, CAT 390D
    unit_code VARCHAR(50) NOT NULL, -- Contoh: EX-623, EXA 612
    hm_awal NUMERIC(10, 2) NOT NULL,
    hm_akhir NUMERIC(10, 2) NOT NULL,
    total_hm NUMERIC(10, 2) NOT NULL,
    jam_kerja_unit NUMERIC(6, 2) DEFAULT 0,
    jam_kerja_mp NUMERIC(6, 2) DEFAULT 0,
    opt_name VARCHAR(255),
    pengawas VARCHAR(255),
    office VARCHAR(255),
    pergantian VARCHAR(20) DEFAULT 'I',
    foto_kertas_hm TEXT, -- Bukti foto kertas timesheet fisik (Base64 JPEG / Storage URL maks 4MB)
    wh_logs JSONB DEFAULT '[]'::jsonb, -- Detail jam kerja [ { time, kegiatan, keterangan, check_hour } ]
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Makassar', now())
);

CREATE INDEX IF NOT EXISTS idx_he_timesheets_tanggal ON public.he_timesheets(tanggal);
CREATE INDEX IF NOT EXISTS idx_he_timesheets_unit_code ON public.he_timesheets(unit_code);
CREATE INDEX IF NOT EXISTS idx_he_timesheets_nik ON public.he_timesheets(nik);

-- 4. TABLE: DT_TIMESHEETS (Time Sheet Dump Truck)
CREATE TABLE IF NOT EXISTS public.dt_timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    nik VARCHAR(50) NOT NULL,
    nama_opt VARCHAR(255) NOT NULL,
    pergantian VARCHAR(20) NOT NULL, -- 'I' | 'II' | 'III'
    tanggal DATE NOT NULL,
    shift VARCHAR(50) NOT NULL,
    unit_code VARCHAR(50) NOT NULL, -- Contoh: DT 145, DT 210
    model_unit VARCHAR(100) DEFAULT 'Hino 500 / FM 260 JD',
    hm_awal NUMERIC(10, 2) NOT NULL,
    hm_akhir NUMERIC(10, 2) NOT NULL,
    total_hm NUMERIC(10, 2) NOT NULL,
    jam_kerja_unit NUMERIC(6, 2) DEFAULT 0,
    jam_kerja_mp NUMERIC(6, 2) DEFAULT 0,
    opt_name VARCHAR(255),
    pengawas VARCHAR(255),
    office VARCHAR(255),
    foto_kertas_hm TEXT, -- Bukti foto slip ritase / kertas HM fisik (Base64 JPEG / Storage URL maks 4MB)
    wh_logs JSONB DEFAULT '[]'::jsonb, -- Detail jam kerja
    ritase_logs JSONB DEFAULT '[]'::jsonb, -- Detail ritase [ { time, ex_code, count } ]
    total_ritase INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Makassar', now())
);

CREATE INDEX IF NOT EXISTS idx_dt_timesheets_tanggal ON public.dt_timesheets(tanggal);
CREATE INDEX IF NOT EXISTS idx_dt_timesheets_unit_code ON public.dt_timesheets(unit_code);
CREATE INDEX IF NOT EXISTS idx_dt_timesheets_nik ON public.dt_timesheets(nik);

-- 5. TABLE: MONTHLY_BACKUPS (Log Rekap Bulanan PDF)
CREATE TABLE IF NOT EXISTS public.monthly_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_month VARCHAR(20) NOT NULL, -- Format 'YYYY-MM'
    total_he_records INTEGER DEFAULT 0,
    total_dt_records INTEGER DEFAULT 0,
    file_name VARCHAR(255),
    downloaded_by VARCHAR(255) DEFAULT 'System / Admin',
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Makassar', now())
);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.he_timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dt_timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_backups ENABLE ROW LEVEL SECURITY;

-- Allow read/write for client application
DROP POLICY IF EXISTS "Allow all for employees" ON public.employees;
CREATE POLICY "Allow all for employees" ON public.employees
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for he_timesheets" ON public.he_timesheets;
CREATE POLICY "Allow all for he_timesheets" ON public.he_timesheets
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for dt_timesheets" ON public.dt_timesheets;
CREATE POLICY "Allow all for dt_timesheets" ON public.dt_timesheets
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for monthly_backups" ON public.monthly_backups;
CREATE POLICY "Allow all for monthly_backups" ON public.monthly_backups
    FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 7. FUNCTION: AUTO RESET DATABASE BULANAN SETIAP TANGGAL 1
-- Hanya menghapus data transaksi time sheet bulan lalu, TABEL EMPLOYEES TETAP AMAN!
-- ==============================================================================
CREATE OR REPLACE FUNCTION clean_monthly_timesheets()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_he INT := 0;
    deleted_dt INT := 0;
    first_of_current_month DATE;
    prev_month_str VARCHAR(10);
BEGIN
    first_of_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    prev_month_str := TO_CHAR(first_of_current_month - INTERVAL '1 day', 'YYYY-MM');

    -- Hitung dan hapus HE timesheet sebelum tanggal 1 bulan ini
    WITH deleted AS (
        DELETE FROM public.he_timesheets
        WHERE tanggal < first_of_current_month
        RETURNING *
    )
    SELECT count(*) INTO deleted_he FROM deleted;

    -- Hitung dan hapus DT timesheet sebelum tanggal 1 bulan ini
    WITH deleted AS (
        DELETE FROM public.dt_timesheets
        WHERE tanggal < first_of_current_month
        RETURNING *
    )
    SELECT count(*) INTO deleted_dt FROM deleted;

    -- Catat riwayat reset ke tabel monthly_backups
    INSERT INTO public.monthly_backups (backup_month, total_he_records, total_dt_records, file_name, downloaded_by)
    VALUES (
        prev_month_str, 
        deleted_he, 
        deleted_dt, 
        'auto_cleanup_' || prev_month_str || '.pdf', 
        'pg_cron Auto Cleaner'
    );

    RETURN jsonb_build_object(
        'status', 'success',
        'deleted_he', deleted_he,
        'deleted_dt', deleted_dt,
        'month_cleared', prev_month_str
    );
END;
$$;

-- Jadwal pg_cron: Berjalan otomatis setiap tanggal 1 jam 00:05 WITA
-- (Uncomment jika pg_cron extension sudah aktif di dashboard Supabase)
-- SELECT cron.schedule(
--     'monthly-timesheet-cleanup',
--     '5 0 1 * *',
--     $$SELECT clean_monthly_timesheets();$$
-- );

-- ==============================================================================
-- 8. INITIAL SEED DATA (DATA AWAL UNTUK DEMO & ADMIN)
-- ==============================================================================
INSERT INTO public.employees (nik, name, role, jabatan, password_hash)
VALUES
    ('ADMIN01', 'Super Admin Site', 'admin', 'Admin Site', 'admin123'),
    ('6301010101880001', 'Ahmad Fauzi', 'operator', 'Operator Alat Berat', 'fauzi123'),
    ('6301010202890002', 'Bambang Sugiono', 'driver', 'Driver Dump Truck', 'bambang123'),
    ('6301010303900003', 'Rian Hidayat', 'operator', 'Operator Alat Berat', 'rian123'),
    ('6301010404910004', 'Dedi Kurniawan', 'driver', 'Driver Dump Truck', 'dedi123')
ON CONFLICT (nik) DO NOTHING;

-- Sample Time Sheet Alat Berat
INSERT INTO public.he_timesheets 
(nik, nama_opt, tanggal, shift, model_unit, unit_code, hm_awal, hm_akhir, total_hm, jam_kerja_unit, jam_kerja_mp, opt_name, pengawas, office, wh_logs)
VALUES
(
    '6301010101880001', 
    'Ahmad Fauzi', 
    CURRENT_DATE, 
    'Shift 1 (Siang)', 
    'DX530LC-7M', 
    'EX-623', 
    1450.5, 
    1461.2, 
    10.7, 
    10.5, 
    11.0, 
    'Ahmad Fauzi', 
    'Supriyanto', 
    'Dwi Lestari',
    '[
        {"time": "06:00-07:00", "kegiatan": "P2H & Safety Talk", "keterangan": "Unit siap operasi", "check_hour": true},
        {"time": "07:00-08:00", "kegiatan": "Loading OB", "keterangan": "Area Pit Kintap Barat", "check_hour": true},
        {"time": "08:00-09:00", "kegiatan": "Loading OB", "keterangan": "Muat DT 145, 146", "check_hour": true},
        {"time": "09:00-10:00", "kegiatan": "Loading OB", "keterangan": "Normal", "check_hour": true},
        {"time": "10:00-11:00", "kegiatan": "Cleaning & Dozing", "keterangan": "Perapian front", "check_hour": true},
        {"time": "11:00-12:00", "kegiatan": "Loading OB", "keterangan": "Lanjut muat", "check_hour": true},
        {"time": "12:00-13:00", "kegiatan": "Istirahat & Sholat", "keterangan": "Unit standby", "check_hour": false},
        {"time": "13:00-14:00", "kegiatan": "Loading Batubara", "keterangan": "Seam C Pit 2", "check_hour": true},
        {"time": "14:00-15:00", "kegiatan": "Loading Batubara", "keterangan": "Normal", "check_hour": true},
        {"time": "15:00-16:00", "kegiatan": "Stok Batu", "keterangan": "ROM Pad Arutmin", "check_hour": true},
        {"time": "16:00-17:00", "kegiatan": "Loading OB", "keterangan": "Pit Kintap", "check_hour": true},
        {"time": "17:00-18:00", "kegiatan": "P2H Akhir & Parkir", "keterangan": "Parkir di workshop aman", "check_hour": true}
    ]'::jsonb
);

-- Sample Time Sheet Dump Truck
INSERT INTO public.dt_timesheets 
(nik, nama_opt, pergantian, tanggal, shift, unit_code, model_unit, hm_awal, hm_akhir, total_hm, jam_kerja_unit, jam_kerja_mp, opt_name, pengawas, office, wh_logs, ritase_logs, total_ritase)
VALUES
(
    '6301010202890002', 
    'Bambang Sugiono', 
    'I', 
    CURRENT_DATE, 
    'Shift 1 (Siang)', 
    'DT 145', 
    'Hino 500 FM 260 JD', 
    8920.0, 
    8930.5, 
    10.5, 
    10.0, 
    11.0, 
    'Bambang Sugiono', 
    'Supriyanto', 
    'Dwi Lestari',
    '[
        {"time": "06:00-07:00", "kegiatan": "P2H & Briefing", "keterangan": "Cek oli & ban aman", "check_hour": true},
        {"time": "07:00-08:00", "kegiatan": "Hauling OB", "keterangan": "Pit to Disposal 2", "check_hour": true},
        {"time": "08:00-09:00", "kegiatan": "Hauling OB", "keterangan": "Lancar", "check_hour": true},
        {"time": "09:00-10:00", "kegiatan": "Hauling OB", "keterangan": "Lancar", "check_hour": true},
        {"time": "10:00-11:00", "kegiatan": "Hauling OB", "keterangan": "Lancar", "check_hour": true},
        {"time": "11:00-12:00", "kegiatan": "Hauling OB", "keterangan": "Lancar", "check_hour": true},
        {"time": "12:00-13:00", "kegiatan": "Istirahat / Lunch", "keterangan": "Standby kantin", "check_hour": false},
        {"time": "13:00-14:00", "kegiatan": "Hauling Batubara", "keterangan": "Pit to ROM Kintap", "check_hour": true},
        {"time": "14:00-15:00", "kegiatan": "Hauling Batubara", "keterangan": "Lancar", "check_hour": true},
        {"time": "15:00-16:00", "kegiatan": "Hauling Batubara", "keterangan": "Lancar", "check_hour": true},
        {"time": "16:00-17:00", "kegiatan": "Hauling OB", "keterangan": "Disposal 2", "check_hour": true},
        {"time": "17:00-18:00", "kegiatan": "Refueling & Parkir", "keterangan": "Solar penuh", "check_hour": true}
    ]'::jsonb,
    '[
        {"time": "07-08", "ex_code": "EX-623", "count": 3},
        {"time": "08-09", "ex_code": "EX-623", "count": 3},
        {"time": "09-10", "ex_code": "EX-623", "count": 4},
        {"time": "10-11", "ex_code": "EX-623", "count": 3},
        {"time": "11-12", "ex_code": "EX-623", "count": 3},
        {"time": "12-13", "ex_code": "-", "count": 0},
        {"time": "13-14", "ex_code": "EXA 612", "count": 2},
        {"time": "14-15", "ex_code": "EXA 612", "count": 3},
        {"time": "15-16", "ex_code": "EXA 612", "count": 2},
        {"time": "16-17", "ex_code": "EX-623", "count": 3},
        {"time": "17-18", "ex_code": "EX-623", "count": 2}
    ]'::jsonb,
    28
);

-- ==============================================================================
-- 9. MIGRATION COMMANDS FOR EXISTING DATABASES
-- ==============================================================================
ALTER TABLE IF EXISTS public.he_timesheets ADD COLUMN IF NOT EXISTS foto_kertas_hm TEXT;
ALTER TABLE IF EXISTS public.dt_timesheets ADD COLUMN IF NOT EXISTS foto_kertas_hm TEXT;
