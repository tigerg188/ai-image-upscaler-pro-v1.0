import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Move, SplitSquareVertical, Columns, Download } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface ImageComparisonSliderProps {
  originalSrc: string;
  upscaledSrc: string | null;
  originalWidth: number;
  originalHeight: number;
  upscaledWidth?: number;
  upscaledHeight?: number;
  scaleFactor: number;
  lang: Language;
  onDownload?: () => void;
  processingRoute?: 'route-a' | 'route-b' | 'route-c';
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  originalSrc,
  upscaledSrc,
  originalWidth,
  originalHeight,
  upscaledWidth,
  upscaledHeight,
  scaleFactor,
  lang,
  onDownload,
  processingRoute = 'route-a',
}) => {
  const t = translations[lang];

  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percentage);
      } else if (isPanning) {
        setPanOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [isDragging, isPanning, panStart]
  );

  useEffect(() => {
    if (isDragging || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isPanning, handleMouseMove, handleMouseUp]);

  const handlePanMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1 && !isDragging) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && containerRef.current && e.touches[0]) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    }
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const currentUpscaledSrc = upscaledSrc || originalSrc;
  const targetW = upscaledWidth || originalWidth * scaleFactor;
  const targetH = upscaledHeight || originalHeight * scaleFactor;

  return (
    <div id="comparison" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-sm space-y-3">
      {/* Viewport Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            {t.viewportTitle}
          </span>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            {t.original}: {originalWidth}x{originalHeight}px → {t.upscaled}: {targetW}x{targetH}px ({scaleFactor}x)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Download Action if Upscaled */}
          {upscaledSrc && onDownload && (
            <button
              onClick={onDownload}
              className="px-2.5 py-1 bg-cyan-400 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 hover:bg-cyan-300 transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.btnDownload}</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('slider')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'slider'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SplitSquareVertical className="w-3 h-3" />
              <span>{t.splitSlider}</span>
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'side-by-side'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3 h-3" />
              <span>{t.sideBySide}</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              disabled={zoomLevel <= 1}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded"
              title={t.zoomOut}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1 text-slate-300 min-w-[36px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(4, z + 0.5))}
              disabled={zoomLevel >= 4}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded"
              title={t.zoomIn}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel > 1 && (
              <button
                onClick={resetZoom}
                className="p-1 text-cyan-400 hover:text-cyan-300 rounded ml-0.5"
                title={t.resetZoom}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Image Container */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          onMouseDown={handlePanMouseDown}
          onTouchMove={handleTouchMove}
          className={`relative w-full h-[480px] sm:h-[560px] bg-slate-950 rounded-xl overflow-hidden select-none border border-slate-800/80 ${
            zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
        >
          {/* Zoomable Inner Wrapper */}
          <div
            className="w-full h-full relative transition-transform duration-75 ease-out flex items-center justify-center"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${
                panOffset.y / zoomLevel
              }px)`,
            }}
          >
            {/* Upscaled Layer (Bottom Layer) */}
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              <img
                src={currentUpscaledSrc}
                alt="Upscaled High-Res"
                className="max-w-full max-h-full object-contain pointer-events-none"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <div className="bg-slate-950/90 border border-slate-800/80 px-2.5 py-1 rounded-md text-[11px] font-mono text-cyan-400 backdrop-blur-md">
                  {upscaledSrc ? `${scaleFactor}x ${t.upscaledTag} (${targetW}x${targetH})` : t.originalTag}
                </div>
                {upscaledSrc && onDownload && (
                  <button
                    onClick={onDownload}
                    className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 shadow-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.btnDownload}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Original Image Layer (Clipped Top Layer) */}
            <div
              className="absolute inset-0 overflow-hidden flex items-center justify-center"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={originalSrc}
                alt="Original Low-Res"
                className="max-w-full max-h-full object-contain pointer-events-none"
                style={{
                  width: containerRef.current?.clientWidth || '100%',
                  maxWidth: 'none',
                }}
              />
              <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800/80 px-2.5 py-1 rounded-md text-[11px] font-mono text-amber-400 backdrop-blur-md">
                {t.originalTag} ({originalWidth}x{originalHeight})
              </div>
            </div>

            {/* Vertical Split Line & Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] z-20 cursor-ew-resize"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-950 border-2 border-cyan-400 shadow-xl flex items-center justify-center text-cyan-400 hover:scale-110 transition-transform">
                <Move className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Side-by-Side Dual Viewport */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Original */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-xs text-amber-400 font-mono mb-2">
              <span>{t.originalTag}</span>
              <span>{originalWidth} x {originalHeight} px</span>
            </div>
            <div className="w-full h-[360px] flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] rounded-lg overflow-hidden">
              <img
                src={originalSrc}
                alt="Original"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          {/* Right: Upscaled */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center relative">
            <div className="w-full flex items-center justify-between text-xs text-cyan-400 font-mono mb-2">
              <span>{scaleFactor}x {t.upscaledTag}</span>
              <span>{targetW} x {targetH} px</span>
            </div>
            <div className="w-full h-[360px] flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] rounded-lg overflow-hidden relative">
              <img
                src={currentUpscaledSrc}
                alt="Upscaled"
                className="max-w-full max-h-full object-contain"
              />
              {upscaledSrc && onDownload && (
                <button
                  onClick={onDownload}
                  className="absolute bottom-3 right-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.btnDownload}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
