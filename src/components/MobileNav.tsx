import React from 'react';
import { PageView } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  TrendingUp,
  Wallet, 
  Database 
} from 'lucide-react';

interface MobileNavProps {
  activePage: PageView;
  onSelectPage: (page: PageView) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activePage,
  onSelectPage
}) => {
  const items: { id: PageView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { id: 'peserta', label: 'Peserta', icon: <Users className="w-4.5 h-4.5" /> },
    { id: 'inputDelegasi', label: 'Input', icon: <FileText className="w-4.5 h-4.5" /> },
    { id: 'riwayat', label: 'Riwayat', icon: <BarChart3 className="w-4.5 h-4.5" /> },
    { id: 'analitik', label: 'Grafik', icon: <TrendingUp className="w-4.5 h-4.5" /> },
    { id: 'anggaran', label: 'Anggaran', icon: <Wallet className="w-4.5 h-4.5" /> },
    { id: 'backup', label: 'Backup', icon: <Database className="w-4.5 h-4.5" /> },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-1 py-1.5 shadow-lg safe-area-bottom">
      <div className="grid grid-cols-7 gap-0.5 items-center max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
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
      </div>
    </div>
  );
};
