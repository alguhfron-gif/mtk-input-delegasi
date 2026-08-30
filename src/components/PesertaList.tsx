import React, { useState } from 'react';
import { Peserta } from '../types';
import { exportPesertaCSV, downloadTemplatePesertaCSV } from '../utils/csv';
import { ImportPesertaModal } from './ImportPesertaModal';
import { 
  Users, 
  UserPlus, 
  FileUp, 
  RotateCcw, 
  Trash2, 
  Search, 
  FileSpreadsheet, 
  Layers, 
  Download, 
  Building, 
  GraduationCap, 
  Briefcase,
  Edit3,
  Save,
  X
} from 'lucide-react';

interface PesertaListProps {
  pesertaList: Peserta[];
  onAddPeserta: (newP: Peserta) => void;
  onEditPeserta?: (updated: Peserta) => void;
  onDeletePeserta: (id: string) => void;
  onResetDefault: () => void;
  onImportCSV: (pesertaArray: Peserta[], mode?: 'skip' | 'update' | 'replace') => void;
}

export const PesertaList: React.FC<PesertaListProps> = ({
  pesertaList,
  onAddPeserta,
  onEditPeserta,
  onDeletePeserta,
  onResetDefault,
  onImportCSV
}) => {
  const [idPPS, setIdPPS] = useState('');
  const [nama, setNama] = useState('');
  const [domisili, setDomisili] = useState('');
  const [kelas, setKelas] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Edit Modal State
  const [editingPeserta, setEditingPeserta] = useState<Peserta | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = idPPS.trim().toUpperCase();
    const cleanNama = nama.trim();

    if (!cleanId || !cleanNama) {
      alert('ID PPS dan Nama Wajib diisi!');
      return;
    }

    if (pesertaList.some(p => p.id === cleanId)) {
      alert(`ID PPS "${cleanId}" sudah digunakan. Silakan gunakan ID lain atau perbarui lewat tombol Edit.`);
      return;
    }

    onAddPeserta({
      id: cleanId,
      nama: cleanNama,
      domisili: domisili.trim(),
      kelas: kelas.trim(),
      jabatan: jabatan.trim() || 'Anggota'
    });

    setIdPPS('');
    setNama('');
    setDomisili('');
    setKelas('');
    setJabatan('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeserta) return;

    if (!editingPeserta.nama.trim()) {
      alert('Nama Peserta tidak boleh kosong!');
      return;
    }

    if (onEditPeserta) {
      onEditPeserta(editingPeserta);
    } else {
      onAddPeserta(editingPeserta);
    }

    setEditingPeserta(null);
  };

  const handleImportModalExecute = (newItems: Peserta[], mode: 'skip' | 'update' | 'replace') => {
    onImportCSV(newItems, mode);
  };

  const filteredList = pesertaList.filter(p => 
    p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.jabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.domisili.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.kelas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="page-peserta" className="space-y-7 animate-fadeIn">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
              <Users className="w-5 h-5" />
            </span>
            Database Peserta
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola master data santri & pengurus untuk integrasi otomatis saat pengisian form delegasi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-buka-modal-impor"
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Impor Massal (Banyak Data)</span>
          </button>

          <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200/80">
            Total: {pesertaList.length} Peserta
          </span>
        </div>
      </div>

      {/* Add Form - Clean Soft Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-emerald-600" />
          Tambah Peserta Baru
        </h3>
        
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              ID PPS *
            </label>
            <input
              id="input-id-pps"
              type="text"
              value={idPPS}
              onChange={(e) => setIdPPS(e.target.value)}
              placeholder="Contoh: PPS011"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs transition-all font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Nama Lengkap *
            </label>
            <input
              id="input-nama-peserta"
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Ahmad Fauzi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs transition-all font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Domisili (Dom)
            </label>
            <input
              id="input-domisili"
              type="text"
              value={domisili}
              onChange={(e) => setDomisili(e.target.value)}
              placeholder="Jakarta / Surabaya"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Kelas
            </label>
            <input
              id="input-kelas"
              type="text"
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              placeholder="XII / 3 Aliyah"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Jabatan
            </label>
            <input
              id="input-jabatan"
              type="text"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              placeholder="Ketua / Anggota"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs transition-all"
            />
          </div>

          <div>
            <button
              id="btn-tambah-peserta"
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 text-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Simpan Data</span>
            </button>
          </div>
        </form>
      </div>

      {/* Toolbar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3.5">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-peserta-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID PPS, Nama, Domisili..."
            className="w-full pl-9.5 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            id="btn-impor-csv"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-emerald-200 transition-colors cursor-pointer"
          >
            <FileUp className="w-3.5 h-3.5 text-emerald-700" />
            <span>Impor Massal</span>
          </button>

          <button
            id="btn-template-csv"
            onClick={downloadTemplatePesertaCSV}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh Format CSV</span>
          </button>

          <button
            id="btn-ekspor-peserta-csv"
            onClick={() => exportPesertaCSV(pesertaList)}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            id="btn-reset-peserta"
            onClick={() => {
              if (confirm('Kembalikan database peserta ke data awal bawaan sistem?')) {
                onResetDefault();
              }
            }}
            className="px-3 py-2 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bawaan</span>
          </button>
        </div>
      </div>

      {/* Table of Participants */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="table-peserta-list" className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
              <tr>
                <th className="p-3.5 font-semibold uppercase tracking-wider">ID PPS</th>
                <th className="p-3.5 font-semibold uppercase tracking-wider">Nama Lengkap</th>
                <th className="p-3.5 font-semibold uppercase tracking-wider">Domisili</th>
                <th className="p-3.5 font-semibold uppercase tracking-wider">Kelas</th>
                <th className="p-3.5 font-semibold uppercase tracking-wider">Jabatan</th>
                <th className="p-3.5 font-semibold uppercase tracking-wider text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-medium">Tidak ada data peserta ditemukan.</p>
                      <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="text-xs text-emerald-700 font-bold hover:underline"
                      >
                        Impor data peserta dalam jumlah banyak
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                          {p.id}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">{p.nama}</td>
                      <td className="p-3.5 text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {p.domisili || '-'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          {p.kelas || '-'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200/70">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          {p.jabatan || 'Anggota'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`btn-edit-peserta-${p.id}`}
                            onClick={() => setEditingPeserta({ ...p })}
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer border border-amber-200/60 bg-amber-50/40"
                            title={`Edit ${p.nama}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-delete-peserta-${p.id}`}
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus peserta ${p.nama} (ID: ${p.id}) dari database?`)) {
                                onDeletePeserta(p.id);
                              }
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-red-200/60 bg-red-50/40"
                            title={`Hapus ${p.nama}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Peserta Modal */}
      {editingPeserta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-800">
                  Edit Data Peserta: <span className="font-mono text-slate-600">{editingPeserta.id}</span>
                </h3>
              </div>
              <button
                onClick={() => setEditingPeserta(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  ID PPS (Kunci Utama)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingPeserta.id}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={editingPeserta.nama}
                  onChange={(e) => setEditingPeserta({ ...editingPeserta, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Domisili
                  </label>
                  <input
                    type="text"
                    value={editingPeserta.domisili}
                    onChange={(e) => setEditingPeserta({ ...editingPeserta, domisili: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Kelas
                  </label>
                  <input
                    type="text"
                    value={editingPeserta.kelas}
                    onChange={(e) => setEditingPeserta({ ...editingPeserta, kelas: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Jabatan
                </label>
                <input
                  type="text"
                  value={editingPeserta.jabatan}
                  onChange={(e) => setEditingPeserta({ ...editingPeserta, jabatan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPeserta(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <ImportPesertaModal
        existingPeserta={pesertaList}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportModalExecute}
      />
    </div>
  );
};
