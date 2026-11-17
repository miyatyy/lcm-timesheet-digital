import { createClient } from '@supabase/supabase-js';

// Helper UUID Generator standar RFC-4122 (kompatibel penuh dengan tipe UUID di Supabase PostgreSQL)
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const isValidUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

// Baca konfigurasi dari URL query (sinkronisasi QR code), .env, atau localStorage
const getStoredConfig = () => {
  // 1. Cek parameter query URL (?sb_url=...&sb_key=...) untuk sinkronisasi instan via QR/link
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const qUrl = params.get('sb_url');
      const qKey = params.get('sb_key');
      if (qUrl && qKey) {
        const conf = { url: decodeURIComponent(qUrl).trim(), anonKey: decodeURIComponent(qKey).trim() };
        localStorage.setItem('lcm_supabase_config', JSON.stringify(conf));
        return conf;
      }
    } catch (e) {}
  }

  // 2. Cek localStorage
  try {
    const saved = localStorage.getItem('lcm_supabase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse stored supabase config', e);
  }

  // 3. Fallback ke environment variable (.env / Vercel)
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
        auth: { persistSession: false },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
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

export const clearSupabaseConfig = () => {
  currentConfig = { url: '', anonKey: '' };
  localStorage.removeItem('lcm_supabase_config');
  supabase = null;
};

export const getSupabaseConfig = () => currentConfig;

export const isSupabaseConfigured = () => {
  return !!(supabase && currentConfig.url && currentConfig.anonKey);
};

// Uji koneksi ke Supabase dan verifikasi kesiapan tabel
export const testSupabaseConnection = async (url, anonKey) => {
  if (!url || !anonKey) {
    return { success: false, message: 'URL Project dan Anon Key tidak boleh kosong.' };
  }
  try {
    const testClient = createClient(url.trim(), anonKey.trim(), { auth: { persistSession: false } });
    const { error } = await testClient.from('employees').select('count', { count: 'exact', head: true });
    if (error) {
      if (error.code === '42P01') {
        return { 
          success: false, 
          message: 'Koneksi ke server Supabase berhasil, namun tabel belum dibuat. Harap jalankan script supabase_schema.sql di SQL Editor Supabase.' 
        };
      }
      return { success: false, message: 'Supabase Error: ' + error.message };
    }
    return { success: true, message: 'Koneksi ke Supabase Cloud berhasil & seluruh tabel terdeteksi!' };
  } catch (err) {
    return { success: false, message: err.message || 'Gagal menghubungi server Supabase.' };
  }
};

// ==============================================================================
// LOCAL STORAGE SEED & REPOSITORY LAYER (HYBRID FALLBACK)
// AKUN DUMMY DIHILANGKAN TOTAL - HANYA AKUN RESMI ADMIN01 & KARYAWAN AKTIF
// ==============================================================================
const SEED_EMPLOYEES = [
  {
    id: 'emp-admin-01',
    nik: 'ADMIN01',
    name: 'Super Admin Site',
    role: 'admin',
    jabatan: 'Admin Site',
    password_hash: 'admin123',
    phone: '',
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const SEED_HE = [];
const SEED_DT = [];

// Helper LocalStorage
const getLocalStorage = (key, defaultVal) => {
  try {
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    const parsed = JSON.parse(val);

    // Otomatis bersihkan akun dummy lama jika masih tersimpan di browser
    if (key === 'lcm_employees' && Array.isArray(parsed)) {
      const cleaned = parsed.filter(e => 
        !['6301010101880001', '6301010202890002', '6301010303900003', '6301010404910004'].includes(e.nik) &&
        !['Ahmad Fauzi', 'Bambang Sugiono', 'Rian Hidayat', 'Dedi Kurniawan'].includes(e.name)
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(key, JSON.stringify(cleaned));
      }
      return cleaned;
    }

    // Otomatis bersihkan lembar kerja dummy lama
    if ((key === 'lcm_he_sheets' || key === 'lcm_dt_sheets') && Array.isArray(parsed)) {
      const cleaned = parsed.filter(s => s && s.id && !s.id.startsWith('he-demo') && !s.id.startsWith('dt-demo'));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(key, JSON.stringify(cleaned));
      }
      return cleaned;
    }

    return parsed;
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
    if (!nik) return null;
    const cleanNik = String(nik).trim();
    const normNik = cleanNik.toUpperCase().replace(/[\s\-_]/g, '');
    const stripDotNik = normNik.replace(/\./g, '');

    if (isSupabaseConfigured()) {
      try {
        // 1. Exact match
        const { data, error } = await supabase.from('employees').select('*').eq('nik', cleanNik).maybeSingle();
        if (!error && data) return data;

        // 2. Case-insensitive match
        const { data: dataIlike } = await supabase.from('employees').select('*').ilike('nik', cleanNik).maybeSingle();
        if (dataIlike) return dataIlike;

        // 3. Match normalized format (e.g. V.26141 vs v.26141 vs V26141)
        const { data: allEmps } = await supabase.from('employees').select('*');
        if (allEmps && allEmps.length > 0) {
          const match = allEmps.find(emp => {
            const eNorm = String(emp.nik || '').toUpperCase().replace(/[\s\-_]/g, '');
            const eStrip = eNorm.replace(/\./g, '');
            return eNorm === normNik || eStrip === stripDotNik;
          });
          if (match) return match;
        }
      } catch (e) {
        console.warn('Supabase findByNik failed, fallback to local', e);
      }
    }
    const employees = getLocalStorage('lcm_employees', SEED_EMPLOYEES);
    return employees.find(emp => {
      const eNorm = String(emp.nik || '').toUpperCase().replace(/[\s\-_]/g, '');
      const eStrip = eNorm.replace(/\./g, '');
      return eNorm === normNik || eStrip === stripDotNik || String(emp.nik).toLowerCase() === cleanNik.toLowerCase();
    }) || null;
  },

  async register(empData) {
    const cleanNik = String(empData.nik).trim();
    
    // Cek apakah NIK sudah terdaftar (UNIQUE constraint)
    const existing = await this.findByNik(cleanNik);
    if (existing) {
      throw new Error(`NIK ${cleanNik} sudah terdaftar atas nama ${existing.name}. Tidak dapat mendaftar ganda.`);
    }

    const newId = generateUUID();
    const newEmp = {
      id: newId,
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
        if (error) {
          console.error('Supabase insert employee error:', error);
          throw error;
        }
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
    const newId = generateUUID();
    const validEmployeeId = isValidUUID(record.employee_id) ? record.employee_id : null;

    const item = {
      id: newId,
      created_at: new Date().toISOString(),
      ...record,
      employee_id: validEmployeeId
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('he_timesheets').insert([item]).select().single();
        if (error) {
          console.error('Supabase create HE error:', error);
          throw error;
        }
        if (data) {
          const local = getLocalStorage('lcm_he_timesheets', SEED_HE);
          setLocalStorage('lcm_he_timesheets', [data, ...local]);
          return data;
        }
      } catch (e) {
        console.warn('Supabase create HE failed:', e);
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
    const newId = generateUUID();
    const validEmployeeId = isValidUUID(record.employee_id) ? record.employee_id : null;

    const item = {
      id: newId,
      created_at: new Date().toISOString(),
      ...record,
      employee_id: validEmployeeId
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('dt_timesheets').insert([item]).select().single();
        if (error) {
          console.error('Supabase create DT error:', error);
          throw error;
        }
        if (data) {
          const local = getLocalStorage('lcm_dt_timesheets', SEED_DT);
          setLocalStorage('lcm_dt_timesheets', [data, ...local]);
          return data;
        }
      } catch (e) {
        console.warn('Supabase create DT failed:', e);
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
