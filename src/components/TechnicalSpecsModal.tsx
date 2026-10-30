import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, Cpu, Layers, HardDrive, HelpCircle } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface TechnicalSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const TechnicalSpecsModal: React.FC<TechnicalSpecsModalProps> = ({ isOpen, onClose, lang }) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'models' | 'principles' | 'limits' | 'stack'>('models');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t.modalTitle}</h2>
              <p className="text-xs text-slate-400">{t.modalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('models')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'models'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tab1}
          </button>
          <button
            onClick={() => setActiveTab('principles')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'principles'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tab2}
          </button>
          <button
            onClick={() => setActiveTab('limits')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'limits'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tab3}
          </button>
          <button
            onClick={() => setActiveTab('stack')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'stack'
                ? 'bg-slate-800 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tab4}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-200 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t.m1NoticeTitle}</span>
                </div>
                <p>
                  <strong>{t.m1NoticeBody}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-red-400 flex items-center gap-1.5">
                    <X className="w-4 h-4" /> {t.m1DiffusionTitle}
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>{t.m1Diffusion1}</li>
                    <li>{t.m1Diffusion2}</li>
                    <li>{t.m1Diffusion3}</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> {t.m1SRTitle}
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>{t.m1SR1}</li>
                    <li>{t.m1SR2}</li>
                    <li>{t.m1SR3}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'principles' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                {t.m2Title}
              </h3>
              <p>{t.m2Intro}</p>

              <div className="space-y-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="font-semibold text-cyan-300 block mb-1">
                    {t.m2Step1Title}
                  </span>
                  <p className="text-slate-400">{t.m2Step1Body}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="font-semibold text-cyan-300 block mb-1">
                    {t.m2Step2Title}
                  </span>
                  <p className="text-slate-400">{t.m2Step2Body}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="font-semibold text-cyan-300 block mb-1">
                    {t.m2Step3Title}
                  </span>
                  <p className="text-slate-400">{t.m2Step3Body}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'limits' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                {t.m3Title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-cyan-400">{t.m3InputTitle}</span>
                  <ul className="space-y-1.5 text-slate-300">
                    <li>• {t.m3In1}</li>
                    <li>• {t.m3In2}</li>
                    <li>• {t.m3In3}</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-cyan-400">{t.m3OutputTitle}</span>
                  <ul className="space-y-1.5 text-slate-300">
                    <li>• {t.m3Out1}</li>
                    <li>• {t.m3Out2}</li>
                    <li>• {t.m3Out3}</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                {t.m3Tip}
              </div>
            </div>
          )}

          {activeTab === 'stack' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                {t.m4Title}
              </h3>

              <div className="space-y-2">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">{t.m4Frontend}</span>
                    <span className="text-slate-400 text-[11px]">{t.m4FrontendSub}</span>
                  </div>
                  <span className="font-mono text-[11px] text-cyan-400 bg-slate-900 px-2 py-1 rounded">Frontend</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">{t.m4Engine}</span>
                    <span className="text-slate-400 text-[11px]">{t.m4EngineSub}</span>
                  </div>
                  <span className="font-mono text-[11px] text-cyan-400 bg-slate-900 px-2 py-1 rounded">Client Worker</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">{t.m4Vision}</span>
                    <span className="text-slate-400 text-[11px]">{t.m4VisionSub}</span>
                  </div>
                  <span className="font-mono text-[11px] text-cyan-400 bg-slate-900 px-2 py-1 rounded">Server-Side</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">{t.m4Env}</span>
                    <span className="text-slate-400 text-[11px]">{t.m4EnvSub}</span>
                  </div>
                  <span className="font-mono text-[11px] text-cyan-400 bg-slate-900 px-2 py-1 rounded">AI Studio</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
          >
            {t.btnClose}
          </button>
        </div>
      </div>
    </div>
  );
};
