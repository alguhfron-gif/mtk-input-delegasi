import { Delegasi, Peserta } from '../types';
import { hitungDurasi } from './format';

export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPesertaCSV(pesertaList: Peserta[]) {
  let csv = 'ID,Nama,Domisili,Kelas,Jabatan\n';
  pesertaList.forEach(p => {
    csv += `"${p.id}","${p.nama}","${p.domisili}","${p.kelas}","${p.jabatan}"\n`;
  });
  downloadCSV(`database_peserta_${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

export function downloadTemplatePesertaCSV() {
  const csv = 'ID,Nama,Domisili,Kelas,Jabatan\nPPS011,Budi,Surabaya,X,Ketua\nPPS012,Ani,Malang,XI,Anggota\n';
  downloadCSV('template_peserta.csv', csv);
}

export function exportDelegasiCSV(delegasiList: Delegasi[], pesertaList: Peserta[]) {
  let csv = 'No,Tujuan,Peserta,Jumlah Peserta,Berangkat,Kembali,Durasi,Uang Dibawa,Uang Terpakai,Sisa Uang\n';
  delegasiList.forEach((d, i) => {
    const namaPeserta = d.peserta
      .map(id => {
        const p = pesertaList.find(item => item.id === id);
        return p ? p.nama : id;
      })
      .join('; ');

    const durasi = hitungDurasi(d.tglBerangkat, d.tglKembali);
    const sisa = d.uangDibawa - d.uangTerpakai;

    csv += `${i + 1},"${d.tujuan}","${namaPeserta}",${d.peserta.length},"${d.tglBerangkat || ''}","${d.tglKembali || ''}","${durasi}",${d.uangDibawa},${d.uangTerpakai},${sisa}\n`;
  });

  downloadCSV(`riwayat_delegasi_mtk_${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
