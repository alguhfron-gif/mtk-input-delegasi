import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Delegasi, Peserta } from '../types';
import { formatRupiah, formatTanggalMasehi, formatTanggalHijri, hitungDurasi } from './format';

// Helper to trigger file download cross-platform (Android, iOS, Desktop)
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

// 1. Export Delegasi to Excel (.xlsx)
export function exportDelegasiExcel(delegasiList: Delegasi[], pesertaList: Peserta[]) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `Laporan_Delegasi_MTK_${timestamp}.xlsx`;

  // Prepare detailed rows
  const dataRows = delegasiList.map((d, index) => {
    const namaPeserta = d.peserta
      .map(id => {
        const p = pesertaList.find(x => x.id === id);
        return p ? `${p.nama} (${p.domisili})` : id;
      })
      .join(', ');

    const rincianText = d.rincian.length > 0
      ? d.rincian.map(r => `${r.nama}: ${formatRupiah(r.nominal)}`).join(' | ')
      : '-';

    const sisa = d.uangDibawa - d.uangTerpakai;

    return {
      'No': index + 1,
      'Tujuan Kegiatan': d.tujuan,
      'Anggota Delegasi': namaPeserta,
      'Jumlah Peserta': d.peserta.length,
      'Tgl Berangkat (Masehi)': formatTanggalMasehi(d.tglBerangkat),
      'Tgl Berangkat (Hijri)': formatTanggalHijri(d.tglBerangkat),
      'Tgl Kembali (Masehi)': formatTanggalMasehi(d.tglKembali),
      'Tgl Kembali (Hijri)': formatTanggalHijri(d.tglKembali),
      'Durasi': hitungDurasi(d.tglBerangkat, d.tglKembali),
      'Uang Dibawa (Rp)': d.uangDibawa,
      'Uang Terpakai (Rp)': d.uangTerpakai,
      'Sisa Dana (Rp)': sisa,
      'Status Keuangan': sisa >= 0 ? 'Surplus / Sisa' : 'Defisit / Kurang',
      'Rincian Pengeluaran': rincianText
    };
  });

  // Calculate Summary
  const totalDibawa = delegasiList.reduce((sum, d) => sum + d.uangDibawa, 0);
  const totalTerpakai = delegasiList.reduce((sum, d) => sum + d.uangTerpakai, 0);
  const totalSisa = totalDibawa - totalTerpakai;

  const summaryRows = [
    { 'Ringkasan Keuangan': 'Total Kegiatan Delegasi', 'Nilai': `${delegasiList.length} Kegiatan` },
    { 'Ringkasan Keuangan': 'Total Uang Dibawa', 'Nilai': formatRupiah(totalDibawa) },
    { 'Ringkasan Keuangan': 'Total Uang Terpakai', 'Nilai': formatRupiah(totalTerpakai) },
    { 'Ringkasan Keuangan': 'Sisa Akumulasi Kas', 'Nilai': formatRupiah(totalSisa) },
    { 'Ringkasan Keuangan': 'Tanggal Ekspor Laporan', 'Nilai': new Date().toLocaleString('id-ID') }
  ];

  // Create Workbook and Sheets
  const wb = XLSX.utils.book_new();

  const wsLaporan = XLSX.utils.json_to_sheet(dataRows);
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

  // Set column widths
  wsLaporan['!cols'] = [
    { wch: 5 },  // No
    { wch: 28 }, // Tujuan
    { wch: 35 }, // Peserta
    { wch: 14 }, // Jml
    { wch: 22 }, // Berangkat Masehi
    { wch: 22 }, // Berangkat Hijri
    { wch: 22 }, // Kembali Masehi
    { wch: 22 }, // Kembali Hijri
    { wch: 12 }, // Durasi
    { wch: 18 }, // Dibawa
    { wch: 18 }, // Terpakai
    { wch: 18 }, // Sisa
    { wch: 18 }, // Status
    { wch: 45 }  // Rincian
  ];

  wsSummary['!cols'] = [
    { wch: 30 },
    { wch: 25 }
  ];

  XLSX.utils.book_append_sheet(wb, wsLaporan, 'Riwayat Delegasi');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Kas');

  // Write file buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerFileDownload(blob, filename);
}

// 2. Export Delegasi to PDF (.pdf)
export function exportDelegasiPDF(delegasiList: Delegasi[], pesertaList: Peserta[]) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `Laporan_Delegasi_MTK_${timestamp}.pdf`;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Colors
  const primaryNavy = [30, 41, 59]; // #1e293b
  const emeraldGreen = [5, 150, 105]; // #059669
  const textDark = [15, 23, 42];

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('LAPORAN PERTANGGUNGJAWABAN & RIWAYAT DELEGASI MTK', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID')} | Total: ${delegasiList.length} Kegiatan`, 14, 21);

  // Summary Financial Box
  const totalDibawa = delegasiList.reduce((sum, d) => sum + d.uangDibawa, 0);
  const totalTerpakai = delegasiList.reduce((sum, d) => sum + d.uangTerpakai, 0);
  const totalSisa = totalDibawa - totalTerpakai;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 25, 269, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`TOTAL DIBAWA: ${formatRupiah(totalDibawa)}`, 20, 33);
  doc.text(`TOTAL TERPAKAI: ${formatRupiah(totalTerpakai)}`, 105, 33);
  doc.setTextColor(totalSisa >= 0 ? emeraldGreen[0] : 220, totalSisa >= 0 ? emeraldGreen[1] : 38, totalSisa >= 0 ? emeraldGreen[2] : 38);
  doc.text(`SISA AKUMULASI: ${formatRupiah(totalSisa)}`, 190, 33);

  // Table Body
  const tableData = delegasiList.map((d, idx) => {
    const namaPeserta = d.peserta
      .map(id => {
        const p = pesertaList.find(x => x.id === id);
        return p ? p.nama : id;
      })
      .join(', ');

    const sisa = d.uangDibawa - d.uangTerpakai;

    return [
      idx + 1,
      d.tujuan,
      namaPeserta,
      `${formatTanggalMasehi(d.tglBerangkat)}\ns/d ${formatTanggalMasehi(d.tglKembali)}`,
      formatRupiah(d.uangDibawa),
      formatRupiah(d.uangTerpakai),
      formatRupiah(sisa)
    ];
  });

  autoTable(doc, {
    startY: 43,
    head: [['No', 'Tujuan Kegiatan', 'Anggota Delegasi', 'Jadwal Kegiatan', 'Dibawa', 'Terpakai', 'Sisa Dana']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 48, fontStyle: 'bold' },
      2: { cellWidth: 65 },
      3: { cellWidth: 42, halign: 'center' },
      4: { halign: 'right', cellWidth: 32 },
      5: { halign: 'right', cellWidth: 32 },
      6: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount} - Dokumen Resmi Sistem Delegasi MTK`,
        14,
        doc.internal.pageSize.height - 8
      );
    }
  });

  // Trigger Save
  doc.save(filename);
}

// 3. Export Single Nota to PDF (.pdf)
export function exportNotaPDF(delegasi: Delegasi, pesertaList: Peserta[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pesertaNames = delegasi.peserta.map(id => {
    const p = pesertaList.find(x => x.id === id);
    return p ? p.nama : id;
  });

  const totalSisa = delegasi.uangDibawa - delegasi.uangTerpakai;
  const fileName = `Nota_Delegasi_${delegasi.id}_${delegasi.tujuan.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)}.pdf`;

  // Border Outer Card
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, 15, 180, 265, 3, 3, 'S');

  // Header
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(25, 22, 160, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('NOTA PENGELUARAN DELEGASI MTK', 105, 31, { align: 'center' });

  // Tujuan & Info Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(25, 42, 160, 38, 2, 2, 'FD');

  // Tujuan Kegiatan
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('TUJUAN KEGIATAN:', 29, 49);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(delegasi.tujuan, 65, 49, { maxWidth: 115 });

  // Anggota Delegasi
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('ANGGOTA DELEGASI:', 29, 58);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(pesertaNames.join(', '), 65, 58, { maxWidth: 115 });

  // Jadwal Berangkat & Kembali
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('JADWAL BERANGKAT:', 29, 67);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatTanggalMasehi(delegasi.tglBerangkat)} (${formatTanggalHijri(delegasi.tglBerangkat)})`, 65, 67);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('JADWAL KEMBALI:', 29, 75);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatTanggalMasehi(delegasi.tglKembali)} (${formatTanggalHijri(delegasi.tglKembali)})`, 65, 75);

  // Box Uang Dibawa
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(25, 84, 160, 11, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('UANG DIBAWA:', 30, 91);
  doc.text(formatRupiah(delegasi.uangDibawa), 180, 91, { align: 'right' });

  // Rincian Pengeluaran Table
  const tableData = delegasi.rincian.map((item, idx) => [
    idx + 1,
    item.nama,
    formatRupiah(item.nominal)
  ]);

  tableData.push([
    '',
    'TOTAL PENGELUARAN:',
    formatRupiah(delegasi.uangTerpakai)
  ]);

  autoTable(doc, {
    startY: 98,
    margin: { left: 25, right: 25 },
    head: [['No', 'Keterangan Pengeluaran', 'Nominal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 100 },
      2: { halign: 'right', cellWidth: 48, fontStyle: 'bold' }
    }
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  const finalY = doc.lastAutoTable.finalY + 6;

  // Sisa Dana Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(25, finalY, 160, 12, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('SISA UANG DELEGASI:', 30, finalY + 8);
  doc.setTextColor(totalSisa >= 0 ? 5 : 220, totalSisa >= 0 ? 150 : 38, totalSisa >= 0 ? 105 : 38);
  doc.text(formatRupiah(totalSisa), 180, finalY + 8, { align: 'right' });

  // Tanda Tangan
  const sigY = Math.min(finalY + 24, 230);
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Mengetahui,', 50, sigY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('TU MTK', 50, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('MOH ALI GHUFORN', 50, sigY + 25, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('Ketua Delegasi,', 155, sigY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Penanggung Jawab', 155, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(pesertaNames[0] || '______________________', 155, sigY + 25, { align: 'center' });

  doc.save(fileName);
}
