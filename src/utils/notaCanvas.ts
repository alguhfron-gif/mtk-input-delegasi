import { Delegasi, Peserta } from '../types';
import { formatRupiah, formatTanggalMasehi, formatTanggalHijri } from './format';

// Helper to draw rounded rectangle in Canvas
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill = false,
  stroke = true
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// Helper to wrap text into lines
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

// Loads image from URL or data URI with promise
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Generates an ultra-crisp, high-resolution HTML5 Canvas of the Nota Pengeluaran Delegasi.
 * Width: 1200px (High-DPI for mobile phones and printing).
 * Height: Automatically calculated according to items and names.
 */
export async function generateNotaCanvas(
  delegasi: Delegasi,
  pesertaList: Peserta[]
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  const pesertaNames = delegasi.peserta.map((id) => {
    const p = pesertaList.find((x) => x.id === id);
    return p ? p.nama : id;
  });

  const totalSisa = delegasi.uangDibawa - delegasi.uangTerpakai;
  const canvasWidth = 1200;
  const paddingX = 60;
  const contentWidth = canvasWidth - paddingX * 2; // 1080px

  // Calculate dynamic heights
  // 1. Text wrapping for info box
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const tujuanLines = wrapText(ctx, delegasi.tujuan || '-', 500);

  ctx.font = '17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const pesertaLines = wrapText(ctx, pesertaNames.join(', ') || '-', 500);

  const leftBoxContentHeight = 25 + tujuanLines.length * 26 + 30 + 25 + pesertaLines.length * 24 + 20;
  const infoBoxHeight = Math.max(leftBoxContentHeight, 180);

  // 2. Table rows height
  const rowCount = Math.max(delegasi.rincian.length, 1);
  const tableHeaderHeight = 46;
  const tableRowHeight = 44;
  const tableFooterHeight = 50;
  const tableTotalHeight = tableHeaderHeight + rowCount * tableRowHeight + tableFooterHeight;

  // Total estimated canvas height
  const baseHeight =
    50 + // top padding
    120 + // header (logo + title)
    20 + // divider gap
    infoBoxHeight + // info box
    25 + // gap
    65 + // uang dibawa box
    25 + // gap
    35 + // rincian header
    tableTotalHeight + // table
    25 + // gap
    70 + // sisa box
    35 + // gap
    140 + // signatures
    60; // bottom padding

  canvas.width = canvasWidth;
  canvas.height = baseHeight;

  // Fill Canvas Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvas.height);

  // Outer paper border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  roundRect(ctx, 20, 20, canvasWidth - 40, canvas.height - 40, 24, false, true);

  let currentY = 55;

  // --- 1. HEADER WITH LOGO ON LEFT & TITLE ON RIGHT ---
  // Draw Logo MTK Sidogiri
  try {
    const logoImg = await loadImage('/logo-mtk.png');
    ctx.drawImage(logoImg, paddingX, currentY - 5, 105, 105);
  } catch {
    try {
      const logoSvg = await loadImage('/logo-mtk.svg');
      ctx.drawImage(logoSvg, paddingX, currentY - 5, 105, 105);
    } catch {
      // Fallback: draw geometric badge
      ctx.fillStyle = '#0e5a5c';
      ctx.beginPath();
      ctx.arc(paddingX + 50, currentY + 45, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MTK', paddingX + 50, currentY + 50);
    }
  }

  // Header Title & Subtitle
  const titleX = paddingX + 130;
  ctx.textAlign = 'left';

  // Title: NOTA PENGELUARAN DELEGASI
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('NOTA PENGELUARAN DELEGASI', titleX, currentY + 40);

  // Subtitle: Musyawarah wa Taklimul Kitab (MTK) Sidogiri
  ctx.fillStyle = '#475569';
  ctx.font = '600 18px "Courier New", Courier, monospace';
  ctx.fillText('Musyawarah wa Taklimul Kitab (MTK) Sidogiri', titleX, currentY + 70);

  currentY += 115;

  // Header bottom border line
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(paddingX, currentY);
  ctx.lineTo(paddingX + contentWidth, currentY);
  ctx.stroke();

  currentY += 22;

  // --- 2. INFORMATION BOX (Tujuan, Peserta, Jadwal) ---
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  roundRect(ctx, paddingX, currentY, contentWidth, infoBoxHeight, 16, true, true);

  // Center vertical divider
  const midX = paddingX + contentWidth / 2;
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(midX, currentY);
  ctx.lineTo(midX, currentY + infoBoxHeight);
  ctx.stroke();

  // Left Column Content
  let leftY = currentY + 30;
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('TUJUAN KEGIATAN:', paddingX + 24, leftY);

  leftY += 25;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  for (const line of tujuanLines) {
    ctx.fillText(line, paddingX + 24, leftY);
    leftY += 26;
  }

  leftY += 12;
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`ANGGOTA DELEGASI (${delegasi.peserta.length} ORANG):`, paddingX + 24, leftY);

  leftY += 24;
  ctx.fillStyle = '#1e293b';
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  for (const line of pesertaLines) {
    ctx.fillText(line, paddingX + 24, leftY);
    leftY += 24;
  }

  // Right Column Content (Jadwal)
  let rightY = currentY + 35;
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('JADWAL BERANGKAT:', midX + 24, rightY);

  rightY += 25;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(formatTanggalMasehi(delegasi.tglBerangkat), midX + 24, rightY);

  if (delegasi.tglBerangkat) {
    rightY += 22;
    ctx.fillStyle = '#0e5a5c';
    ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`(${formatTanggalHijri(delegasi.tglBerangkat)})`, midX + 24, rightY);
  }

  rightY += 30;
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('JADWAL KEMBALI:', midX + 24, rightY);

  rightY += 25;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(formatTanggalMasehi(delegasi.tglKembali), midX + 24, rightY);

  if (delegasi.tglKembali) {
    rightY += 22;
    ctx.fillStyle = '#0e5a5c';
    ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`(${formatTanggalHijri(delegasi.tglKembali)})`, midX + 24, rightY);
  }

  currentY += infoBoxHeight + 20;

  // --- 3. UANG DIBAWA BOX ---
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  roundRect(ctx, paddingX, currentY, contentWidth, 58, 14, true, true);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('UANG DIBAWA:', paddingX + 24, currentY + 36);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 22px "Courier New", Courier, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(formatRupiah(delegasi.uangDibawa), paddingX + contentWidth - 24, currentY + 37);

  currentY += 76;

  // --- 4. EXPENSES TABLE ---
  ctx.textAlign = 'left';
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('RINCIAN PENGELUARAN:', paddingX, currentY);

  currentY += 14;

  const colWidthNo = 80;
  const colWidthNominal = 260;
  const colWidthKet = contentWidth - colWidthNo - colWidthNominal;

  // Table Header
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(paddingX, currentY, contentWidth, tableHeaderHeight);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(paddingX, currentY, contentWidth, tableHeaderHeight);

  // Column dividers for header
  ctx.beginPath();
  ctx.moveTo(paddingX + colWidthNo, currentY);
  ctx.lineTo(paddingX + colWidthNo, currentY + tableHeaderHeight);
  ctx.moveTo(paddingX + colWidthNo + colWidthKet, currentY);
  ctx.lineTo(paddingX + colWidthNo + colWidthKet, currentY + tableHeaderHeight);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('No', paddingX + colWidthNo / 2, currentY + 29);

  ctx.textAlign = 'left';
  ctx.fillText('Keterangan Pengeluaran', paddingX + colWidthNo + 18, currentY + 29);

  ctx.textAlign = 'right';
  ctx.fillText('Nominal', paddingX + contentWidth - 18, currentY + 29);

  currentY += tableHeaderHeight;

  // Table Rows
  if (delegasi.rincian.length === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(paddingX, currentY, contentWidth, tableRowHeight);
    ctx.strokeRect(paddingX, currentY, contentWidth, tableRowHeight);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Tidak ada rincian item pengeluaran.', paddingX + contentWidth / 2, currentY + 28);
    currentY += tableRowHeight;
  } else {
    delegasi.rincian.forEach((item, idx) => {
      // Row background
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#fafafa';
      ctx.fillRect(paddingX, currentY, contentWidth, tableRowHeight);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingX, currentY, contentWidth, tableRowHeight);

      // Dividers
      ctx.beginPath();
      ctx.moveTo(paddingX + colWidthNo, currentY);
      ctx.lineTo(paddingX + colWidthNo, currentY + tableRowHeight);
      ctx.moveTo(paddingX + colWidthNo + colWidthKet, currentY);
      ctx.lineTo(paddingX + colWidthNo + colWidthKet, currentY + tableRowHeight);
      ctx.stroke();

      // No
      ctx.fillStyle = '#334155';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(idx + 1), paddingX + colWidthNo / 2, currentY + 27);

      // Keterangan
      ctx.textAlign = 'left';
      ctx.fillText(item.nama, paddingX + colWidthNo + 18, currentY + 27);

      // Nominal
      ctx.textAlign = 'right';
      ctx.font = 'bold 16px "Courier New", Courier, monospace';
      ctx.fillText(formatRupiah(item.nominal), paddingX + contentWidth - 18, currentY + 27);

      currentY += tableRowHeight;
    });
  }

  // Table Footer: Total Pengeluaran
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(paddingX, currentY, contentWidth, tableFooterHeight);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(paddingX, currentY, contentWidth, tableFooterHeight);

  ctx.beginPath();
  ctx.moveTo(paddingX + colWidthNo + colWidthKet, currentY);
  ctx.lineTo(paddingX + colWidthNo + colWidthKet, currentY + tableFooterHeight);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('TOTAL PENGELUARAN:', paddingX + colWidthNo + colWidthKet - 18, currentY + 31);

  ctx.font = '900 18px "Courier New", Courier, monospace';
  ctx.fillText(formatRupiah(delegasi.uangTerpakai), paddingX + contentWidth - 18, currentY + 31);

  currentY += tableFooterHeight + 22;

  // --- 5. SISA UANG DELEGASI BOX ---
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  roundRect(ctx, paddingX, currentY, contentWidth, 62, 14, true, true);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SISA UANG DELEGASI:', paddingX + 24, currentY + 38);

  ctx.fillStyle = totalSisa >= 0 ? '#047857' : '#dc2626';
  ctx.font = '900 24px "Courier New", Courier, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(formatRupiah(totalSisa), paddingX + contentWidth - 24, currentY + 39);

  currentY += 80;

  // --- 6. SIGNATURES ---
  const sigLeftX = paddingX + 180;
  const sigRightX = paddingX + contentWidth - 180;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Mengetahui,', sigLeftX, currentY);
  ctx.fillText('Ketua Delegasi,', sigRightX, currentY);

  ctx.fillStyle = '#64748b';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('TU MTK', sigLeftX, currentY + 22);
  ctx.fillText('Penanggung Jawab', sigRightX, currentY + 22);

  currentY += 95;

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('MOH ALI GHUFORN', sigLeftX, currentY);
  ctx.fillText(pesertaNames[0] || '______________________', sigRightX, currentY);

  return canvas;
}
