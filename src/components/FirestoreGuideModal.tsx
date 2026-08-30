import React, { useState } from 'react';
import { 
  X, 
  Database, 
  FileCode2, 
  Shield, 
  Copy, 
  Check, 
  Users, 
  Briefcase, 
  Coins, 
  Layers, 
  Code2, 
  ExternalLink,
  BookOpen,
  Sparkles,
  Info
} from 'lucide-react';

interface FirestoreGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirestoreGuideModal: React.FC<FirestoreGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'json' | 'rules'>('schema');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const samplePesertaJSON = `{
  "id": "PPS001",
  "nama": "Ahmad Fauzi",
  "domisili": "Surabaya",
  "kelas": "XII / 3 Aliyah",
  "jabatan": "Ketua Delegasi",
  "updatedAt": "2026-08-30T10:00:00.000Z"
}`;

  const sampleDelegasiJSON = `{
  "id": 1740873600000,
  "peserta": [
    "PPS001",
    "PPS002"
  ],
  "tujuan": "Lomba Musabaqah Qiraatil Kutub (MQK) Wilayah Jatim",
  "tglBerangkat": "2026-09-05",
  "tglKembali": "2026-09-08",
  "uangDibawa": 2500000,
  "uangTerpakai": 2150000,
  "rincian": [
    { "nama": "Transportasi & Tiket Kereta", "nominal": 950000 },
    { "nama": "Biaya Registrasi Lomba", "nominal": 400000 },
    { "nama": "Konsumsi & Akomodasi", "nominal": 600000 },
    { "nama": "P3K & Operasional Darurat", "nominal": 200000 }
  ],
  "status": "selesai",
  "createdAt": "2026-08-30T03:00:00.000Z"
}`;

  const sampleConfigJSON = `{
  "saldoAnggaran": 75000000,
  "tahun": 2026,
  "updatedAt": "2026-08-30T03:00:00.000Z"
}`;

  const firestoreRulesCode = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // 1. Koleksi Master Peserta
    match /peserta/{pesertaId} {
      allow read, write: if true;
    }

    // 2. Koleksi Riwayat Delegasi & Nota
    match /delegasi/{delegasiId} {
      allow read, write: if true;
    }

    // 3. Koleksi Pengaturan Saldo & Anggaran
    match /config/{configId} {
      allow read, write: if true;
    }
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Struktur Database & Dokumentasi Firestore
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Cloud Live
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Panduan arsitektur koleksi data, format dokumen JSON, dan aturan keamanan database MTK.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tutup Panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Struktur Koleksi & Dokumen</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>2. Contoh Format Dokumen JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rules'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>3. Aturan Keamanan (Security Rules)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
          
          {/* TAB 1: SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Firestore menyimpan data dalam bentuk <strong>Collections (Koleksi)</strong> yang berisi <strong>Documents (Dokumen)</strong>. Sistem ini memiliki 3 koleksi terpisah yang saling terhubung secara otomatis.
                </p>
              </div>

              {/* Koleksi 1: peserta */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-100">
                      <Users className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Koleksi: <code className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono text-xs">peserta</code>
                      </h4>
                      <p className="text-[11px] text-slate-500">Menyimpan master data santri & pengurus delegasi.</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                    Doc ID: ID Santri (e.g. 'PPS001')
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="p-2.5">Nama Field</th>
                        <th className="p-2.5">Tipe Data</th>
                        <th className="p-2.5">Keterangan & Contoh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">id</td>
                        <td className="p-2.5 font-mono text-slate-500">string</td>
                        <td className="p-2.5">Kunci unik PPS santri, misal: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">"PPS001"</code></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">nama</td>
                        <td className="p-2.5 font-mono text-slate-500">string</td>
                        <td className="p-2.5">Nama lengkap santri/pengurus, misal: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">"Ahmad Fauzi"</code></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">domisili</td>
                        <td className="p-2.5 font-mono text-slate-500">string</td>
                        <td className="p-2.5">Asal daerah santri, misal: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">"Surabaya"</code></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">kelas</td>
                        <td className="p-2.5 font-mono text-slate-500">string</td>
                        <td className="p-2.5">Tingkatan kelas santri, misal: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">"XII / 3 Aliyah"</code></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">jabatan</td>
                        <td className="p-2.5 font-mono text-slate-500">string</td>
                        <td className="p-2.5">Jabatan struktural, misal: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">"Ketua Delegasi"</code> / <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">"Anggota"</code></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">updatedAt</td>
                        <td className="p-2.5 font-mono text-slate-500">string (ISO)</td>
                        <td className="p-2.5">Timestamp pembaruan terakhir data peserta</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Koleksi 2: delegasi */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                      <Briefcase className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Koleksi: <code className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono text-xs">delegasi</code>
                      </h4>
                      <p className="text-[11px] text-slate-500">Menyimpan riwayat kegiatan delegasi, jadwal, dan rincian nota keuangan.</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                    Doc ID: Numeric ID / Timestamp (e.g. '1740873600000')
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="p-2.5">Nama Field</th>
                        <th className="p-2.5">Tipe Data</th>
                        <th className="p-2.5">Keterangan & Contoh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-700">id</td>
                        <td className="p-2.5 font-mono text-slate-500">number</td>
                        <td className="p-2.5">ID angka unik delegasi (berbasis milidetik timestamp)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-700">peserta</td>
                        <td className="p-2.5 font-mono text-slate-500">array&lt;string&gt;</td>
                        <td className="p-2.5">Daftar ID PPS yang ditugaskan, contoh: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">["PPS001", "PPS002"]</code></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-700">tujuan</td>
                        <td className="p-2.5 font-mono text-slate-500">string</td>
                        <td className="p-2.5">Nama kegiatan delegasi/tujuan acara resmi</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-700">tglBerangkat</td>
                        <td className="p-2.5 font-mono text-slate-500">string (YYYY-MM-DD)</td>
                        <td className="p-2.5">Tanggal mulai keberangkatan</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-700">tglKembali</td>
                        <td className="p-2.5 font-mono text-slate-500">string (YYYY-MM-DD)</td>
                        <td className="p-2.5">Tanggal kepulangan delegasi</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-700">uangDibawa</td>
                        <td className="p-2.5 font-mono text-slate-500">number</td>
                        <td className="p-2.5">Nominal bekal kas awal yang diserahkan ke delegasi</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-700">uangTerpakai</td>
                        <td className="p-2.5 font-mono text-slate-500">number</td>
                        <td className="p-2.5">Total pengeluaran riil berdasarkan akumulasi rincian nota</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-700">rincian</td>
                        <td className="p-2.5 font-mono text-slate-500">array&lt;object&gt;</td>
                        <td className="p-2.5">Daftar item nota belanja: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">[{`{nama: "Tiket", nominal: 500000}`}]</code></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-700">status</td>
                        <td className="p-2.5 font-mono text-slate-500">string</td>
                        <td className="p-2.5">Status: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">"selesai"</code> | <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">"berlangsung"</code></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-indigo-700">createdAt</td>
                        <td className="p-2.5 font-mono text-slate-500">string (ISO)</td>
                        <td className="p-2.5">Waktu pembuatan dokumen pertama kali</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Koleksi 3: config */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                      <Coins className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Koleksi: <code className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono text-xs">config</code> (Dokumen: <code className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono text-xs">anggaran</code>)
                      </h4>
                      <p className="text-[11px] text-slate-500">Menyimpan konfigurasi plafon pagu anggaran tahunan MTK.</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                    Doc ID: 'anggaran'
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="p-2.5">Nama Field</th>
                        <th className="p-2.5">Tipe Data</th>
                        <th className="p-2.5">Keterangan & Contoh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-amber-700">saldoAnggaran</td>
                        <td className="p-2.5 font-mono text-slate-500">number</td>
                        <td className="p-2.5">Total plafon batas anggaran operasional tahunan (misal: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">75000000</code>)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-amber-700">tahun</td>
                        <td className="p-2.5 font-mono text-slate-500">number</td>
                        <td className="p-2.5">Tahun periode berjalan (misal: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">2026</code>)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-amber-700">updatedAt</td>
                        <td className="p-2.5 font-mono text-slate-500">string (ISO)</td>
                        <td className="p-2.5">Timestamp saat nominal anggaran terakhir diubah</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JSON SAMPLES */}
          {activeTab === 'json' && (
            <div className="space-y-6 animate-fadeIn">
              <p className="text-xs text-slate-600">
                Berikut adalah contoh format dokumen JSON nyata dari ketiga koleksi di Firestore. Format ini juga kompatibel saat Anda mengunduh atau memulihkan file cadangan (*backup*).
              </p>

              {/* JSON 1: Peserta */}
              <div className="bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 bg-slate-800 flex items-center justify-between border-b border-slate-700 text-xs">
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5" />
                    Koleksi: /peserta/PPS001
                  </span>
                  <button
                    onClick={() => handleCopy(samplePesertaJSON, 'peserta_json')}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    {copiedKey === 'peserta_json' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto text-emerald-300 leading-relaxed">
                  {samplePesertaJSON}
                </pre>
              </div>

              {/* JSON 2: Delegasi */}
              <div className="bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 bg-slate-800 flex items-center justify-between border-b border-slate-700 text-xs">
                  <span className="font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5" />
                    Koleksi: /delegasi/1740873600000
                  </span>
                  <button
                    onClick={() => handleCopy(sampleDelegasiJSON, 'delegasi_json')}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    {copiedKey === 'delegasi_json' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto text-indigo-200 leading-relaxed">
                  {sampleDelegasiJSON}
                </pre>
              </div>

              {/* JSON 3: Config */}
              <div className="bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 bg-slate-800 flex items-center justify-between border-b border-slate-700 text-xs">
                  <span className="font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5" />
                    Koleksi: /config/anggaran
                  </span>
                  <button
                    onClick={() => handleCopy(sampleConfigJSON, 'config_json')}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    {copiedKey === 'config_json' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto text-amber-200 leading-relaxed">
                  {sampleConfigJSON}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-start gap-3">
                <Shield className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 space-y-1">
                  <p className="font-bold text-indigo-900">Firestore Security Rules Aktif:</p>
                  <p className="text-indigo-800/90 leading-relaxed">
                    Aturan ini mengatur hak akses pembacaan (read) dan penulisan (write) ke database Firestore sehingga hanya koleksi resmi aplikasi yang dapat diakses.
                  </p>
                </div>
              </div>

              {/* Rules Code Box */}
              <div className="bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 bg-slate-800 flex items-center justify-between border-b border-slate-700 text-xs">
                  <span className="font-mono font-bold text-indigo-300 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    firestore.rules
                  </span>
                  <button
                    onClick={() => handleCopy(firestoreRulesCode, 'rules_code')}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    {copiedKey === 'rules_code' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Rules Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Rules</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto text-slate-100 leading-relaxed">
                  {firestoreRulesCode}
                </pre>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 space-y-2.5 text-xs text-slate-700">
                <h5 className="font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Cara Melihat & Mengelola Data di Firebase Console:
                </h5>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 leading-relaxed pl-1">
                  <li>Buka <strong>Firebase Console</strong> di <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold underline">console.firebase.google.com</a> dan pilih proyek <code className="font-bold text-slate-800">delegasi-mtk</code>.</li>
                  <li>Buka menu <strong>Build &gt; Firestore Database</strong> di bilah navigasi kiri.</li>
                  <li>Anda akan langsung melihat 3 koleksi: <code className="font-mono bg-slate-100 px-1 rounded">peserta</code>, <code className="font-mono bg-slate-100 px-1 rounded">delegasi</code>, dan <code className="font-mono bg-slate-100 px-1 rounded">config</code> beserta dokumen yang disimpan.</li>
                  <li>Untuk aturan keamanan, buka tab <strong>Rules</strong> di Firestore Database, tempelkan kode rules di atas, lalu klik <strong>Publish</strong>.</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Koleksi: <code>peserta</code>, <code>delegasi</code>, <code>config</code></span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Tutup Dokumentasi
          </button>
        </div>

      </div>
    </div>
  );
};
