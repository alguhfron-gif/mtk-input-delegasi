import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Root Application ErrorBoundary
 * Soft, light, high-contrast styling (NO black/dark screen).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('App Error Caught:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    try {
      window.history.replaceState({ page: 'dashboard' }, '', '/');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 text-slate-800 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
          <div className="bg-white border border-slate-200/90 max-w-md w-full p-6 rounded-3xl shadow-xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                Aplikasi Membutuhkan Penyesuaian
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Terjadi kendala saat menampilkan data di HP. Silakan tekan tombol di bawah untuk kembali ke halaman utama atau memuat ulang secara normal.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={this.handleGoHome}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Kembali ke Halaman Utama</span>
              </button>

              <button
                onClick={this.handleReload}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
                <span>Muat Ulang Aplikasi</span>
              </button>
            </div>

            {this.state.error && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-mono text-slate-400 truncate text-left bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Scoped Component ErrorBoundary for sub-components (modals, tables, cards)
 * Prevents sub-component errors from crashing the entire page.
 */
interface ComponentErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

export class ComponentErrorBoundary extends Component<ComponentErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Component Error Caught:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-3 my-2">
          <div className="flex items-center justify-center gap-2 text-amber-800 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{this.props.fallbackTitle || 'Gagal memuat bagian ini'}</span>
          </div>
          <p className="text-[11px] text-slate-600 max-w-sm mx-auto leading-relaxed">
            Data pada bagian ini sedang mengalami penyesuaian. Klik tombol di bawah untuk memuat kembali.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Muat Ulang Bagian Ini</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

