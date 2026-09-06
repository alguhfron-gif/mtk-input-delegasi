export const HIJRI_MONTHS = [
  "Muharram", "Shafar", "Rabiul Awal", "Rabiul Tsani",
  "Jumadal Ula", "Jumadas Tsani", "Rajab", "Sya'ban",
  "Ramadhan", "Syawal", "Dzul Qa'dah", "Dzul Hijjah"
];

// Urutan siklus tahun ajaran pesantren:
// 1. Syawal (Paling awal / paling bawah)
// 2. Dzul Qa'dah
// 3. Dzul Hijjah
// 4. Muharram
// 5. Shafar
// 6. Rabiul Awal
// 7. Rabiul Tsani
// 8. Jumadal Ula
// 9. Jumadas Tsani
// 10. Rajab
// 11. Sya'ban
// 12. Ramadhan (Paling akhir / paling atas)
export const PESANTREN_MONTH_RANK: Record<number, number> = {
  10: 1,  // Syawal (Bulan 10 Hijriah -> Rank 1, paling bawah)
  11: 2,  // Dzul Qa'dah (Bulan 11 Hijriah -> Rank 2)
  12: 3,  // Dzul Hijjah (Bulan 12 Hijriah -> Rank 3)
  1: 4,   // Muharram (Bulan 1 Hijriah -> Rank 4)
  2: 5,   // Shafar (Bulan 2 Hijriah -> Rank 5)
  3: 6,   // Rabiul Awal (Bulan 3 Hijriah -> Rank 6)
  4: 7,   // Rabiul Tsani (Bulan 4 Hijriah -> Rank 7)
  5: 8,   // Jumadal Ula (Bulan 5 Hijriah -> Rank 8)
  6: 9,   // Jumadas Tsani (Bulan 6 Hijriah -> Rank 9)
  7: 10,  // Rajab (Bulan 7 Hijriah -> Rank 10)
  8: 11,  // Sya'ban (Bulan 8 Hijriah -> Rank 11)
  9: 12   // Ramadhan (Bulan 9 Hijriah -> Rank 12, paling atas)
};

export interface HijriDateInfo {
  day: number;
  month: number; // 1 to 12
  year: number;
  monthName: string;
  formatted: string;
  sortKey: number; // e.g. 14460115 for 15 Muharram 1446
  pesantrenWeight: number; // bobot urutan tahun ajaran pesantren
}

/**
 * Menghitung bobot urutan kalender pesantren:
 * Paling bawah: Syawal, Dzul Qa'dah, Dzul Hijjah
 * Lanjut ke: Muharram, Shafar, Rabiul Awal, Rabiul Tsani, Jumadal Ula, Jumadas Tsani, Rajab, Sya'ban
 * Paling atas: Ramadhan (atau bulan terbaru)
 */
export function getPesantrenSortWeight(input: string | Date | null): number {
  if (!input) return -1;
  const info = getHijriInfo(input);
  if (!info) return -1;
  return info.pesantrenWeight;
}

export function getHijriInfo(input: string | Date | null): HijriDateInfo | null {
  if (!input) return null;
  const date = typeof input === 'string' ? new Date(input) : input;
  if (!date || isNaN(date.getTime())) return null;

  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();

  const jd = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
             Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
             Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) + d - 32075;
             
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hMonth = Math.floor((24 * l3) / 709);
  const hDay = l3 - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;

  if (hMonth < 1 || hMonth > 12) return null;

  const monthName = HIJRI_MONTHS[hMonth - 1];
  const sortKey = (hYear * 10000) + (hMonth * 100) + hDay;

  // Tahun ajaran pesantren dimulai pada bulan Syawal (bulan 10):
  // Bulan 10, 11, 12 berada pada tahun hijriah yang sama (hYear),
  // sedangkan bulan 1 sampai 9 berada pada tahun hijriah berikutnya (hYear),
  // sehingga satu siklus ajaran (Syawal s/d Ramadhan) memiliki base year yang selaras:
  const cycleYear = hMonth >= 10 ? hYear : hYear - 1;
  const monthRank = PESANTREN_MONTH_RANK[hMonth] || hMonth;
  const pesantrenWeight = (cycleYear * 10000) + (monthRank * 100) + hDay;

  return {
    day: hDay,
    month: hMonth,
    year: hYear,
    monthName,
    formatted: `${hDay} ${monthName} ${hYear} H`,
    sortKey,
    pesantrenWeight
  };
}

export function toHijri(date: Date): string {
  const info = getHijriInfo(date);
  return info ? info.formatted : '';
}

export function formatRupiah(amount: number): string {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

export function formatTanggalMasehi(isoStr: string | null): string {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTanggalHijri(isoStr: string | null): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return toHijri(d);
}

export function hitungDurasi(a: string | null, b: string | null): string {
  if (!a || !b) return '-';
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return '-';
  const diffTime = Math.abs(db.getTime() - da.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} hari`;
}
