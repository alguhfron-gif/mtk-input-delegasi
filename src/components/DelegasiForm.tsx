import React, { useState, useEffect, useMemo } from 'react';
import { Delegasi, Peserta, RincianItem } from '../types';
import { formatRupiah } from '../utils/format';
import { 
  FileEdit, 
  Plus, 
  X, 
  Save, 
  Undo2, 
  Calendar, 
  MapPin, 
  Wallet, 
  Receipt, 
  Trash2,
  Users,
  CheckCircle2,
  UserCheck,
  Building,
  GraduationCap,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface DelegasiFormProps {
  pesertaList: Peserta[];
  editDelegasi: Delegasi | null;
  onSaveDelegasi: (data: Omit<Delegasi, 'id'>, editId?: number) => void;
  onCancelEdit: () => void;
}

export const DelegasiForm: React.FC<DelegasiFormProps> = ({
  pesertaList,
  editDelegasi,
  onSaveDelegasi,
  onCancelEdit
}) => {
  const [selectedPesertaIds, setSelectedPesertaIds] = useState<string[]>([]);
  const [inputPesertaId, setInputPesertaId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tujuan, setTujuan] = useState('');
  const [tglBerangkat, setTglBerangkat] = useState('');
  const [tglKembali, setTglKembali] = useState('');
  const [uangDibawa, setUangDibawa] = useState<number>(0);
  const [rincian, setRincian] = useState<RincianItem[]>([
    { nama: 'Transportasi', nominal: 0 },
    { nama: 'Foto Copy', nominal: 0 },
    { nama: 'Konsumsi', nominal: 0 }
  ]);

  useEffect(() => {
    if (editDelegasi) {
      setSelectedPesertaIds([...editDelegasi.peserta]);
      setTujuan(editDelegasi.tujuan);
      setTglBerangkat(editDelegasi.tglBerangkat || '');
      setTglKembali(editDelegasi.tglKembali || '');
      setUangDibawa(editDelegasi.uangDibawa);
      setRincian(
        editDelegasi.rincian.length > 0
          ? editDelegasi.rincian.map(r => ({ ...r }))
          : [
              { nama: 'Transportasi', nominal: 0 },
              { nama: 'Foto Copy', nominal: 0 },
              { nama: 'Konsumsi', nominal: 0 }
            ]
      );
    } else {
      resetForm();
    }
  }, [editDelegasi]);

  const resetForm = () => {
    setSelectedPesertaIds([]);
    setInputPesertaId('');
    setTujuan('');
    setTglBerangkat('');
    setTglKembali('');
    setUangDibawa(0);
    setRincian([
      { nama: 'Transportasi', nominal: 0 },
      { nama: 'Foto Copy', nominal: 0 },
      { nama: 'Konsumsi', nominal: 0 }
    ]);
  };

  // Find exact or primary matched peserta based on typed ID/query
  const matchedPeserta = useMemo(() => {
    const query = inputPesertaId.trim().toUpperCase();
    if (!query) return null;

    const exact = pesertaList.find(p => p.id.toUpperCase() === query);
    if (exact) return exact;

    const partialId = pesertaList.find(p => p.id.toUpperCase().includes(query));
    if (partialId) return partialId;

    const byName = pesertaList.find(p => p.nama.toUpperCase().includes(query));
    return byName || null;
  }, [inputPesertaId, pesertaList]);

  // Suggestions for autocomplete dropdown
  const filteredSuggestions = useMemo(() => {
    const q = inputPesertaId.trim().toLowerCase();
    if (!q) return [];
    return pesertaList.filter(p => 
      p.id.toLowerCase().includes(q) || 
      p.nama.toLowerCase().includes(q) ||
      p.domisili.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [inputPesertaId, pesertaList]);

  const handleAddPesertaToGroup = (targetId?: string) => {
    const idToAdd = (targetId || (matchedPeserta ? matchedPeserta.id : inputPesertaId)).trim().toUpperCase();
    if (!idToAdd) return;

    const exists = pesertaList.find(p => p.id === idToAdd);
    if (!exists) {
      alert(`Peserta dengan ID "${idToAdd}" tidak ditemukan di database peserta.`);
      return;
    }

    if (selectedPesertaIds.includes(idToAdd)) {
      alert(`Peserta ${exists.nama} (${idToAdd}) sudah ditambahkan ke tim.`);
      return;
    }

    setSelectedPesertaIds(prev => [...prev, idToAdd]);
    setInputPesertaId('');
    setIsDropdownOpen(false);
  };

  const handleRemovePesertaFromGroup = (idToRemove: string) => {
    setSelectedPesertaIds(prev => prev.filter(id => id !== idToRemove));
  };

  const handleRincianChange = (index: number, field: keyof RincianItem, value: string | number) => {
    const updated = [...rincian];
    if (field === 'nominal') {
      updated[index].nominal = typeof value === 'number' ? value : parseFloat(value as string) || 0;
    } else {
      updated[index].nama = value as string;
    }
    setRincian(updated);
  };

  const handleAddRincianItem = () => {
    setRincian([...rincian, { nama: '', nominal: 0 }]);
  };

  const handleRemoveRincianItem = (index: number) => {
    setRincian(rincian.filter((_, idx) => idx !== index));
  };

  const totalTerpakai = rincian.reduce((sum, item) => sum + (item.nominal || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPesertaIds.length < 2) {
      alert('Delegasi minimal harus beranggotakan 2 peserta!');
      return;
    }

    const cleanTujuan = tujuan.trim();
    if (!cleanTujuan) {
      alert('Tujuan delegasi wajib diisi!');
      return;
    }

    const cleanRincian = rincian
      .filter(item => item.nama.trim() || item.nominal > 0)
      .map(item => ({
        nama: item.nama.trim() || 'Lain-lain',
        nominal: item.nominal || 0
      }));

    onSaveDelegasi(
      {
        peserta: [...selectedPesertaIds],
        tujuan: cleanTujuan,
        tglBerangkat: tglBerangkat || null,
        tglKembali: tglKembali || null,
        uangDibawa,
        rincian: cleanRincian,
        uangTerpakai: totalTerpakai
      },
      editDelegasi ? editDelegasi.id : undefined
    );

    resetForm();
  };

  return (
    <div id="page-input-delegasi" className="space-y-7 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <FileEdit className="w-5 h-5" />
            </span>
            {editDelegasi ? 'Edit Data Delegasi' : 'Form Input Delegasi'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ketik ID PPS peserta untuk memuat data otomatis, lalu atur rincian tugas dan keuangan.
          </p>
        </div>

        {editDelegasi && (
          <span className="bg-amber-50 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-amber-200/70 w-fit">
            Mode Edit (ID: #{editDelegasi.id})
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Participants with Auto Lookup */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              1. Anggota Delegasi (Min. 2 Peserta)
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70">
              {selectedPesertaIds.length} Terpilih
            </span>
          </div>

          {/* Search / Input with Auto-Fill Display */}
          <div className="space-y-3">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Ketik ID PPS / Cari Nama:
            </label>

            <div className="flex flex-col sm:flex-row gap-3 relative">
              <div className="relative flex-1">
                <input
                  id="input-pps-delegasi"
                  type="text"
                  value={inputPesertaId}
                  onChange={(e) => {
                    setInputPesertaId(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPesertaToGroup();
                    }
                  }}
                  placeholder="Ketik ID PPS (misal: PPS001, PPS002, atau Nama)..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs font-medium transition-all"
                  autoComplete="off"
                />

                {inputPesertaId && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputPesertaId('');
                      setIsDropdownOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Autocomplete Dropdown List */}
                {isDropdownOpen && filteredSuggestions.length > 0 && inputPesertaId.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {filteredSuggestions.map((p) => {
                      const isAlreadyInTeam = selectedPesertaIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setInputPesertaId(p.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                            isAlreadyInTeam ? 'bg-slate-50 opacity-70' : 'hover:bg-emerald-50/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              {p.id}
                            </span>
                            <div>
                              <div className="font-semibold text-xs text-slate-800">{p.nama}</div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span>{p.domisili || '-'}</span>
                                <span>•</span>
                                <span>{p.kelas || '-'}</span>
                                <span>•</span>
                                <span className="text-slate-700 font-medium">{p.jabatan || 'Anggota'}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {isAlreadyInTeam ? (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Sudah di Tim
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Pilih
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                id="btn-tambah-peserta-grup"
                onClick={() => handleAddPesertaToGroup()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah ke Tim</span>
              </button>
            </div>

            {/* AUTO LOOKUP PREVIEW CARD */}
            {matchedPeserta ? (
              <div 
                id="preview-peserta-card" 
                className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 shadow-2xs transition-all animate-fadeIn"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                      {matchedPeserta.nama.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-emerald-700 text-white px-2 py-0.5 rounded">
                          {matchedPeserta.id}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {matchedPeserta.nama}
                        </span>
                        {selectedPesertaIds.includes(matchedPeserta.id) ? (
                          <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                            <CheckCircle2 className="w-3 h-3 text-amber-600" />
                            Sudah di Tim
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Data Terdeteksi Otomatis
                          </span>
                        )}
                      </div>

                      {/* Detail Otomatis: Domisili, Kelas, Jabatan */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-100">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-500">Domisili:</span>
                          <span className="font-semibold text-slate-800">{matchedPeserta.domisili || '-'}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-100">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-500">Kelas:</span>
                          <span className="font-semibold text-slate-800">{matchedPeserta.kelas || '-'}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-100">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-500">Jabatan:</span>
                          <span className="font-semibold text-slate-800">{matchedPeserta.jabatan || 'Anggota'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!selectedPesertaIds.includes(matchedPeserta.id) && (
                    <button
                      type="button"
                      onClick={() => handleAddPesertaToGroup(matchedPeserta.id)}
                      className="self-end md:self-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Tambahkan Peserta</span>
                    </button>
                  )}
                </div>
              </div>
            ) : inputPesertaId.trim().length > 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs text-slate-600 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  ID atau Nama "<strong>{inputPesertaId}</strong>" tidak ditemukan. Cek kembali atau tambahkan data peserta terlebih dahulu di Database Peserta.
                </span>
              </div>
            ) : null}
          </div>

          {/* Selected Team Members List */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Daftar Anggota Tim Terpilih:
            </label>

            <div className="min-h-20 p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
              {selectedPesertaIds.length === 0 ? (
                <div className="py-5 text-center text-xs text-slate-400 font-medium">
                  Belum ada peserta dipilih. Ketik ID PPS di atas untuk menambahkan minimal 2 orang.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {selectedPesertaIds.map((id, index) => {
                    const p = pesertaList.find(x => x.id === id);
                    return (
                      <div
                        key={id}
                        className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2.5 hover:border-emerald-300 transition-all"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-100">
                            {index + 1}
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-slate-800">{id}</span>
                              <span className="text-xs font-semibold text-slate-800 truncate">
                                {p ? p.nama : id}
                              </span>
                            </div>
                            {p && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                                <span>{p.domisili || '-'}</span>
                                <span>•</span>
                                <span>{p.kelas || '-'}</span>
                                <span>•</span>
                                <span className="font-medium text-slate-700">{p.jabatan || 'Anggota'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePesertaFromGroup(id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Hapus dari Tim"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Activity Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-emerald-600" />
            2. Informasi Kegiatan & Tanggal
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="md:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Tujuan Delegasi *
              </label>
              <input
                id="input-tujuan-delegasi"
                type="text"
                value={tujuan}
                onChange={(e) => setTujuan(e.target.value)}
                placeholder="Contoh: BM ke MWCNU Surabaya / Lomba MTK Wilayah"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Tanggal Berangkat
              </label>
              <input
                id="input-tgl-berangkat"
                type="datetime-local"
                value={tglBerangkat}
                onChange={(e) => setTglBerangkat(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Tanggal Kembali
              </label>
              <input
                id="input-tgl-kembali"
                type="datetime-local"
                value={tglKembali}
                onChange={(e) => setTglKembali(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-slate-400" />
                Uang Dibawa (Rp)
              </label>
              <input
                id="input-uang-dibawa"
                type="number"
                min="0"
                value={uangDibawa || ''}
                onChange={(e) => setUangDibawa(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs font-semibold text-emerald-800"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Expense Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              3. Rincian Pengeluaran
            </h3>
            <span className="text-xs font-bold text-slate-800 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
              Total: {formatRupiah(totalTerpakai)}
            </span>
          </div>

          <div className="space-y-2.5">
            {rincian.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={item.nama}
                  onChange={(e) => handleRincianChange(idx, 'nama', e.target.value)}
                  placeholder="Keterangan Pengeluaran (misal: Transportasi, Foto Copy, Konsumsi)"
                  className="flex-2 px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs"
                />
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={item.nominal || ''}
                    onChange={(e) => handleRincianChange(idx, 'nominal', e.target.value)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-xs font-semibold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRincianItem(idx)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Hapus Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            id="btn-tambah-item-rincian"
            onClick={handleAddRincianItem}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Item Pengeluaran</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            id="btn-simpan-delegasi-submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{editDelegasi ? 'Perbarui Data Delegasi' : 'Simpan Data Delegasi'}</span>
          </button>

          {editDelegasi && (
            <button
              type="button"
              id="btn-batal-edit-delegasi"
              onClick={onCancelEdit}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Batal Edit</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
