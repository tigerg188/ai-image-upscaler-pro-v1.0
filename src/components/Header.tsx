import React, { useState, useEffect } from 'react';
import { Layers, HelpCircle, Sparkles, Image as ImageIcon, Terminal, Download } from 'lucide-react';
import { Language, translations } from '../i18n/translations';
import { getPersistentLogs } from '../utils/logger';

interface HeaderProps {
  onOpenSpecs: () => void;
  onOpenLogs: () => void;
  onLoadSample: () => void;
  hasImage: boolean;
  hasUpscaled: boolean;
  onDownload: () => void;
  lang: Language;
  onToggleLang: (newLang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSpecs,
  onOpenLogs,
  onLoadSample,
  hasImage,
  hasUpscaled,
  onDownload,
  lang,
  onToggleLang,
}) => {
  const t = translations[lang];
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setLogCount(getPersistentLogs().length);
    };
    updateCount();

    window.addEventListener('system-log-updated', updateCount);
    window.addEventListener('system-log-cleared', updateCount);

    return () => {
      window.removeEventListener('system-log-updated', updateCount);
      window.removeEventListener('system-log-cleared', updateCount);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <a href="/" className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              {t.appTitle}
            </a>
            <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-mono">
              {t.subtitle}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
          <button
            onClick={onOpenSpecs}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.navSpecs}</span>
          </button>

          <button
            onClick={onOpenLogs}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.btnLogs}</span>
            <span className="font-mono text-[10px] bg-slate-900 border border-slate-700/80 text-cyan-300 px-1.5 py-0.2 rounded-full">
              {logCount}
            </span>
          </button>

          <a
            href="#diagnosis"
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
          >
            {t.navDiagnosis}
          </a>
          <a
            href="#comparison"
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
          >
            {t.navCompare}
          </a>
        </nav>

        {/* Zone 3: Actions & Language Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Prominent Header Download Button when upscale complete */}
          {hasUpscaled && (
            <button
              onClick={onDownload}
              className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer animate-pulse"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>{t.btnDownload}</span>
            </button>
          )}

          {/* System Logs Mobile/Header Action */}
          <button
            onClick={onOpenLogs}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            title="Open System Logs"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-mono">{t.btnLogs}</span>
            <span className="font-mono text-[10px] bg-slate-800 text-cyan-400 px-1.5 py-0.2 rounded-full">
              {logCount}
            </span>
          </button>

          {/* Bilingual Switcher */}
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => onToggleLang('zh')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                lang === 'zh'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => onToggleLang('en')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          <button
            onClick={onLoadSample}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>{hasImage ? t.btnChangeImage : t.btnDemoPhoto}</span>
          </button>

          <button
            onClick={onOpenSpecs}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 rounded-lg shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>{t.btnTechSpecs}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
