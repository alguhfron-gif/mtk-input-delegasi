import React, { useState } from 'react';
import { Delegasi, Peserta } from '../types';
import { formatRupiah, formatTanggalMasehi, formatTanggalHijri } from '../utils/format';
import { exportDelegasiCSV } from '../utils/csv';
import { exportDelegasiExcel, exportDelegasiPDF } from '../utils/exportUtils';
import { 
  BarChart3, 
  Search, 
  FileSpreadsheet, 
  FileText,
  Download,
  Edit3, 
  Receipt, 
  Coins, 
  CreditCard, 
  PiggyBank, 
  ListChecks,
  CheckCircle2,
  Loader2
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
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

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

  const handleExportExcel = () => {
    try {
      setDownloadingFormat('excel');
      exportDelegasiExcel(delegasiList, pesertaList);
      setSuccessToast('Laporan Excel (.xlsx) berhasil diunduh!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Export Excel failed:', err);
      alert('Gagal mengunduh Excel.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleExportPDF = () => {
    try {
      setDownloadingFormat('pdf');
      exportDelegasiPDF(delegasiList, pesertaList);
      setSuccessToast('Laporan PDF (.pdf) resmi berhasil diunduh!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Export PDF failed:', err);
      alert('Gagal mengunduh PDF.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleExportCSV = () => {
    try {
      setDownloadingFormat('csv');
      exportDelegasiCSV(delegasiList, pesertaList);
      setSuccessToast('Data CSV berhasil diunduh!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Export CSV failed:', err);
      alert('Gagal mengunduh CSV.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div id="page-riwayat" className="space-y-6 sm:space-y-7 animate-fadeIn">
      {/* Title & Action Buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <BarChart3 className="w-5 h-5" />
            </span>
            Riwayat & Laporan Delegasi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar riwayat kegiatan delegasi, pencatatan nota, dan unduh data laporan ke Excel & PDF untuk HP dan Komputer.
          </p>
        </div>

        {/* Export Buttons: Excel, PDF, CSV */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Unduh Excel (.xlsx) */}
          <button
            id="btn-ekspor-riwayat-excel"
            onClick={handleExportExcel}
            disabled={downloadingFormat === 'excel' || delegasiList.length === 0}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Unduh format spreadsheet Excel (.xlsx) lengkap dengan rincian"
          >
            {downloadingFormat === 'excel' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>Unduh Excel</span>
          </button>

          {/* Unduh PDF (.pdf) */}
          <button
            id="btn-ekspor-riwayat-pdf"
            onClick={handleExportPDF}
            disabled={downloadingFormat === 'pdf' || delegasiList.length === 0}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Unduh laporan dokumen PDF resmi siap cetak"
          >
            {downloadingFormat === 'pdf' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>Unduh PDF</span>
          </button>

          {/* Unduh CSV */}
          <button
            id="btn-ekspor-riwayat-csv"
            onClick={handleExportCSV}
            disabled={downloadingFormat === 'csv' || delegasiList.length === 0}
            className="px-3 py-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Ekspor data CSV mentah"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

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
                <th className="p-3 font-semibold text-center w-28">Aksi</th>
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
                            className="px-2 py-1 text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer border border-indigo-200/60 bg-indigo-50/40 flex items-center gap-1 font-semibold text-[11px]"
                            title="Buka Nota, Simpan Gambar & Cetak"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Nota</span>
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
