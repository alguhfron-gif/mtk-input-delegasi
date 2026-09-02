import { useState, useEffect } from 'react';
import { PageView, Peserta, Delegasi, DEFAULT_PESERTA } from './types';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Dashboard } from './components/Dashboard';
import { PesertaList } from './components/PesertaList';
import { DelegasiForm } from './components/DelegasiForm';
import { RiwayatLaporan } from './components/RiwayatLaporan';
import { AnggaranTab } from './components/AnggaranTab';
import { BackupTab } from './components/BackupTab';
import { NotaModal } from './components/NotaModal';
import { InstallPromptBanner } from './components/InstallPromptBanner';
import { AndroidStudioGuideModal } from './components/AndroidStudioGuideModal';
import { 
  Menu, 
  Cloud, 
  CloudCheck, 
  Smartphone, 
  Globe, 
  RefreshCw,
  Download
} from 'lucide-react';
import {
  subscribePeserta,
  subscribeDelegasi,
  subscribeAnggaran,
  savePesertaToFirestore,
  deletePesertaFromFirestore,
  batchImportPesertaToFirestore,
  saveDelegasiToFirestore,
  deleteDelegasiFromFirestore,
  clearAllDelegasiFromFirestore,
  saveAnggaranToFirestore,
  seedInitialDataIfEmpty,
  testFirestoreConnection
} from './lib/firebase';

const STORAGE_PESERTA = 'mtk_finalv2_peserta';
const STORAGE_DELEGASI = 'mtk_finalv2_delegasi';
const STORAGE_ANGGARAN = 'mtk_finalv2_anggaran';

export default function App() {
  const [activePage, setActivePage] = useState<PageView>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'input' || tabParam === 'inputDelegasi') return 'inputDelegasi';
      if (tabParam === 'riwayat') return 'riwayat';
      if (tabParam === 'peserta') return 'peserta';
      if (tabParam === 'anggaran') return 'anggaran';
      if (tabParam === 'backup') return 'backup';
    } catch {
      // ignore
    }
    return 'dashboard';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isAndroidGuideOpen, setIsAndroidGuideOpen] = useState<boolean>(false);

  // Data States with LocalStorage fallback
  const [pesertaList, setPesertaList] = useState<Peserta[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PESERTA);
      return saved ? JSON.parse(saved) : DEFAULT_PESERTA;
    } catch {
      return DEFAULT_PESERTA;
    }
  });

  const [delegasiList, setDelegasiList] = useState<Delegasi[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DELEGASI);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [saldoAnggaran, setSaldoAnggaran] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ANGGARAN);
      return saved ? JSON.parse(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Edit & Modal State
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [selectedNota, setSelectedNota] = useState<Delegasi | null>(null);

  // -------------------------------------------------------------
  // Real-time Firebase Sync Across HP and Web
  // -------------------------------------------------------------
  useEffect(() => {
    // Initial connection test
    testFirestoreConnection().then(connected => {
      setIsFirebaseConnected(connected);
    });

    // Seed default peserta to Firestore if DB is empty
    seedInitialDataIfEmpty(DEFAULT_PESERTA);

    // Subscribe to real-time changes from Firestore
    setIsSyncing(true);

    const unsubPeserta = subscribePeserta((data) => {
      setPesertaList(data);
      localStorage.setItem(STORAGE_PESERTA, JSON.stringify(data));
      setIsSyncing(false);
      setIsFirebaseConnected(true);
    }, () => {
      setIsFirebaseConnected(false);
      setIsSyncing(false);
    });

    const unsubDelegasi = subscribeDelegasi((data) => {
      setDelegasiList(data);
      localStorage.setItem(STORAGE_DELEGASI, JSON.stringify(data));
      setIsSyncing(false);
      setIsFirebaseConnected(true);
    }, () => {
      setIsFirebaseConnected(false);
      setIsSyncing(false);
    });

    const unsubAnggaran = subscribeAnggaran((saldo) => {
      setSaldoAnggaran(saldo);
      localStorage.setItem(STORAGE_ANGGARAN, JSON.stringify(saldo));
      setIsSyncing(false);
      setIsFirebaseConnected(true);
    }, () => {
      setIsFirebaseConnected(false);
      setIsSyncing(false);
    });

    return () => {
      unsubPeserta();
      unsubDelegasi();
      unsubAnggaran();
    };
  }, []);

  // -------------------------------------------------------------
  // Handlers with Direct Real-time Firestore Auto-Save
  // -------------------------------------------------------------

  // Handlers for Peserta
  const handleAddPeserta = async (newP: Peserta) => {
    setPesertaList(prev => [...prev, newP]);
    try {
      await savePesertaToFirestore(newP);
    } catch (err) {
      console.error('Failed to sync new peserta to Firebase:', err);
    }
  };

  const handleEditPeserta = async (updatedP: Peserta) => {
    setPesertaList(prev => prev.map(p => p.id === updatedP.id ? updatedP : p));
    try {
      await savePesertaToFirestore(updatedP);
    } catch (err) {
      console.error('Failed to sync edited peserta to Firebase:', err);
    }
  };

  const handleDeletePeserta = async (pesertaId: string) => {
    setPesertaList(prev => prev.filter(p => p.id !== pesertaId));
    try {
      await deletePesertaFromFirestore(pesertaId);
    } catch (err) {
      console.error('Failed to delete peserta from Firebase:', err);
    }
  };

  const handleResetPesertaDefault = async () => {
    setPesertaList([...DEFAULT_PESERTA]);
    try {
      await batchImportPesertaToFirestore(DEFAULT_PESERTA, 'replace');
    } catch (err) {
      console.error('Failed to reset peserta to Firebase:', err);
    }
  };

  const handleImportPesertaCSV = async (
    imported: Peserta[], 
    mode: 'skip' | 'update' | 'replace' = 'update'
  ) => {
    try {
      await batchImportPesertaToFirestore(imported, mode);
    } catch (err) {
      console.error('Failed to batch import peserta to Firebase:', err);
    }
  };

  // Handlers for Delegasi
  const handleSaveDelegasi = async (data: Omit<Delegasi, 'id'>, editId?: number) => {
    const delegasiToSave: Delegasi = {
      ...data,
      id: editId !== undefined ? editId : Date.now()
    };

    if (editId !== undefined) {
      setDelegasiList(prev =>
        prev.map(d => (d.id === editId ? delegasiToSave : d))
      );
      setEditIndex(null);
    } else {
      setDelegasiList(prev => [...prev, delegasiToSave]);
    }

    setActivePage('riwayat');

    try {
      await saveDelegasiToFirestore(delegasiToSave);
    } catch (err) {
      console.error('Failed to save delegasi to Firebase:', err);
    }
  };

  const handleStartEditDelegasi = (index: number) => {
    setEditIndex(index);
    setActivePage('inputDelegasi');
  };

  const handleCancelEditDelegasi = () => {
    setEditIndex(null);
    setActivePage('riwayat');
  };

  const handleDeleteDelegasi = async (index: number) => {
    const target = delegasiList[index];
    if (!target) return;
    setDelegasiList(prev => prev.filter((_, idx) => idx !== index));
    try {
      await deleteDelegasiFromFirestore(target.id);
    } catch (err) {
      console.error('Failed to delete delegasi from Firebase:', err);
    }
  };

  const handleClearAllDelegasi = async () => {
    setDelegasiList([]);
    try {
      await clearAllDelegasiFromFirestore();
    } catch (err) {
      console.error('Failed to clear delegasi from Firebase:', err);
    }
  };

  // Handlers for Anggaran
  const handleSaveSaldoAnggaran = async (nominal: number) => {
    setSaldoAnggaran(nominal);
    try {
      await saveAnggaranToFirestore(nominal);
    } catch (err) {
      console.error('Failed to save anggaran to Firebase:', err);
    }
  };

  // Handlers for Backup & Restore
  const handleRestoreData = async (restored: {
    peserta: Peserta[];
    delegasi: Delegasi[];
    saldoAnggaran: number;
  }) => {
    setPesertaList(restored.peserta);
    setDelegasiList(restored.delegasi);
    setSaldoAnggaran(restored.saldoAnggaran);

    try {
      if (restored.peserta?.length > 0) {
        await batchImportPesertaToFirestore(restored.peserta, 'replace');
      }
      if (restored.delegasi?.length > 0) {
        for (const d of restored.delegasi) {
          await saveDelegasiToFirestore(d);
        }
      }
      await saveAnggaranToFirestore(restored.saldoAnggaran || 0);
    } catch (err) {
      console.error('Failed to sync restored data to Firebase:', err);
    }
  };

  const handleBackupDownload = () => {
    const dbData = {
      peserta: pesertaList,
      delegasi: delegasiList,
      saldoAnggaran,
      exportedAt: new Date().toISOString(),
      source: 'Firebase & Local MTK Storage'
    };

    const jsonString = JSON.stringify(dbData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_mtk_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-800 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900 pb-16 lg:pb-0">
      {/* Sidebar Navigation for Desktop */}
      <Sidebar
        activePage={activePage}
        onSelectPage={(page) => {
          if (page === 'inputDelegasi' && activePage !== 'inputDelegasi') {
            setEditIndex(null);
          }
          setActivePage(page);
        }}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen w-full">
        {/* Top Navbar Header for Mobile & Desktop */}
        <header className="bg-[#1E293B] text-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-30 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <button
              id="mobile-hamburger-btn"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                MTK Delegasi
              </span>
              <span className="hidden sm:inline-block text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Cloud Sync
              </span>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-header-apk-guide"
              onClick={() => setIsAndroidGuideOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kode APK Android</span>
            </button>

            {/* Sync Status Badge (HP & Web Sync Indicator) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <div className="flex items-center gap-1 text-slate-300">
                <Smartphone className="w-3 h-3 text-emerald-400" />
                <span className="text-slate-500">•</span>
                <Globe className="w-3 h-3 text-teal-400" />
                <span className="hidden sm:inline text-slate-300 font-medium ml-1">
                  {isFirebaseConnected ? 'Tersinkron Realtime' : 'Mode Offline'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <Dashboard
              pesertaList={pesertaList}
              delegasiList={delegasiList}
              saldoAnggaran={saldoAnggaran}
              onNavigate={(page) => setActivePage(page)}
              onBackup={handleBackupDownload}
            />
          )}

          {activePage === 'peserta' && (
            <PesertaList
              pesertaList={pesertaList}
              onAddPeserta={handleAddPeserta}
              onEditPeserta={handleEditPeserta}
              onDeletePeserta={handleDeletePeserta}
              onResetDefault={handleResetPesertaDefault}
              onImportCSV={handleImportPesertaCSV}
            />
          )}

          {activePage === 'inputDelegasi' && (
            <DelegasiForm
              pesertaList={pesertaList}
              editDelegasi={editIndex !== null ? delegasiList[editIndex] : null}
              onSaveDelegasi={handleSaveDelegasi}
              onCancelEdit={handleCancelEditDelegasi}
            />
          )}

          {activePage === 'riwayat' && (
            <RiwayatLaporan
              delegasiList={delegasiList}
              pesertaList={pesertaList}
              onEditDelegasi={handleStartEditDelegasi}
              onPrintNota={(delegasi) => setSelectedNota(delegasi)}
            />
          )}

          {activePage === 'anggaran' && (
            <AnggaranTab
              saldoAnggaran={saldoAnggaran}
              delegasiList={delegasiList}
              onSaveSaldo={handleSaveSaldoAnggaran}
            />
          )}

          {activePage === 'backup' && (
            <BackupTab
              pesertaList={pesertaList}
              delegasiList={delegasiList}
              saldoAnggaran={saldoAnggaran}
              onRestoreData={handleRestoreData}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation for HP */}
      <MobileNav
        activePage={activePage}
        onSelectPage={(page) => {
          if (page === 'inputDelegasi' && activePage !== 'inputDelegasi') {
            setEditIndex(null);
          }
          setActivePage(page);
        }}
      />

      {/* Print / Save Image Nota Modal */}
      {selectedNota && (
        <NotaModal
          delegasi={selectedNota}
          pesertaList={pesertaList}
          onClose={() => setSelectedNota(null)}
        />
      )}

      {/* Direct Install PWA Banner & Quick Install Guide */}
      <InstallPromptBanner />

      {/* Android Studio WebView APK Source Code & Setup Modal */}
      <AndroidStudioGuideModal
        isOpen={isAndroidGuideOpen}
        onClose={() => setIsAndroidGuideOpen(false)}
      />
    </div>
  );
}
