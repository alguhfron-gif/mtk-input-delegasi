import React from 'react';
import { Delegasi, PageView, Peserta } from '../types';
import { formatRupiah, formatTanggalMasehi, formatTanggalHijri } from '../utils/format';
import { exportDelegasiCSV } from '../utils/csv';
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
  Calendar
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

      {/* Metrics Cards - Soft Pastel Modern Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Peserta */}
        <div id="card-total-peserta" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Database Peserta</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-100/60 flex items-center justify-center">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{totalPeserta}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Santri & Pengurus</div>
        </div>

        {/* Total Delegasi */}
        <div id="card-total-delegasi" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Total Delegasi</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/60 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{totalDelegasi}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Kegiatan Tercatat</div>
        </div>

        {/* Saldo Anggaran Awal */}
        <div id="card-saldo-anggaran" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Anggaran Awal</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100/60 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-800 truncate" title={formatRupiah(saldoAnggaran)}>
            {formatRupiah(saldoAnggaran)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Plafon Tahunan</div>
        </div>

        {/* Total Uang Dibawa */}
        <div id="card-total-dibawa" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Uang Dibawa</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/60 flex items-center justify-center">
              <Coins className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-800 truncate" title={formatRupiah(totalDibawa)}>
            {formatRupiah(totalDibawa)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Dana Diberikan</div>
        </div>

        {/* Total Uang Terpakai */}
        <div id="card-total-terpakai" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Uang Terpakai</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100/60 flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-base font-bold text-rose-700 truncate" title={formatRupiah(totalTerpakai)}>
            {formatRupiah(totalTerpakai)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Pengeluaran Riil</div>
        </div>

        {/* Sisa Anggaran */}
        <div id="card-sisa-anggaran" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Sisa Anggaran</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/60 flex items-center justify-center">
              <PiggyBank className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className={`text-base font-bold truncate ${sisaAnggaran >= 0 ? 'text-emerald-700' : 'text-red-600'}`} title={formatRupiah(sisaAnggaran)}>
            {formatRupiah(sisaAnggaran)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            {sisaAnggaran >= 0 ? 'Surplus Dana' : 'Defisit Anggaran'}
          </div>
        </div>
      </div>

      {/* Quick Actions - Soothing Gentle Buttons */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5">
          Aksi Cepat & Navigasi
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            id="btn-quick-delegasi-baru"
            onClick={() => onNavigate('inputDelegasi')}
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Delegasi Baru</span>
          </button>

          <button
            id="btn-quick-tambah-peserta"
            onClick={() => onNavigate('peserta')}
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
            <span>Database Peserta</span>
          </button>

          <button
            id="btn-quick-ekspor-csv"
            onClick={() => exportDelegasiCSV(delegasiList, pesertaList)}
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            id="btn-quick-backup"
            onClick={onBackup}
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-600" />
            <span>Backup Data</span>
          </button>
        </div>
      </div>

      {/* Recent 5 Delegations */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
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

        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table id="table-recent-delegations" className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
              <tr>
                <th className="p-3 font-semibold text-center w-12">No</th>
                <th className="p-3 font-semibold">Anggota Delegasi</th>
                <th className="p-3 font-semibold">Tujuan Kegiatan</th>
                <th className="p-3 font-semibold">Jadwal Berangkat</th>
                <th className="p-3 font-semibold">Jadwal Kembali</th>
                <th className="p-3 font-semibold text-right">Uang Dibawa</th>
                <th className="p-3 font-semibold text-right">Terpakai</th>
                <th className="p-3 font-semibold text-right">Sisa Dana</th>
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
