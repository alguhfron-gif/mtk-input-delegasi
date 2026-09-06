import React from 'react';
import { PageView } from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  TrendingUp,
  Menu,
  ChevronDown,
  Maximize2
} from 'lucide-react';

interface MobileNavProps {
  activePage: PageView;
  onSelectPage: (page: PageView) => void;
  onOpenMenu: () => void;
  isHidden: boolean;
  onToggleHidden: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activePage,
  onSelectPage,
  onOpenMenu,
  isHidden,
  onToggleHidden
}) => {
  // Mode Layar Penuh (Jika navigasi bawah diminimalkan agar layar HP tidak ketutup)
  if (isHidden) {
    return (
      <div className="lg:hidden fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          id="btn-restore-mobile-nav"
          onClick={onToggleHidden}
          className="bg-white/95 backdrop-blur-md text-slate-600 hover:text-slate-900 px-3 py-2 rounded-full shadow-lg border border-slate-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          title="Tampilkan kembali bilah navigasi bawah"
        >
          <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px]">Navigasi</span>
        </button>

        {/* Floating Hamburger Action Button */}
        <button
          id="btn-floating-hamburger"
          onClick={onOpenMenu}
          className="bg-[#1E293B] text-white p-3.5 rounded-full shadow-xl shadow-slate-900/30 border-2 border-emerald-500 flex items-center justify-center active:scale-90 transition-all cursor-pointer group"
          title="Buka Menu Hamburger Navigasi"
          aria-label="Menu Hamburger"
        >
          <Menu className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    );
  }

  const primaryItems: { id: PageView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { id: 'inputDelegasi', label: 'Input', icon: <FileText className="w-4.5 h-4.5" /> },
    { id: 'riwayat', label: 'Riwayat', icon: <BarChart3 className="w-4.5 h-4.5" /> },
    { id: 'analitik', label: 'Analitik', icon: <TrendingUp className="w-4.5 h-4.5" /> },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1 shadow-lg safe-area-bottom">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Tombol Pintasan Utama */}
        <div className="grid grid-cols-5 flex-1 gap-1 items-center">
          {primaryItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-tab-${item.id}`}
                onClick={() => onSelectPage(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 truncate leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Tombol Hamburger Menu Khusus di Bar Bawah */}
          <button
            id="mobile-tab-hamburger-menu"
            onClick={onOpenMenu}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-700 hover:text-emerald-700 font-medium hover:bg-slate-100/70 transition-all cursor-pointer group"
            title="Buka Semua Menu (Hamburger)"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Menu className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] mt-0.5 font-bold text-slate-800 truncate leading-none">
              Menu ☰
            </span>
          </button>
        </div>

        {/* Tombol Minimalkan Bar agar Layar HP Lega */}
        <button
          id="btn-minimize-bottom-nav"
          onClick={onToggleHidden}
          className="ml-1 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Sembunyikan bar bawah agar tampilan di HP lebih lega"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
