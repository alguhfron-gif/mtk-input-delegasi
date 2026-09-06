import React, { useState } from 'react';
import { Delegasi, Peserta } from '../types';
import { formatRupiah, formatTanggalMasehi, formatTanggalHijri } from '../utils/format';
import { exportNotaPDF, triggerFileDownload, downloadDataUrl } from '../utils/exportUtils';
import { LogoMTK } from './LogoMTK';
import { 
  Printer, 
  X, 
  Download, 
  Share2, 
  Check, 
  Loader2, 
  Image as ImageIcon,
  FileText,
  Smartphone,
  Eye
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface NotaModalProps {
  delegasi: Delegasi | null;
  pesertaList: Peserta[];
  onClose: () => void;
}

export const NotaModal: React.FC<NotaModalProps> = ({
  delegasi,
  pesertaList,
  onClose
}) => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!delegasi) return null;

  const pesertaNames = delegasi.peserta.map(id => {
    const p = pesertaList.find(x => x.id === id);
    return p ? p.nama : id;
  });

  const totalSisa = delegasi.uangDibawa - delegasi.uangTerpakai;
  const fileName = `nota_delegasi_${delegasi.id}_${delegasi.tujuan.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)}.png`;

  // Print via browser/system dialog
  const handlePrint = () => {
    try {
      window.print();
    } catch {
      // Fallback to generating PDF if window.print is blocked in WebView
      handleDownloadPDF();
    }
  };

  // Download Nota as PDF using jsPDF
  const handleDownloadPDF = () => {
    try {
      setIsGeneratingPDF(true);
      exportNotaPDF(delegasi, pesertaList);
      setIsGeneratingPDF(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setIsGeneratingPDF(false);
      alert('Gagal mengunduh PDF. Silakan gunakan tombol Simpan Gambar.');
    }
  };

  // Download Nota as PNG image for Phone Gallery / Downloads
  const handleDownloadImage = async () => {
    const notaElement = document.getElementById('printable-nota');
    if (!notaElement) return;

    try {
      setIsGeneratingImage(true);

      // Render the element to high-res canvas (scale 3 for crisp text on mobile)
      const canvas = await html2canvas(notaElement, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        scrollY: 0,
        scrollX: 0
      });

      const dataUrl = canvas.toDataURL('image/png');
      setPreviewImage(dataUrl);

      // 1. Direct download trigger using Data URL (standard for Chrome, Android & iOS WebKit)
      downloadDataUrl(dataUrl, fileName);

      // 2. Also convert to Blob for native file download retention
      canvas.toBlob((blob) => {
        if (blob) {
          triggerFileDownload(blob, fileName);
        }
      }, 'image/png');

      setIsGeneratingImage(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);

    } catch (err) {
      console.error('Error generating nota image:', err);
      alert('Gagal membuat gambar nota. Mengalihkan ke unduhan PDF...');
      setIsGeneratingImage(false);
      handleDownloadPDF();
    }
  };

  // Share via Web Share API
  const handleShare = async () => {
    if (!previewImage) {
      await handleDownloadImage();
    }
    try {
      const notaElement = document.getElementById('printable-nota');
      if (!notaElement) return;
      const canvas = await html2canvas(notaElement, { scale: 2.5, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        if (blob && navigator.share) {
          const file = new File([blob], fileName, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Nota Delegasi MTK',
              text: `Nota Delegasi MTK: ${delegasi.tujuan}`
            });
          }
        }
      }, 'image/png');
    } catch (e) {
      console.log('Share dismissed or not supported', e);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-scaleUp my-4 sm:my-8 flex flex-col max-h-[94vh]">
        {/* Modal Top Bar (Not printed) */}
        <div className="bg-[#1E293B] text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5 no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-bold text-xs sm:text-sm text-white">
              Nota Delegasi MTK
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Download Image Button (Phone Gallery / File) */}
            <button
              id="btn-download-nota-image"
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                downloadSuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title="Simpan sebagai gambar PNG di Galeri HP / Komputer"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Simpan ke Galeri</span>
                </>
              )}
            </button>

            {/* Download PDF Button */}
            <button
              id="btn-unduh-nota-pdf"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              title="Unduh Nota dalam format PDF"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>Unduh PDF</span>
            </button>

            {/* Print Button */}
            <button
              id="btn-cetak-nota-print"
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              title="Cetak Langsung ke Printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
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
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-50 flex flex-col items-center gap-4">
          {/* Card Hasil Gambar untuk Galeri HP */}
          {previewImage && (
            <div className="w-full max-w-xl p-4 bg-emerald-50 border-2 border-emerald-400/80 rounded-2xl flex flex-col gap-3 text-xs text-emerald-950 shadow-sm no-print animate-fadeIn">
              <div className="flex items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span className="font-bold text-sm text-emerald-900">
                    Foto Nota Siap Disimpan ke Galeri HP
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full">
                  PNG HD
                </span>
              </div>

              {/* RENDERED IMAGE: User can long-press this image to save to native gallery! */}
              <div className="bg-white p-2 rounded-xl border border-emerald-300 shadow-inner flex flex-col items-center">
                <img 
                  id="preview-nota-image"
                  src={previewImage} 
                  alt={`Nota ${delegasi.tujuan}`}
                  className="w-full h-auto object-contain rounded-lg border border-slate-100 max-h-[50vh] cursor-pointer"
                  onClick={() => downloadDataUrl(previewImage, fileName)}
                  title="Sentuh atau klik untuk mengunduh gambar"
                />
              </div>

              {/* Petunjuk Simpan ke Galeri HP */}
              <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200 text-slate-700 space-y-1">
                <p className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
                  <span>📱</span>
                  <span>Cara Simpan ke Galeri Foto HP:</span>
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Sentuh dan tahan (tekan lama) pada gambar nota di atas selama 1 detik, lalu pilih menu <strong>"Simpan Gambar"</strong> atau <strong>"Download Gambar"</strong>. Gambar akan langsung tersimpan di album foto HP Anda.
                </p>
              </div>

              {/* Action Buttons for Image */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => downloadDataUrl(previewImage, fileName)}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Gambar</span>
                </button>

                <button
                  onClick={handleShare}
                  className="py-2 px-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  title="Bagikan melalui WhatsApp atau simpan"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Bagikan</span>
                </button>
              </div>
            </div>
          )}

          {/* Printable & Capture Area */}
          <div 
            id="printable-nota" 
            className="p-6 sm:p-8 font-mono text-slate-800 bg-white shadow-sm border border-slate-200/80 rounded-2xl w-full max-w-xl space-y-5"
          >
            {/* Header Nota: Logo MTK di Kiri & Tulisan di Kanan */}
            <div className="border-b-2 border-slate-900 pb-3.5 flex items-center gap-4">
              <div className="shrink-0 flex items-center justify-center">
                <LogoMTK className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-xl font-black uppercase tracking-wider text-slate-900 font-sans leading-tight">
                  NOTA PENGELUARAN DELEGASI
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono mt-1 uppercase tracking-wider font-semibold">
                  Musyawarah wa Taklimul Kitab (MTK) Sidogiri
                </p>
              </div>
            </div>

            {/* Kolom Informasi Delegasi (Tujuan, Peserta, Jadwal) */}
            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs bg-slate-50/70">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                {/* Kolom Kiri: Tujuan & Anggota Delegasi */}
                <div className="p-3.5 space-y-3">
                  <div>
                    <span className="text-slate-500 font-sans block uppercase font-bold text-[10px] tracking-wider">
                      Tujuan Kegiatan:
                    </span>
                    <span className="font-bold text-slate-900 text-sm block mt-0.5">
                      {delegasi.tujuan}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-sans block uppercase font-bold text-[10px] tracking-wider">
                      Anggota Delegasi ({delegasi.peserta.length} Orang):
                    </span>
                    <span className="font-semibold text-slate-800 leading-snug block mt-0.5">
                      {pesertaNames.join(', ')}
                    </span>
                  </div>
                </div>

                {/* Kolom Kanan: Jadwal Berangkat & Kembali */}
                <div className="p-3.5 space-y-3 flex flex-col justify-center bg-white/60">
                  <div>
                    <span className="text-slate-500 font-sans uppercase font-bold text-[10px] tracking-wider block">
                      Jadwal Berangkat:
                    </span>
                    <span className="font-semibold text-slate-900 block mt-0.5">
                      {formatTanggalMasehi(delegasi.tglBerangkat)}
                    </span>
                    {delegasi.tglBerangkat && (
                      <span className="text-teal-800 text-[10px] block font-sans font-medium">
                        ({formatTanggalHijri(delegasi.tglBerangkat)})
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 font-sans uppercase font-bold text-[10px] tracking-wider block">
                      Jadwal Kembali:
                    </span>
                    <span className="font-semibold text-slate-900 block mt-0.5">
                      {formatTanggalMasehi(delegasi.tglKembali)}
                    </span>
                    {delegasi.tglKembali && (
                      <span className="text-teal-800 text-[10px] block font-sans font-medium">
                        ({formatTanggalHijri(delegasi.tglKembali)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Money Brought */}
            <div className="flex justify-between items-center text-xs font-bold bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-700">UANG DIBAWA:</span>
              <span className="text-slate-900 font-extrabold">{formatRupiah(delegasi.uangDibawa)}</span>
            </div>

            {/* Expenses Table */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold font-sans uppercase tracking-wider text-slate-600">
                Rincian Pengeluaran:
              </h4>
              <table className="w-full text-xs border-collapse border border-slate-800">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="border border-slate-800 p-2 text-center w-10">No</th>
                    <th className="border border-slate-800 p-2 text-left">Keterangan</th>
                    <th className="border border-slate-800 p-2 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {delegasi.rincian.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="border border-slate-800 p-3 text-center text-slate-400">
                        Tidak ada rincian item.
                      </td>
                    </tr>
                  ) : (
                    delegasi.rincian.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-800 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-800 p-2">{item.nama}</td>
                        <td className="border border-slate-800 p-2 text-right font-semibold">
                          {formatRupiah(item.nominal)}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={2} className="border border-slate-800 p-2 text-right uppercase">
                      Total Pengeluaran:
                    </td>
                    <td className="border border-slate-800 p-2 text-right text-slate-900">
                      {formatRupiah(delegasi.uangTerpakai)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Balance */}
            <div className="flex justify-between items-center text-xs font-bold p-3 rounded-xl border border-slate-300 bg-white">
              <span>SISA UANG DELEGASI:</span>
              <span className={`text-sm ${totalSisa >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {formatRupiah(totalSisa)}
              </span>
            </div>

            {/* Signatures */}
            <div className="pt-5 flex justify-between text-xs text-center font-sans">
              <div>
                <p className="font-semibold text-slate-800">Mengetahui,</p>
                <p className="text-[10px] text-slate-600 font-medium">TU MTK</p>
                <p className="mt-12 font-bold text-slate-900 uppercase">MOH ALI GHUFORN</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Ketua Delegasi,</p>
                <p className="text-[10px] text-slate-600 font-medium">Penanggung Jawab</p>
                <p className="mt-12 font-bold text-slate-900 uppercase">{pesertaNames[0] || '______________________'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile quick save hint */}
        <div className="p-3 bg-white border-t border-slate-200 text-center text-xs text-slate-600 no-print flex items-center justify-center gap-2">
          <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Tersedia pilihan <strong>Simpan ke Galeri (PNG)</strong>, <strong>Unduh PDF</strong>, dan <strong>Cetak</strong> untuk kemudahan di HP & Komputer.</span>
        </div>
      </div>
    </div>
  );
};
