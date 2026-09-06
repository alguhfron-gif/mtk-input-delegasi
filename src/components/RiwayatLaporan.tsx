import React, { useState, useMemo } from 'react';
import { Delegasi, Peserta } from '../types';
import { 
  formatRupiah, 
  formatTanggalMasehi, 
  formatTanggalHijri, 
  getHijriInfo,
  getPesantrenSortWeight,
  HIJRI_MONTHS 
} from '../utils/format';
import { exportDelegasiCSV } from '../utils/csv';
import { exportDelegasiExcel, exportDelegasiPDF } from '../utils/exportUtils';
import { TouchScrollContainer } from './TouchScrollContainer';
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
  Loader2,
  Calendar,
  Filter,
  RotateCcw
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
  const [selectedHijriMonth, setSelectedHijriMonth] = useState<string>('all');
  const [selectedHijriYear, setSelectedHijriYear] = useState<string>('all');
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Extract available Hijri years from delegasi records
  const availableHijriYears = useMemo(() => {
    const yearsSet = new Set<number>();
    delegasiList.forEach(d => {
      const info = getHijriInfo(d.tglBerangkat);
      if (info) yearsSet.add(info.year);
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [delegasiList]);

  // Filter and Sort according to Hijri date and month
  const filteredAndSorted = useMemo(() => {
    // 1. Filter
    const filtered = delegasiList.filter(d => {
      // Search by participant name or destination
      const names = d.peserta
        .map(id => {
          const p = pesertaList.find(x => x.id === id);
          return p ? p.nama : id;
        })
        .join(' ')
        .toLowerCase();

      const matchesSearch = 
        names.includes(searchQuery.toLowerCase()) ||
        d.tujuan.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filter by Hijri Month
      if (selectedHijriMonth !== 'all') {
        const info = getHijriInfo(d.tglBerangkat);
        if (!info || info.month.toString() !== selectedHijriMonth) return false;
      }

      // Filter by Hijri Year
      if (selectedHijriYear !== 'all') {
        const info = getHijriInfo(d.tglBerangkat);
        if (!info || info.year.toString() !== selectedHijriYear) return false;
      }

      return true;
    });

    // 2. Pengurutan otomatis kalender ajaran pesantren:
    // Urutan paling bawah adalah: Syawal, Dzul Qa'dah, Dzul Hijjah, Muharram, Shafar, Rabiul Awal, Rabiul Tsani, Jumadal Ula, Jumadas Tsani, Rajab, Sya'ban, Ramadhan
    // Paling atas adalah tanggal & bulan terbaru, dan paling bawah adalah yang paling lama/awal siklus.
    return [...filtered].sort((a, b) => {
      const weightA = getPesantrenSortWeight(a.tglBerangkat);
      const weightB = getPesantrenSortWeight(b.tglBerangkat);

      if (weightA !== weightB) {
        return weightB - weightA; // Bobot lebih tinggi (terbaru) di atas, Syawal di paling bawah
      }
      const timeA = a.tglBerangkat ? new Date(a.tglBerangkat).getTime() : 0;
      const timeB = b.tglBerangkat ? new Date(b.tglBerangkat).getTime() : 0;
      return timeB - timeA;
    });
  }, [delegasiList, pesertaList, searchQuery, selectedHijriMonth, selectedHijriYear]);

  const totalDibawa = filteredAndSorted.reduce((sum, d) => sum + d.uangDibawa, 0);
  const totalTerpakai = filteredAndSorted.reduce((sum, d) => sum + d.uangTerpakai, 0);
  const totalSisa = totalDibawa - totalTerpakai;

  const handleExportExcel = () => {
    try {
      setDownloadingFormat('excel');
      exportDelegasiExcel(filteredAndSorted, pesertaList);
      setSuccessToast('Laporan Excel (.xlsx) berhasil diunduh sesuai urutan kalender Hijriah!');
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
      exportDelegasiPDF(filteredAndSorted, pesertaList);
      setSuccessToast('Laporan PDF (.pdf) resmi berhasil diunduh sesuai urutan kalender Hijriah!');
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
      exportDelegasiCSV(filteredAndSorted, pesertaList);
      setSuccessToast('Data CSV berhasil diunduh sesuai urutan kalender Hijriah!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Export CSV failed:', err);
      alert('Gagal mengunduh CSV.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedHijriMonth('all');
    setSelectedHijriYear('all');
  };

  return (
    <div id="page-riwayat" className="space-y-6 sm:space-y-7 animate-fadeIn">
      {/* Title & Action Buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <BarChart3 className="w-5 h-5" />
            </span>
            Riwayat & Laporan Delegasi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data delegasi tersusun berurutan: Syawal di paling bawah berurutan hingga bulan dan tanggal terbaru di paling atas.
          </p>
        </div>

        {/* Export Buttons: Excel, PDF, CSV */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Unduh Excel (.xlsx) */}
          <button
            id="btn-ekspor-riwayat-excel"
            onClick={handleExportExcel}
            disabled={downloadingFormat === 'excel' || filteredAndSorted.length === 0}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Unduh format spreadsheet Excel (.xlsx) terurut tanggal Hijriah"
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
            disabled={downloadingFormat === 'pdf' || filteredAndSorted.length === 0}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Unduh dokumen PDF resmi terurut tanggal Hijriah"
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
            disabled={downloadingFormat === 'csv' || filteredAndSorted.length === 0}
            className="px-3 py-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Ekspor data CSV terurut"
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
              <div className="text-[11px] font-semibold text-slate-400">Total Delegasi Ditampilkan</div>
              <div className="text-lg font-bold text-slate-800">{filteredAndSorted.length} Kegiatan</div>
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

      {/* Filter & Sorting Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-riwayat-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama peserta atau tujuan kegiatan..."
              className="w-full pl-9.5 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none"
            />
          </div>

          {/* Controls: Filter Bulan & Tahun Hijriah */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Bulan Hijriah */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="text-[11px] font-medium text-slate-500 shrink-0">Bulan:</span>
              <select
                id="select-bulan-hijriah"
                value={selectedHijriMonth}
                onChange={(e) => setSelectedHijriMonth(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Bulan Hijriah</option>
                <option value="10">10. Syawal (Paling Bawah)</option>
                <option value="11">11. Dzul Qa'dah</option>
                <option value="12">12. Dzul Hijjah</option>
                <option value="1">1. Muharram</option>
                <option value="2">2. Shafar</option>
                <option value="3">3. Rabiul Awal</option>
                <option value="4">4. Rabiul Tsani</option>
                <option value="5">5. Jumadal Ula</option>
                <option value="6">6. Jumadas Tsani</option>
                <option value="7">7. Rajab</option>
                <option value="8">8. Sya'ban</option>
                <option value="9">9. Ramadhan (Paling Atas)</option>
              </select>
            </div>

            {/* Filter Tahun Hijriah (jika ada lebih dari 1 tahun) */}
            {availableHijriYears.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                <span className="text-[11px] font-medium text-slate-500 shrink-0">Tahun:</span>
                <select
                  id="select-tahun-hijriah"
                  value={selectedHijriYear}
                  onChange={(e) => setSelectedHijriYear(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Tahun</option>
                  {availableHijriYears.map(yr => (
                    <option key={yr} value={yr.toString()}>{yr} H</option>
                  ))}
                </select>
              </div>
            )}

            {/* Tombol Reset jika filter aktif */}
            {(searchQuery || selectedHijriMonth !== 'all' || selectedHijriYear !== 'all') && (
              <button
                id="btn-reset-filter-riwayat"
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Reset pencarian dan filter bulan/tahun"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Indikator Pengurutan Otomatis */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-medium text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
            <span>🌙</span>
            <span>
              Urutan kalender: <strong className="font-semibold text-emerald-900">Syawal</strong> (paling bawah) berurutan hingga <strong className="font-semibold text-emerald-900">Ramadhan / Terbaru</strong> (paling atas)
            </span>
          </div>

          <div className="text-slate-400">
            Menampilkan <span className="font-semibold text-slate-700">{filteredAndSorted.length}</span> dari {delegasiList.length} total data delegasi
          </div>
        </div>
      </div>

      {/* Main Table with Touch Swipe Support */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <TouchScrollContainer id="scroll-container-riwayat" hintText="Sentuh & geser riwayat laporan ke kanan / kiri">
          <table id="table-riwayat-delegasi" className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
              <tr>
                <th className="p-2.5 sm:p-3 font-semibold text-center w-12 text-[11px]">No</th>
                <th className="p-2.5 sm:p-3 font-semibold min-w-[150px] text-[11px]">Anggota Delegasi</th>
                <th className="p-2.5 sm:p-3 font-semibold min-w-[130px] text-[11px]">Tujuan Kegiatan</th>
                <th className="p-2.5 sm:p-3 font-semibold min-w-[170px] text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span>Jadwal Berangkat</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-800 font-bold">
                      Hijriah
                    </span>
                  </div>
                </th>
                <th className="p-2.5 sm:p-3 font-semibold min-w-[170px] text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span>Jadwal Kembali</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200 text-slate-700 font-medium">
                      Hijriah
                    </span>
                  </div>
                </th>
                <th className="p-2.5 sm:p-3 font-semibold text-right text-[11px]">Dibawa</th>
                <th className="p-2.5 sm:p-3 font-semibold text-right text-[11px]">Terpakai</th>
                <th className="p-2.5 sm:p-3 font-semibold text-right text-[11px]">Sisa Dana</th>
                <th className="p-2.5 sm:p-3 font-semibold text-center w-28 text-[11px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="w-8 h-8 text-slate-300" />
                      <div className="font-semibold text-slate-600 text-sm">Tidak ada riwayat delegasi</div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Tidak ditemukan kegiatan yang sesuai dengan kata kunci atau filter bulan Hijriah yang dipilih.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((item, idx) => {
                  const actualIndex = delegasiList.findIndex(x => x.id === item.id);
                  const sisa = item.uangDibawa - item.uangTerpakai;
                  const isPositif = sisa >= 0;

                  const names = item.peserta
                    .map(id => {
                      const p = pesertaList.find(x => x.id === id);
                      return p ? p.nama : id;
                    })
                    .join(', ');

                  const tglBerangkatHijri = formatTanggalHijri(item.tglBerangkat);
                  const tglKembaliHijri = formatTanggalHijri(item.tglKembali);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-500 bg-slate-50/30">
                        {idx + 1}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 max-w-xs truncate" title={names}>
                        {names}
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{item.tujuan}</td>
                      <td className="p-3">
                        {/* Tanggal Hijriah Utama */}
                        <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                          <span className="text-emerald-600 text-xs">🌙</span>
                          <span>{tglBerangkatHijri || '-'}</span>
                        </div>
                        {/* Tanggal Masehi Pendamping */}
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatTanggalMasehi(item.tglBerangkat)}
                        </div>
                      </td>
                      <td className="p-3">
                        {/* Tanggal Hijriah Kembali */}
                        <div className="font-semibold text-teal-800 flex items-center gap-1.5 text-xs">
                          <span className="text-teal-600 text-xs">🌙</span>
                          <span>{tglKembaliHijri || '-'}</span>
                        </div>
                        {/* Tanggal Masehi Pendamping */}
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatTanggalMasehi(item.tglKembali)}
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
        </TouchScrollContainer>
      </div>
    </div>
  );
};
