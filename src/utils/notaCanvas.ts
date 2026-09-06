import { Delegasi, Peserta } from '../types';
import { formatRupiah, formatTanggalMasehi, formatTanggalHijri } from './format';
import { LOGO_MTK_BASE64 } from '../assets/logoData';

// Loads image from URL or data URI with promise
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

// Helper to wrap text into multiple lines given a max pixel width
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

/**
 * Generates an authentic 58mm Thermal Store Receipt (Struk Kasir 58mm) Canvas.
 * Width: 480px (Standard high-resolution 58mm thermal paper roll).
 * Height: Automatically calculated based on items & content.
 * 100% Solid White background with pure RGB for flawless Android/iOS gallery indexing.
 */
export async function generateNotaCanvas(
  delegasi: Delegasi,
  pesertaList: Peserta[]
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context not supported');

  const pesertaNames = delegasi.peserta.map((id) => {
    const p = pesertaList.find((x) => x.id === id);
    return p ? p.nama : id;
  });

  const totalSisa = delegasi.uangDibawa - delegasi.uangTerpakai;

  // 58mm Thermal Receipt Dimensions (480px width @ high-dpi)
  const canvasWidth = 480;
  const paddingX = 24;
  const contentWidth = canvasWidth - paddingX * 2; // 432px

  // Measurement context
  ctx.font = 'bold 15px "Courier New", Courier, monospace';
  const tujuanLines = wrapText(ctx, delegasi.tujuan || '-', contentWidth - 90);
  
  ctx.font = '14px "Courier New", Courier, monospace';
  const pesertaLines = wrapText(ctx, pesertaNames.join(', ') || '-', contentWidth);

  // Height estimation for items
  let itemsHeight = 0;
  delegasi.rincian.forEach((item) => {
    ctx.font = '14px "Courier New", Courier, monospace';
    const itemLines = wrapText(ctx, item.nama, contentWidth - 140);
    itemsHeight += Math.max(itemLines.length * 20, 24) + 6;
  });
  if (delegasi.rincian.length === 0) {
    itemsHeight = 30;
  }

  // Calculate total canvas height
  const baseHeight =
    20 + // top padding
    70 + // logo (60px) + gap
    105 + // header text
    15 + // divider
    26 + // no nota
    24 + // tgl berangkat masehi
    22 + // tgl berangkat hijri
    (delegasi.tglKembali ? 40 : 0) + // tgl kembali if exists
    tujuanLines.length * 22 + 6 + // tujuan
    24 + // delegasi header
    pesertaLines.length * 20 + 8 + // delegasi names
    15 + // divider
    30 + // rincian header
    itemsHeight + // items list
    15 + // divider
    30 + // uang dibawa
    30 + // uang terpakai
    15 + // divider
    36 + // sisa kembali
    24 + // note status
    15 + // divider
    110 + // signatures (mengetahui & ketua)
    15 + // divider
    45 + // footer / barcode / thanks
    35; // bottom paper teeth

  canvas.width = canvasWidth;
  canvas.height = Math.max(baseHeight, 600);

  // 1. Fill 100% Solid White Paper Background (No alpha channel to avoid Gallery decoding bugs)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, canvas.height);

  let currentY = 22;

  // 2. Draw Centered Logo MTK Sidogiri
  try {
    const logoImg = await loadImage(LOGO_MTK_BASE64);
    const logoSize = 64;
    const logoX = (canvasWidth - logoSize) / 2;
    ctx.drawImage(logoImg, logoX, currentY, logoSize, logoSize);
    currentY += logoSize + 12;
  } catch (err) {
    console.warn('Could not load logo for 58mm canvas:', err);
    currentY += 10;
  }

  // 3. Header Text (Thermal Store Header)
  ctx.textAlign = 'center';
  
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 17px "Courier New", Courier, monospace';
  ctx.fillText('PONDOK PESANTREN SIDOGIRI', canvasWidth / 2, currentY);
  currentY += 20;

  ctx.font = 'bold 15px "Courier New", Courier, monospace';
  ctx.fillText('MTK (TAKLIMUL KITAB)', canvasWidth / 2, currentY);
  currentY += 18;

  ctx.font = '12px "Courier New", Courier, monospace';
  ctx.fillStyle = '#4B5563';
  ctx.fillText('Pasuruan, Jawa Timur - Indonesia', canvasWidth / 2, currentY);
  currentY += 18;

  ctx.font = 'bold 15px "Courier New", Courier, monospace';
  ctx.fillStyle = '#111827';
  ctx.fillText('NOTA PENGELUARAN DELEGASI', canvasWidth / 2, currentY);
  currentY += 16;

  // Helper to draw clean dotted divider line (like thermal printer)
  const drawDottedLine = (y: number, char = '-') => {
    ctx.font = '13px "Courier New", Courier, monospace';
    ctx.fillStyle = '#6B7280';
    ctx.textAlign = 'center';
    const pattern = char.repeat(38);
    ctx.fillText(pattern, canvasWidth / 2, y);
  };

  const drawDoubleLine = (y: number) => {
    drawDottedLine(y, '=');
  };

  drawDoubleLine(currentY);
  currentY += 16;

  // 4. Metadata Info (Receipt Key-Value)
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px "Courier New", Courier, monospace';
  ctx.fillStyle = '#111827';

  // No Nota & Tanggal
  ctx.fillText(`No. Bukti : #DEL-${String(delegasi.id).padStart(4, '0')}`, paddingX, currentY);
  currentY += 20;

  ctx.font = '13px "Courier New", Courier, monospace';
  ctx.fillText(`Berangkat : ${formatTanggalMasehi(delegasi.tglBerangkat).split(',')[0]}`, paddingX, currentY);
  currentY += 18;
  ctx.fillText(`            (${formatTanggalHijri(delegasi.tglBerangkat).split(',')[0]})`, paddingX, currentY);
  currentY += 20;

  if (delegasi.tglKembali) {
    ctx.fillText(`Kembali   : ${formatTanggalMasehi(delegasi.tglKembali).split(',')[0]}`, paddingX, currentY);
    currentY += 18;
    ctx.fillText(`            (${formatTanggalHijri(delegasi.tglKembali).split(',')[0]})`, paddingX, currentY);
    currentY += 20;
  }

  // Tujuan Kegiatan
  ctx.font = 'bold 13px "Courier New", Courier, monospace';
  ctx.fillText('Tujuan    : ', paddingX, currentY);
  ctx.font = '13px "Courier New", Courier, monospace';
  for (let i = 0; i < tujuanLines.length; i++) {
    if (i === 0) {
      ctx.fillText(tujuanLines[i], paddingX + 90, currentY);
    } else {
      currentY += 18;
      ctx.fillText(tujuanLines[i], paddingX + 90, currentY);
    }
  }
  currentY += 22;

  // Delegasi
  ctx.font = 'bold 13px "Courier New", Courier, monospace';
  ctx.fillText(`Delegasi (${delegasi.peserta.length} Orang):`, paddingX, currentY);
  currentY += 18;
  ctx.font = '13px "Courier New", Courier, monospace';
  ctx.fillStyle = '#1F2937';
  for (const line of pesertaLines) {
    ctx.fillText(line, paddingX, currentY);
    currentY += 18;
  }

  currentY += 4;
  drawDottedLine(currentY);
  currentY += 18;

  // 5. Rincian Pengeluaran Items (Thermal Struk Layout)
  ctx.font = 'bold 14px "Courier New", Courier, monospace';
  ctx.fillStyle = '#111827';
  ctx.fillText('RINCIAN PENGELUARAN:', paddingX, currentY);
  currentY += 20;

  if (delegasi.rincian.length === 0) {
    ctx.font = 'italic 13px "Courier New", Courier, monospace';
    ctx.fillStyle = '#6B7280';
    ctx.fillText('Tidak ada rincian pos pengeluaran', paddingX, currentY);
    currentY += 22;
  } else {
    delegasi.rincian.forEach((item, idx) => {
      ctx.font = '13px "Courier New", Courier, monospace';
      ctx.fillStyle = '#111827';
      const itemLabel = `${idx + 1}. ${item.nama}`;
      const itemLines = wrapText(ctx, itemLabel, contentWidth - 130);
      const nominalStr = formatRupiah(item.nominal);

      // Print item title lines
      for (let l = 0; l < itemLines.length; l++) {
        ctx.textAlign = 'left';
        ctx.fillText(itemLines[l], paddingX, currentY);
        if (l === 0) {
          // Print nominal right-aligned on first line
          ctx.textAlign = 'right';
          ctx.font = 'bold 13px "Courier New", Courier, monospace';
          ctx.fillText(nominalStr, paddingX + contentWidth, currentY);
          ctx.font = '13px "Courier New", Courier, monospace';
        }
        currentY += 19;
      }
      currentY += 3;
    });
  }

  currentY += 2;
  drawDottedLine(currentY);
  currentY += 18;

  // 6. Summary Totals (Store Receipt POS Format)
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px "Courier New", Courier, monospace';
  ctx.fillStyle = '#374151';
  ctx.fillText('Uang Dibawa    :', paddingX, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(formatRupiah(delegasi.uangDibawa), paddingX + contentWidth, currentY);
  currentY += 22;

  ctx.textAlign = 'left';
  ctx.fillText('Uang Terpakai  :', paddingX, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(formatRupiah(delegasi.uangTerpakai), paddingX + contentWidth, currentY);
  currentY += 16;

  drawDoubleLine(currentY);
  currentY += 18;

  // Sisa Uang Saku Kembali
  ctx.textAlign = 'left';
  ctx.font = 'bold 15px "Courier New", Courier, monospace';
  ctx.fillStyle = totalSisa >= 0 ? '#047857' : '#B91C1C';
  ctx.fillText(totalSisa >= 0 ? 'SISA KEMBALI   :' : 'KEKURANGAN DANA:', paddingX, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(formatRupiah(Math.abs(totalSisa)), paddingX + contentWidth, currentY);
  currentY += 16;

  drawDoubleLine(currentY);
  currentY += 16;

  // Status note
  ctx.textAlign = 'center';
  ctx.font = 'italic 11px "Courier New", Courier, monospace';
  ctx.fillStyle = '#4B5563';
  ctx.fillText(
    totalSisa >= 0
      ? '*Sisa uang wajib dikembalikan ke kas MTK'
      : '*Memerlukan pencairan kas pengganti',
    canvasWidth / 2,
    currentY
  );
  currentY += 22;

  // 7. Signatures (Compact 58mm Thermal layout)
  drawDottedLine(currentY);
  currentY += 18;

  const colLeft = paddingX + contentWidth * 0.25;
  const colRight = paddingX + contentWidth * 0.75;

  ctx.textAlign = 'center';
  ctx.font = 'bold 12px "Courier New", Courier, monospace';
  ctx.fillStyle = '#111827';
  ctx.fillText('Mengetahui,', colLeft, currentY);
  ctx.fillText('Ketua Delegasi,', colRight, currentY);
  currentY += 15;

  ctx.font = '11px "Courier New", Courier, monospace';
  ctx.fillStyle = '#6B7280';
  ctx.fillText('(TU MTK)', colLeft, currentY);
  ctx.fillText('(Penanggung Jawab)', colRight, currentY);
  currentY += 50;

  // Names
  ctx.font = 'bold 12px "Courier New", Courier, monospace';
  ctx.fillStyle = '#111827';
  ctx.fillText('MOH ALI GHUFRON', colLeft, currentY);
  const ketuaName = pesertaNames[0] || 'Delegasi';
  ctx.fillText(ketuaName.slice(0, 18), colRight, currentY);
  currentY += 18;

  drawDottedLine(currentY);
  currentY += 18;

  // 8. Thermal Receipt Footer
  ctx.textAlign = 'center';
  ctx.font = '11px "Courier New", Courier, monospace';
  ctx.fillStyle = '#4B5563';
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const printTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
  ctx.fillText(`Dicetak: ${printDate} ${printTime}`, canvasWidth / 2, currentY);
  currentY += 16;

  ctx.font = 'bold 12px "Courier New", Courier, monospace';
  ctx.fillStyle = '#111827';
  ctx.fillText('*** JAZAKUMULLAH KHAIRAN ***', canvasWidth / 2, currentY);
  currentY += 14;

  ctx.font = '10px "Courier New", Courier, monospace';
  ctx.fillStyle = '#6B7280';
  ctx.fillText('Simpan nota ini sebagai bukti sah kas', canvasWidth / 2, currentY);
  currentY += 20;

  // 9. Decorative Jagged Thermal Receipt Bottom Edge (Struk Gigi Kertas Kasir)
  const toothWidth = 12;
  const toothHeight = 6;
  const numTeeth = Math.ceil(canvasWidth / toothWidth);

  ctx.fillStyle = '#F3F4F6';
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(0, canvas.height - toothHeight);
  for (let i = 0; i < numTeeth; i++) {
    const x = i * toothWidth;
    ctx.lineTo(x + toothWidth / 2, canvas.height - toothHeight * 2);
    ctx.lineTo(x + toothWidth, canvas.height - toothHeight);
  }
  ctx.lineTo(canvasWidth, canvas.height);
  ctx.closePath();
  ctx.fill();

  return canvas;
}
