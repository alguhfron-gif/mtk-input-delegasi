export interface Peserta {
  id: string;
  nama: string;
  domisili: string;
  kelas: string;
  jabatan: string;
}

export interface RincianItem {
  nama: string;
  nominal: number;
}

export interface Delegasi {
  id: number;
  peserta: string[]; // array of Peserta IDs
  tujuan: string;
  tglBerangkat: string | null;
  tglKembali: string | null;
  uangDibawa: number;
  rincian: RincianItem[];
  uangTerpakai: number;
}

export type PageView = 'dashboard' | 'peserta' | 'inputDelegasi' | 'riwayat' | 'anggaran' | 'backup';

export const DEFAULT_PESERTA: Peserta[] = [
  { id: "PPS001", nama: "Ahmad Fauzi", domisili: "Jakarta", kelas: "XII", jabatan: "Ketua" },
  { id: "PPS002", nama: "Siti Aminah", domisili: "Bandung", kelas: "XI", jabatan: "Wakil Ketua" },
  { id: "PPS003", nama: "Budi Santoso", domisili: "Surabaya", kelas: "XII", jabatan: "Sekretaris" },
  { id: "PPS004", nama: "Dewi Lestari", domisili: "Medan", kelas: "X", jabatan: "Bendahara" },
  { id: "PPS005", nama: "Eko Prasetyo", domisili: "Semarang", kelas: "XI", jabatan: "Anggota" },
  { id: "PPS006", nama: "Fitri Handayani", domisili: "Yogyakarta", kelas: "XII", jabatan: "Anggota" },
  { id: "PPS007", nama: "Gilang Ramadhan", domisili: "Malang", kelas: "X", jabatan: "Anggota" },
  { id: "PPS008", nama: "Hana Safira", domisili: "Denpasar", kelas: "XI", jabatan: "Anggota" },
  { id: "PPS009", nama: "Irfan Maulana", domisili: "Makassar", kelas: "XII", jabatan: "Anggota" },
  { id: "PPS010", nama: "Jihan Nurhaliza", domisili: "Palembang", kelas: "X", jabatan: "Anggota" }
];
