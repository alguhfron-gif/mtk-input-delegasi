import React, { useState } from 'react';
import { Delegasi, Peserta } from '../types';
import { formatRupiah, formatTanggalMasehi, formatTanggalHijri } from '../utils/format';
import { exportDelegasiCSV } from '../utils/csv';
import { 
  BarChart3, 
  Search, 
  FileSpreadsheet, 
  Edit3, 
  Receipt, 
  Coins, 
  CreditCard, 
  PiggyBank, 
  ListChecks 
} from 'lucide-react';

interface RiwayatLaporanProps {
  delegasiList: Delegasi[];
  pesertaList: Peserta[];
  onEditDelegasi: (index: number) => void;
  onPrintNota: (delegasi: Delegasi) => void;
}

export const RiwayatLaporan: React.FC<RiwayatLaporanProps> = ({
  delegasiList,
  pesertaList,
  onEditDelegasi,
  onPrintNota
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = delegasiList.filter(d => {
    const names = d.peserta
      .map(id => {
        const p = pesertaList.find(x => x.id === id);
        return p ? p.nama : id;
      })
      .join(' ')
      .toLowerCase();

    return (
      names.includes(searchQuery.toLowerCase()) ||
      d.tujuan.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalDibawa = delegasiList.reduce((sum, d) => sum + d.uangDibawa, 0);
  const totalTerpakai = delegasiList.reduce((sum, d) => sum + d.uangTerpakai, 0);
  const totalSisa = totalDibawa - totalTerpakai;

  return (
    <div id="page-riwayat" className="space-y-7 animate-fadeIn">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <BarChart3 className="w-5 h-5" />
            </span>
            Riwayat & Laporan Delegasi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar seluruh riwayat delegasi, rincian biaya, cetak nota, dan ekspor data laporan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-ekspor-riwayat-csv"
            onClick={() => exportDelegasiCSV(delegasiList, pesertaList)}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/60">
              <ListChecks className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Total Delegasi</div>
              <div className="text-lg font-bold text-slate-800">{delegasiList.length} Kegiatan</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/60">
              <Coins className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Total Uang Dibawa</div>
              <div className="text-lg font-bold text-slate-800">{formatRupiah(totalDibawa)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100/60">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Total Terpakai</div>
              <div className="text-lg font-bold text-rose-700">{formatRupiah(totalTerpakai)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/60">
              <PiggyBank className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Sisa Akumulasi</div>
              <div className={`text-lg font-bold ${totalSisa >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {formatRupiah(totalSisa)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-riwayat-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama peserta atau tujuan kegiatan..."
            className="w-full pl-9.5 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table id="table-riwayat-delegasi" className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
              <tr>
                <th className="p-3 font-semibold text-center w-12">No</th>
                <th className="p-3 font-semibold">Anggota Delegasi</th>
                <th className="p-3 font-semibold">Tujuan Kegiatan</th>
                <th className="p-3 font-semibold">Jadwal Berangkat</th>
                <th className="p-3 font-semibold">Jadwal Kembali</th>
                <th className="p-3 font-semibold text-right">Dibawa</th>
                <th className="p-3 font-semibold text-right">Terpakai</th>
                <th className="p-3 font-semibold text-right">Sisa Dana</th>
                <th className="p-3 font-semibold text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400 font-medium">
                    Tidak ada riwayat delegasi ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const actualIndex = delegasiList.findIndex(x => x.id === item.id);
                  const sisa = item.uangDibawa - item.uangTerpakai;
                  const isPositif = sisa >= 0;

                  const names = item.peserta
                    .map(id => {
                      const p = pesertaList.find(x => x.id === id);
                      return p ? p.nama : id;
                    })
                    .join(', ');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-800 max-w-xs truncate" title={names}>
                        {names}
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{item.tujuan}</td>
                      <td className="p-3">
                        <div className="text-slate-700 font-medium">
                          {formatTanggalMasehi(item.tglBerangkat)}
                        </div>
                        <div className="text-[10px] text-teal-700 font-medium">
                          {formatTanggalHijri(item.tglBerangkat)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-700 font-medium">
                          {formatTanggalMasehi(item.tglKembali)}
                        </div>
                        <div className="text-[10px] text-teal-700 font-medium">
                          {formatTanggalHijri(item.tglKembali)}
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium text-slate-700">
                        {formatRupiah(item.uangDibawa)}
                      </td>
                      <td className="p-3 text-right font-medium text-slate-700">
                        {formatRupiah(item.uangTerpakai)}
                      </td>
                      <td className={`p-3 text-right font-bold ${isPositif ? 'text-emerald-700' : 'text-red-600'}`}>
                        {formatRupiah(sisa)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`btn-edit-delegasi-${item.id}`}
                            onClick={() => onEditDelegasi(actualIndex)}
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer border border-amber-200/60 bg-amber-50/40"
                            title="Edit Delegasi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`btn-nota-delegasi-${item.id}`}
                            onClick={() => onPrintNota(item)}
                            className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer border border-indigo-200/60 bg-indigo-50/40"
                            title="Cetak & Simpan Nota"
                          >
                            <Receipt className="w-3.5 h-3.5" />
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
    </div>
  );
};
