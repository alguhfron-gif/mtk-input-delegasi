import React, { useState, useMemo } from 'react';
import { Delegasi, Peserta } from '../types';
import { formatRupiah, formatTanggalMasehi, formatTanggalHijri } from '../utils/format';
import {
  Users,
  Trophy,
  Flame,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowUpDown,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Award,
  Wallet,
  UserX,
  UserCheck,
  Percent,
  Sparkles
} from 'lucide-react';

interface AnalitikKeikutsertaanProps {
  pesertaList: Peserta[];
  delegasiList: Delegasi[];
  totalAllKegiatan: number;
  selectedYear: string;
}

export interface MemberDelegationStat {
  id: string;
  nama: string;
  jabatan: string;
  kelas: string;
  domisili: string;
  totalKegiatan: number;
  persentase: number;
  totalNominal: number;
  tujuanList: string[];
  kegiatanDetail: {
    id: number;
    tujuan: string;
    tglBerangkat: string | null;
    nominal: number;
  }[];
  terakhirBerangkat: string | null;
  status: 'sering' | 'pernah' | 'belum';
}

export const AnalitikKeikutsertaan: React.FC<AnalitikKeikutsertaanProps> = ({
  pesertaList,
  delegasiList,
  totalAllKegiatan,
  selectedYear
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'sering' | 'pernah' | 'belum'>('all');
  const [sortBy, setSortBy] = useState<'sering-desc' | 'sering-asc' | 'nama-asc' | 'nominal-desc'>('sering-desc');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  // Kalkulasi statistik partisipasi setiap anggota
  const allMemberStats = useMemo(() => {
    const map = new Map<string, MemberDelegationStat>();

    // 1. Inisialisasi seluruh anggota terdaftar dari pesertaList
    pesertaList.forEach(p => {
      map.set(p.id, {
        id: p.id,
        nama: p.nama,
        jabatan: p.jabatan || 'Anggota',
        kelas: p.kelas || '-',
        domisili: p.domisili || '-',
        totalKegiatan: 0,
        persentase: 0,
        totalNominal: 0,
        tujuanList: [],
        kegiatanDetail: [],
        terakhirBerangkat: null,
        status: 'belum'
      });
    });

    // 2. Akumulasi data kegiatan dari delegasiList (yang sudah difilter tahun)
    delegasiList.forEach(d => {
      if (Array.isArray(d.peserta)) {
        d.peserta.forEach(pIdentifier => {
          if (!pIdentifier) return;

          // Cari anggota berdasarkan ID atau kesamaan nama
          let targetKey = '';
          for (const [id, stat] of map.entries()) {
            if (id === pIdentifier || stat.nama.toLowerCase() === pIdentifier.toLowerCase()) {
              targetKey = id;
              break;
            }
          }

          // Jika ada anggota yang tercatat di delegasi tapi tidak ada di pesertaList, buatkan entri baru
          if (!targetKey) {
            targetKey = pIdentifier;
            map.set(targetKey, {
              id: targetKey,
              nama: pIdentifier,
              jabatan: 'Anggota',
              kelas: '-',
              domisili: '-',
              totalKegiatan: 0,
              persentase: 0,
              totalNominal: 0,
              tujuanList: [],
              kegiatanDetail: [],
              terakhirBerangkat: null,
              status: 'belum'
            });
          }

          const stat = map.get(targetKey)!;
          stat.totalKegiatan += 1;
          stat.totalNominal += (d.uangTerpakai || 0);

          if (d.tujuan && !stat.tujuanList.includes(d.tujuan)) {
            stat.tujuanList.push(d.tujuan);
          }

          stat.kegiatanDetail.push({
            id: d.id,
            tujuan: d.tujuan,
            tglBerangkat: d.tglBerangkat,
            nominal: d.uangTerpakai || 0
          });

          if (d.tglBerangkat) {
            if (!stat.terakhirBerangkat || new Date(d.tglBerangkat) > new Date(stat.terakhirBerangkat)) {
              stat.terakhirBerangkat = d.tglBerangkat;
            }
          }
        });
      }
    });

    const list = Array.from(map.values());
    const maxKegiatan = Math.max(...list.map(x => x.totalKegiatan), 0);
    // Ambang batas 'sering': jika ada kegiatan dan frekuensi >= 2
    const thresholdSering = maxKegiatan >= 4 ? 3 : 2;

    list.forEach(stat => {
      stat.persentase = totalAllKegiatan > 0 ? Number(((stat.totalKegiatan / totalAllKegiatan) * 100).toFixed(1)) : 0;
      if (stat.totalKegiatan === 0) {
        stat.status = 'belum';
      } else if (stat.totalKegiatan >= thresholdSering) {
        stat.status = 'sering';
      } else {
        stat.status = 'pernah';
      }
    });

    return list;
  }, [pesertaList, delegasiList, totalAllKegiatan]);

  // Statistik Ringkasan (KPI)
  const summary = useMemo(() => {
    const totalAnggota = allMemberStats.length;
    const seringList = allMemberStats.filter(m => m.status === 'sering');
    const pernahList = allMemberStats.filter(m => m.status === 'pernah');
    const belumPernahList = allMemberStats.filter(m => m.status === 'belum');

    // Anggota no. 1 paling sering
    const sortedByFreq = [...allMemberStats].sort((a, b) => b.totalKegiatan - a.totalKegiatan);
    const topMember = sortedByFreq.length > 0 && sortedByFreq[0].totalKegiatan > 0 ? sortedByFreq[0] : null;

    const pernahAtauSeringCount = seringList.length + pernahList.length;
    const rasioPemerataan = totalAnggota > 0 ? ((pernahAtauSeringCount / totalAnggota) * 100).toFixed(0) : '0';

    const maxKegiatan = Math.max(...allMemberStats.map(x => x.totalKegiatan), 1);

    return {
      totalAnggota,
      seringCount: seringList.length,
      pernahCount: pernahList.length,
      belumPernahCount: belumPernahList.length,
      topMember,
      rasioPemerataan,
      maxKegiatan
    };
  }, [allMemberStats]);

  // Filter & Urutkan Data Tabel
  const filteredAndSortedStats = useMemo(() => {
    let result = [...allMemberStats];

    // Filter berdasarkan Tab
    if (filterTab === 'sering') {
      result = result.filter(m => m.status === 'sering');
    } else if (filterTab === 'pernah') {
      result = result.filter(m => m.status === 'pernah');
    } else if (filterTab === 'belum') {
      result = result.filter(m => m.status === 'belum');
    }

    // Filter berdasarkan Pencarian Nama/ID/Jabatan
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        m =>
          m.nama.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.jabatan.toLowerCase().includes(q) ||
          m.tujuanList.some(t => t.toLowerCase().includes(q))
      );
    }

    // Urutkan (Sorting)
    if (sortBy === 'sering-desc') {
      // Paling sering keluar (terbanyak -> 0x)
      result.sort((a, b) => {
        if (b.totalKegiatan !== a.totalKegiatan) {
          return b.totalKegiatan - a.totalKegiatan;
        }
        return b.totalNominal - a.totalNominal;
      });
    } else if (sortBy === 'sering-asc') {
      // Belum pernah keluar dulu (0x -> terbanyak)
      result.sort((a, b) => {
        if (a.totalKegiatan !== b.totalKegiatan) {
          return a.totalKegiatan - b.totalKegiatan;
        }
        return a.nama.localeCompare(b.nama);
      });
    } else if (sortBy === 'nama-asc') {
      result.sort((a, b) => a.nama.localeCompare(b.nama));
    } else if (sortBy === 'nominal-desc') {
      result.sort((a, b) => b.totalNominal - a.totalNominal);
    }

    return result;
  }, [allMemberStats, filterTab, searchQuery, sortBy]);

  const toggleExpand = (id: string) => {
    setExpandedMemberId(prev => (prev === id ? null : id));
  };

  return (
    <div id="analitik-keikutsertaan-delegasi" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      
      {/* Header Bagian */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                <Users className="w-4.5 h-4.5" />
              </span>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                <span>Tabel Analitik Keikutsertaan Delegasi</span>
                <span className="text-[11px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                  {selectedYear === 'all' ? 'Semua Periode' : `Tahun ${selectedYear} H`}
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Peringkat frekuensi nama yang paling sering ditugaskan keluar hingga nama yang belum pernah menjadi delegasi.
            </p>
          </div>

          {/* Badge Status Pemerataan */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs self-start md:self-auto">
            <Percent className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-slate-500">Pemerataan Tugas:</span>
            <span className="font-bold text-teal-800 font-mono">{summary.rasioPemerataan}% anggota</span>
          </div>
        </div>

        {/* 4 KPI Ringkasan Keikutsertaan Anggota */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          
          {/* 1. Paling Sering Jadi Delegasi */}
          <div className="bg-white p-3 rounded-xl border border-teal-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-teal-900 mb-1">
              <span>Paling Sering</span>
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={summary.topMember ? summary.topMember.nama : 'Belum Ada'}>
              {summary.topMember ? summary.topMember.nama : 'Belum ada'}
            </div>
            <div className="text-[10px] font-mono text-teal-700 font-semibold mt-0.5">
              {summary.topMember ? `🏆 ${summary.topMember.totalKegiatan}x kegiatan (${summary.topMember.persentase}%)` : '0 kegiatan'}
            </div>
          </div>

          {/* 2. Sering Bertugas */}
          <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900 mb-1">
              <span>Sering Keluar</span>
              <Flame className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-sm sm:text-base font-black text-emerald-700 font-mono">
              {summary.seringCount} <span className="text-xs font-normal text-slate-500">orang</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Intensitas tinggi (≥ 2-3x)
            </div>
          </div>

          {/* 3. Pernah Bertugas */}
          <div className="bg-white p-3 rounded-xl border border-sky-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-sky-900 mb-1">
              <span>Pernah Keluar</span>
              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="text-sm sm:text-base font-black text-sky-700 font-mono">
              {summary.pernahCount} <span className="text-xs font-normal text-slate-500">orang</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Pernah bertugas (1x)
            </div>
          </div>

          {/* 4. Belum Pernah Keluar (Paling Krusial untuk Pemerataan) */}
          <div className="bg-white p-3 rounded-xl border border-rose-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-rose-900 mb-1">
              <span>Belum Pernah (0x)</span>
              <UserX className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-sm sm:text-base font-black text-rose-600 font-mono">
              {summary.belumPernahCount} <span className="text-xs font-normal text-slate-500">orang</span>
            </div>
            <div className="text-[10px] text-rose-700 font-medium mt-0.5">
              Belum pernah ada giliran
            </div>
          </div>

        </div>
      </div>

      {/* Kontrol Filter, Pencarian, dan Urutan */}
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
        
        {/* Tab Kategori Keaktifan */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Semua Anggota ({summary.totalAnggota})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('sering')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterTab === 'sering'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sering Keluar ({summary.seringCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('pernah')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterTab === 'pernah'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100/80 border border-sky-200/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-500" />
            <span>Pernah Keluar ({summary.pernahCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('belum')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterTab === 'belum'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100/80 border border-rose-200/60'
            }`}
            title="Klik untuk melihat anggota yang belum pernah menjadi delegasi"
          >
            <UserX className="w-3.5 h-3.5 text-rose-500" />
            <span>Belum Pernah ({summary.belumPernahCount})</span>
          </button>
        </div>

        {/* Pencarian dan Pilihan Urutan */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Input Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama anggota..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500 text-slate-800"
            />
          </div>

          {/* Select Sorting */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="sering-desc">Paling Sering → Belum Pernah (0x)</option>
              <option value="sering-asc">Belum Pernah (0x) → Sering</option>
              <option value="nama-asc">Nama Anggota (A - Z)</option>
              <option value="nominal-desc">Total Dana Terbesar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Data Keikutsertaan */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 text-center w-14">Rank</th>
              <th className="py-3 px-3">Nama Anggota & Jabatan</th>
              <th className="py-3 px-3 text-center min-w-[140px]">Frekuensi Delegasi</th>
              <th className="py-3 px-3 text-center">Status Keaktifan</th>
              <th className="py-3 px-3">Kegiatan / Tujuan yang Diikuti</th>
              <th className="py-3 px-3 text-right">Total Dana Terkait</th>
              <th className="py-3 px-3 text-center">Terakhir Tugas</th>
              <th className="py-3 px-3 text-center w-12">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredAndSortedStats.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-7 h-7 text-slate-300" />
                    <span>Tidak ada anggota yang sesuai dengan filter atau pencarian.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedStats.map((member, index) => {
                const isExpanded = expandedMemberId === member.id;
                const progressPct = summary.maxKegiatan > 0 ? (member.totalKegiatan / summary.maxKegiatan) * 100 : 0;
                
                // Rank styling
                const isTop1 = member.totalKegiatan > 0 && index === 0 && sortBy === 'sering-desc';
                const isTop2 = member.totalKegiatan > 0 && index === 1 && sortBy === 'sering-desc';
                const isTop3 = member.totalKegiatan > 0 && index === 2 && sortBy === 'sering-desc';

                return (
                  <React.Fragment key={member.id}>
                    <tr
                      className={`hover:bg-slate-50/80 transition-colors ${
                        member.status === 'sering'
                          ? 'bg-emerald-50/20'
                          : member.status === 'belum'
                          ? 'bg-slate-50/30 text-slate-500'
                          : ''
                      }`}
                    >
                      {/* 1. Peringkat */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {member.totalKegiatan === 0 ? (
                          <span className="text-slate-400 text-xs font-mono font-medium">—</span>
                        ) : isTop1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-black text-xs shadow-2xs border border-amber-300">
                            🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-black text-xs shadow-2xs border border-slate-300">
                            🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/10 text-amber-900 font-black text-xs shadow-2xs border border-amber-600/30">
                            🥉
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-bold text-[11px]">
                            #{index + 1}
                          </span>
                        )}
                      </td>

                      {/* 2. Nama Anggota & Jabatan */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              member.status === 'sering'
                                ? 'bg-emerald-100 text-emerald-800'
                                : member.status === 'pernah'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {member.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{member.nama}</span>
                              {isTop1 && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-200">
                                  Top 1
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                                {member.id}
                              </span>
                              <span>•</span>
                              <span className="text-slate-600 font-medium">{member.jabatan}</span>
                              {member.kelas && member.kelas !== '-' && (
                                <>
                                  <span>•</span>
                                  <span>Kelas {member.kelas}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Frekuensi Delegasi (Progress & Count) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono font-black text-xs px-2 py-0.5 rounded-full ${
                                member.totalKegiatan >= 3
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : member.totalKegiatan > 0
                                  ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {member.totalKegiatan}x kegiatan
                            </span>
                            {member.totalKegiatan > 0 && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({member.persentase}%)
                              </span>
                            )}
                          </div>

                          {/* Mini Progress Bar */}
                          {member.totalKegiatan > 0 ? (
                            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  member.status === 'sering' ? 'bg-emerald-500' : 'bg-sky-500'
                                }`}
                                style={{ width: `${Math.max(8, progressPct)}%` }}
                              />
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal">Nihil / 0%</span>
                          )}
                        </div>
                      </td>

                      {/* 4. Status Keaktifan */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {member.status === 'sering' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                            <Flame className="w-3 h-3 text-emerald-600" />
                            <span>Sering Keluar</span>
                          </span>
                        ) : member.status === 'pernah' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-200/80">
                            <CheckCircle2 className="w-3 h-3 text-sky-600" />
                            <span>Pernah Keluar</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <UserX className="w-3 h-3 text-rose-500" />
                            <span>Belum Pernah Keluar</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Daftar Tujuan yang Diikuti */}
                      <td className="py-3 px-3 text-left">
                        {member.tujuanList.length === 0 ? (
                          <span className="text-slate-400 italic text-[11px] flex items-center gap-1">
                            <span>Belum pernah ada tugas</span>
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1 max-w-xs">
                            {member.tujuanList.slice(0, 3).map((tujuan, tIdx) => (
                              <span
                                key={tIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200"
                              >
                                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                <span className="truncate max-w-[120px]">{tujuan}</span>
                              </span>
                            ))}
                            {member.tujuanList.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                                +{member.tujuanList.length - 3} lainnya
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 6. Total Dana Terkait */}
                      <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                        {member.totalNominal > 0 ? (
                          <span className="text-slate-800">{formatRupiah(member.totalNominal)}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>

                      {/* 7. Terakhir Bertugas */}
                      <td className="py-3 px-3 text-center whitespace-nowrap text-[11px]">
                        {member.terakhirBerangkat ? (
                          <div>
                            <div className="font-semibold text-slate-700">
                              {formatTanggalMasehi(member.terakhirBerangkat).split(',')[0]}
                            </div>
                            <div className="text-[10px] text-teal-700 font-medium">
                              {formatTanggalHijri(member.terakhirBerangkat).split(',')[0]}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum Ada</span>
                        )}
                      </td>

                      {/* 8. Tombol Detail Expand */}
                      <td className="py-3 px-3 text-center">
                        {member.totalKegiatan > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(member.id)}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Lihat detail riwayat kegiatan anggota"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-teal-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-300">•</span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Riwayat Kegiatan Anggota */}
                    {isExpanded && member.kegiatanDetail.length > 0 && (
                      <tr className="bg-teal-50/30 border-b border-teal-100">
                        <td colSpan={8} className="p-3.5 pl-14">
                          <div className="bg-white p-3 rounded-xl border border-teal-200/80 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-xs">
                              <span className="font-bold text-teal-900 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                                <span>Riwayat Penugasan: {member.nama} ({member.kegiatanDetail.length} Kegiatan)</span>
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Total Pengeluaran: <strong className="text-slate-800 font-mono">{formatRupiah(member.totalNominal)}</strong>
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                              {member.kegiatanDetail.map((k, kIdx) => (
                                <div
                                  key={kIdx}
                                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-col justify-between gap-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800 truncate pr-2 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                                      <span>{k.tujuan}</span>
                                    </span>
                                    <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      {formatRupiah(k.nominal)}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-1">
                                    <span>Tgl: {formatTanggalMasehi(k.tglBerangkat)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info Catatan Pemerataan */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>
            Menampilkan <strong>{filteredAndSortedStats.length}</strong> dari <strong>{summary.totalAnggota}</strong> anggota MTK Sidogiri.
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          💡 Tips: Klik tab <strong>"Belum Pernah"</strong> untuk memprioritaskan anggota yang belum pernah ditugaskan pada kegiatan berikutnya.
        </div>
      </div>

    </div>
  );
};
