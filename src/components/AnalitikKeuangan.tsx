import React, { useState, useMemo } from 'react';
import { Delegasi, Peserta, PageView } from '../types';
import { formatRupiah } from '../utils/format';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Wallet,
  Coins,
  ArrowUpRight,
  Receipt,
  Layers,
  MapPin,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AnalitikKeuanganProps {
  delegasiList: Delegasi[];
  pesertaList: Peserta[];
  saldoAnggaran: number;
  onNavigate?: (page: PageView) => void;
}

const PALETTE_COLORS = [
  '#059669', // Emerald 600
  '#0284c7', // Sky 600
  '#4f46e5', // Indigo 600
  '#d97706', // Amber 600
  '#e11d48', // Rose 600
  '#7c3aed', // Purple 600
  '#0d9488', // Teal 600
  '#ea580c', // Orange 600
  '#475569', // Slate 600
  '#0891b2', // Cyan 600
];

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const NAMA_BULAN_PENDEK = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const AnalitikKeuangan: React.FC<AnalitikKeuanganProps> = ({
  delegasiList,
  pesertaList,
  saldoAnggaran,
  onNavigate
}) => {
  // Available Years Filter
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const currentYear = new Date().getFullYear().toString();
    yearsSet.add(currentYear);

    delegasiList.forEach(d => {
      if (d.tglBerangkat) {
        const y = new Date(d.tglBerangkat).getFullYear();
        if (!isNaN(y)) yearsSet.add(y.toString());
      }
    });

    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [delegasiList]);

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [activeChartType, setActiveChartType] = useState<'bar' | 'area'>('bar');

  // Filtered delegasi based on selected year
  const filteredDelegasi = useMemo(() => {
    if (selectedYear === 'all') return delegasiList;
    return delegasiList.filter(d => {
      if (!d.tglBerangkat) return false;
      const y = new Date(d.tglBerangkat).getFullYear().toString();
      return y === selectedYear;
    });
  }, [delegasiList, selectedYear]);

  // Total summary calculations
  const totalPengeluaran = useMemo(() => {
    return filteredDelegasi.reduce((sum, d) => sum + (d.uangTerpakai || 0), 0);
  }, [filteredDelegasi]);

  const totalDibawa = useMemo(() => {
    return filteredDelegasi.reduce((sum, d) => sum + (d.uangDibawa || 0), 0);
  }, [filteredDelegasi]);

  const totalSisaKembali = Math.max(0, totalDibawa - totalPengeluaran);
  const persentasePlafon = saldoAnggaran > 0 ? ((totalPengeluaran / saldoAnggaran) * 100) : 0;
  const sisaPlafon = Math.max(0, saldoAnggaran - totalPengeluaran);

  // 1. Data Pengeluaran Bulanan (Monthly Expenses for Bar/Area Chart)
  const monthlyData = useMemo(() => {
    // 12 months array
    const months = Array.from({ length: 12 }, (_, i) => ({
      bulanIndex: i,
      bulan: NAMA_BULAN_PENDEK[i],
      bulanFull: NAMA_BULAN[i],
      uangTerpakai: 0,
      uangDibawa: 0,
      totalKegiatan: 0
    }));

    filteredDelegasi.forEach(d => {
      if (d.tglBerangkat) {
        const date = new Date(d.tglBerangkat);
        if (!isNaN(date.getTime())) {
          const m = date.getMonth();
          if (m >= 0 && m < 12) {
            months[m].uangTerpakai += (d.uangTerpakai || 0);
            months[m].uangDibawa += (d.uangDibawa || 0);
            months[m].totalKegiatan += 1;
          }
        }
      }
    });

    return months;
  }, [filteredDelegasi]);

  // 2. Data Pengeluaran Berdasarkan Kategori Rincian (Category Aggregation for Pie & Horizontal Bar)
  const categoryData = useMemo(() => {
    const categoryMap: { [key: string]: { nominal: number; count: number } } = {};

    filteredDelegasi.forEach(d => {
      if (d.rincian && d.rincian.length > 0) {
        d.rincian.forEach(r => {
          const rawName = r.nama.trim() || 'Lain-lain';
          // Standardize category name (Capitalized)
          const catName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
          if (!categoryMap[catName]) {
            categoryMap[catName] = { nominal: 0, count: 0 };
          }
          categoryMap[catName].nominal += (r.nominal || 0);
          categoryMap[catName].count += 1;
        });
      } else if (d.uangTerpakai > 0) {
        // Fallback for delegasi without detailed rincian items
        const catName = 'Operasional Umum';
        if (!categoryMap[catName]) {
          categoryMap[catName] = { nominal: 0, count: 0 };
        }
        categoryMap[catName].nominal += d.uangTerpakai;
        categoryMap[catName].count += 1;
      }
    });

    const list = Object.keys(categoryMap).map((name) => {
      const item = categoryMap[name];
      const percentage = totalPengeluaran > 0 ? (item.nominal / totalPengeluaran) * 100 : 0;
      return {
        name,
        value: item.nominal,
        count: item.count,
        percentage: Number(percentage.toFixed(1))
      };
    });

    // Sort descending by nominal
    return list.sort((a, b) => b.value - a.value);
  }, [filteredDelegasi, totalPengeluaran]);

  // 3. Data Pengeluaran Berdasarkan Tujuan / Wilayah
  const destinationData = useMemo(() => {
    const destMap: { [key: string]: { total: number; count: number } } = {};

    filteredDelegasi.forEach(d => {
      const tujuan = d.tujuan.trim() || 'Tidak Disebutkan';
      if (!destMap[tujuan]) {
        destMap[tujuan] = { total: 0, count: 0 };
      }
      destMap[tujuan].total += (d.uangTerpakai || 0);
      destMap[tujuan].count += 1;
    });

    return Object.keys(destMap)
      .map(name => ({
        name,
        total: destMap[name].total,
        count: destMap[name].count
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6); // Top 6
  }, [filteredDelegasi]);

  // Top category highlight
  const topCategory = categoryData[0] || null;

  // Custom Currency Tooltip for Bar & Area Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[170px]">
          <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bulan {label}</span>
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {formatRupiah(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Currency Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 min-w-[160px]">
          <p className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-sky-400" />
            <span>{data.name}</span>
          </p>
          <div className="flex items-center justify-between text-emerald-400 font-mono font-bold pt-0.5">
            <span>Nominal:</span>
            <span>{formatRupiah(data.value)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300 text-[11px]">
            <span>Porsi:</span>
            <span>{data.payload?.percentage || 0}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="page-analitik-keuangan" className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <span>Analitik Keuangan Delegasi</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200/60 font-mono">
                  Firebase Sync
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring visual pengeluaran bulanan dan alokasi anggaran delegasi secara real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter Tahun:</span>
            <select
              id="select-filter-tahun"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer pl-1"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveChartType('bar')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartType === 'bar'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Batang</span>
            </button>
            <button
              onClick={() => setActiveChartType('area')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartType === 'area'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Area</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pengeluaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Total Pengeluaran</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <Receipt className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-800 truncate" title={formatRupiah(totalPengeluaran)}>
            {formatRupiah(totalPengeluaran)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Dari {filteredDelegasi.length} kegiatan delegasi</span>
            <span className="text-emerald-600 font-bold font-mono">
              {filteredDelegasi.length > 0 ? formatRupiah(Math.round(totalPengeluaran / filteredDelegasi.length)) + '/kegiatan' : '-'}
            </span>
          </div>
        </div>

        {/* Uang Dibawa & Sisa Dikembalikan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Total Uang Dibawa</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-800 truncate" title={formatRupiah(totalDibawa)}>
            {formatRupiah(totalDibawa)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Sisa dana dikembalikan:</span>
            <span className="text-sky-600 font-bold font-mono">{formatRupiah(totalSisaKembali)}</span>
          </div>
        </div>

        {/* Kategori Terbesar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Kategori Terbesar</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <PieChartIcon className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-800 truncate">
            {topCategory ? topCategory.name : 'Belum Ada Data'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{topCategory ? formatRupiah(topCategory.value) : '-'}</span>
            <span className="text-indigo-600 font-bold font-mono">
              {topCategory ? `${topCategory.percentage}%` : '-'}
            </span>
          </div>
        </div>

        {/* Realisasi Anggaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Realisasi Plafon</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Coins className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold text-slate-800 font-mono">
              {persentasePlafon.toFixed(1)}%
            </div>
            <div className="text-xs font-medium text-slate-500 truncate" title={`Sisa Plafon: ${formatRupiah(sisaPlafon)}`}>
              Sisa: {formatRupiah(sisaPlafon)}
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                persentasePlafon > 90 ? 'bg-rose-500' : persentasePlafon > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, persentasePlafon)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Pengeluaran Bulanan (2 Cols on Large Screen) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Pengeluaran Bulanan (Tahun {selectedYear === 'all' ? 'Semua' : selectedYear})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Perbandingan uang dibawa vs realisasi uang terpakai setiap bulan
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-slate-600">Dibawa</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Terpakai</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartType === 'bar' ? (
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="bulan" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                      return `${val}`;
                    }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar 
                    dataKey="uangDibawa" 
                    name="Uang Dibawa" 
                    fill="#38bdf8" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={22}
                  />
                  <Bar 
                    dataKey="uangTerpakai" 
                    name="Uang Terpakai" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={22}
                  />
                </BarChart>
              ) : (
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTerpakai" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorDibawa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="bulan" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                      return `${val}`;
                    }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="uangDibawa" 
                    name="Uang Dibawa" 
                    stroke="#0284c7" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorDibawa)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="uangTerpakai" 
                    name="Uang Terpakai" 
                    stroke="#059669" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorTerpakai)" 
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Distribusi Berdasarkan Kategori Rincian (Donut / Pie Chart) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-sky-600" />
              <span>Porsi Kategori Pengeluaran</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Komposisi rincian biaya delegasi yang tercatat
            </p>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
              <span>Belum ada rincian transaksi pengeluaran.</span>
            </div>
          ) : (
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PALETTE_COLORS[index % PALETTE_COLORS.length]} 
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Donut Total Badge */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                <span className="text-xs font-bold text-slate-800 font-mono">
                  {formatRupiah(totalPengeluaran)}
                </span>
              </div>
            </div>
          )}

          {/* Quick Legend Chips */}
          <div className="flex flex-wrap gap-1.5 pt-2 max-h-24 overflow-y-auto">
            {categoryData.slice(0, 5).map((cat, idx) => (
              <div 
                key={cat.name} 
                className="flex items-center gap-1.5 text-[11px] bg-slate-50 border border-slate-200/60 px-2 py-1 rounded-lg text-slate-700"
              >
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: PALETTE_COLORS[idx % PALETTE_COLORS.length] }} 
                />
                <span className="truncate max-w-[90px]">{cat.name}</span>
                <span className="font-bold font-mono text-slate-500">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Secondary Row: Breakdown Table & Top Destinations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Detail Tabel Breakdown Kategori */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Rincian Pengeluaran Berdasarkan Kategori</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rangkuman nominal dan persentase kontribusi per kategori
              </p>
            </div>
            <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
              {categoryData.length} Kategori
            </span>
          </div>

          {categoryData.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Belum ada data pengeluaran yang tercatat pada periode ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Nama Kategori</th>
                    <th className="py-3 px-4 text-center">Frekuensi</th>
                    <th className="py-3 px-4 text-right">Total Nominal</th>
                    <th className="py-3 px-4">Porsi / Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {categoryData.map((cat, idx) => (
                    <tr key={cat.name} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: PALETTE_COLORS[idx % PALETTE_COLORS.length] }} 
                        />
                        <span>{cat.name}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {cat.count}x
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(cat.value)}
                      </td>
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(100, cat.percentage)}%`,
                                backgroundColor: PALETTE_COLORS[idx % PALETTE_COLORS.length]
                              }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-600 w-10 text-right">
                            {cat.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Destinasi & Lokasi Delegasi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>Pengeluaran per Tujuan Utama</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Wilayah atau instansi dengan serapan dana terbesar
              </p>
            </div>

            {destinationData.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada data tujuan delegasi.
              </div>
            ) : (
              <div className="space-y-3.5">
                {destinationData.map((dest, idx) => {
                  const pct = totalPengeluaran > 0 ? (dest.total / totalPengeluaran) * 100 : 0;
                  return (
                    <div key={dest.name} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-700 font-medium">
                        <span className="truncate pr-2 font-semibold text-slate-800">{dest.name}</span>
                        <span className="font-mono font-bold text-slate-900 shrink-0">
                          {formatRupiah(dest.total)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pb-0.5">
                        <span>{dest.count} kegiatan delegasi</span>
                        <span className="font-mono font-bold text-slate-600">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {onNavigate && (
            <div className="pt-5 border-t border-slate-100 mt-4">
              <button
                onClick={() => onNavigate('riwayat')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Lihat Riwayat & Laporan Lengkap</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
