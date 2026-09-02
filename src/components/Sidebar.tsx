import React from 'react';
import { PageView } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Wallet, 
  Database,
  X,
  Compass,
  Smartphone
} from 'lucide-react';

interface SidebarProps {
  activePage: PageView;
  onSelectPage: (page: PageView) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenAndroidGuide?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  mobileOpen,
  setMobileOpen,
  onOpenAndroidGuide
}) => {
  const menuItems: { id: PageView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { id: 'peserta', label: 'Database Peserta', icon: <Users className="w-4.5 h-4.5" /> },
    { id: 'inputDelegasi', label: 'Input Delegasi', icon: <FileText className="w-4.5 h-4.5" /> },
    { id: 'riwayat', label: 'Riwayat & Laporan', icon: <BarChart3 className="w-4.5 h-4.5" /> },
    { id: 'anggaran', label: 'Anggaran Tahunan', icon: <Wallet className="w-4.5 h-4.5" /> },
    { id: 'backup', label: 'Backup & Pulihkan', icon: <Database className="w-4.5 h-4.5" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container - Soft Modern Slate & Sage Tone */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#1E293B] text-slate-200 flex flex-col shadow-xl transition-transform duration-300 ease-in-out border-r border-slate-700/40 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-700/50 relative">
          <button
            id="close-sidebar-btn"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xl text-white tracking-tight leading-tight">
                MTK Delegasi
              </div>
              <p className="text-[11px] font-medium text-emerald-400/90 tracking-wide mt-0.5">
                Sistem Tugas & Keuangan
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3.5 py-6 overflow-y-auto space-y-1.5">
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu Navigasi
          </div>
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`menu-item-${item.id}`}
                onClick={() => {
                  onSelectPage(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info badge & Android APK Guide trigger */}
        <div className="p-4 border-t border-slate-700/50 space-y-2.5">
          {onOpenAndroidGuide && (
            <button
              id="sidebar-btn-apk-guide"
              onClick={() => {
                onOpenAndroidGuide();
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Source Code APK</span>
              </div>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded font-mono">
                WebView
              </span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">Data Tersimpan Otomatis</span>
          </div>
        </div>
      </aside>
    </>
  );
};
