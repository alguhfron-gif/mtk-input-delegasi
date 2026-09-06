import React, { useState, useEffect } from 'react';
import { Bell, X, Sparkles, CheckCircle2, UserPlus, Send, Wallet, Volume2 } from 'lucide-react';
import { 
  RealtimeAlert, 
  onRealtimeAlert, 
  requestNotificationPermission,
  playNotificationChime
} from '../utils/notifications';

export const RealtimeNotificationBanner: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<RealtimeAlert | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        // Tampilkan ajakan izin notifikasi sekali saja jika belum diset
        const hasPrompted = sessionStorage.getItem('mtk_notif_prompted');
        if (!hasPrompted) {
          setShowPermissionPrompt(true);
        }
      }
    }

    // Subscribe to realtime alerts triggered when new data is added
    const unsubscribe = onRealtimeAlert((alert) => {
      setActiveAlert(alert);
      // Auto dismiss after 7 seconds
      const timer = setTimeout(() => {
        setActiveAlert((curr) => (curr?.id === alert.id ? null : curr));
      }, 7000);
      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);

  const handleEnablePermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    setShowPermissionPrompt(false);
    sessionStorage.setItem('mtk_notif_prompted', 'true');
    if (res === 'granted') {
      playNotificationChime();
    }
  };

  const handleDismissPermission = () => {
    setShowPermissionPrompt(false);
    sessionStorage.setItem('mtk_notif_prompted', 'true');
  };

  return (
    <>
      {/* Floating System Notification Prompt (One-time, non-intrusive) */}
      {showPermissionPrompt && permission === 'default' && (
        <div 
          id="notif-permission-prompt"
          className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Aktifkan Notifikasi Real-time?</p>
              <p className="text-[11px] text-slate-300 leading-tight">
                Dapatkan pemberitahuan seketika saat ada delegasi atau data baru di HP & Laptop Anda.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleEnablePermission}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Aktifkan
            </button>
            <button
              onClick={handleDismissPermission}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Active Alert Banner across all screens */}
      {activeAlert && (
        <div 
          id="realtime-alert-toast"
          className="fixed top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-lg z-50 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-300">
                {activeAlert.tipe === 'delegasi' && <Send className="w-4 h-4" />}
                {activeAlert.tipe === 'peserta' && <UserPlus className="w-4 h-4" />}
                {activeAlert.tipe === 'anggaran' && <Wallet className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
                    Notifikasi Real-time
                  </span>
                  <span className="text-[10px] text-slate-400">Baru saja</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                  {activeAlert.judul}
                </h4>
                <p className="text-[11px] text-slate-300 truncate">
                  {activeAlert.pesan}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => playNotificationChime()}
                title="Dengarkan bunyi notifikasi"
                className="p-1.5 text-slate-400 hover:text-emerald-300 rounded-lg transition-colors cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveAlert(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Tutup pemberitahuan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
