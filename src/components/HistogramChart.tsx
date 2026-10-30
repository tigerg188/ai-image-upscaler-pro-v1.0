import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface HistogramChartProps {
  histogramData: { r: number[]; g: number[]; b: number[] } | null;
  lang: Language;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({ histogramData, lang }) => {
  const t = translations[lang];

  const normalizedData = useMemo(() => {
    if (!histogramData) return null;

    const maxR = Math.max(...histogramData.r, 1);
    const maxG = Math.max(...histogramData.g, 1);
    const maxB = Math.max(...histogramData.b, 1);
    const maxVal = Math.max(maxR, maxG, maxB);

    const bucketsCount = 64;
    const step = 256 / bucketsCount;

    const sampledR = new Array(bucketsCount).fill(0);
    const sampledG = new Array(bucketsCount).fill(0);
    const sampledB = new Array(bucketsCount).fill(0);

    for (let i = 0; i < 256; i++) {
      const bucketIdx = Math.min(bucketsCount - 1, Math.floor(i / step));
      sampledR[bucketIdx] += histogramData.r[i];
      sampledG[bucketIdx] += histogramData.g[i];
      sampledB[bucketIdx] += histogramData.b[i];
    }

    return {
      r: sampledR.map((v) => (v / maxVal) * 100),
      g: sampledG.map((v) => (v / maxVal) * 100),
      b: sampledB.map((v) => (v / maxVal) * 100),
    };
  }, [histogramData]);

  if (!normalizedData) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span>{t.histogramTitle}</span>
        </span>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-red-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> {t.red}
          </span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {t.green}
          </span>
          <span className="text-blue-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> {t.blue}
          </span>
        </div>
      </div>

      <div className="h-24 w-full bg-slate-950 rounded-xl p-2 relative flex items-end justify-between gap-0.5 overflow-hidden border border-slate-800/80">
        {normalizedData.r.map((rHeight, i) => {
          const gHeight = normalizedData.g[i];
          const bHeight = normalizedData.b[i];

          return (
            <div key={i} className="flex-1 h-full flex items-end justify-center relative opacity-80">
              <div
                className="w-full bg-red-500/30 absolute bottom-0 mix-blend-screen"
                style={{ height: `${rHeight}%` }}
              ></div>
              <div
                className="w-full bg-emerald-500/30 absolute bottom-0 mix-blend-screen"
                style={{ height: `${gHeight}%` }}
              ></div>
              <div
                className="w-full bg-blue-500/30 absolute bottom-0 mix-blend-screen"
                style={{ height: `${bHeight}%` }}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
