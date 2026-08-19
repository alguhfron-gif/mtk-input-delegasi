import React, { useState, useMemo } from 'react';
import { Peserta } from '../types';
import { 
  FileUp, 
  X, 
  ClipboardPaste, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Download,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { downloadTemplatePesertaCSV } from '../utils/csv';

interface ImportPesertaModalProps {
  existingPeserta: Peserta[];
  isOpen: boolean;
  onClose: () => void;
  onImport: (newPesertaList: Peserta[], mode: 'skip' | 'update' | 'replace') => void;
}

export const ImportPesertaModal: React.FC<ImportPesertaModalProps> = ({
  existingPeserta,
  isOpen,
  onClose,
  onImport
}) => {
  const [importTab, setImportTab] = useState<'paste' | 'file'>('paste');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [conflictMode, setConflictMode] = useState<'skip' | 'update' | 'replace'>('update');
  const [isDragging, setIsDragging] = useState(false);

  // Parse lines into Peserta objects
  const parseRows = (text: string): { items: Peserta[]; errors: string[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return { items: [], errors: [] };

    const items: Peserta[] = [];
    const errors: string[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const lower = line.toLowerCase();
      if (
        (lower.includes('id') || lower.includes('pps')) && 
        (lower.includes('nama') || lower.includes('name')) &&
        i === 0
      ) {
        continue;
      }

      let cols: string[] = [];
      if (line.includes('\t')) {
        cols = line.split('\t');
      } else if (line.includes(';')) {
        cols = line.split(';');
      } else if (line.includes('|')) {
        cols = line.split('|');
      } else {
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        cols = matches;
      }

      cols = cols.map(c => c.replace(/^["']|["']$/g, '').trim());

      const rawId = cols[0]?.toUpperCase().trim();
      const rawNama = cols[1]?.trim();
      const rawDomisili = cols[2]?.trim() || '';
      const rawKelas = cols[3]?.trim() || '';
      const rawJabatan = cols[4]?.trim() || 'Anggota';

      if (!rawId || !rawNama) {
        if (cols.length > 1) {
          errors.push(`Baris ${i + 1}: ID atau Nama kosong`);
        }
        continue;
      }

      if (seenIds.has(rawId)) {
        errors.push(`Baris ${i + 1}: Duplikasi ID "${rawId}" dalam data impor`);
        continue;
      }

      seenIds.add(rawId);
      items.push({
        id: rawId,
        nama: rawNama,
        domisili: rawDomisili,
        kelas: rawKelas,
        jabatan: rawJabatan
      });
    }

    return { items, errors };
  };

  const { items: parsedItems, errors: parseErrors } = useMemo(() => {
    return parseRows(rawText);
  }, [rawText]);

  const stats = useMemo(() => {
    const existingIdSet = new Set(existingPeserta.map(p => p.id.toUpperCase()));
    let newCount = 0;
    let existCount = 0;

    parsedItems.forEach(item => {
      if (existingIdSet.has(item.id)) {
        existCount++;
      } else {
        newCount++;
      }
    });

    return {
      total: parsedItems.length,
      newCount,
      existCount
    };
  }, [parsedItems, existingPeserta]);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setRawText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleLoadSample = () => {
    const sample = `PPS011\tMuhammad Rizky\tSurabaya\tXII MIPA 1\tKetua Delegasi
PPS012\tNurul Hidayah\tSidoarjo\tXI IPS 2\tSekretaris
PPS013\tFaris Al-Ghifari\tGresik\tXII Agama\tBendahara
PPS014\tZaskia Adelia\tMalang\tX MIPA 3\tAnggota
PPS015\tRian Kurniawan\tPasuruan\tXI MIPA 2\tAnggota
PPS016\tDewi Anggraini\tMojokerto\tXII IPS 1\tAnggota
PPS017\tAhmad Solihin\tLamongan\tX Agama\tAnggota
PPS018\tSalma Qonitah\tJombang\tXI IPS 3\tAnggota
PPS019\tDimas Pradana\tKediri\tXII MIPA 2\tAnggota
PPS020\tNadia Syaharani\tBlitar\tX MIPA 1\tAnggota`;
    setRawText(sample);
  };

  const handleExecuteImport = () => {
    if (parsedItems.length === 0) {
      alert('Tidak ada data valid yang bisa diimpor!');
      return;
    }

    onImport(parsedItems, conflictMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div 
        id="modal-impor-peserta"
        className="bg-white w-full max-w-3xl rounded-3xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Impor Database Peserta Massal</h3>
              <p className="text-[11px] text-slate-300">
                Tambah atau perbarui banyak data peserta sekaligus dari Excel / Sheets / CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Method Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <button
              type="button"
              id="tab-impor-paste"
              onClick={() => setImportTab('paste')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                importTab === 'paste'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ClipboardPaste className="w-4 h-4 text-emerald-600" />
              <span>Salin & Tempel (Excel / Google Sheets)</span>
            </button>

            <button
              type="button"
              id="tab-impor-file"
              onClick={() => setImportTab('file')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                importTab === 'file'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileUp className="w-4 h-4 text-teal-600" />
              <span>Upload File CSV / TXT</span>
            </button>
          </div>

          {/* Tab 1: Paste Input */}
          {importTab === 'paste' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Tempel Baris Data (Format: ID [tab] Nama [tab] Domisili [tab] Kelas [tab] Jabatan)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                  >
                    Isi Contoh 10 Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setRawText('')}
                    className="text-[11px] text-slate-500 hover:text-slate-700 font-medium px-2 py-1"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              <textarea
                id="textarea-bulk-paste"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Salin kolom dari Excel / Google Sheets lalu tempel di sini...&#10;Contoh:&#10;PPS011&#9;Ahmad Subagyo&#9;Surabaya&#9;XII&#9;Ketua&#10;PPS012&#9;Siti Rahma&#9;Malang&#9;XI&#9;Anggota"
                rows={6}
                className="w-full p-3.5 font-mono text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none bg-slate-50/50 leading-relaxed resize-y"
              />
            </div>
          )}

          {/* Tab 2: Upload File */}
          {importTab === 'file' && (
            <div className="space-y-3.5">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('modal-file-upload-input')?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <input
                  type="file"
                  id="modal-file-upload-input"
                  accept=".csv,.txt,.tsv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 mb-0.5">
                  {fileName ? `File: ${fileName}` : 'Klik untuk memilih file CSV / TXT atau seret ke sini'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Mendukung berkas CSV atau file teks hasil ekspor spreadsheet
                </p>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Info className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Format file CSV standar</span>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplatePesertaCSV}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unduh Template CSV</span>
                </button>
              </div>
            </div>
          )}

          {/* Options: Conflict Handling */}
          <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Opsi Penanganan ID yang Sudah Ada:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label 
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2 ${
                  conflictMode === 'update'
                    ? 'border-emerald-500 bg-white text-slate-900 shadow-2xs'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="conflictMode"
                  value="update"
                  checked={conflictMode === 'update'}
                  onChange={() => setConflictMode('update')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-800">Perbarui (Update)</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">
                    Data lama akan diperbarui dengan data baru
                  </div>
                </div>
              </label>

              <label 
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2 ${
                  conflictMode === 'skip'
                    ? 'border-emerald-500 bg-white text-slate-900 shadow-2xs'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="conflictMode"
                  value="skip"
                  checked={conflictMode === 'skip'}
                  onChange={() => setConflictMode('skip')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-800">Lewati (Skip)</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">
                    Hanya menambahkan ID baru, data lama tetap
                  </div>
                </div>
              </label>

              <label 
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2 ${
                  conflictMode === 'replace'
                    ? 'border-emerald-500 bg-white text-slate-900 shadow-2xs'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="conflictMode"
                  value="replace"
                  checked={conflictMode === 'replace'}
                  onChange={() => setConflictMode('replace')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-red-600">Ganti Seluruh DB</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">
                    Hapus semua data lama dan ganti dengan ini
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Validation & Preview Section */}
          {rawText.trim().length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{stats.total} Peserta Terbaca</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-semibold">
                  <span>{stats.newCount} ID Baru</span>
                </div>

                {stats.existCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{stats.existCount} ID Sudah Terdaftar</span>
                  </div>
                )}
              </div>

              {parseErrors.length > 0 && (
                <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-800 space-y-0.5 max-h-20 overflow-y-auto">
                  <div className="font-semibold">Catatan baris yang dilewati ({parseErrors.length}):</div>
                  {parseErrors.slice(0, 3).map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                </div>
              )}

              {/* Live Preview Table */}
              <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Pratinjau Hasil Impor ({Math.min(parsedItems.length, 8)} dari {parsedItems.length} baris)</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2">ID PPS</th>
                        <th className="p-2">Nama</th>
                        <th className="p-2">Domisili</th>
                        <th className="p-2">Kelas</th>
                        <th className="p-2">Jabatan</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedItems.slice(0, 10).map((p, idx) => {
                        const isExist = existingPeserta.some(x => x.id === p.id);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="p-2 font-mono font-bold text-slate-800">{p.id}</td>
                            <td className="p-2 font-medium text-slate-800">{p.nama}</td>
                            <td className="p-2 text-slate-500">{p.domisili || '-'}</td>
                            <td className="p-2 text-slate-500">{p.kelas || '-'}</td>
                            <td className="p-2 text-slate-500">{p.jabatan || 'Anggota'}</td>
                            <td className="p-2">
                              {isExist ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                                  Sudah Ada
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                                  Baru
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            id="btn-eksekusi-impor-massal"
            onClick={handleExecuteImport}
            disabled={parsedItems.length === 0}
            className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              parsedItems.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Impor {parsedItems.length > 0 ? `${parsedItems.length} Peserta` : 'Data'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
