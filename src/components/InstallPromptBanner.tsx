import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('mtk_install_dismissed') === 'true';
  });

  useEffect(() => {
    // Check if already in standalone mode (installed app)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('mtk_install_dismissed', 'true');
  };

  if (isInstalled || dismissed) return null;

  return (
    <>
      {/* Floating Bottom / Banner Prompt */}
      <div 
        id="pwa-install-banner"
        className="fixed bottom-20 lg:bottom-5 right-4 left-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0 p-1">
            <img src="/icon-192.png" alt="Logo MTK" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">Pasang Aplikasi MTK</h4>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.2 rounded border border-emerald-500/30">
                Resmi
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
              Buka langsung dari layar utama HP tanpa buka browser
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="install-app-action-btn"
            onClick={handleInstallClick}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pasang</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            title="Tutup banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Manual Instructions Modal if Browser Suppresses Native Prompt */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl text-slate-800 relative">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center p-1.5">
                <img src="/icon-192.png" alt="Delegasi MTK" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Cara Pasang ke Layar Utama HP</h3>
                <p className="text-xs text-slate-500">Buka langsung aplikasi tanpa URL browser</p>
              </div>
            </div>

            <div className="space-y-3 my-4 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Buka Menu Browser</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Ketuk tombol titik tiga (<strong>⋮</strong>) di Chrome/Browser Android, atau tombol Share (<strong>⎙</strong>) di Safari iPhone.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Pilih "Tambahkan ke Layar Utama" / "Instal"</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Pilih menu <strong>Tambahkan ke Layar Utama</strong> (*Add to Home screen*) atau <strong>Instal Aplikasi</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900">Selesai!</p>
                  <p className="text-emerald-700 text-xs mt-0.5">
                    Ikon <strong>Delegasi MTK</strong> akan langsung terpasang di HP Anda dan dapat dibuka satu kali klik layaknya aplikasi Android/iOS biasa.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold rounded-xl text-sm transition-all"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
