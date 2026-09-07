import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Delegasi, Peserta, PageView } from '../types';
import { formatRupiah, getHijriInfo, formatTanggalMasehi, formatTanggalHijri } from '../utils/format';
import { ComponentErrorBoundary } from './ErrorBoundary';
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
  Area,
  ComposedChart,
  Line
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
  AlertCircle,
  Trophy,
  Activity,
  Flame,
  TrendingDown,
  ArrowUpDown,
  Sparkles,
  X
} from 'lucide-react';
import { AnalitikKeikutsertaan } from './AnalitikKeikutsertaan';

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

// Siklus kalender ajaran pesantren: Syawal (paling bawah/awal siklus) hingga Ramadhan (puncak/akhir siklus)
const HIJRI_ACADEMIC_MONTHS = [
  { monthNum: 10, short: 'Syaw', full: 'Syawal' },
  { monthNum: 11, short: 'Dz.Q', full: "Dzul Qa'dah" },
  { monthNum: 12, short: 'Dz.H', full: "Dzul Hijjah" },
  { monthNum: 1, short: 'Muh', full: 'Muharram' },
  { monthNum: 2, short: 'Shaf', full: 'Shafar' },
  { monthNum: 3, short: 'Rab.A', full: 'Rabiul Awal' },
  { monthNum: 4, short: 'Rab.T', full: 'Rabiul Tsani' },
  { monthNum: 5, short: 'Jum.U', full: 'Jumadal Ula' },
  { monthNum: 6, short: 'Jum.T', full: 'Jumadas Tsani' },
  { monthNum: 7, short: 'Raj', full: 'Rajab' },
  { monthNum: 8, short: "Sya'b", full: "Sya'ban" },
  { monthNum: 9, short: 'Ram', full: 'Ramadhan' }
];

export const AnalitikKeuangan: React.FC<AnalitikKeuanganProps> = ({
  delegasiList,
  pesertaList,
  saldoAnggaran,
  onNavigate
}) => {
  // Available Hijri Years Filter
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const currentHijri = (getHijriInfo(new Date())?.year || 1446).toString();
    yearsSet.add(currentHijri);

    delegasiList.forEach(d => {
      if (d.tglBerangkat) {
        const hInfo = getHijriInfo(d.tglBerangkat);
        if (hInfo) {
          yearsSet.add(hInfo.year.toString());
        }
      }
    });

    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [delegasiList]);

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'both' | 'kegiatan' | 'nominal'>('both');
  const [tableSortBy, setTableSortBy] = useState<'calendar' | 'kegiatan-desc' | 'nominal-desc'>('calendar');
  const [expandedMonthDelegates, setExpandedMonthDelegates] = useState<Record<number, boolean>>({});
  const [selectedMonthKegiatanModal, setSelectedMonthKegiatanModal] = useState<{
    bulanFull: string;
    totalKegiatan: number;
    uangTerpakai: number;
    kegiatanList: Delegasi[];
  } | null>(null);

  // Tangani tombol kembali HP & ESC saat modal rincian kegiatan terbuka
  useEffect(() => {
    if (!selectedMonthKegiatanModal) return;

    try {
      window.history.pushState({ modal: 'monthKegiatan' }, '');
    } catch {
      // ignore
    }

    const handlePopState = () => {
      setSelectedMonthKegiatanModal(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMonthKegiatanModal(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedMonthKegiatanModal]);

  const handleCloseKegiatanModal = useCallback(() => {
    if (window.history.state?.modal === 'monthKegiatan') {
      window.history.back();
    } else {
      setSelectedMonthKegiatanModal(null);
    }
  }, []);

  const toggleMonthDelegates = (monthIdx: number) => {
    setExpandedMonthDelegates(prev => ({
      ...prev,
      [monthIdx]: !prev[monthIdx]
    }));
  };

  // Filtered delegasi based on selected Hijri year
  const filteredDelegasi = useMemo(() => {
    if (selectedYear === 'all') return delegasiList;
    return delegasiList.filter(d => {
      if (!d.tglBerangkat) return false;
      const hInfo = getHijriInfo(d.tglBerangkat);
      return hInfo && hInfo.year.toString() === selectedYear;
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

  // 1. Data Pengeluaran & Jumlah Kegiatan Bulanan (100% Kalender Hijriah Pesantren: Syawal s.d. Ramadhan)
  const monthlyData = useMemo(() => {
    const months = HIJRI_ACADEMIC_MONTHS.map((hm, idx) => ({
      bulanIndex: idx,
      bulan: hm.short,
      bulanFull: hm.full,
      uangTerpakai: 0,
      uangDibawa: 0,
      totalKegiatan: 0,
      hijriMonthNum: hm.monthNum,
      pesertaListMonth: [] as { id: string; nama: string; count: number }[],
      kegiatanListMonth: [] as Delegasi[]
    }));

    filteredDelegasi.forEach(d => {
      if (d.tglBerangkat) {
        const hInfo = getHijriInfo(d.tglBerangkat);
        if (hInfo) {
          const targetMonth = months.find(m => m.hijriMonthNum === hInfo.month);
          if (targetMonth) {
            targetMonth.uangTerpakai += (d.uangTerpakai || 0);
            targetMonth.uangDibawa += (d.uangDibawa || 0);
            targetMonth.totalKegiatan += 1;
            targetMonth.kegiatanListMonth.push(d);

            if (Array.isArray(d.peserta)) {
              d.peserta.forEach(pid => {
                if (!pid) return;
                const pidStr = typeof pid === 'object' && pid !== null
                  ? String((pid as any).nama || (pid as any).id || '').trim()
                  : String(pid || '').trim();
                if (!pidStr) return;

                const p = pesertaList.find(x => {
                  if (!x) return false;
                  const xId = x.id ? String(x.id).toLowerCase() : '';
                  const xNama = x.nama ? String(x.nama).toLowerCase() : '';
                  const target = pidStr.toLowerCase();
                  return xId === target || xNama === target;
                });

                const pId = p?.id || pidStr;
                const pNama = p?.nama || pidStr;
                const existing = targetMonth.pesertaListMonth.find(x => {
                  const xId = x.id ? String(x.id).toLowerCase() : '';
                  const xNama = x.nama ? String(x.nama).toLowerCase() : '';
                  const target = pNama.toLowerCase();
                  return xId === target || xNama === target;
                });

                if (existing) {
                  existing.count += 1;
                } else {
                  targetMonth.pesertaListMonth.push({ id: pId, nama: pNama, count: 1 });
                }
              });
            }
          }
        }
      }
    });

    // Urutkan peserta dalam bulan: paling sering keluar di bulan tsb ke paling sedikit
    months.forEach(m => {
      m.pesertaListMonth.sort((a, b) => b.count - a.count);
    });

    return months;
  }, [filteredDelegasi, pesertaList]);

  // Statistik Kegiatan Bulanan (Bulan Terbanyak vs Tersedikit)
  const monthlyStats = useMemo(() => {
    const withActivities = monthlyData.filter(m => m.totalKegiatan > 0);
    const monthsWithZero = monthlyData.filter(m => m.totalKegiatan === 0);

    if (withActivities.length === 0) {
      return {
        bulanTerbanyak: null,
        bulanTersedikit: null,
        maxKegiatan: 0,
        minKegiatan: 0,
        totalKegiatan: 0,
        rataRataPerBulan: '0',
        monthsWithZeroCount: 12
      };
    }

    // Sort descending by total kegiatan
    const sortedDesc = [...withActivities].sort((a, b) => b.totalKegiatan - a.totalKegiatan);
    const maxKegiatan = sortedDesc[0].totalKegiatan;
    const bulanTerbanyak = sortedDesc[0];

    // Bulan paling sedikit kegiatan
    // Jika ada bulan yang nol, kita catat bulan beraktivitas paling sedikit dan info bulan nol
    const sortedAsc = [...withActivities].sort((a, b) => a.totalKegiatan - b.totalKegiatan);
    const minKegiatan = sortedAsc[0].totalKegiatan;
    const bulanTersedikit = sortedAsc[0];

    const totalKegiatan = withActivities.reduce((sum, m) => sum + m.totalKegiatan, 0);

    return {
      bulanTerbanyak,
      bulanTersedikit,
      maxKegiatan,
      minKegiatan,
      totalKegiatan,
      rataRataPerBulan: (totalKegiatan / 12).toFixed(1),
      monthsWithZeroCount: monthsWithZero.length
    };
  }, [monthlyData]);

  // 2. Data Pengeluaran Berdasarkan Kategori Rincian (Category Aggregation for Pie & Horizontal Bar)
  const categoryData = useMemo(() => {
    const categoryMap: { [key: string]: { nominal: number; count: number } } = {};

    filteredDelegasi.forEach(d => {
      if (d.rincian && d.rincian.length > 0) {
        d.rincian.forEach(r => {
          const rawName = r.nama.trim() || 'Lain-lain';
          const catName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
          if (!categoryMap[catName]) {
            categoryMap[catName] = { nominal: 0, count: 0 };
          }
          categoryMap[catName].nominal += (r.nominal || 0);
          categoryMap[catName].count += 1;
        });
      } else if (d.uangTerpakai > 0) {
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
      .slice(0, 6);
  }, [filteredDelegasi]);

  // Sorted monthly table data
  const tableMonthlyData = useMemo(() => {
    const list = [...monthlyData];
    if (tableSortBy === 'kegiatan-desc') {
      return list.sort((a, b) => b.totalKegiatan - a.totalKegiatan);
    }
    if (tableSortBy === 'nominal-desc') {
      return list.sort((a, b) => b.uangTerpakai - a.uangTerpakai);
    }
    return list; // default calendar order
  }, [monthlyData, tableSortBy]);

  // Top category highlight
  const topCategory = categoryData[0] || null;

  // Custom Currency & Activities Tooltip for Bar & Composed Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const mItem = monthlyData.find(m => m.bulan === label);
      const totalKeg = mItem ? mItem.totalKegiatan : 0;
      const uangTerpakai = mItem ? mItem.uangTerpakai : 0;
      const uangDibawa = mItem ? mItem.uangDibawa : 0;
      const sisaKembali = Math.max(0, uangDibawa - uangTerpakai);
      const rataRata = totalKeg > 0 ? Math.round(uangTerpakai / totalKeg) : 0;

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-2 min-w-[210px] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bulan {mItem ? mItem.bulanFull : label}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {totalKeg} Kegiatan
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Kegiatan:</span>
              <span className="font-bold font-mono text-teal-300">{totalKeg} Kegiatan</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Uang Terpakai:</span>
              <span className="font-bold font-mono text-emerald-400">{formatRupiah(uangTerpakai)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Uang Dibawa:</span>
              <span className="font-bold font-mono text-sky-400">{formatRupiah(uangDibawa)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Sisa Kembali:</span>
              <span className="font-mono text-slate-300">{formatRupiah(sisaKembali)}</span>
            </div>
            {totalKeg > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                <span>Rata-rata / kegiatan:</span>
                <span className="font-mono text-slate-200">{formatRupiah(rataRata)}</span>
              </div>
            )}
          </div>
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
    <div id="page-analitik-keuangan" className="space-y-4 animate-fadeIn pb-12">
      
      {/* Header Page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <TrendingUp className="w-4.5 h-4.5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <span>Presentase Kegiatan</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200/60 font-mono">
                  Firebase Sync
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring visual intensitas dan presentase kegiatan bulanan, keikutsertaan delegasi, serta alokasi anggaran berbasis Kalender Hijriah.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls: Tahun Hijriah & Indikator Kalender */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Tahun Hijriah */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Tahun Hijriah:</span>
            <select
              id="select-filter-tahun"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer pl-1"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y} H</option>
              ))}
            </select>
          </div>

          {/* Badge Kalender Hijriah Pesantren */}
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200/80 text-xs font-bold shadow-2xs">
            <span>🌙 Siklus Pesantren: Syawal – Ramadhan</span>
          </div>
        </div>
      </div>

      {/* 6 KPI METRIK UTAMA (UKURAN DIPERKECIL, RINGKAS & HEMAT TEMPAT) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
        {/* 1. Bulan Paling Banyak Kegiatan (Teal / Hijau Zamrud - Tanpa Oranye) */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-teal-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-teal-900 truncate">Bulan Terbanyak</span>
            <div className="w-5 h-5 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Trophy className="w-3 h-3 text-teal-600" />
            </div>
          </div>
          <div className="text-sm sm:text-base font-black text-slate-800 truncate" title={monthlyStats.bulanTerbanyak ? monthlyStats.bulanTerbanyak.bulanFull : 'Belum Ada'}>
            {monthlyStats.bulanTerbanyak ? monthlyStats.bulanTerbanyak.bulanFull : '-'}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Puncak:</span>
            <span className="font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-1.5 py-0.2 rounded font-mono">
              🏆 {monthlyStats.bulanTerbanyak ? `${monthlyStats.bulanTerbanyak.totalKegiatan} Keg` : '0'}
            </span>
          </div>
        </div>

        {/* 2. Bulan Paling Sedikit Kegiatan (Sky Blue) */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-sky-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-sky-900 truncate">Bulan Tersedikit</span>
            <div className="w-5 h-5 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <TrendingDown className="w-3 h-3 text-sky-600" />
            </div>
          </div>
          <div className="text-sm sm:text-base font-black text-slate-800 truncate" title={monthlyStats.bulanTersedikit ? monthlyStats.bulanTersedikit.bulanFull : 'Belum Ada'}>
            {monthlyStats.bulanTersedikit ? monthlyStats.bulanTersedikit.bulanFull : '-'}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Terendah:</span>
            <span className="font-bold text-sky-700 bg-sky-50 border border-sky-200/80 px-1.5 py-0.2 rounded font-mono">
              📉 {monthlyStats.bulanTersedikit ? `${monthlyStats.bulanTersedikit.totalKegiatan} Keg` : '0'}
            </span>
          </div>
        </div>

        {/* 3. Kolom Pengeluaran */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-semibold text-slate-600 truncate">Pengeluaran</span>
            <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Receipt className="w-3 h-3 text-emerald-600" />
            </div>
          </div>
          <div className="text-sm sm:text-base font-black text-slate-800 font-mono truncate" title={formatRupiah(totalPengeluaran)}>
            {formatRupiah(totalPengeluaran)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>Kegiatan:</span>
            <span className="font-bold text-emerald-700 font-mono">{filteredDelegasi.length} keg</span>
          </div>
        </div>

        {/* 4. Kolom Uang Dibawa */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-semibold text-slate-600 truncate">Uang Dibawa</span>
            <div className="w-5 h-5 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Wallet className="w-3 h-3 text-sky-600" />
            </div>
          </div>
          <div className="text-sm sm:text-base font-black text-slate-800 font-mono truncate" title={formatRupiah(totalDibawa)}>
            {formatRupiah(totalDibawa)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>Sisa:</span>
            <span className="font-bold text-sky-700 font-mono">{formatRupiah(totalSisaKembali)}</span>
          </div>
        </div>

        {/* 5. Kolom Rata-rata Bulan */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-semibold text-slate-600 truncate">Rata-rata Bulan</span>
            <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Activity className="w-3 h-3 text-indigo-600" />
            </div>
          </div>
          <div className="text-sm sm:text-base font-black text-slate-800 font-mono truncate">
            {monthlyStats.rataRataPerBulan} <span className="text-[10px] font-normal text-slate-500">keg/bln</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>Total:</span>
            <span className="font-bold text-indigo-700 font-mono">{monthlyStats.totalKegiatan} keg</span>
          </div>
        </div>

        {/* 6. Kolom Realisasi Plafon */}
        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-semibold text-slate-600 truncate">Realisasi Plafon</span>
            <div className="w-5 h-5 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Coins className="w-3 h-3 text-teal-600" />
            </div>
          </div>
          <div className="text-sm sm:text-base font-black text-slate-800 font-mono truncate">
            {persentasePlafon.toFixed(1)}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                persentasePlafon > 90 ? 'bg-rose-500' : persentasePlafon > 70 ? 'bg-teal-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, persentasePlafon)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Visualisasi Bulanan (Biaya & Jumlah Kegiatan) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>
                  Visualisasi Bulanan (Kalender Hijriah Pesantren - {selectedYear === 'all' ? 'Semua Tahun' : `Tahun ${selectedYear} H`})
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoring jumlah kegiatan dan pengeluaran setiap bulan
              </p>
            </div>

            {/* Metric Mode Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                id="btn-metric-both"
                onClick={() => setChartMetric('both')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMetric === 'both' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gabungan
              </button>
              <button
                id="btn-metric-kegiatan"
                onClick={() => setChartMetric('kegiatan')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMetric === 'kegiatan' ? 'bg-white text-teal-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Jml Kegiatan
              </button>
              <button
                id="btn-metric-nominal"
                onClick={() => setChartMetric('nominal')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMetric === 'nominal' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nominal (Rp)
              </button>
            </div>
          </div>

          {/* Legend Badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold mb-2">
            {(chartMetric === 'both' || chartMetric === 'nominal') && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Uang Terpakai</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <span className="text-slate-600">Uang Dibawa</span>
                </div>
              </>
            )}
            {(chartMetric === 'both' || chartMetric === 'kegiatan') && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <span className="text-teal-800 font-bold">Jumlah Kegiatan (Sumbu Kanan)</span>
              </div>
            )}
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartMetric === 'both' ? (
                /* Composed Chart: Bar for Money + Line for Activity Count */
                <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="bulan" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                      return `${val}`;
                    }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#0d9488', fontWeight: 'bold' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val} keg`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar 
                    yAxisId="left"
                    dataKey="uangDibawa" 
                    name="Uang Dibawa" 
                    fill="#38bdf8" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={18}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="uangTerpakai" 
                    name="Uang Terpakai" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={18}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="totalKegiatan" 
                    name="Jumlah Kegiatan" 
                    stroke="#0d9488" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#0f766e' }}
                  />
                </ComposedChart>
              ) : chartMetric === 'kegiatan' ? (
                /* Bar Chart: Fokus Jumlah Kegiatan */
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="bulan" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val} kegiatan`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar 
                    dataKey="totalKegiatan" 
                    name="Jumlah Kegiatan" 
                    fill="#0d9488" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={28}
                  >
                    {monthlyData.map((entry, index) => {
                      const isMax = entry.totalKegiatan > 0 && entry.totalKegiatan === monthlyStats.maxKegiatan;
                      const isMin = entry.totalKegiatan > 0 && entry.totalKegiatan === monthlyStats.minKegiatan;
                      return (
                        <Cell 
                          key={`bar-${index}`} 
                          fill={isMax ? '#0d9488' : isMin ? '#0284c7' : '#5eead4'} 
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              ) : (
                /* Bar Chart: Nominal Saja */
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

      {/* TABEL REKAPITULASI INTENSITAS KEGIATAN & PENGELUARAN PER BULAN (KOMPAK & RINGKAS) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Tabel Rekapitulasi Bulanan Kalender Hijriah</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Urutan siklus pesantren: Syawal s.d. Ramadhan dengan rincian kegiatan dan keuangan
            </p>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium">Urutan:</span>
            <select
              id="select-urut-tabel-kegiatan"
              value={tableSortBy}
              onChange={(e) => setTableSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="calendar">Siklus Kalender (Syawal → Ramadhan)</option>
              <option value="kegiatan-desc">Kegiatan Terbanyak → Sedikit</option>
              <option value="nominal-desc">Pengeluaran Terbesar → Terkecil</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Bulan Hijriah</th>
                <th className="py-2.5 px-3 text-center">Jml Kegiatan</th>
                <th className="py-2.5 px-3 text-left min-w-[200px]">Delegasi yang Bertugas (Sering → Jarang)</th>
                <th className="py-2.5 px-3 text-right">Pengeluaran</th>
                <th className="py-2.5 px-3 text-right">Uang Dibawa</th>
                <th className="py-2.5 px-3 text-right">Sisa Kembali</th>
                <th className="py-2.5 px-3 text-right">Rata-rata/Keg</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tableMonthlyData.map((m) => {
                const sisa = Math.max(0, m.uangDibawa - m.uangTerpakai);
                const rataRata = m.totalKegiatan > 0 ? Math.round(m.uangTerpakai / m.totalKegiatan) : 0;
                const isMax = m.totalKegiatan > 0 && m.totalKegiatan === monthlyStats.maxKegiatan;
                const isMin = m.totalKegiatan > 0 && m.totalKegiatan === monthlyStats.minKegiatan && !isMax;
                const isZero = m.totalKegiatan === 0;

                return (
                  <tr 
                    key={m.bulanFull} 
                    className={`transition-colors hover:bg-slate-50/70 ${
                      isMax ? 'bg-teal-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      <span>{m.bulanFull}</span>
                    </td>

                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                          isMax 
                            ? 'bg-teal-600 text-white shadow-xs' 
                            : isMin 
                            ? 'bg-sky-100 text-sky-800 border border-sky-200' 
                            : isZero 
                            ? 'bg-slate-100 text-slate-400' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {m.totalKegiatan} keg
                        </span>
                        {isMax && (
                          <span className="text-xs" title="Bulan paling banyak kegiatan">🏆</span>
                        )}
                        {isMin && (
                          <span className="text-xs" title="Bulan paling sedikit kegiatan">📉</span>
                        )}
                      </div>
                    </td>

                    {/* Kolom Nama Delegasi yang Bertugas di Bulan Ini */}
                    <td className="py-2 px-3 text-left">
                      {m.pesertaListMonth.length === 0 ? (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1 max-w-md">
                          {(expandedMonthDelegates[m.bulanIndex] ? m.pesertaListMonth : m.pesertaListMonth.slice(0, 3)).map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200"
                              title={`${p.nama}: ${p.count}x tugas di bulan ${m.bulanFull}`}
                            >
                              <span className="truncate max-w-[110px]">{p.nama}</span>
                              {p.count > 1 && (
                                <span className="font-bold text-teal-800 bg-teal-50 px-1 rounded-sm text-[9px] border border-teal-200/60 font-mono">
                                  {p.count}x
                                </span>
                              )}
                            </span>
                          ))}

                          {m.pesertaListMonth.length > 3 && !expandedMonthDelegates[m.bulanIndex] && (
                            <button
                              type="button"
                              onClick={() => toggleMonthDelegates(m.bulanIndex)}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                              title="Klik untuk melihat semua delegasi yang bertugas di bulan ini"
                            >
                              +{m.pesertaListMonth.length - 3} lainnya ▼
                            </button>
                          )}

                          {m.pesertaListMonth.length > 3 && expandedMonthDelegates[m.bulanIndex] && (
                            <button
                              type="button"
                              onClick={() => toggleMonthDelegates(m.bulanIndex)}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold cursor-pointer transition-colors"
                              title="Tutup daftar delegasi"
                            >
                              Tutup ▲
                            </button>
                          )}

                          {/* Tombol Lihat Rincian Semua Kegiatan Bulan Ini */}
                          {m.kegiatanListMonth.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedMonthKegiatanModal({
                                bulanFull: m.bulanFull,
                                totalKegiatan: m.totalKegiatan,
                                uangTerpakai: m.uangTerpakai,
                                kegiatanList: m.kegiatanListMonth
                              })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold transition-colors cursor-pointer ml-1 shadow-2xs"
                              title={`Buka rincian lengkap ${m.totalKegiatan} kegiatan di bulan ${m.bulanFull}`}
                            >
                              <span>Lihat {m.totalKegiatan} Kegiatan</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                      {m.uangTerpakai > 0 ? formatRupiah(m.uangTerpakai) : '-'}
                    </td>

                    <td className="py-2 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                      {m.uangDibawa > 0 ? formatRupiah(m.uangDibawa) : '-'}
                    </td>

                    <td className="py-2 px-3 text-right font-mono text-sky-700 whitespace-nowrap">
                      {sisa > 0 ? formatRupiah(sisa) : '-'}
                    </td>

                    <td className="py-2 px-3 text-right font-mono text-slate-500 whitespace-nowrap">
                      {rataRata > 0 ? formatRupiah(rataRata) : '-'}
                    </td>

                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      {isMax ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                          🏆 Paling Padat
                        </span>
                      ) : isZero ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                          Nihil
                        </span>
                      ) : isMin ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-100 text-sky-700 border border-sky-200">
                          Senggang
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          Reguler
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

      {/* TABEL ANALITIK KEIKUTSERTAAN DELEGASI (SIAPA SERING KELUAR S.D. BELUM PERNAH KELUAR) */}
      <AnalitikKeikutsertaan
        pesertaList={pesertaList}
        delegasiList={filteredDelegasi}
        totalAllKegiatan={filteredDelegasi.length}
        selectedYear={selectedYear}
      />

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

      {/* Modal Rincian Semua Kegiatan Bulan Ini */}
      {selectedMonthKegiatanModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseKegiatanModal();
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                    Rincian Kegiatan Bulan {selectedMonthKegiatanModal.bulanFull || '-'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>Total: <strong>{selectedMonthKegiatanModal.totalKegiatan || 0} Kegiatan</strong></span>
                    <span>•</span>
                    <span>Pengeluaran: <strong className="text-teal-800 font-mono">{formatRupiah(selectedMonthKegiatanModal.uangTerpakai || 0)}</strong></span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseKegiatanModal}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Tutup (Kembali)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Daftar Kegiatan */}
            <ComponentErrorBoundary 
              fallbackTitle="Terjadi kesalahan saat memuat rincian kegiatan"
              onReset={handleCloseKegiatanModal}
            >
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3 divide-y divide-slate-100">
                {(!selectedMonthKegiatanModal.kegiatanList || selectedMonthKegiatanModal.kegiatanList.length === 0) ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Belum ada data kegiatan untuk bulan ini.
                  </div>
                ) : (
                  selectedMonthKegiatanModal.kegiatanList.map((k, kIdx) => {
                    if (!k) return null;
                    const sisa = Math.max(0, (k.uangDibawa || 0) - (k.uangTerpakai || 0));
                    
                    let masehiClean = '-';
                    let hijriClean = '-';
                    try {
                      if (k.tglBerangkat) {
                        const mStr = formatTanggalMasehi(k.tglBerangkat);
                        if (mStr) masehiClean = mStr.split(',')[0] || mStr;
                        const hStr = formatTanggalHijri(k.tglBerangkat);
                        if (hStr) hijriClean = hStr.split(',')[0] || hStr;
                      }
                    } catch {
                      masehiClean = String(k.tglBerangkat || '-');
                    }

                    const rawPeserta = Array.isArray(k.peserta) ? k.peserta : [];

                    return (
                      <div key={k.id || `keg-${kIdx}`} className="pt-3 first:pt-0 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center font-mono shrink-0">
                              {kIdx + 1}
                            </span>
                            <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>{typeof k.tujuan === 'string' ? k.tujuan : 'Tujuan Kegiatan'}</span>
                            </span>
                          </div>

                          <div className="text-right font-mono font-bold text-xs text-emerald-700">
                            {formatRupiah(k.uangTerpakai || 0)}
                          </div>
                        </div>

                        {/* Tanggal & Keuangan Info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Tgl Berangkat:</span>
                            <span className="font-medium text-slate-700">{masehiClean}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Tgl Hijriah:</span>
                            <span className="font-medium text-teal-700">{hijriClean}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Uang Dibawa:</span>
                            <span className="font-mono text-slate-600">{formatRupiah(k.uangDibawa || 0)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Sisa Kembali:</span>
                            <span className="font-mono text-sky-700 font-semibold">{formatRupiah(sisa)}</span>
                          </div>
                        </div>

                        {/* Delegasi yang Ditugaskan */}
                        {rawPeserta.length > 0 && (
                          <div className="text-xs">
                            <span className="text-slate-500 text-[11px] font-medium mr-1.5">Delegasi Bertugas:</span>
                            <div className="inline-flex flex-wrap gap-1 mt-1">
                              {rawPeserta.map((pid, pIdx) => {
                                const pidStr = typeof pid === 'object' && pid !== null 
                                  ? String((pid as any).nama || (pid as any).id || `Peserta ${pIdx + 1}`) 
                                  : String(pid || `Peserta ${pIdx + 1}`);

                                const p = pesertaList.find(x => {
                                  if (!x) return false;
                                  const xId = x.id ? String(x.id).toLowerCase() : '';
                                  const xNama = x.nama ? String(x.nama).toLowerCase() : '';
                                  const target = pidStr.toLowerCase();
                                  return xId === target || xNama === target;
                                });

                                const displayName = p?.nama || pidStr;
                                const displayJabatan = p?.jabatan || null;

                                return (
                                  <span
                                    key={`${pidStr}-${pIdx}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium shadow-2xs"
                                  >
                                    <span>{displayName}</span>
                                    {displayJabatan && (
                                      <span className="text-[10px] text-slate-400">({displayJabatan})</span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ComponentErrorBoundary>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={handleCloseKegiatanModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
