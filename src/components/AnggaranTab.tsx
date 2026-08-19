import React, { useState, useEffect } from 'react';
import { Delegasi } from '../types';
import { formatRupiah } from '../utils/format';
import { Wallet, Save, Building2, CreditCard, PiggyBank } from 'lucide-react';

interface AnggaranTabProps {
  saldoAnggaran: number;
  delegasiList: Delegasi[];
  onSaveSaldo: (nominal: number) => void;
}

export const AnggaranTab: React.FC<AnggaranTabProps> = ({
  saldoAnggaran,
  delegasiList,
  onSaveSaldo
}) => {
  const [inputNominal, setInputNominal] = useState<number>(saldoAnggaran);

  useEffect(() => {
    setInputNominal(saldoAnggaran);
  }, [saldoAnggaran]);

  const totalTerpakai = delegasiList.reduce((sum, d) => sum + d.uangTerpakai, 0);
  const sisaAnggaran = saldoAnggaran - totalTerpakai;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSaldo(inputNominal);
    alert('Saldo anggaran tahunan berhasil diperbarui!');
  };

  return (
    <div id="page-anggaran" className="space-y-7 animate-fadeIn">
      {/* Title */}
      <div className="flex items-center gap-2.5 pb-2">
        <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
          <Wallet className="w-5 h-5" />
        </span>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Saldo Anggaran Tahunan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola pagu alokasi dana delegasi dalam satu periode anggaran.
          </p>
        </div>
      </div>

      {/* Main Form Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            Pengaturan Plafon Anggaran
          </h3>
          <p className="text-xs text-slate-500">
            Tentukan total dana yang dialokasikan untuk membiayai seluruh kegiatan delegasi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-3.5 max-w-xl">
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Total Anggaran Tahunan (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                Rp
              </span>
              <input
                id="input-saldo-anggaran"
                type="number"
                min="0"
                value={inputNominal || ''}
                onChange={(e) => setInputNominal(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none text-sm font-semibold text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-simpan-saldo-anggaran"
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Saldo</span>
          </button>
        </form>

        {/* Live Calculation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold uppercase mb-1">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>Saldo Awal</span>
            </div>
            <div className="text-lg font-bold text-slate-800">
              {formatRupiah(saldoAnggaran)}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold uppercase mb-1">
              <CreditCard className="w-4 h-4 text-rose-600" />
              <span>Uang Terpakai</span>
            </div>
            <div className="text-lg font-bold text-rose-700">
              {formatRupiah(totalTerpakai)}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold uppercase mb-1">
              <PiggyBank className="w-4 h-4 text-emerald-600" />
              <span>Sisa Anggaran</span>
            </div>
            <div className={`text-lg font-bold ${sisaAnggaran >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {formatRupiah(sisaAnggaran)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
