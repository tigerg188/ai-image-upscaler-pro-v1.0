import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Terminal } from 'lucide-react';
import { logSystemEvent } from '../utils/logger';

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
    logSystemEvent('error', 'system', `Uncaught React Component Error: ${error.message}`, {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">页面运行时捕获异常 (Session Protected)</h2>
                <p className="text-xs text-slate-400">已保护会话状态，您的图片与系统全量日志已完整保留</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-red-300 overflow-x-auto">
              {this.state.error?.message || 'Unknown runtime error occurred'}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-system-logs'))}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Terminal className="w-4 h-4" />
                <span>查看全量日志</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>恢复运行会话</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
