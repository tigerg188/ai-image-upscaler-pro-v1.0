import React from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Sliders, Cpu } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

export interface AiDiagnosisResult {
  noiseLevel: string;
  compressionArtifacts: string;
  blurriness: string;
  qualityScore: number;
  recommendedScale: string;
  recommendedDenoise: number;
  recommendedSharpness: number;
  assessmentSummary: string;
  imageCategory: string;
  source?: 'gemini' | 'algorithmic' | 'default';
}

interface AiDiagnosisPanelProps {
  diagnosis: AiDiagnosisResult | null;
  isLoading: boolean;
  onAnalyze: () => void;
  onApplyRecommended: (scale: 2 | 4 | 8, denoise: number, sharpness: number) => void;
  lang: Language;
}

export const AiDiagnosisPanel: React.FC<AiDiagnosisPanelProps> = ({
  diagnosis,
  isLoading,
  onAnalyze,
  onApplyRecommended,
  lang,
}) => {
  const t = translations[lang];

  return (
    <div id="diagnosis" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{t.diagnosisTitle}</h3>
            <p className="text-[11px] text-slate-400">{t.diagnosisSubtitle}</p>
          </div>
        </div>

        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span>{t.btnAnalyzing}</span>
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>{diagnosis ? t.btnReAnalyze : t.btnRunDiagnosis}</span>
            </>
          )}
        </button>
      </div>

      {!diagnosis && !isLoading && (
        <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <AlertCircle className="w-6 h-6 text-slate-500" />
          <p>{t.diagnosisPromptMsg}</p>
        </div>
      )}

      {isLoading && (
        <div className="py-8 text-center flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-300 font-mono">{t.btnAnalyzing}</p>
        </div>
      )}

      {diagnosis && !isLoading && (
        <div className="mt-4 space-y-4">
          {/* Summary Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">[{diagnosis.imageCategory}]</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono">
                    {diagnosis.source === 'gemini' ? 'Gemini 3.8 Flash' : '智能原画分析引擎'}
                  </span>
                </div>
                <span>{diagnosis.assessmentSummary}</span>
              </div>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Quality Score */}
            <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">{t.qualityScore}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-cyan-400">{diagnosis.qualityScore}</span>
                <span className="text-[10px] text-slate-500">/ 100</span>
              </div>
            </div>

            {/* Noise Level */}
            <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">{t.noiseLevel}</span>
              <span className="font-semibold text-slate-200">{diagnosis.noiseLevel}</span>
            </div>

            {/* Blurriness */}
            <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">{t.blurriness}</span>
              <span className="font-semibold text-slate-200">{diagnosis.blurriness}</span>
            </div>

            {/* Compression */}
            <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">{t.jpegArtifacts}</span>
              <span className="font-semibold text-slate-200">{diagnosis.compressionArtifacts}</span>
            </div>
          </div>

          {/* Recommendation Banner & Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-blue-950/30 border border-cyan-500/20 p-3 rounded-xl">
            <div className="text-xs space-y-0.5">
              <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.aiRecParams}</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                {t.scale}: <strong className="text-slate-200 font-mono">{diagnosis.recommendedScale}</strong> · {t.denoise}:{' '}
                <strong className="text-slate-200 font-mono">{diagnosis.recommendedDenoise}%</strong> · {t.sharpness}:{' '}
                <strong className="text-slate-200 font-mono">{diagnosis.recommendedSharpness}%</strong>
              </p>
            </div>

            <button
              onClick={() => {
                const scaleNum = (parseInt(diagnosis.recommendedScale) || 4) as 2 | 4 | 8;
                onApplyRecommended(scaleNum, diagnosis.recommendedDenoise, diagnosis.recommendedSharpness);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.btnApplyRec}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
