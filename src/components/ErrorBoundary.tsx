import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in TraceLock:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-6 text-[#172033]">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl border border-[#E2E8F0] p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-[#DC2626] mx-auto flex items-center justify-center mb-5">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold text-[#172033] mb-2 font-sans">
              TraceLock System Recovery
            </h1>

            <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
              An unexpected interface error was intercepted. TraceLock has protected your session and cryptographic data integrity.
            </p>

            {this.state.error && (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 mb-6 text-left overflow-x-auto text-xs font-mono text-slate-700">
                {this.state.error.message || 'Unknown runtime error occurred.'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#243B6B] hover:bg-[#1A2C52] text-white text-sm font-semibold transition-colors cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>

              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#64748B] hover:text-[#172033] text-sm font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
