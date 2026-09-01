import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('PWA Mobile Crash Caught:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none">
          <div className="bg-slate-800 border border-slate-700 max-w-md w-full p-6 rounded-3xl shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Aplikasi Membutuhkan Muat Ulang
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Terjadi kendala saat memuat aplikasi di HP. Silakan klik tombol di bawah untuk memuat ulang data secara normal.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Aplikasi</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Kembali ke Halaman Utama</span>
              </button>
            </div>

            {this.state.error && (
              <p className="text-[10px] font-mono text-slate-500 truncate pt-2">
                {this.state.error.toString()}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
