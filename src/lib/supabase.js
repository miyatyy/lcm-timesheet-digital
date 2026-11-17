import { createClient } from '@supabase/supabase-js';

// Baca konfigurasi dari .env atau dari localStorage (yang diset lewat modal admin)
const getStoredConfig = () => {
  try {
    const saved = localStorage.getItem('lcm_supabase_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse stored supabase config', e);
  }
  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  };
};

let currentConfig = getStoredConfig();

export let supabase = null;

export const initSupabaseClient = (url, anonKey) => {
  if (url && anonKey && url.startsWith('http')) {
    try {
      supabase = createClient(url, anonKey, {
        auth: { persistSession: false }
      });
      return true;
    } catch (e) {
      console.warn('Gagal menginisialisasi Supabase client:', e);
      supabase = null;
      return false;
    }
  }
  supabase = null;
  return false;
};

// Inisialisasi awal
initSupabaseClient(currentConfig.url, currentConfig.anonKey);

export const saveSupabaseConfig = (url, anonKey) => {
  currentConfig = { url: url.trim(), anonKey: anonKey.trim() };
  localStorage.setItem('lcm_supabase_config', JSON.stringify(currentConfig));
  return initSupabaseClient(currentConfig.url, currentConfig.anonKey);
};

export const getSupabaseConfig = () => currentConfig;

export const isSupabaseConfigured = () => {
  return !!(supabase && currentConfig.url && currentConfig.anonKey);
};

// ==============================================================================
// LOCAL STORAGE SEED & REPOSITORY LAYER (HYBRID FALLBACK)
// ==============================================================================
const SEED_EMPLOYEES = [
  {
    id: 'emp-admin-01',
    nik: 'ADMIN01',
    name: 'Super Admin Site',
    role: 'admin',
    jabatan: 'Admin Site',
    password_hash: 'admin123',
    phone: '081234567890',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'emp-opt-01',
    nik: '6301010101880001',
    name: 'Ahmad Fauzi',
    role: 'operator',
    jabatan: 'Operator Alat Berat',
    password_hash: 'fauzi123',
    phone: '081234567891',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'emp-dt-01',
    nik: '6301010202890002',
    name: 'Bambang Sugiono',
    role: 'driver',
    jabatan: 'Driver Dump Truck',
    password_hash: 'bambang123',
    phone: '081234567892',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'emp-opt-02',
    nik: '6301010303900003',
    name: 'Rian Hidayat',
    role: 'operator',
    jabatan: 'Operator Alat Berat',
    password_hash: 'rian123',
    phone: '081234567893',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'emp-dt-02',
    nik: '6301010404910004',
    name: 'Dedi Kurniawan',
    role: 'driver',
    jabatan: 'Driver Dump Truck',
    password_hash: 'dedi123',
    phone: '081234567894',
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const SEED_HE = [
  {
    id: 'he-demo-01',
    nik: '6301010101880001',
    nama_opt: 'Ahmad Fauzi',
    tanggal: getTodayDateStr(),
    shift: 'Shift 1 (Siang)',
    model_unit: 'DX530LC-7M',
    unit_code: 'EX-623',
    hm_awal: 1450.5,
    hm_akhir: 1461.2,
    total_hm: 10.7,
    jam_kerja_unit: 10.5,
    jam_kerja_mp: 11.0,
    opt_name: 'Ahmad Fauzi',
    pengawas: 'Supriyanto',
    office: 'Dwi Lestari',
    pergantian: 'I',
    wh_logs: [
      { time: '06:00-07:00', kegiatan: 'P2H & Safety Talk', keterangan: 'Unit siap operasi', check_hour: true },
      { time: '07:00-08:00', kegiatan: 'Loading OB', keterangan: 'Area Pit Kintap Barat', check_hour: true },
      { time: '08:00-09:00', kegiatan: 'Loading OB', keterangan: 'Muat DT 145, 146', check_hour: true },
      { time: '09:00-10:00', kegiatan: 'Loading OB', keterangan: 'Normal', check_hour: true },
      { time: '10:00-11:00', kegiatan: 'Cleaning & Dozing', keterangan: 'Perapian front', check_hour: true },
      { time: '11:00-12:00', kegiatan: 'Loading OB', keterangan: 'Lanjut muat', check_hour: true },
      { time: '12:00-13:00', kegiatan: 'Istirahat & Sholat', keterangan: 'Standby kantin', check_hour: false },
      { time: '13:00-14:00', kegiatan: 'Loading Batubara', keterangan: 'Seam C Pit 2', check_hour: true },
      { time: '14:00-15:00', kegiatan: 'Loading Batubara', keterangan: 'Lancar', check_hour: true },
      { time: '15:00-16:00', kegiatan: 'Stok Batu', keterangan: 'ROM Pad Arutmin', check_hour: true },
      { time: '16:00-17:00', kegiatan: 'Loading OB', keterangan: 'Disposal Area', check_hour: true },
      { time: '17:00-18:00', kegiatan: 'P2H Akhir & Parkir', keterangan: 'Parkir workshop aman', check_hour: true }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'he-demo-02',
    nik: '6301010303900003',
    nama_opt: 'Rian Hidayat',
    tanggal: getTodayDateStr(),
    shift: 'Shift 1 (Siang)',
    model_unit: 'PC2000-8',
    unit_code: 'EXA 612',
    hm_awal: 3200.0,
    hm_akhir: 3211.5,
    total_hm: 11.5,
    jam_kerja_unit: 11.0,
    jam_kerja_mp: 11.5,
    opt_name: 'Rian Hidayat',
    pengawas: 'Supriyanto',
    office: 'Dwi Lestari',
    pergantian: 'I',
    wh_logs: [
      { time: '06:00-07:00', kegiatan: 'P2H & Safety Talk', keterangan: 'Oli & hidrolik aman', check_hour: true },
      { time: '07:00-08:00', kegiatan: 'Loading Top Soil', keterangan: 'Fleet A', check_hour: true },
      { time: '08:00-09:00', kegiatan: 'Loading Top Soil', keterangan: 'Lancar', check_hour: true },
      { time: '09:00-10:00', kegiatan: 'Loading OB', keterangan: 'Fleet B', check_hour: true },
      { time: '10:00-11:00', kegiatan: 'Loading OB', keterangan: 'Lancar', check_hour: true },
      { time: '11:00-12:00', kegiatan: 'Loading OB', keterangan: 'Lancar', check_hour: true },
      { time: '12:00-13:00', kegiatan: 'Break / Istirahat', keterangan: 'Kantin Pit', check_hour: false },
      { time: '13:00-14:00', kegiatan: 'Loading OB', keterangan: 'Lancar', check_hour: true },
      { time: '14:00-15:00', kegiatan: 'Loading Batubara', keterangan: 'Pit Kintap Timur', check_hour: true },
      { time: '15:00-16:00', kegiatan: 'Loading Batubara', keterangan: 'Lancar', check_hour: true },
      { time: '16:00-17:00', kegiatan: 'Cleaning Bench', keterangan: 'Perataan jalan', check_hour: true },
      { time: '17:00-18:00', kegiatan: 'Parkir & Serah Terima', keterangan: 'Siap shift 2', check_hour: true }
    ],
    created_at: new Date().toISOString()
  }
];

const SEED_DT = [
  {
    id: 'dt-demo-01',
    nik: '6301010202890002',
    nama_opt: 'Bambang Sugiono',
    pergantian: 'I',
    tanggal: getTodayDateStr(),
    shift: 'Shift 1 (Siang)',
    unit_code: 'DT 145',
    model_unit: 'Hino 500 FM 260 JD',
    hm_awal: 8920.0,
    hm_akhir: 8930.5,
    total_hm: 10.5,
    jam_kerja_unit: 10.0,
    jam_kerja_mp: 11.0,
    opt_name: 'Bambang Sugiono',
    pengawas: 'Supriyanto',
    office: 'Dwi Lestari',
    wh_logs: [
      { time: '06:00-07:00', kegiatan: 'P2H & Briefing', keterangan: 'Ban & rem baik', check_hour: true },
      { time: '07:00-08:00', kegiatan: 'Hauling OB', keterangan: 'Pit to Disposal 2', check_hour: true },
      { time: '08:00-09:00', kegiatan: 'Hauling OB', keterangan: 'Lancar', check_hour: true },
      { time: '09:00-10:00', kegiatan: 'Hauling OB', keterangan: 'Lancar', check_hour: true },
      { time: '10:00-11:00', kegiatan: 'Hauling OB', keterangan: 'Lancar', check_hour: true },
      { time: '11:00-12:00', kegiatan: 'Hauling OB', keterangan: 'Lancar', check_hour: true },
      { time: '12:00-13:00', kegiatan: 'Istirahat / Lunch', keterangan: 'Standby kantin', check_hour: false },
      { time: '13:00-14:00', kegiatan: 'Hauling Batubara', keterangan: 'ROM Pad Kintap', check_hour: true },
      { time: '14:00-15:00', kegiatan: 'Hauling Batubara', keterangan: 'Lancar', check_hour: true },
      { time: '15:00-16:00', kegiatan: 'Hauling Batubara', keterangan: 'Lancar', check_hour: true },
      { time: '16:00-17:00', kegiatan: 'Hauling OB', keterangan: 'Disposal 2', check_hour: true },
      { time: '17:00-18:00', kegiatan: 'Refueling & Parkir', keterangan: 'Solar terisi penuh', check_hour: true }
    ],
    ritase_logs: [
      { time: '07-08', ex_code: 'EX-623', count: 3 },
      { time: '08-09', ex_code: 'EX-623', count: 3 },
      { time: '09-10', ex_code: 'EX-623', count: 4 },
      { time: '10-11', ex_code: 'EX-623', count: 3 },
      { time: '11-12', ex_code: 'EX-623', count: 3 },
      { time: '12-13', ex_code: '-', count: 0 },
      { time: '13-14', ex_code: 'EXA 612', count: 2 },
      { time: '14-15', ex_code: 'EXA 612', count: 3 },
      { time: '15-16', ex_code: 'EXA 612', count: 2 },
      { time: '16-17', ex_code: 'EX-623', count: 3 },
      { time: '17-18', ex_code: 'EX-623', count: 2 }
    ],
    total_ritase: 28,
    created_at: new Date().toISOString()
  }
];

// Helper LocalStorage
const getLocalStorage = (key, defaultVal) => {
  try {
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(val);
  } catch (e) {
    return defaultVal;
  }
};

const setLocalStorage = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

// ==============================================================================
// REPOSITORY: EMPLOYEES (Akun Mandiri Karyawan)
// ==============================================================================
export const employeeRepo = {
  async getAll() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase fetch employees failed, fallback to local', e);
      }
    }
    return getLocalStorage('lcm_employees', SEED_EMPLOYEES);
  },

  async findByNik(nik) {
    const cleanNik = String(nik).trim();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('employees').select('*').eq('nik', cleanNik).maybeSingle();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase findByNik failed, fallback to local', e);
      }
    }
    const employees = getLocalStorage('lcm_employees', SEED_EMPLOYEES);
    return employees.find(emp => emp.nik.toLowerCase() === cleanNik.toLowerCase()) || null;
  },

  async register(empData) {
    const cleanNik = String(empData.nik).trim();
    
    // Cek apakah NIK sudah terdaftar (UNIQUE constraint)
    const existing = await this.findByNik(cleanNik);
    if (existing) {
      throw new Error(`NIK ${cleanNik} sudah terdaftar atas nama ${existing.name}. Tidak dapat mendaftar ganda.`);
    }

    const newEmp = {
      id: 'emp-' + Date.now(),
      nik: cleanNik,
      name: empData.name.trim(),
      role: empData.jabatan.includes('Dump Truck') ? 'driver' : (empData.jabatan.includes('Admin') ? 'admin' : 'operator'),
      jabatan: empData.jabatan,
      password_hash: empData.password,
      phone: empData.phone || '',
      is_active: true,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('employees').insert([newEmp]).select().single();
        if (error) throw error;
        if (data) {
          // Sync to local
          const local = getLocalStorage('lcm_employees', SEED_EMPLOYEES);
          setLocalStorage('lcm_employees', [data, ...local]);
          return data;
        }
      } catch (e) {
        console.warn('Supabase insert failed, saving to local only:', e);
      }
    }

    const local = getLocalStorage('lcm_employees', SEED_EMPLOYEES);
    setLocalStorage('lcm_employees', [newEmp, ...local]);
    return newEmp;
  },

  async resetPassword(nik, newPassword) {
    const cleanNik = String(nik).trim();
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('employees').update({ password_hash: newPassword }).eq('nik', cleanNik);
        if (error) throw error;
      } catch (e) {
        console.warn('Supabase resetPassword failed', e);
      }
    }
    const list = getLocalStorage('lcm_employees', SEED_EMPLOYEES);
    const idx = list.findIndex(e => e.nik === cleanNik);
    if (idx !== -1) {
      list[idx].password_hash = newPassword;
      setLocalStorage('lcm_employees', list);
      return true;
    }
    return false;
  }
};

// ==============================================================================
// REPOSITORY: HE_TIMESHEETS (Alat Berat)
// ==============================================================================
export const heTimesheetRepo = {
  async getAll() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('he_timesheets').select('*').order('tanggal', { ascending: false }).order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase fetch HE failed', e);
      }
    }
    return getLocalStorage('lcm_he_timesheets', SEED_HE);
  },

  async create(record) {
    const item = {
      id: 'he-' + Date.now(),
      created_at: new Date().toISOString(),
      ...record
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('he_timesheets').insert([item]).select().single();
        if (error) throw error;
        if (data) {
          const local = getLocalStorage('lcm_he_timesheets', SEED_HE);
          setLocalStorage('lcm_he_timesheets', [data, ...local]);
          return data;
        }
      } catch (e) {
        console.warn('Supabase create HE failed', e);
      }
    }

    const local = getLocalStorage('lcm_he_timesheets', SEED_HE);
    setLocalStorage('lcm_he_timesheets', [item, ...local]);
    return item;
  }
};

// ==============================================================================
// REPOSITORY: DT_TIMESHEETS (Dump Truck)
// ==============================================================================
export const dtTimesheetRepo = {
  async getAll() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('dt_timesheets').select('*').order('tanggal', { ascending: false }).order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase fetch DT failed', e);
      }
    }
    return getLocalStorage('lcm_dt_timesheets', SEED_DT);
  },

  async create(record) {
    const item = {
      id: 'dt-' + Date.now(),
      created_at: new Date().toISOString(),
      ...record
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('dt_timesheets').insert([item]).select().single();
        if (error) throw error;
        if (data) {
          const local = getLocalStorage('lcm_dt_timesheets', SEED_DT);
          setLocalStorage('lcm_dt_timesheets', [data, ...local]);
          return data;
        }
      } catch (e) {
        console.warn('Supabase create DT failed', e);
      }
    }

    const local = getLocalStorage('lcm_dt_timesheets', SEED_DT);
    setLocalStorage('lcm_dt_timesheets', [item, ...local]);
    return item;
  }
};

// ==============================================================================
// REPOSITORY: AUTO-RESET BULANAN SETIAP TANGGAL 1
// Hanya menghapus he_timesheets dan dt_timesheets bulan lalu,
// TABEL EMPLOYEES TIDAK BOLEH DIHAPUS!
// ==============================================================================
export const monthlyResetService = {
  checkIfFirstDayOfMonth() {
    const today = new Date();
    return today.getDate() === 1;
  },

  async executeReset() {
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDateStr = firstOfThisMonth.toISOString().split('T')[0];
    
    let deletedHECount = 0;
    let deletedDTCount = 0;

    if (isSupabaseConfigured()) {
      try {
        const { data: heData, error: heErr } = await supabase.from('he_timesheets').delete().lt('tanggal', firstDateStr).select('id');
        if (!heErr && heData) deletedHECount += heData.length;

        const { data: dtData, error: dtErr } = await supabase.from('dt_timesheets').delete().lt('tanggal', firstDateStr).select('id');
        if (!dtErr && dtData) deletedDTCount += dtData.length;
      } catch (e) {
        console.warn('Supabase monthly cleanup failed:', e);
      }
    }

    // Bersihkan di LocalStorage juga (hanya data bulan lalu)
    const localHE = getLocalStorage('lcm_he_timesheets', SEED_HE);
    const filteredHE = localHE.filter(r => r.tanggal >= firstDateStr);
    deletedHECount += (localHE.length - filteredHE.length);
    setLocalStorage('lcm_he_timesheets', filteredHE);

    const localDT = getLocalStorage('lcm_dt_timesheets', SEED_DT);
    const filteredDT = localDT.filter(r => r.tanggal >= firstDateStr);
    deletedDTCount += (localDT.length - filteredDT.length);
    setLocalStorage('lcm_dt_timesheets', filteredDT);

    // Catat riwayat reset (TANPA MENYENTUH TABEL EMPLOYEES)
    const lastMonthLabel = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const backupLog = {
      id: 'backup-' + Date.now(),
      backup_month: lastMonthLabel,
      total_he_records: deletedHECount,
      total_dt_records: deletedDTCount,
      timestamp: new Date().toISOString()
    };

    const backups = getLocalStorage('lcm_backup_history', []);
    setLocalStorage('lcm_backup_history', [backupLog, ...backups]);

    return {
      success: true,
      month: lastMonthLabel,
      deletedHE: deletedHECount,
      deletedDT: deletedDTCount
    };
  }
};
