import React, { useState, useEffect, useRef } from 'react';
import { Delegasi, Peserta } from '../types';
import { formatRupiah, formatTanggalMasehi, formatTanggalHijri } from '../utils/format';
import { exportNotaPDF } from '../utils/exportUtils';
import { generateNotaCanvas } from '../utils/notaCanvas';
import { LogoMTK } from './LogoMTK';
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
  ExternalLink,
  Smartphone,
  Info
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [imageBlobJpg, setImageBlobJpg] = useState<Blob | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [waNumber, setWaNumber] = useState('082260978266');
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!delegasi) return null;

  const pesertaNames = delegasi.peserta.map(id => {
    const p = pesertaList.find(x => x.id === id);
    return p ? p.nama : id;
  });

  const totalSisa = delegasi.uangDibawa - delegasi.uangTerpakai;
  const fileBaseName = `Nota_58mm_Delegasi_${delegasi.id}_${delegasi.tujuan.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 15)}`;

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

  // Pre-render 58mm Canvas saat modal dibuka
  useEffect(() => {
    let isMounted = true;
    const renderCanvas = async () => {
      try {
        setIsGeneratingImage(true);
        const canvas = await generateNotaCanvas(delegasi, pesertaList);
        if (!isMounted) return;
        canvasRef.current = canvas;

        // JPEG 96% solid white background - 100% kompatibel dengan galeri HP Android & iOS
        const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
        setPreviewImage(dataUrl);

        canvas.toBlob((blob) => {
          if (isMounted && blob) {
            setImageBlobJpg(blob);
          }
          if (isMounted) setIsGeneratingImage(false);
        }, 'image/jpeg', 0.96);
      } catch (err) {
        console.error('Error pre-rendering 58mm canvas:', err);
        if (isMounted) setIsGeneratingImage(false);
      }
    };

    renderCanvas();
    return () => {
      isMounted = false;
      if (notifTimeoutRef.current) {
        clearTimeout(notifTimeoutRef.current);
      }
    };
  }, [delegasi, pesertaList]);

  // Format teks rapi struk 58mm untuk WhatsApp
  const generateWhatsAppText = () => {
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
      ...delegasi.rincian.map((r, idx) => `${idx + 1}. ${r.nama} : ${formatRupiah(r.nominal)}`),
      `--------------------------------`,
      `*Uang Dibawa   :* ${formatRupiah(delegasi.uangDibawa)}`,
      `*Uang Terpakai :* ${formatRupiah(delegasi.uangTerpakai)}`,
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
  };

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

  // Buka gambar di Tab Baru (Luar Iframe) agar bisa langsung sentuh tahan & simpan di HP
  const handleOpenImageInNewTab = () => {
    try {
      if (!previewImage) return;
      const newTab = window.open('about:blank', '_blank');
      if (newTab) {
        newTab.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Nota 58mm MTK - ${delegasi.tujuan}</title>
              <style>
                body { margin: 0; padding: 16px; background: #0f172a; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                .banner { background: #065f46; color: #ecfdf5; padding: 14px 18px; border-radius: 12px; margin-bottom: 16px; max-width: 420px; width: 100%; box-sizing: border-box; text-align: center; font-size: 14px; line-height: 1.4; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 1px solid #10b981; }
                .banner strong { color: #6ee7b7; font-size: 15px; }
                img { max-width: 100%; width: 380px; height: auto; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); background: white; }
                .btn-row { margin-top: 18px; margin-bottom: 30px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
                .btn { display: inline-block; padding: 10px 20px; background: #059669; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
                .btn:active { transform: scale(0.98); }
              </style>
            </head>
            <body>
              <div class="banner">
                📱 <strong>Cara Simpan ke Galeri HP:</strong><br>
                Sentuh &amp; tahan (tekan lama 1 detik) foto nota di bawah, lalu pilih <strong>"Simpan Gambar"</strong> atau <strong>"Download Gambar"</strong>.
              </div>
              <img src="${previewImage}" alt="Nota 58mm MTK" />
              <div class="btn-row">
                <a class="btn" href="${previewImage}" download="${fileBaseName}.jpg">⬇️ Unduh Berkas .JPG</a>
              </div>
            </body>
          </html>
        `);
        newTab.document.close();
      }
    } catch (e) {
      console.error('Error opening image in new tab:', e);
    }
  };

  // Unduh langsung berkas .JPG
  const handleDirectDownloadFile = () => {
    try {
      const fileName = `${fileBaseName}.jpg`;
      if (imageBlobJpg) {
        const url = URL.createObjectURL(imageBlobJpg);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            if (document.body.contains(a)) document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch {}
        }, 15000);
      } else if (previewImage) {
        const a = document.createElement('a');
        a.href = previewImage;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            if (document.body.contains(a)) document.body.removeChild(a);
          } catch {}
        }, 3000);
      }

      showSuccessNotification(
        'Berkas .JPG Sedang Diunduh!',
        'Jika tidak otomatis muncul di album Galeri, periksa folder "Download" di File Manager atau sentuh & tahan foto untuk Simpan Gambar.'
      );
    } catch (err) {
      console.error('Error direct download:', err);
    }
  };

  // Bagikan via Native Share Sheet (Simpan ke Foto di iPhone, Share ke WhatsApp/Galeri di Android)
  const handleNativeShare = async () => {
    try {
      if (!imageBlobJpg) return;
      const file = new File([imageBlobJpg], `${fileBaseName}.jpg`, { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Nota 58mm Delegasi MTK - ${delegasi.tujuan}`,
          text: `Nota Pengeluaran Delegasi MTK Sidogiri - ${delegasi.tujuan}`
        });
        showSuccessNotification(
          'Berhasil Membagikan!',
          'Nota delegasi telah dibagikan.'
        );
      } else {
        handleSendToWhatsApp();
      }
    } catch (e) {
      console.log('Share cancelled or not supported:', e);
    }
  };

  // Print via browser/system dialog (dengan gaya ukuran kertas struk 58mm)
  const handlePrint = () => {
    try {
      window.print();
    } catch {
      handleDownloadPDF();
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
      alert('Gagal mengunduh PDF. Silakan gunakan tombol Simpan ke Galeri.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
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
            {/* Download Image Button (Phone Gallery / File) */}
            <button
              id="btn-download-nota-image"
              onClick={() => setShowGalleryModal(true)}
              className="px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              title="Simpan sebagai gambar Struk 58mm di Galeri HP / Komputer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simpan ke Galeri</span>
            </button>

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
              className="p-1.5 sm:px-2 sm:py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              title="Cetak Langsung ke Thermal Printer 58mm"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">Cetak</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
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
                onClick={handleNativeShare}
                className="p-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-xs"
                title="Bagikan berkas nota ke WhatsApp"
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
            className="w-full max-w-[340px] sm:max-w-[360px] bg-white text-slate-900 font-mono text-xs p-4 sm:p-5 shadow-md border border-slate-300 rounded-xl relative"
            style={{
              boxShadow: '0 4px 15px rgba(0,0,0,0.06)'
            }}
          >
            {/* Header Nota: Logo MTK & Identitas Pesantren */}
            <div className="text-center space-y-1 pb-2">
              <div className="flex justify-center mb-1.5">
                <LogoMTK className="w-12 h-12 object-contain" />
              </div>
              <h2 className="font-black text-xs uppercase tracking-wider text-slate-900 leading-tight">
                PONDOK PESANTREN SIDOGIRI
              </h2>
              <p className="font-bold text-[11px] text-slate-800 uppercase tracking-tight">
                MTK (TAKLIMUL KITAB)
              </p>
              <p className="text-[9px] text-slate-500">
                Pasuruan, Jawa Timur - Indonesia
              </p>
              <div className="pt-1">
                <span className="font-black text-[11px] bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-wider inline-block">
                  NOTA PENGELUARAN DELEGASI
                </span>
              </div>
            </div>

            {/* Separator Double Line */}
            <div className="border-t-2 border-dashed border-slate-800 my-2" />

            {/* Metadata Ringkas Struk 58mm */}
            <div className="space-y-1 text-[11px] leading-tight">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">No. Bukti</span>
                <span className="font-bold font-mono">#DEL-{String(delegasi.id).padStart(4, '0')}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Berangkat</span>
                <span className="font-bold">{formatTanggalMasehi(delegasi.tglBerangkat).split(',')[0]}</span>
              </div>
              <div className="text-right text-[10px] text-teal-800 font-medium">
                ({formatTanggalHijri(delegasi.tglBerangkat).split(',')[0]})
              </div>

              {delegasi.tglKembali && (
                <>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-slate-500">Kembali</span>
                    <span className="font-bold">{formatTanggalMasehi(delegasi.tglKembali).split(',')[0]}</span>
                  </div>
                  <div className="text-right text-[10px] text-teal-800 font-medium">
                    ({formatTanggalHijri(delegasi.tglKembali).split(',')[0]})
                  </div>
                </>
              )}

              <div className="pt-1">
                <span className="text-slate-500 block">Tujuan Kegiatan:</span>
                <span className="font-bold text-slate-900 block mt-0.5 text-xs">
                  {delegasi.tujuan}
                </span>
              </div>

              <div className="pt-1">
                <span className="text-slate-500 block">
                  Anggota Delegasi ({delegasi.peserta.length} Orang):
                </span>
                <span className="text-slate-800 block mt-0.5 font-medium leading-snug">
                  {pesertaNames.join(', ')}
                </span>
              </div>
            </div>

            {/* Separator Dotted Line */}
            <div className="border-t border-dashed border-slate-400 my-2.5" />

            {/* Rincian Pengeluaran POS 58mm */}
            <div>
              <div className="font-black uppercase text-[10px] tracking-wider text-slate-700 mb-1.5">
                RINCIAN PENGELUARAN:
              </div>

              <div className="space-y-1.5 text-[11px]">
                {delegasi.rincian.length === 0 ? (
                  <p className="text-slate-400 italic text-center py-1 text-[10px]">
                    Tidak ada rincian pos pengeluaran
                  </p>
                ) : (
                  delegasi.rincian.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2">
                      <span className="leading-tight text-slate-800">
                        {idx + 1}. {item.nama}
                      </span>
                      <span className="font-bold font-mono text-slate-900 shrink-0">
                        {formatRupiah(item.nominal)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Separator Dotted Line */}
            <div className="border-t border-dashed border-slate-400 my-2.5" />

            {/* Ringkasan Keuangan POS 58mm */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span>Uang Saku Dibawa:</span>
                <span className="font-bold font-mono text-slate-900">
                  {formatRupiah(delegasi.uangDibawa)}
                </span>
              </div>

              <div className="flex justify-between text-slate-700">
                <span>Uang Terpakai:</span>
                <span className="font-bold font-mono text-slate-900">
                  {formatRupiah(delegasi.uangTerpakai)}
                </span>
              </div>

              {/* Separator Double Line */}
              <div className="border-t-2 border-dashed border-slate-800 my-1.5" />

              {/* Sisa Kembali (Bold POS Struk) */}
              <div className="flex justify-between items-center text-xs font-black py-0.5">
                <span className={totalSisa >= 0 ? 'text-emerald-800' : 'text-red-700'}>
                  {totalSisa >= 0 ? 'SISA KEMBALI:' : 'KEKURANGAN DANA:'}
                </span>
                <span className={`text-sm font-black font-mono ${totalSisa >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                  {formatRupiah(Math.abs(totalSisa))}
                </span>
              </div>

              <div className="border-t-2 border-dashed border-slate-800 my-1.5" />

              <p className="text-[9px] italic text-slate-500 text-center">
                {totalSisa >= 0 
                  ? '*Sisa uang wajib disetorkan ke kas MTK' 
                  : '*Memerlukan pencairan kas pengganti'}
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

        </div>

        {/* Modal Bottom Bar */}
        <div className="p-2.5 bg-white border-t border-slate-200 text-center text-xs text-slate-600 no-print flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Format Struk 58mm (Kasir / Toko)</span>
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="text-[11px]">
            File Gambar (.JPG) & PDF 58mm siap cetak ke Bluetooth Thermal Printer
          </span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* POPUP KHUSUS: SIMPAN KE GALERI HP (PASTI BERHASIL & TERSIMPAN)   */}
      {/* ================================================================ */}
      {showGalleryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-60 flex items-center justify-center p-3 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[95vh]">
            
            {/* Header Dialog */}
            <div className="bg-[#1E293B] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-500 text-white">
                  <Smartphone className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white leading-tight">
                    Simpan Nota ke Galeri HP
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Format Foto Struk 58mm (.JPG)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGalleryModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Isi Dialog */}
            <div className="p-4 overflow-y-auto flex flex-col items-center gap-3 bg-slate-50">
              
              {/* Petunjuk Praktis & Pasti Masuk Galeri */}
              <div className="w-full bg-emerald-50 border-2 border-emerald-500/80 rounded-2xl p-3 text-emerald-950 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                  <p className="font-extrabold text-xs text-emerald-900 uppercase tracking-wide">
                    Cara Pasti Masuk ke Galeri HP:
                  </p>
                </div>
                <p className="text-xs text-emerald-900 leading-snug">
                  👉 <strong>Sentuh &amp; tahan (tekan lama 1 detik)</strong> foto nota di bawah, lalu pilih menu <strong>"Simpan Gambar"</strong> atau <strong>"Download Gambar"</strong>.
                </p>
                <p className="text-[11px] text-emerald-700 leading-tight">
                  Foto akan langsung 100% tersimpan rapi di album Galeri HP Anda!
                </p>
              </div>

              {/* Tampilan Foto Nota Siap Simpan */}
              <div className="w-full flex justify-center p-2.5 bg-white rounded-2xl border border-slate-300 shadow-xs">
                {previewImage ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={previewImage} 
                      alt="Nota 58mm MTK" 
                      className="w-full max-w-[280px] sm:max-w-[320px] h-auto rounded-lg shadow-md border border-slate-200 cursor-pointer active:scale-95 transition-transform"
                      title="Tekan lama foto untuk Simpan ke Galeri"
                    />
                    <p className="text-[10px] text-slate-500 font-medium mt-1.5 text-center">
                      👆 Tekan lama foto di atas untuk Simpan ke Galeri
                    </p>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs">Menyiapkan foto nota...</span>
                  </div>
                )}
              </div>

              {/* Tombol-tombol Opsi Cadangan */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Buka di Tab Baru (Luar Iframe) */}
                <button
                  type="button"
                  onClick={handleOpenImageInNewTab}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>Buka di Tab Baru</span>
                </button>

                {/* Unduh Otomatis File .JPG */}
                <button
                  type="button"
                  onClick={handleDirectDownloadFile}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File (.JPG)</span>
                </button>
              </div>

              {/* Catatan Tambahan */}
              <div className="w-full flex items-start gap-1.5 text-[10px] text-slate-500 pt-1 px-1">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  Jika tombol unduh berkas tersimpan di folder "Unduhan/Download" HP, Anda dapat memindahkannya ke Galeri atau cukup gunakan cara <strong>tekan lama foto</strong> di atas.
                </p>
              </div>

            </div>

            {/* Footer Dialog */}
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGalleryModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
