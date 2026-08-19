export function toHijri(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';
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

  const hijriMonths = [
    "Muharram", "Safar", "Rabiul Awwal", "Rabiul Akhir",
    "Jumadil Awwal", "Jumadil Akhir", "Rajab", "Sya'ban",
    "Ramadhan", "Syawal", "Zulkaidah", "Zulhijjah"
  ];

  if (hMonth < 1 || hMonth > 12) return '';
  return `${hDay} ${hijriMonths[hMonth - 1]} ${hYear} H`;
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
