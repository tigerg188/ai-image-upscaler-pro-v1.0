import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Trash2,
  Download,
  Copy,
  Search,
  Filter,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Database,
} from 'lucide-react';
import {
  LogEntry,
  LogLevel,
  LogCategory,
  getPersistentLogs,
  clearPersistentLogs,
  downloadLogsAsJson,
} from '../utils/logger';
import { Language } from '../i18n/translations';

interface SystemLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const SystemLogsModal: React.FC<SystemLogsModalProps> = ({ isOpen, onClose, lang }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load persistent logs when modal opens & subscribe to real-time events
  useEffect(() => {
    if (isOpen) {
      setLogs(getPersistentLogs());
    }

    const handleLogUpdate = () => {
      setLogs(getPersistentLogs());
    };

    const handleLogCleared = () => {
      setLogs([]);
    };

    window.addEventListener('system-log-updated', handleLogUpdate);
    window.addEventListener('system-log-cleared', handleLogCleared);

    return () => {
      window.removeEventListener('system-log-updated', handleLogUpdate);
      window.removeEventListener('system-log-cleared', handleLogCleared);
    };
  }, [isOpen]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        searchQuery === '' ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase()));

      const matchLevel = selectedLevel === 'all' || log.level === selectedLevel;
      const matchCategory = selectedCategory === 'all' || log.category === selectedCategory;

      return matchSearch && matchLevel && matchCategory;
    });
  }, [logs, searchQuery, selectedLevel, selectedCategory]);

  const handleClearLogs = () => {
    if (confirm(lang === 'zh' ? '确定要清空全量系统日志吗？此操作无法撤销。' : 'Are you sure you want to clear all persistent system logs?')) {
      clearPersistentLogs();
    }
  };

  const handleCopyLogs = () => {
    const textStr = JSON.stringify(logs, null, 2);
    navigator.clipboard.writeText(textStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const isZh = lang === 'zh';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {isZh ? '系统全量过程日志 (Secondary System Logs)' : 'Full System Lifecycle Logs'}
                </h2>
                <span className="font-mono text-xs text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  {logs.length} {isZh ? '条记录' : 'Entries'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isZh ? '全过程无遗漏持久化日志记录，随 localStorage 保留不随页面刷新丢失' : 'Full lifecycle telemetry stored in persistent localStorage'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Persistence Guarantee Banner */}
        <div className="bg-cyan-950/30 border-b border-cyan-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {isZh
                ? '提示：所有运行、切片渲染与 AI 诊断日志均持久化在本地存储 (localStorage) 中。刷新浏览器或重启不会清空，除非您手动点击下方「清空全量日志」。'
                : 'Notice: All tile rendering & AI diagnosis logs are persisted in local storage. Reloading browser will NOT reset logs unless explicitly cleared.'}
            </span>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isZh ? '搜索日志消息或详细内容...' : 'Search logs or details...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            {['all', 'info', 'success', 'warn', 'error'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors uppercase ${
                  selectedLevel === lvl
                    ? 'bg-slate-800 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500 font-mono text-xs"
          >
            <option value="all">{isZh ? '全部分类 (All Categories)' : 'All Categories'}</option>
            <option value="upscale-engine">upscale-engine</option>
            <option value="ai-diagnosis">ai-diagnosis</option>
            <option value="upload">upload</option>
            <option value="export">export</option>
            <option value="system">system</option>
          </select>
        </div>

        {/* Log Stream Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-950/60 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
              <Terminal className="w-8 h-8 text-slate-600" />
              <p>{isZh ? '暂无匹配的系统运行日志' : 'No matching log entries found.'}</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedId === log.id;

              return (
                <div
                  key={log.id}
                  className="bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 space-y-2 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Level Icon */}
                      {log.level === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {log.level === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                      {log.level === 'error' && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                      {log.level === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
                      {log.level === 'debug' && <Terminal className="w-4 h-4 text-slate-400 shrink-0" />}

                      {/* Timestamp */}
                      <span className="text-[11px] text-slate-400">{log.timestamp}</span>

                      {/* Category Tag */}
                      <span className="text-[10px] bg-slate-800 text-cyan-300 border border-slate-700/80 px-2 py-0.5 rounded font-mono">
                        [{log.category.toUpperCase()}]
                      </span>
                    </div>

                    {log.details && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? (isZh ? '收起明细' : 'Hide Details') : (isZh ? '查看明细' : 'View Details')}</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Message Body */}
                  <div className={`text-slate-200 font-sans text-xs ${log.level === 'error' ? 'text-red-300 font-semibold' : ''}`}>
                    {log.message}
                  </div>

                  {/* Expandable Details JSON */}
                  {isExpanded && log.details && (
                    <div className="mt-2 bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                      <pre className="text-[11px] text-cyan-300/90 whitespace-pre-wrap font-mono">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearLogs}
              disabled={logs.length === 0}
              className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/80 border border-red-500/30 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>{isZh ? '清空全量日志' : 'Clear All Logs'}</span>
            </button>

            <button
              onClick={downloadLogsAsJson}
              disabled={logs.length === 0}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-30 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isZh ? '导出 JSON 日志' : 'Export JSON'}</span>
            </button>

            <button
              onClick={handleCopyLogs}
              disabled={logs.length === 0}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-30 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>{copied ? (isZh ? '已复制！' : 'Copied!') : (isZh ? '复制日志内容' : 'Copy All')}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
          >
            {isZh ? '关闭二级日志界面' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
