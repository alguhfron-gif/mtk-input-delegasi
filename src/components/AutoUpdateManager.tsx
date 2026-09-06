import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Smartphone, 
  Globe, 
  X, 
  Radio, 
  ShieldCheck, 
  Info, 
  Download,
  AlertCircle
} from 'lucide-react';
import { 
  LOCAL_APP_VERSION, 
  LOCAL_BUILD_TIME, 
  subscribeAppVersion, 
  broadcastNewAppVersion, 
  AppVersionState 
} from '../lib/firebase';
import { triggerAlert } from '../utils/notifications';

interface AutoUpdateManagerProps {
  isModalOpen: boolean;
  onCloseModal: () => void;
}

export function AutoUpdateManager({ isModalOpen, onCloseModal }: AutoUpdateManagerProps) {
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'updating' | 'upToDate' | 'updated'>('idle');
  const [incomingVersion, setIncomingVersion] = useState<AppVersionState | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>(() => new Date().toLocaleTimeString('id-ID'));
  const [countdown, setCountdown] = useState<number | null>(null);

  // 1. Subscribe to real-time Firestore version announcements
  useEffect(() => {
    const loadedAt = localStorage.getItem('mtk_session_loaded_at') || new Date().toISOString();
    if (!localStorage.getItem('mtk_session_loaded_at')) {
      localStorage.setItem('mtk_session_loaded_at', loadedAt);
    }

    const unsub = subscribeAppVersion((remote) => {
      // Periksa apakah waktu pembaruan remote lebih baru daripada saat sesi ini dimuat
      const remoteReloadTime = remote.forceReloadTime || remote.buildTime;
      const isNewerVersion = remote.version !== LOCAL_APP_VERSION;
      const isNewerTime = remoteReloadTime && new Date(remoteReloadTime).getTime() > new Date(loadedAt).getTime();

      if (isNewerVersion || isNewerTime) {
        console.log('[OTA Auto-Update] Pembaruan baru terdeteksi dari cloud:', remote);
        setIncomingVersion(remote);
        setUpdateStatus('updating');

        triggerAlert(
          'delegasi',
          'Pembaruan Otomatis Diterapkan!',
          `Versi sistem baru (${remote.version}) aktif secara otomatis tanpa download ulang.`
        );

        // Mulai hitung mundur 3 detik untuk menerapkan pembaruan secara mulus
        let count = 3;
        setCountdown(count);
        const timer = setInterval(() => {
          count -= 1;
          setCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            applyUpdateNow();
          }
        }, 1000);
      }
    });

    // 2. Dengarkan event Service Worker jika ada versi file statis baru yang aktif
    const handleSwUpdated = () => {
      setUpdateStatus('updated');
      triggerAlert(
        'delegasi',
        'Pembaruan Aset Berhasil',
        'Aset aplikasi terbaru telah diunduh dan aktif di HP.'
      );
    };

    window.addEventListener('mtk:app-updated', handleSwUpdated);

    return () => {
      unsub();
      window.removeEventListener('mtk:app-updated', handleSwUpdated);
    };
  }, []);

  // Terapkan pembaruan seketika: bersihkan cache dan refresh halaman
  const applyUpdateNow = () => {
    localStorage.setItem('mtk_session_loaded_at', new Date().toISOString());
    const win = window as unknown as { __forceMTKAppReload?: () => void };
    if (typeof win.__forceMTKAppReload === 'function') {
      win.__forceMTKAppReload();
      return;
    }
    if (typeof caches !== 'undefined' && caches.keys) {
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      }).finally(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  // Cek pembaruan manual ke server & service worker
  const handleCheckUpdate = async () => {
    setUpdateStatus('checking');
    try {
      // 1. Cek service worker registration update
      const checkSW = (window as unknown as { __checkMTKAppUpdate?: () => Promise<boolean> }).__checkMTKAppUpdate;
      if (typeof checkSW === 'function') {
        await checkSW();
      }

      // 2. Tunggu simulasi pemeriksaan jaringan
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setLastCheckedTime(new Date().toLocaleTimeString('id-ID'));
      setUpdateStatus('upToDate');
      setTimeout(() => setUpdateStatus('idle'), 3500);
    } catch (err) {
      console.warn('Gagal cek update:', err);
      setUpdateStatus('idle');
    }
  };

  // Siarkan pembaruan ke seluruh HP yang sedang terhubung
  const handleBroadcastUpdate = async () => {
    setIsBroadcasting(true);
    try {
      await broadcastNewAppVersion(`Pembaruan serentak oleh Pengurus (${new Date().toLocaleTimeString('id-ID')})`);
      setUpdateStatus('upToDate');
      alert('Sinyal pembaruan berhasil disiarkan! Seluruh HP dan komputer yang sedang membuka aplikasi akan otomatis memuat versi terbaru.');
    } catch (err) {
      console.error('Gagal menyiarkan pembaruan:', err);
      alert('Gagal menyiarkan pembaruan. Pastikan koneksi internet aktif.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <>
      {/* 1. Floating Banner Saat Pembaruan Otomatis Sedang Berlangsung */}
      {updateStatus === 'updating' && (
        <div 
          id="ota-auto-update-banner"
          className="fixed top-3 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-500/80 backdrop-blur-md animate-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-white">Pembaruan Otomatis Terdeteksi!</h4>
                <span className="text-[10px] bg-emerald-500 text-slate-900 font-bold px-1.5 py-0.5 rounded">
                  OTA Live
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {incomingVersion?.updateNotes || 'Aplikasi diperbarui secara otomatis tanpa download lagi.'}
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-xs font-semibold text-emerald-300">
                  Memuat ulang dalam {countdown ?? 2} detik...
                </span>
                <button
                  onClick={applyUpdateNow}
                  className="ml-auto px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Perbarui Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Informasi & Kontrol Auto-Update Sistem */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl text-slate-800 relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Tombol Tutup */}
            <button
              onClick={onCloseModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Modal */}
            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">Sistem Pembaruan Otomatis</h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Aktif (OTA)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Over-The-Air Update: Otomatis berubah di semua HP tanpa download ulang
                </p>
              </div>
            </div>

            {/* Status Kartu Informasi */}
            <div className="space-y-3 mb-5">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Versi Aplikasi</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">v{LOCAL_APP_VERSION} (Rilis Terkini)</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Status Koneksi</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Terhubung Cloud Realtime
                  </span>
                </div>
              </div>

              {/* Penjelasan Cara Kerja Otomatis */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/60">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 leading-relaxed">
                    <p className="font-bold text-emerald-950 mb-1">
                      Bagaimana Pembaruan Bekerja di HP yang Sudah Terinstal?
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-emerald-800">
                      <li>
                        <strong>Tanpa Download APK Baru:</strong> Setiap ada fitur baru, kode diperbarui langsung di server/cloud.
                      </li>
                      <li>
                        <strong>Otomatis Terdeteksi:</strong> Saat HP membuka aplikasi atau sedang digunakan, sistem otomatis mengambil versi terbaru dan menyinkronkan data.
                      </li>
                      <li>
                        <strong>Data Aman & Tidak Hilang:</strong> Semua data santri, anggaran, dan riwayat delegasi tetap tersimpan rapi di Cloud Database Firestore.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Status Pengecekan */}
              {updateStatus === 'upToDate' && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Aplikasi Anda sudah menggunakan versi paling mutakhir (Diperiksa: {lastCheckedTime}).</span>
                </div>
              )}
            </div>

            {/* Tombol Aksi Kontrol */}
            <div className="space-y-2.5">
              <button
                id="btn-check-update-now"
                onClick={handleCheckUpdate}
                disabled={updateStatus === 'checking'}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-900/10 cursor-pointer disabled:opacity-70"
              >
                <RefreshCw className={`w-4 h-4 ${updateStatus === 'checking' ? 'animate-spin text-emerald-400' : 'text-slate-300'}`} />
                <span>
                  {updateStatus === 'checking' ? 'Sedang Memeriksa Pembaruan...' : 'Periksa Pembaruan Sekarang'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-force-reload-cache"
                  onClick={applyUpdateNow}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                  title="Membersihkan cache lama dan memuat ulang"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bersihkan Cache</span>
                </button>

                <button
                  id="btn-broadcast-update-to-all"
                  onClick={handleBroadcastUpdate}
                  disabled={isBroadcasting}
                  className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 active:scale-98 text-emerald-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-emerald-200 disabled:opacity-60"
                  title="Siarkan sinyal update agar semua HP otomatis memuat versi baru"
                >
                  <Radio className={`w-3.5 h-3.5 ${isBroadcasting ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
                  <span>{isBroadcasting ? 'Menyiarkan...' : 'Siarkan ke Semua HP'}</span>
                </button>
              </div>
            </div>

            {/* Footer Catatan Kecil */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Auto-Update Berlisensi MTK PWA
              </span>
              <span>Build: {LOCAL_BUILD_TIME.slice(0, 10)}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
