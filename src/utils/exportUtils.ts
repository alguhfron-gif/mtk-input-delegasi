import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Delegasi, Peserta } from '../types';
import { formatRupiah, formatTanggalMasehi, formatTanggalHijri, hitungDurasi } from './format';
import { LOGO_MTK_BASE64 } from '../assets/logoData';

// Helper to trigger file download cross-platform (Android, iOS, Desktop)
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Keep object URL alive for 60 seconds so mobile download managers don't abort
  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, 60000);
}

// Helper to trigger direct download from Base64 Data URL (Highly reliable for mobile PNG images)
export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    } catch {
      // ignore
    }
  }, 2000);
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

// 3. Export Single Nota to 58mm Thermal Receipt PDF (.pdf)
export function exportNotaPDF(delegasi: Delegasi, pesertaList: Peserta[]) {
  const pesertaNames = delegasi.peserta.map(id => {
    const p = pesertaList.find(x => x.id === id);
    return p ? p.nama : id;
  });

  const totalSisa = delegasi.uangDibawa - delegasi.uangTerpakai;
  const fileName = `Nota_Delegasi_58mm_${delegasi.id}_${delegasi.tujuan.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 15)}.pdf`;

  // Calculate dynamic height in mm for continuous 58mm thermal receipt roll
  const baseItemsCount = Math.max(delegasi.rincian.length, 1);
  const itemsHeightMm = baseItemsCount * 5;
  const pesertaHeightMm = Math.ceil(pesertaNames.join(', ').length / 30) * 4;
  const totalHeightMm = Math.max(140 + itemsHeightMm + pesertaHeightMm, 150);

  // Initialize jsPDF with exact 58mm thermal roll width
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [58, totalHeightMm]
  });

  const pageWidth = 58;
  const marginX = 3.5;
  const printableWidth = pageWidth - marginX * 2; // 51mm
  const rightX = pageWidth - marginX;

  let currentY = 5;

  // 1. Centered Logo MTK Sidogiri
  try {
    const logoSize = 13;
    const logoX = (pageWidth - logoSize) / 2;
    doc.addImage(LOGO_MTK_BASE64, 'PNG', logoX, currentY, logoSize, logoSize);
    currentY += logoSize + 3;
  } catch (err) {
    console.warn('Could not add logo to PDF:', err);
    currentY += 2;
  }

  // 2. Header Text (Thermal Store Style)
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PONDOK PESANTREN SIDOGIRI', pageWidth / 2, currentY, { align: 'center' });
  currentY += 3.5;

  doc.setFontSize(6.5);
  doc.text('MTK (TAKLIMUL KITAB)', pageWidth / 2, currentY, { align: 'center' });
  currentY += 3;

  doc.setFont('courier', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Pasuruan, Jawa Timur', pageWidth / 2, currentY, { align: 'center' });
  currentY += 3.2;

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('NOTA PENGELUARAN DELEGASI', pageWidth / 2, currentY, { align: 'center' });
  currentY += 2.5;

  // Dotted / Dashed Divider
  const drawLine = (y: number, char = '-') => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(char.repeat(34), pageWidth / 2, y, { align: 'center' });
  };

  drawLine(currentY, '=');
  currentY += 3.5;

  // 3. Metadata Info
  doc.setFont('courier', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text(`No. Bukti : #DEL-${String(delegasi.id).padStart(4, '0')}`, marginX, currentY);
  currentY += 3.2;

  doc.setFont('courier', 'normal');
  doc.text(`Berangkat : ${formatTanggalMasehi(delegasi.tglBerangkat).split(',')[0]}`, marginX, currentY);
  currentY += 2.8;
  doc.text(`            (${formatTanggalHijri(delegasi.tglBerangkat).split(',')[0]})`, marginX, currentY);
  currentY += 3.2;

  if (delegasi.tglKembali) {
    doc.text(`Kembali   : ${formatTanggalMasehi(delegasi.tglKembali).split(',')[0]}`, marginX, currentY);
    currentY += 2.8;
    doc.text(`            (${formatTanggalHijri(delegasi.tglKembali).split(',')[0]})`, marginX, currentY);
    currentY += 3.2;
  }

  // Tujuan
  doc.setFont('courier', 'bold');
  doc.text('Tujuan    :', marginX, currentY);
  doc.setFont('courier', 'normal');
  const tujuanLines = doc.splitTextToSize(delegasi.tujuan || '-', printableWidth - 16);
  doc.text(tujuanLines, marginX + 16, currentY);
  currentY += Math.max(tujuanLines.length * 3, 3.5);

  // Delegasi
  doc.setFont('courier', 'bold');
  doc.text(`Delegasi (${delegasi.peserta.length}):`, marginX, currentY);
  currentY += 3;
  doc.setFont('courier', 'normal');
  const pesertaLines = doc.splitTextToSize(pesertaNames.join(', ') || '-', printableWidth);
  doc.text(pesertaLines, marginX, currentY);
  currentY += pesertaLines.length * 3 + 1;

  drawLine(currentY);
  currentY += 3.5;

  // 4. Items List
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.text('RINCIAN PENGELUARAN:', marginX, currentY);
  currentY += 3.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(6);

  if (delegasi.rincian.length === 0) {
    doc.text('Tidak ada rincian pos pengeluaran', marginX, currentY);
    currentY += 3.5;
  } else {
    delegasi.rincian.forEach((item, idx) => {
      const itemTitle = `${idx + 1}. ${item.nama}`;
      const nominalText = formatRupiah(item.nominal);
      const titleLines = doc.splitTextToSize(itemTitle, printableWidth - 20);

      doc.text(titleLines, marginX, currentY);
      doc.setFont('courier', 'bold');
      doc.text(nominalText, rightX, currentY, { align: 'right' });
      doc.setFont('courier', 'normal');

      currentY += Math.max(titleLines.length * 3, 3.5);
    });
  }

  drawLine(currentY);
  currentY += 3.5;

  // 5. Totals
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.text('Uang Dibawa    :', marginX, currentY);
  doc.text(formatRupiah(delegasi.uangDibawa), rightX, currentY, { align: 'right' });
  currentY += 3.5;

  doc.text('Uang Terpakai  :', marginX, currentY);
  doc.text(formatRupiah(delegasi.uangTerpakai), rightX, currentY, { align: 'right' });
  currentY += 2.5;

  drawLine(currentY, '=');
  currentY += 3.5;

  // Sisa Uang Saku
  doc.setFontSize(7.5);
  if (totalSisa >= 0) {
    doc.setTextColor(4, 120, 87);
    doc.text('SISA KEMBALI   :', marginX, currentY);
  } else {
    doc.setTextColor(185, 28, 28);
    doc.text('KEKURANGAN DANA:', marginX, currentY);
  }
  doc.text(formatRupiah(Math.abs(totalSisa)), rightX, currentY, { align: 'right' });
  currentY += 2.5;

  drawLine(currentY, '=');
  currentY += 3.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    totalSisa >= 0 ? '*Sisa uang disetorkan ke kas MTK' : '*Memerlukan pencairan kas pengganti',
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 4;

  // 6. Signatures (Mengetahui TU MTK & Penanggung Jawab)
  drawLine(currentY);
  currentY += 3.5;

  const colLeft = marginX + printableWidth * 0.25;
  const colRight = marginX + printableWidth * 0.75;

  doc.setFont('courier', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text('Mengetahui,', colLeft, currentY, { align: 'center' });
  doc.text('Ketua Delegasi,', colRight, currentY, { align: 'center' });
  currentY += 2.8;

  doc.setFont('courier', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text('(TU MTK)', colLeft, currentY, { align: 'center' });
  doc.text('(Penanggung Jawab)', colRight, currentY, { align: 'center' });
  currentY += 9;

  doc.setFont('courier', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(15, 23, 42);
  doc.text('MOH ALI GHUFRON', colLeft, currentY, { align: 'center' });
  const ketuaName = pesertaNames[0] || 'Delegasi';
  doc.text(ketuaName.slice(0, 16), colRight, currentY, { align: 'center' });
  currentY += 3;

  drawLine(currentY);
  currentY += 3.5;

  // 7. Footer
  doc.setFont('courier', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  const printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const printTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  doc.text(`Dicetak: ${printDate} ${printTime}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 2.8;

  doc.setFont('courier', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text('*** JAZAKUMULLAH KHAIRAN ***', pageWidth / 2, currentY, { align: 'center' });
  currentY += 2.8;

  doc.setFont('courier', 'normal');
  doc.setFontSize(4.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Simpan nota ini sebagai bukti sah kas', pageWidth / 2, currentY, { align: 'center' });

  // Save 58mm PDF
  doc.save(fileName);
}
