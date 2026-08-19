import React from 'react';
import { Delegasi, Peserta } from '../types';
import { Database, Download, Upload, ShieldCheck } from 'lucide-react';

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
  const handleBackup = () => {
    const db = {
      peserta: pesertaList,
      delegasi: delegasiList,
      saldoAnggaran,
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
          if (confirm('Apakah Anda yakin ingin MEMULIHKAN data dari backup? Seluruh data saat ini akan ditimpa!')) {
            onRestoreData({
              peserta: parsed.peserta,
              delegasi: parsed.delegasi,
              saldoAnggaran: parsed.saldoAnggaran || 0
            });
            alert('Data MTK berhasil dipulihkan!');
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
      {/* Title */}
      <div className="flex items-center gap-2.5 pb-2">
        <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
          <Database className="w-5 h-5" />
        </span>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Backup & Pulihkan Database
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Amankan data sistem secara mandiri atau pulihkan data dari file cadangan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Backup Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/60 w-fit mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">1. Unduh Backup (JSON)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Simpan cadangan database MTK (Database Peserta, Riwayat Delegasi, dan Saldo Anggaran) ke file berkas JSON di perangkat Anda.
            </p>
          </div>

          <button
            id="btn-backup-json"
            onClick={handleBackup}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Berkas Backup</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/60 w-fit mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">2. Pulihkan Database</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Unggah file JSON backup untuk mengembalikan data peserta, riwayat kegiatan, dan anggaran yang telah dicadangkan sebelumnya.
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
          <p className="font-bold text-emerald-900">Penyimpanan Otomatis di Browser:</p>
          <p className="text-emerald-800/90 leading-relaxed">
            Semua aktivitas tersimpan otomatis di memori browser lokal. Melakukan backup berkala ke file JSON disarankan untuk mengamankan data jangka panjang.
          </p>
        </div>
      </div>
    </div>
  );
};
