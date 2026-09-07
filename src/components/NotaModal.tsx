import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Delegasi, Peserta } from '../types';
import { formatRupiah, formatTanggalMasehi, formatTanggalHijri } from '../utils/format';
import { exportNotaPDF } from '../utils/exportUtils';
import { generateNotaCanvas, downloadNotaCanvasPNG } from '../utils/notaCanvas';
import { downloadNotaPNG } from '../utils/notaImageExport';
import { printReceiptThermal } from '../utils/printReceipt';
import { LogoMTK } from './LogoMTK';
import { useModalBackHandler } from '../utils/navigationHistory';
import { 
  Printer, 
  X, 
  Download, 
  Share2, 
  Loader2, 
  FileText,
  MessageSquare,
  Send,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

interface NotaModalProps {
  delegasi: Delegasi | null;
  pesertaList: Peserta[];
  onClose: () => void;
}

interface NotificationState {
  title: string;
  message: string;
}

export const NotaModal: React.FC<NotaModalProps> = ({
  delegasi,
  pesertaList,
  onClose
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [imageBlobPng, setImageBlobPng] = useState<Blob | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [waNumber, setWaNumber] = useState('082260978266');
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const notaReceiptRef = useRef<HTMLDivElement | null>(null);
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tangani tombol kembali fisik/gesture HP agar menutup modal dengan mulus tanpa blank screen
  const { safeClose: handleCloseSafely } = useModalBackHandler(
    Boolean(delegasi),
    onClose,
    'nota',
    'riwayat'
  );

  if (!delegasi) return null;

  const rawPeserta = Array.isArray(delegasi.peserta) ? delegasi.peserta : [];
  const pesertaNames = rawPeserta.map(id => {
    const p = pesertaList.find(x => x.id === id || (x.nama && x.nama.toLowerCase() === String(id).toLowerCase()));
    return p ? p.nama : String(id);
  });

  const totalSisa = (delegasi.uangDibawa || 0) - (delegasi.uangTerpakai || 0);
  const fileBaseName = `Nota_58mm_Delegasi_${delegasi.id}_${(delegasi.tujuan || 'Kegiatan').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 15)}`;

  // Tampilkan notifikasi dengan auto-hide 5 detik
  const showSuccessNotification = (title: string, message: string) => {
    if (notifTimeoutRef.current) {
      clearTimeout(notifTimeoutRef.current);
    }
    setNotification({ title, message });
    notifTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Generate preview PNG saat modal dibuka menggunakan high-resolution canvas engine
  useEffect(() => {
    let isMounted = true;
    const generatePreview = async () => {
      try {
        const canvas = await generateNotaCanvas(delegasi, pesertaList, { scale: 3, backgroundColor: '#ffffff' });
        if (!isMounted) return;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        canvas.toBlob((blob) => {
          if (isMounted && blob) {
            setImageBlobPng(blob);
          }
        }, 'image/png');
        setPreviewImage(dataUrl);
      } catch (e) {
        console.warn('Pratinjau awal canvas ditunda:', e);
      }
    };
    generatePreview();

    return () => {
      isMounted = false;
      if (notifTimeoutRef.current) {
        clearTimeout(notifTimeoutRef.current);
      }
    };
  }, [delegasi, pesertaList]);

  // Format teks rapi struk 58mm untuk WhatsApp
  const generateWhatsAppText = useCallback(() => {
    const rincianArr = Array.isArray(delegasi.rincian) ? delegasi.rincian : [];
    const lines = [
      `🧾 *NOTA PENGELUARAN DELEGASI (58mm)*`,
      `*PONDOK PESANTREN SIDOGIRI*`,
      `*MTK (TAKLIMUL KITAB)*`,
      `--------------------------------`,
      `*No. Bukti :* #DEL-${String(delegasi.id).padStart(4, '0')}`,
      `*Tujuan    :* ${delegasi.tujuan}`,
      `*Berangkat :* ${formatTanggalMasehi(delegasi.tglBerangkat).split(',')[0]} (${formatTanggalHijri(delegasi.tglBerangkat).split(',')[0]})`,
      delegasi.tglKembali ? `*Kembali   :* ${formatTanggalMasehi(delegasi.tglKembali).split(',')[0]}` : '',
      `*Delegasi  :* ${pesertaNames.join(', ')}`,
      `--------------------------------`,
      `*RINCIAN PENGELUARAN:*`,
      ...rincianArr.map((r, idx) => `${idx + 1}. ${r.nama} : ${formatRupiah(r.nominal)}`),
      `--------------------------------`,
      `*Uang Dibawa   :* ${formatRupiah(delegasi.uangDibawa || 0)}`,
      `*Uang Terpakai :* ${formatRupiah(delegasi.uangTerpakai || 0)}`,
      `================================`,
      totalSisa >= 0 
        ? `*SISA KEMBALI  : ${formatRupiah(totalSisa)}*`
        : `*KEKURANGAN   : ${formatRupiah(Math.abs(totalSisa))}*`,
      `================================`,
      `*TU MTK :* MOH ALI GHUFRON`,
      `*Ketua  :* ${pesertaNames[0] || 'Delegasi'}`,
      `_Dicetak via Sistem MTK Sidogiri_`
    ].filter(Boolean);
    return lines.join('\n');
  }, [delegasi, pesertaNames, totalSisa]);

  // Kirim ke WhatsApp (default: 082260978266)
  const handleSendToWhatsApp = (phone = waNumber) => {
    try {
      const cleanPhone = phone.replace(/^0/, '62').replace(/[^0-9]/g, '');
      const text = encodeURIComponent(generateWhatsAppText());
      const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
      window.open(waUrl, '_blank');
      showSuccessNotification(
        'Berhasil Membuka WhatsApp!',
        `Rincian nota delegasi telah disiapkan untuk dikirim ke nomor ${phone || waNumber}.`
      );
    } catch (e) {
      console.error('Failed to open WhatsApp:', e);
    }
  };

  // Unduh langsung foto nota resolusi tinggi berformat PNG murni ('image/png')
  const handleDownloadPNG = async () => {
    setIsSaving(true);
    try {
      const fileName = `${fileBaseName}.png`;

      // 1. Prioritaskan downloadNotaCanvasPNG (resolusi scale: 3 / 1440px murni, putih solid, anti-buram, tanpa dependensi DOM scroll)
      const result = await downloadNotaCanvasPNG(delegasi, pesertaList, fileName, {
        scale: 3,
        backgroundColor: '#ffffff'
      });

      if (result.dataUrl) setPreviewImage(result.dataUrl);
      if (result.blob) setImageBlobPng(result.blob);

      showSuccessNotification(
        'Nota PNG Berhasil Diunduh!',
        'Foto nota resolusi tinggi (.png) telah berhasil diunduh dan tersimpan di Galeri/Download perangkat Anda.'
      );
    } catch (err) {
      console.error('Download direct canvas error, mencoba fallback DOM capture:', err);
      try {
        const fileName = `${fileBaseName}.png`;
        const targetEl = notaReceiptRef.current || document.getElementById('printable-nota');
        if (targetEl) {
          const result = await downloadNotaPNG(targetEl, fileName, {
            scale: 3,
            backgroundColor: '#ffffff'
          });
          if (result.dataUrl) setPreviewImage(result.dataUrl);
          if (result.blob) setImageBlobPng(result.blob);
          showSuccessNotification(
            'Nota PNG Berhasil Diunduh!',
            'Foto nota resolusi tinggi (.png) telah berhasil diunduh dan tersimpan di Galeri/Download perangkat Anda.'
          );
        }
      } catch (fallbackErr) {
        console.error('Fallback DOM download failed, mencoba trigger tautan langsung:', fallbackErr);
        if (previewImage) {
          const link = document.createElement('a');
          link.href = previewImage;
          link.download = `${fileBaseName}.png`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            if (document.body.contains(link)) document.body.removeChild(link);
          }, 3000);
          showSuccessNotification(
            'Nota PNG Berhasil Diunduh!',
            'Foto nota (.png) telah disimpan ke perangkat Anda.'
          );
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Bagikan via Native Share Sheet ke WhatsApp / Aplikasi lain atau unduh langsung
  const handleSharePNG = async () => {
    setIsSaving(true);
    try {
      const fileName = `${fileBaseName}.png`;
      let blob = imageBlobPng;

      if (!blob) {
        const canvas = await generateNotaCanvas(delegasi, pesertaList, { scale: 3, backgroundColor: '#ffffff' });
        blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      }

      if (blob && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Nota 58mm Delegasi MTK - ${delegasi.tujuan}`,
            text: `Bukti Nota Pengeluaran Delegasi MTK Sidogiri - ${delegasi.tujuan}`
          });
          showSuccessNotification(
            'Berhasil!',
            'Nota delegasi (.png) telah dibagikan.'
          );
          setIsSaving(false);
          return;
        }
      }

      // Jika Web Share file tidak didukung browser, unduh langsung
      await handleDownloadPNG();
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.warn('Share error or cancelled:', e);
        await handleDownloadPNG();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Salin ringkasan teks nota ke clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateWhatsAppText());
      setIsCopied(true);
      showSuccessNotification(
        'Teks Nota Disalin!',
        'Ringkasan nota delegasi berhasil disalin ke papan klip.'
      );
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  // Print via dedicated thermal print engine with system dialog and fallback
  const handlePrint = async () => {
    if (isPrinting) return;
    try {
      setIsPrinting(true);
      showSuccessNotification(
        'Menyiapkan Cetak Nota...',
        'Membuka dialog pencetakan printer thermal 58mm / printer sistem.'
      );
      const success = await printReceiptThermal('printable-nota');
      if (!success) {
        handleDownloadPDF();
      }
    } catch (err) {
      console.error('Error saat mencetak nota:', err);
      handleDownloadPDF();
    } finally {
      setIsPrinting(false);
    }
  };

  // Download Nota dalam ukuran 58mm Thermal Receipt PDF (.pdf)
  const handleDownloadPDF = () => {
    try {
      setIsGeneratingPDF(true);
      exportNotaPDF(delegasi, pesertaList);
      setIsGeneratingPDF(false);
      showSuccessNotification(
        'Berhasil Mengunduh PDF 58mm!',
        'Berkas PDF ukuran struk 58mm telah berhasil disimpan ke perangkat Anda.'
      );
    } catch (err) {
      console.error('Error generating PDF:', err);
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseSafely();
      }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      {/* Modal Container */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-scaleUp my-2 sm:my-6 flex flex-col max-h-[96vh]">
        
        {/* Modal Top Bar */}
        <div className="bg-[#1E293B] text-white px-3 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2 no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-xs sm:text-sm text-white block leading-tight">
                Nota Struk 58mm (Ukuran Kasir Toko)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Format Mini Roll 58mm • Galeri & PDF
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Tombol Simpan ke Galeri (PNG) */}
            {previewImage ? (
              <a
                id="btn-download-nota-image"
                href={previewImage}
                download={`${fileBaseName}.png`}
                className="px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95"
                title="Simpan foto nota 58mm resolusi tinggi (.PNG) ke Galeri HP / Laptop"
                onClick={() => {
                  showSuccessNotification(
                    'Nota PNG Berhasil Diunduh!',
                    'Foto nota resolusi tinggi (.png) berhasil disimpan ke perangkat Anda.'
                  );
                }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan ke Galeri</span>
              </a>
            ) : (
              <button
                id="btn-download-nota-image"
                onClick={handleDownloadPNG}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 active:scale-95"
                title="Simpan foto nota 58mm resolusi tinggi (.PNG) ke Galeri HP"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Simpan ke Galeri</span>
              </button>
            )}

            {/* Download PDF 58mm Button */}
            <button
              id="btn-unduh-nota-pdf"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              title="Unduh Nota Struk 58mm dalam format PDF"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>PDF 58mm</span>
            </button>

            {/* Print Button */}
            <button
              id="btn-cetak-nota-print"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs disabled:opacity-60"
              title="Cetak Langsung ke Thermal Printer 58mm / Printer Sistem"
            >
              {isPrinting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
              <span>Cetak</span>
            </button>

            {/* Close Button */}
            <button
              onClick={handleCloseSafely}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
              title="Tutup Nota (Kembali)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-3 sm:p-5 bg-slate-100 flex flex-col items-center gap-3">
          
          {/* NOTIFIKASI BERHASIL POPUP / BANNER */}
          {notification && (
            <div className="w-full max-w-[360px] bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-3 shadow-md flex items-start gap-2.5 animate-fadeIn no-print">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-emerald-900 leading-tight">
                  {notification.title}
                </p>
                <p className="text-[11px] text-emerald-800 mt-0.5 leading-snug">
                  {notification.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="p-1 text-emerald-700 hover:text-emerald-900 rounded-lg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Card WhatsApp Cepat */}
          <div className="w-full max-w-[360px] p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col gap-2 text-xs text-emerald-950 shadow-xs no-print">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded-lg bg-[#25D366] text-white">
                  <MessageSquare className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-xs text-emerald-900">
                  Kirim ke WhatsApp (082260978266)
                </span>
              </div>
              <span className="text-[10px] bg-emerald-700 text-white font-bold px-1.5 py-0.5 rounded-md font-mono">
                58mm
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <input 
                type="text"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="082260978266"
                className="flex-1 px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-emerald-300 bg-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleSendToWhatsApp(waNumber)}
                className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>Kirim</span>
              </button>
              <button
                type="button"
                onClick={handleSharePNG}
                disabled={isSaving}
                className="p-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-xs disabled:opacity-60"
                title="Bagikan foto nota (.PNG)"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ========================================================== */}
          {/* TAMPILAN NOTA STRUK 58mm (Format Kasir Toko)              */}
          {/* ========================================================== */}
          <div 
            id="printable-nota"
            ref={notaReceiptRef}
            className="w-full max-w-[340px] sm:max-w-[360px] bg-white text-slate-900 font-mono text-xs p-4 sm:p-5 pb-6 sm:pb-7 shadow-md border border-slate-300 rounded-xl relative select-none"
          >
            {/* Header Struk Toko 58mm */}
            <div className="text-center space-y-1">
              <div className="flex justify-center mb-1">
                <LogoMTK className="w-10 h-10 object-contain drop-shadow-xs" />
              </div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight uppercase leading-tight text-slate-900">
                Pondok Pesantren Sidogiri
              </h1>
              <h2 className="font-bold text-xs tracking-wider uppercase text-slate-800">
                Taklimul Kitab (MTK)
              </h2>
              <p className="text-[10px] text-slate-600">
                Sidogiri Pasuruan Jawa Timur 67103
              </p>
              <p className="text-[10px] text-slate-600 font-mono">
                WA: 082260978266
              </p>
            </div>

            {/* Separator Dotted Line */}
            <div className="border-t border-dashed border-slate-400 my-2.5 pt-1" />

            <div className="text-center font-bold text-[11px] uppercase tracking-wide text-slate-800 pb-1">
              *** BUKTI PENGELUARAN DELEGASI ***
            </div>

            {/* Metadata Struk */}
            <div className="space-y-0.5 text-[11px] leading-tight">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Bukti:</span>
                <span className="font-bold font-mono">#DEL-{String(delegasi.id).padStart(4, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tujuan:</span>
                <span className="font-bold text-right truncate max-w-[190px]">{delegasi.tujuan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tgl Berangkat:</span>
                <span className="text-right">
                  {formatTanggalMasehi(delegasi.tglBerangkat).split(',')[0]}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-teal-800">
                <span className="text-slate-500">Tgl Hijriah:</span>
                <span className="text-right">
                  {formatTanggalHijri(delegasi.tglBerangkat).split(',')[0]}
                </span>
              </div>
              {delegasi.tglKembali && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tgl Kembali:</span>
                  <span className="text-right">
                    {formatTanggalMasehi(delegasi.tglKembali).split(',')[0]}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500">Delegasi:</span>
                <span className="text-right font-medium text-[10px] max-w-[190px] truncate">
                  {pesertaNames.join(', ')}
                </span>
              </div>
            </div>

            {/* Separator Line */}
            <div className="border-t border-dashed border-slate-400 my-2 pt-1" />

            {/* Rincian Header */}
            <div className="flex justify-between font-bold text-[10px] uppercase text-slate-700 pb-1">
              <span>Item / Kebutuhan</span>
              <span>Nominal</span>
            </div>

            {/* Rincian Item */}
            <div className="space-y-1 text-[11px]">
              {(Array.isArray(delegasi.rincian) ? delegasi.rincian : []).map((item, index) => (
                <div key={index} className="flex justify-between items-baseline gap-1">
                  <span className="truncate max-w-[180px] text-slate-800">
                    {index + 1}. {item.nama}
                  </span>
                  <span className="font-mono font-medium text-slate-900 whitespace-nowrap">
                    {formatRupiah(item.nominal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Separator Double/Solid */}
            <div className="border-t-2 border-slate-700 my-2 pt-1.5 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Dibawa:</span>
                <span className="font-mono font-bold">{formatRupiah(delegasi.uangDibawa || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Terpakai:</span>
                <span className="font-mono font-bold text-slate-900">{formatRupiah(delegasi.uangTerpakai || 0)}</span>
              </div>

              {/* Sisa Kembali atau Kekurangan Kasir */}
              <div className="border-t border-dashed border-slate-400 pt-1 flex justify-between font-bold text-xs">
                <span>{totalSisa >= 0 ? 'SISA KEMBALI:' : 'KEKURANGAN:'}</span>
                <span className={`font-mono text-xs ${totalSisa >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatRupiah(Math.abs(totalSisa))}
                </span>
              </div>
            </div>

            {/* Terbilang */}
            <div className="mt-2 p-1.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-slate-600 italic leading-snug">
              <p>
                <strong>Ket:</strong> Pengeluaran delegasi telah diverifikasi dan dicatat pada sistem kas MTK.
              </p>
            </div>

            {/* Tanda Tangan Struk 58mm */}
            <div className="border-t border-dashed border-slate-400 my-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                <div>
                  <p className="font-bold text-slate-800">Mengetahui,</p>
                  <p className="text-[9px] text-slate-500">(TU MTK)</p>
                  <p className="mt-8 font-black uppercase text-slate-900 text-[10px]">
                    MOH ALI GHUFRON
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-800">Ketua Delegasi,</p>
                  <p className="text-[9px] text-slate-500">(Penanggung Jwb)</p>
                  <p className="mt-8 font-black uppercase text-slate-900 text-[10px] truncate">
                    {pesertaNames[0] || 'Delegasi'}
                  </p>
                </div>
              </div>
            </div>

            {/* Separator Dotted Line */}
            <div className="border-t border-dashed border-slate-400 my-2 pt-1" />

            {/* Footer Struk Kasir */}
            <div className="text-center space-y-0.5 text-[9px] text-slate-500">
              <p>
                Dicetak: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="font-bold text-slate-800 text-[10px]">
                *** JAZAKUMULLAH KHAIRAN ***
              </p>
              <p className="text-[8px] text-slate-400">
                Simpan nota struk ini sebagai bukti sah kas
              </p>
            </div>

            {/* Decorative Thermal Paper Zigzag Bottom (Gigi Kertas Kasir) */}
            <div 
              className="absolute -bottom-2.5 left-0 right-0 h-2.5 bg-repeat-x pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, transparent 4px, white 5px)',
                backgroundSize: '10px 10px',
                backgroundPosition: '0 -5px'
              }}
            />
          </div>

          {/* Quick Action Bar under Receipt */}
          <div className="w-full max-w-[360px] flex flex-wrap items-center justify-center gap-2 no-print pt-1">
            {previewImage ? (
              <a
                id="btn-unduh-png-bawah"
                href={previewImage}
                download={`${fileBaseName}.png`}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-transform cursor-pointer"
                title="Unduh foto nota berformat PNG resolusi tinggi (.png) ke Galeri HP / Laptop"
                onClick={() => {
                  showSuccessNotification(
                    'Nota PNG Berhasil Diunduh!',
                    'Foto nota resolusi tinggi (.png) berhasil disimpan ke perangkat Anda.'
                  );
                }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Foto (.PNG)</span>
              </a>
            ) : (
              <button
                id="btn-unduh-png-bawah"
                type="button"
                onClick={handleDownloadPNG}
                disabled={isSaving}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-transform cursor-pointer disabled:opacity-60"
                title="Unduh foto nota berformat PNG resolusi tinggi (.png) ke Galeri HP"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Unduh Foto (.PNG)</span>
              </button>
            )}

            <button
              id="btn-cetak-nota-bawah"
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-transform cursor-pointer disabled:opacity-60"
              title="Cetak langsung struk kasir 58mm ke thermal printer / printer sistem"
            >
              {isPrinting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
              <span>Cetak Struk</span>
            </button>

            <button
              id="btn-bagikan-nota-bawah"
              type="button"
              onClick={handleSharePNG}
              disabled={isSaving}
              className="px-3 py-2 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-transform cursor-pointer disabled:opacity-60"
              title="Bagikan file foto nota (.png) ke WhatsApp atau aplikasi lain"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan</span>
            </button>

            <button
              id="btn-salin-teks-nota"
              type="button"
              onClick={handleCopyText}
              className="px-3 py-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 shadow-2xs transition-transform cursor-pointer"
              title="Salin ringkasan teks nota ke papan klip"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{isCopied ? 'Tersalin' : 'Salin Teks'}</span>
            </button>
          </div>

        </div>

        {/* Modal Bottom Bar */}
        <div className="p-2.5 bg-white border-t border-slate-200 text-center text-xs text-slate-600 no-print flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Format Struk 58mm (Kasir / Toko)</span>
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="text-[11px]">
            File Gambar (.PNG) Resolusi Tinggi & PDF 58mm siap cetak ke Bluetooth Thermal Printer
          </span>
        </div>
      </div>

    </div>
  );
};
