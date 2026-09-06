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
  Check, 
  Loader2, 
  FileText,
  MessageSquare,
  Send,
  CheckCircle2
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

  // Unduh Nota 58mm Gambar (JPEG murni agar terbaca 100% di Galeri HP tanpa error)
  const handleDownloadImage = async () => {
    try {
      setIsGeneratingImage(true);

      let blob = imageBlobJpg;
      let dataUrl = previewImage;

      if (!blob || !dataUrl) {
        const canvas = await generateNotaCanvas(delegasi, pesertaList);
        dataUrl = canvas.toDataURL('image/jpeg', 0.96);
        setPreviewImage(dataUrl);
        blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.96));
        if (blob) setImageBlobJpg(blob);
      }

      const fileName = `${fileBaseName}.jpg`;

      // Jika di HP mendukung Web Share API file, tawarkan langsung ke galeri/aplikasi
      if (blob && navigator.share && /android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
        try {
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Nota 58mm Delegasi MTK`,
              text: `Nota Pengeluaran Delegasi MTK Sidogiri - ${delegasi.tujuan}`
            });
            setIsGeneratingImage(false);
            showSuccessNotification(
              'Berhasil Menyimpan Nota!',
              'Nota struk 58mm berhasil dibagikan / disimpan ke Galeri HP Anda.'
            );
            return;
          }
        } catch {
          // Fallback ke direct download
        }
      }

      // Standar download berkas
      if (blob) {
        const url = URL.createObjectURL(blob);
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
      } else if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            if (document.body.contains(a)) document.body.removeChild(a);
          } catch {}
        }, 3000);
      }

      setIsGeneratingImage(false);
      showSuccessNotification(
        'Berhasil Mengunduh Nota!',
        'Nota struk 58mm (.JPG) telah berhasil diunduh dan tersimpan di Galeri / folder Unduhan HP Anda.'
      );
    } catch (err) {
      console.error('Error downloading nota image:', err);
      setIsGeneratingImage(false);
      alert('Gagal mengunduh gambar nota.');
    }
  };

  // Bagikan gambar nota ke WhatsApp / Galeri via Web Share API
  const handleShare = async () => {
    try {
      setIsGeneratingImage(true);
      let blob = imageBlobJpg;
      let dataUrl = previewImage;

      if (!blob || !dataUrl) {
        const canvas = await generateNotaCanvas(delegasi, pesertaList);
        dataUrl = canvas.toDataURL('image/jpeg', 0.96);
        setPreviewImage(dataUrl);
        blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.96));
        if (blob) setImageBlobJpg(blob);
      }

      setIsGeneratingImage(false);

      if (blob && navigator.share) {
        const file = new File([blob], `${fileBaseName}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Nota 58mm Delegasi MTK - ${delegasi.tujuan}`,
              text: generateWhatsAppText()
            });
            showSuccessNotification(
              'Berhasil Membagikan Nota!',
              'Nota pengeluaran delegasi berhasil dibagikan.'
            );
            return;
          } catch (shareErr) {
            console.log('Share dismissed or cancelled:', shareErr);
          }
        }
      }

      // Fallback: Kirim rincian teks ke WhatsApp
      handleSendToWhatsApp();
    } catch (e) {
      console.error('Share error:', e);
      setIsGeneratingImage(false);
      handleSendToWhatsApp();
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
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              title="Simpan sebagai gambar Struk 58mm di Galeri HP / Komputer"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Memproses...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Simpan ke Galeri</span>
                </>
              )}
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
                onClick={handleShare}
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
    </div>
  );
};
