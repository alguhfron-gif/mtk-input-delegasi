import React from 'react';
import { Delegasi, PageView, Peserta } from '../types';
import { formatRupiah, formatTanggalMasehi, formatTanggalHijri } from '../utils/format';
import { exportDelegasiCSV } from '../utils/csv';
import { TouchScrollContainer } from './TouchScrollContainer';
import { 
  Users, 
  FileText, 
  Building2, 
  Coins, 
  CreditCard, 
  PiggyBank, 
  PlusCircle, 
  UserPlus, 
  Download, 
  FileSpreadsheet,
  ArrowUpRight,
  Calendar,
  TrendingUp,
  Zap
} from 'lucide-react';

interface DashboardProps {
  pesertaList: Peserta[];
  delegasiList: Delegasi[];
  saldoAnggaran: number;
  onNavigate: (page: PageView) => void;
  onBackup: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  pesertaList,
  delegasiList,
  saldoAnggaran,
  onNavigate,
  onBackup
}) => {
  const totalPeserta = pesertaList.length;
  const totalDelegasi = delegasiList.length;
  const totalDibawa = delegasiList.reduce((sum, d) => sum + d.uangDibawa, 0);
  const totalTerpakai = delegasiList.reduce((sum, d) => sum + d.uangTerpakai, 0);
  const sisaAnggaran = saldoAnggaran - totalTerpakai;

  const last5 = [...delegasiList].reverse().slice(0, 5);

  return (
    <div id="page-dashboard" className="space-y-7 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <FileText className="w-5 h-5" />
            </span>
            Ringkasan Delegasi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau aktivitas kegiatan delegasi, saldo anggaran, dan pengeluaran secara terpadu.
          </p>
        </div>
      </div>

      {/* Metrics Cards - Compact & Space-Efficient */}
      <TouchScrollContainer id="scroll-container-dashboard-metrics" hintText="Sentuh & geser kartu ringkasan ke kanan / kiri">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 min-w-[620px] lg:min-w-0">
          {/* Data Peserta */}
          <div id="card-total-peserta" className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 truncate">Data Peserta</span>
              <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 border border-teal-100/60 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-bold text-slate-800 leading-tight">{totalPeserta}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">Santri/Pengurus</div>
          </div>

          {/* Total Delegasi */}
          <div id="card-total-delegasi" className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 truncate">Total Delegasi</span>
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/60 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-bold text-slate-800 leading-tight">{totalDelegasi}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">Kegiatan</div>
          </div>

          {/* Anggaran Awal */}
          <div id="card-saldo-anggaran" className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 truncate">Anggaran Awal</span>
              <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 border border-sky-100/60 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800 font-mono truncate leading-tight" title={formatRupiah(saldoAnggaran)}>
              {formatRupiah(saldoAnggaran)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">Plafon Tahunan</div>
          </div>

          {/* Uang Dibawa */}
          <div id="card-total-dibawa" className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 truncate">Uang Dibawa</span>
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 border border-amber-100/60 flex items-center justify-center shrink-0">
                <Coins className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800 font-mono truncate leading-tight" title={formatRupiah(totalDibawa)}>
              {formatRupiah(totalDibawa)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">Dana Keluar</div>
          </div>

          {/* Uang Terpakai */}
          <div id="card-total-terpakai" className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 truncate">Uang Terpakai</span>
              <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 border border-rose-100/60 flex items-center justify-center shrink-0">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xs sm:text-sm font-bold text-rose-700 font-mono truncate leading-tight" title={formatRupiah(totalTerpakai)}>
              {formatRupiah(totalTerpakai)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">Realisasi Riil</div>
          </div>

          {/* Sisa Anggaran */}
          <div id="card-sisa-anggaran" className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 truncate">Sisa Anggaran</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/60 flex items-center justify-center shrink-0">
                <PiggyBank className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`text-xs sm:text-sm font-bold font-mono truncate leading-tight ${sisaAnggaran >= 0 ? 'text-emerald-700' : 'text-red-600'}`} title={formatRupiah(sisaAnggaran)}>
              {formatRupiah(sisaAnggaran)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">
              {sisaAnggaran >= 0 ? 'Surplus' : 'Defisit'}
            </div>
          </div>
        </div>
      </TouchScrollContainer>

      {/* Aksi Cepat - Compact & Swipe-Friendly */}
      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Aksi Cepat
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Navigasi Singkat</span>
        </div>
        <TouchScrollContainer id="scroll-container-dashboard-actions" hintText="Sentuh & geser tombol aksi ke kanan / kiri">
          <div className="flex items-center gap-2 min-w-max pb-0.5">
            <button
              id="btn-quick-delegasi-baru"
              onClick={() => onNavigate('inputDelegasi')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Delegasi Baru</span>
            </button>

            <button
              id="btn-quick-analitik"
              onClick={() => onNavigate('analitik')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer whitespace-nowrap"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span>Presentase Kegiatan</span>
            </button>

            <button
              id="btn-quick-tambah-peserta"
              onClick={() => onNavigate('peserta')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 transition-all cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-600" />
              <span>Database Peserta</span>
            </button>

            <button
              id="btn-quick-ekspor-csv"
              onClick={() => exportDelegasiCSV(delegasiList, pesertaList)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 transition-all cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              <span>Ekspor CSV</span>
            </button>

            <button
              id="btn-quick-backup"
              onClick={onBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Backup Data</span>
            </button>
          </div>
        </TouchScrollContainer>
      </div>

      {/* Recent 5 Delegations Table with Touch Swipe Support */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-slate-800">
              5 Delegasi Terbaru
            </h3>
          </div>
          <button
            onClick={() => onNavigate('riwayat')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Buka Semua Riwayat</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-xl border border-slate-200/80 overflow-hidden">
          <TouchScrollContainer id="scroll-container-dashboard-recent" hintText="Sentuh & geser tabel ke kanan / kiri">
            <table id="table-recent-delegations" className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
                <tr>
                  <th className="p-2 sm:p-2.5 font-semibold text-center w-10 text-[11px]">No</th>
                  <th className="p-2 sm:p-2.5 font-semibold text-[11px] min-w-[140px]">Anggota Delegasi</th>
                  <th className="p-2 sm:p-2.5 font-semibold text-[11px] min-w-[120px]">Tujuan Kegiatan</th>
                  <th className="p-2 sm:p-2.5 font-semibold text-[11px] min-w-[150px]">Jadwal Berangkat</th>
                  <th className="p-2 sm:p-2.5 font-semibold text-[11px] min-w-[150px]">Jadwal Kembali</th>
                  <th className="p-2 sm:p-2.5 font-semibold text-right text-[11px]">Uang Dibawa</th>
                  <th className="p-2 sm:p-2.5 font-semibold text-right text-[11px]">Terpakai</th>
                  <th className="p-2 sm:p-2.5 font-semibold text-right text-[11px]">Sisa Dana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {last5.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      Belum ada data kegiatan delegasi yang tercatat.
                    </td>
                  </tr>
                ) : (
                  last5.map((item, idx) => {
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
                        <td className="p-2 sm:p-2.5 text-center font-medium text-slate-400 text-[11px] whitespace-nowrap">{idx + 1}</td>
                        <td className="p-2 sm:p-2.5 font-semibold text-slate-800 max-w-xs truncate whitespace-nowrap" title={names}>
                          {names}
                        </td>
                        <td className="p-2 sm:p-2.5 text-slate-700 font-medium whitespace-nowrap">{item.tujuan}</td>
                        <td className="p-2 sm:p-2.5 whitespace-nowrap">
                          <div className="text-slate-700 font-medium text-xs">
                            {formatTanggalMasehi(item.tglBerangkat)}
                          </div>
                          <div className="text-[10px] text-teal-700 font-medium">
                            {formatTanggalHijri(item.tglBerangkat)}
                          </div>
                        </td>
                        <td className="p-2 sm:p-2.5 whitespace-nowrap">
                          <div className="text-slate-700 font-medium text-xs">
                            {formatTanggalMasehi(item.tglKembali)}
                          </div>
                          <div className="text-[10px] text-teal-700 font-medium">
                            {formatTanggalHijri(item.tglKembali)}
                          </div>
                        </td>
                        <td className="p-2 sm:p-2.5 text-right font-medium text-slate-700 font-mono whitespace-nowrap">
                          {formatRupiah(item.uangDibawa)}
                        </td>
                        <td className="p-2 sm:p-2.5 text-right font-medium text-slate-700 font-mono whitespace-nowrap">
                          {formatRupiah(item.uangTerpakai)}
                        </td>
                        <td className={`p-2 sm:p-2.5 text-right font-bold font-mono whitespace-nowrap ${isPositif ? 'text-emerald-700' : 'text-red-600'}`}>
                          {formatRupiah(sisa)}
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
    </div>
  );
};
