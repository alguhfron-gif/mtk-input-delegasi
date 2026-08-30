import React, { useState } from 'react';
import { Delegasi, Peserta } from '../types';
import { 
  Database, 
  Download, 
  Upload, 
  ShieldCheck, 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  Smartphone, 
  Globe, 
  CheckCircle2,
  BookOpen,
  Layers,
  Code2,
  Shield,
  FileSpreadsheet
} from 'lucide-react';
import { batchImportPesertaToFirestore, saveDelegasiToFirestore, saveAnggaranToFirestore } from '../lib/firebase';
import { FirestoreGuideModal } from './FirestoreGuideModal';

interface BackupTabProps {
  pesertaList: Peserta[];
  delegasiList: Delegasi[];
  saldoAnggaran: number;
  onRestoreData: (restored: { peserta: Peserta[]; delegasi: Delegasi[]; saldoAnggaran: number }) => void;
}

export const BackupTab: React.FC<BackupTabProps> = ({
  pesertaList,
  delegasiList,
  saldoAnggaran,
  onRestoreData
}) => {
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const handleManualPushToFirebase = async () => {
    try {
      setIsSyncingAll(true);
      setSyncSuccessMessage(null);

      // 1. Push all Peserta to Firestore
      if (pesertaList.length > 0) {
        await batchImportPesertaToFirestore(pesertaList, 'update');
      }

      // 2. Push all Delegasi to Firestore
      for (const d of delegasiList) {
        await saveDelegasiToFirestore(d);
      }

      // 3. Push Saldo Anggaran to Firestore
      await saveAnggaranToFirestore(saldoAnggaran);

      setIsSyncingAll(false);
      setSyncSuccessMessage('Seluruh data peserta, delegasi, dan saldo berhasil disinkronkan ke Firebase Cloud!');
      setTimeout(() => setSyncSuccessMessage(null), 6000);
    } catch (error) {
      setIsSyncingAll(false);
      console.error('Manual sync error:', error);
      alert('Gagal menyinkronkan data ke Firebase. Periksa koneksi internet Anda.');
    }
  };

  const handleBackup = () => {
    const db = {
      peserta: pesertaList,
      delegasi: delegasiList,
      saldoAnggaran,
      source: 'Firebase Firestore & Local Cache',
      exportedAt: new Date().toISOString()
    };

    const jsonString = JSON.stringify(db, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `backup_mtk_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed && Array.isArray(parsed.peserta) && Array.isArray(parsed.delegasi)) {
          if (confirm('Apakah Anda yakin ingin MEMULIHKAN data dari backup? Seluruh data di HP dan Web akan ditimpa dan disinkronkan ke Firebase!')) {
            onRestoreData({
              peserta: parsed.peserta,
              delegasi: parsed.delegasi,
              saldoAnggaran: parsed.saldoAnggaran || 0
            });
            alert('Data MTK berhasil dipulihkan dan disinkronkan ke Firebase!');
          }
        } else {
          alert('Format file JSON backup tidak sesuai! Pastikan memilih file backup MTK yang benar.');
        }
      } catch {
        alert('Gagal membaca file JSON backup.');
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div id="page-backup" className="space-y-7 animate-fadeIn">
      {/* Title & Documentation Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
            <Database className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Cloud Firebase & Database Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Penyimpanan data cloud Firebase Firestore, sinkronisasi real-time antar HP & Web, serta panduan skema.
            </p>
          </div>
        </div>

        <button
          id="btn-buka-panduan-firestore"
          onClick={() => setIsGuideModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <BookOpen className="w-4 h-4" />
          <span>Panduan Skema & Rules Firestore</span>
        </button>
      </div>

      {/* Cloud Firebase Realtime Sync Status Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Penyimpanan Firebase Firestore Aktif
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Data Tersimpan Aman di Cloud Database
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Setiap penambahan peserta, input delegasi, perubahan saldo, dan rincian nota otomatis tersimpan di cloud database Firebase dan langsung tersinkronisasi di HP maupun Web secara real-time.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              id="btn-sync-firebase-now"
              onClick={handleManualPushToFirebase}
              disabled={isSyncingAll}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>HP & Laptop Terhubung</span>
            </div>
          </div>
        </div>

        {syncSuccessMessage && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{syncSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Interactive Firestore Schema & Documentation Highlight Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Struktur Koleksi Cloud Firestore (Single Source of Truth)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rangkuman 3 koleksi utama yang digunakan untuk menyimpan seluruh master data & transaksi.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="text-xs text-indigo-700 font-bold hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200/70 transition-colors"
          >
            <span>Buka Dokumentasi Lengkap & Format JSON</span>
            <Code2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: peserta */}
          <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                /peserta
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {pesertaList.length} Dokumen
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-800">Database Master Peserta</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Doc ID: <code className="font-mono text-teal-700 font-bold">ID Santri (PPS001)</code>. Menyimpan field <code>id</code>, <code>nama</code>, <code>domisili</code>, <code>kelas</code>, <code>jabatan</code>, dan <code>updatedAt</code>.
            </p>
          </div>

          {/* Card 2: delegasi */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                /delegasi
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {delegasiList.length} Dokumen
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-800">Riwayat Delegasi & Nota</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Doc ID: <code className="font-mono text-indigo-700 font-bold">Timestamp ID</code>. Menyimpan field <code>peserta</code> [array], <code>tujuan</code>, <code>uangDibawa</code>, <code>uangTerpakai</code>, dan <code>rincian</code> [array nota].
            </p>
          </div>

          {/* Card 3: config */}
          <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                /config/anggaran
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Plafon Aktif
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-800">Konfigurasi Anggaran</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Doc ID: <code className="font-mono text-amber-700 font-bold">'anggaran'</code>. Menyimpan field <code>saldoAnggaran</code>, <code>tahun</code>, dan <code>updatedAt</code>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Backup Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/60 w-fit mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">1. Unduh Berkas Cadangan (JSON)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Simpan salinan offline database MTK ({pesertaList.length} Peserta, {delegasiList.length} Riwayat Delegasi, dan Plafon Anggaran) ke format file JSON di perangkat Anda.
            </p>
          </div>

          <button
            id="btn-backup-json"
            onClick={handleBackup}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Berkas Backup (.json)</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/60 w-fit mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">2. Pulihkan dari Berkas JSON</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Unggah file JSON backup untuk mengembalikan data peserta, riwayat kegiatan, dan anggaran yang telah dicadangkan sebelumnya, sekaligus menyinkronkannya kembali ke Firebase.
            </p>
          </div>

          <div>
            <input
              type="file"
              id="file-restore-database"
              accept=".json"
              className="hidden"
              onChange={handleRestoreFile}
            />
            <button
              id="btn-pulihkan-database"
              onClick={() => document.getElementById('file-restore-database')?.click()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Pilih File Backup (.json)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-emerald-50/60 p-4.5 rounded-2xl border border-emerald-200/70 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 space-y-1">
          <p className="font-bold text-emerald-900">Perlindungan Data Ganda (Cloud & Offline):</p>
          <p className="text-emerald-800/90 leading-relaxed">
            Data Anda tersimpan secara terpusat di cloud Firebase Firestore dan juga dicadangkan di cache lokal perangkat Anda. Jika Anda membuka aplikasi di HP atau perangkat baru, data otomatis ditarik dari Firebase secara utuh.
          </p>
        </div>
      </div>

      {/* Firestore Guide Modal */}
      <FirestoreGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
};
