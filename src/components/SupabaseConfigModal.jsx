import React, { useState } from 'react';
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  isSupabaseConfigured,
  supabase
} from '../lib/supabase';

export const SupabaseConfigModal = ({ isOpen, onClose, onConfigSaved }) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Mohon isi Project URL dan Anon Key terlebih dahulu.'
      });
      setTesting(false);
      return;
    }

    try {
      // Save temporarily & test
      saveSupabaseConfig(url, anonKey);
      
      if (!supabase) {
        throw new Error('Supabase client gagal diinisialisasi. Cek format URL.');
      }

      const { data, error } = await supabase.from('employees').select('count', { count: 'exact', head: true });
      if (error) {
        throw error;
      }

      setTestResult({
        success: true,
        message: 'Koneksi ke Supabase PostgreSQL BERHASIL terhubung!'
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Koneksi gagal: ' + (err.message || 'Periksa kembali URL, Anon Key, atau pastikan tabel sudah dibuat via SQL Editor.')
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const success = saveSupabaseConfig(url, anonKey);
    if (onConfigSaved) onConfigSaved(success);
    onClose();
  };

  const handleUseDemo = () => {
    saveSupabaseConfig('', '');
    setUrl('');
    setAnonKey('');
    if (onConfigSaved) onConfigSaved(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#0F5132] px-5 py-4 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-amber-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Konfigurasi Database Supabase</h3>
              <p className="text-[11px] text-emerald-200">PostgreSQL Free Tier PT. LAZ COAL MANDIRI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 space-y-1.5">
            <span className="font-extrabold text-[#0F5132] block">
              💡 Cara Menghubungkan ke Supabase Anda:
            </span>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-900">
              <li>Buka project Anda di <strong>supabase.com</strong>.</li>
              <li>Salin script <code>supabase_schema.sql</code> ke <strong>SQL Editor</strong> di Supabase lalu klik Run.</li>
              <li>Buka <strong>Project Settings &rarr; Data API</strong>, salin URL dan <code>anon</code> public key ke form bawah.</li>
            </ol>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Supabase Project URL:
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0F5132] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Supabase Anon Public API Key:
            </label>
            <textarea
              rows={3}
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full text-xs font-mono px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#0F5132] outline-none resize-none"
            />
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 border ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-300 text-[#0F5132]' 
                : 'bg-red-50 border-red-300 text-red-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="font-semibold">{testResult.message}</div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl border border-slate-300 flex items-center justify-center space-x-1.5 transition"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-[#0F5132]" />}
              <span>{testing ? 'Mengecek...' : 'Tes Koneksi'}</span>
            </button>

            <button
              type="button"
              onClick={handleUseDemo}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 hover:underline"
              title="Gunakan LocalStorage Demo Mode"
            >
              Mode Offline
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 px-3 py-1.5"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="bg-[#0F5132] hover:bg-[#0a3622] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition"
          >
            Simpan Konfigurasi
          </button>
        </div>

      </div>
    </div>
  );
};
