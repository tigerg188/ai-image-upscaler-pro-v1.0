import React, { useState, useRef, useEffect } from 'react';
import { TileSlice } from '../utils/upscalerEngine';
import {
  Download,
  ZoomIn,
  Maximize2,
  Sparkles,
  Cpu,
  Camera,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Info,
  Clock,
  HardDrive,
} from 'lucide-react';
import {
  stitchSafeCanvasImage,
  stitchFullResolutionPng,
  stitchFullResolutionBmp,
  StitchSourceTile,
} from '../utils/localStitchEngine';

interface AutomatedMosaicViewerProps {
  tiles: TileSlice[];
  totalWidth: number;
  totalHeight: number;
  originalFileName: string;
  onDownloadZip: () => void;
  isDownloadingZip?: boolean;
}

export const AutomatedMosaicViewer: React.FC<AutomatedMosaicViewerProps> = ({
  tiles: initialTiles,
  totalWidth,
  totalHeight,
  originalFileName,
  onDownloadZip,
  isDownloadingZip = false,
}) => {
  const [scale, setScale] = useState(0.2);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Current active tiles (can be updated via local mock upload / file picker)
  const [activeTiles, setActiveTiles] = useState<TileSlice[]>(initialTiles);

  // Local Time-Extended Stitching State
  const [isStitching, setIsStitching] = useState(false);
  const [stitchProgress, setStitchProgress] = useState(0);
  const [stitchStatusText, setStitchStatusText] = useState<string>('');
  const [stitchSuccess, setStitchSuccess] = useState(false);
  const [stitchError, setStitchError] = useState<string | null>(null);

  // Stitch Plan Selection:
  // 'safe_16k_jpg': 16K max (~16384px) - 5-10s
  // 'safe_12k_png': 12K (12288px) - 10-15s
  // 'full_8x_png': 23808x31744 True 7.55亿像素无损 PNG - 30-50s
  // 'full_8x_bmp': 23808x31744 True 7.55亿像素未压缩 BMP - 30-50s
  const [stitchPlan, setStitchPlan] = useState<'safe_16k_jpg' | 'safe_12k_png' | 'full_8x_png' | 'full_8x_bmp'>('full_8x_png');

  const viewportRef = useRef<HTMLDivElement>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTiles(initialTiles);
  }, [initialTiles]);

  // Auto-fit on initial load
  useEffect(() => {
    if (viewportRef.current) {
      const vw = viewportRef.current.clientWidth;
      const vh = viewportRef.current.clientHeight;
      const initialScale = Math.min(vw / totalWidth, vh / totalHeight) * 0.9;
      setScale(Math.max(0.02, initialScale));
      setPos({
        x: (vw - totalWidth * initialScale) / 2,
        y: (vh - totalHeight * initialScale) / 2,
      });
    }
  }, [totalWidth, totalHeight]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const prevScale = scale;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const nextScale = Math.max(0.01, Math.min(5.0, prevScale * factor));

    setPos({
      x: mouseX - (mouseX - pos.x) * (nextScale / prevScale),
      y: mouseY - (mouseY - pos.y) * (nextScale / prevScale),
    });
    setScale(nextScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPos({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetFit = () => {
    if (!viewportRef.current) return;
    const vw = viewportRef.current.clientWidth;
    const vh = viewportRef.current.clientHeight;
    const fitScale = Math.min(vw / totalWidth, vh / totalHeight) * 0.9;
    setScale(fitScale);
    setPos({
      x: (vw - totalWidth * fitScale) / 2,
      y: (vh - totalHeight * fitScale) / 2,
    });
  };

  const handleZoom100 = () => {
    if (!viewportRef.current) return;
    const vw = viewportRef.current.clientWidth;
    const vh = viewportRef.current.clientHeight;
    setScale(1.0);
    setPos({
      x: (vw - totalWidth) / 2,
      y: (vh - totalHeight) / 2,
    });
  };

  // Local Viewport Detail 100% Export
  const handleExportView100 = () => {
    if (!viewportRef.current) return;
    const vw = viewportRef.current.clientWidth;
    const vh = viewportRef.current.clientHeight;

    const canvas = document.createElement('canvas');
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, vw, vh);

    activeTiles.forEach((t) => {
      const tileX = t.col * (totalWidth / 2);
      const tileY = t.row * (totalHeight / 2);
      ctx.drawImage(
        t.canvas,
        pos.x + tileX * scale,
        pos.y + tileY * scale,
        (totalWidth / 2) * scale,
        (totalHeight / 2) * scale
      );
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `100%特写视窗_${originalFileName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, 'image/png');
  };

  // Handle Local Mock Upload (selecting local files directly in browser)
  const handleLocalFilesUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    const updated = [...activeTiles];
    fileList.forEach((file) => {
      const name = file.name.toLowerCase();
      let matchedIdx = -1;
      if (name.includes('01') || name.includes('top_left') || name.includes('左上')) matchedIdx = 0;
      else if (name.includes('02') || name.includes('top_right') || name.includes('右上')) matchedIdx = 1;
      else if (name.includes('03') || name.includes('bottom_left') || name.includes('左下')) matchedIdx = 2;
      else if (name.includes('04') || name.includes('bottom_right') || name.includes('右下')) matchedIdx = 3;

      if (matchedIdx !== -1 && updated[matchedIdx]) {
        updated[matchedIdx] = {
          ...updated[matchedIdx],
          blob: file,
        };
      }
    });

    setActiveTiles(updated);
    setStitchSuccess(true);
    setStitchStatusText('✔ 已通过本地模拟上传挂载切片，已解锁全部本地拼合方案！');
  };

  // Execute Pure Client-Side Stitching (Zero Cloud Dependency!)
  const handleTriggerLocalStitch = async () => {
    setIsStitching(true);
    setStitchError(null);
    setStitchSuccess(false);
    setStitchProgress(5);
    setStitchStatusText('初始化本地时间换空间装配引擎...');

    try {
      const stitchSources: StitchSourceTile[] = activeTiles.map((t) => ({
        col: t.col,
        row: t.row,
        source: t.blob || t.canvas,
      }));

      let outBlob: Blob;
      let downloadFilename: string;

      if (stitchPlan === 'full_8x_png') {
        // Breakthrough 23808x31744 True Lossless Streaming PNG (24G RAM, 0 VRAM, ~450MB output!)
        setStitchStatusText('正在调度 24GB 物理大内存，按带状流式无损压缩生成 23808×31744 PNG 巨图 (需 30~50 秒)...');
        outBlob = await stitchFullResolutionPng(
          stitchSources,
          totalWidth,
          totalHeight,
          (percent, msg) => {
            setStitchProgress(percent);
            setStitchStatusText(msg);
          }
        );
        downloadFilename = `全量8X单张巨图_${totalWidth}x${totalHeight}_${originalFileName}.png`;
      } else if (stitchPlan === 'full_8x_bmp') {
        // Breakthrough 23808x31744 True Uncompressed BMP Assembler (24G RAM, 0 VRAM!)
        setStitchStatusText('正在调度 24GB 物理大内存，按带状分块生成 23808×31744 单张巨图 (需 30~50 秒)...');
        outBlob = await stitchFullResolutionBmp(
          stitchSources,
          totalWidth,
          totalHeight,
          (percent, msg) => {
            setStitchProgress(percent);
            setStitchStatusText(msg);
          }
        );
        downloadFilename = `全量8X单张巨图_${totalWidth}x${totalHeight}_${originalFileName}.bmp`;
      } else if (stitchPlan === 'safe_16k_jpg') {
        // 16K Hardware Safe Max (~16384px) - Instant & Universal
        setStitchStatusText('正在按分块装配 16K 超高清晰单图 (16384px · 需 5~10 秒)...');
        outBlob = await stitchSafeCanvasImage(
          stitchSources,
          totalWidth,
          totalHeight,
          16384,
          'jpeg',
          0.93,
          (percent, msg) => {
            setStitchProgress(percent);
            setStitchStatusText(msg);
          }
        );
        downloadFilename = `合并单张超清大图_16K_${originalFileName}.jpg`;
      } else {
        // 12K Lossless PNG (12288px)
        setStitchStatusText('正在按分块装配 12K 无损单图 (12288px · 需 10~15 秒)...');
        outBlob = await stitchSafeCanvasImage(
          stitchSources,
          totalWidth,
          totalHeight,
          12288,
          'png',
          1.0,
          (percent, msg) => {
            setStitchProgress(percent);
            setStitchStatusText(msg);
          }
        );
        downloadFilename = `合并单张超清大图_12K_${originalFileName}.png`;
      }

      // Trigger instantaneous browser download
      const url = URL.createObjectURL(outBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStitchSuccess(true);
      setStitchProgress(100);
      setStitchStatusText(
        `🎉 成功下载单张巨图！文件体积 ${(outBlob.size / 1024 / 1024).toFixed(1)} MB，全程纯本地 CPU 运算，未消耗云端流量。`
      );
    } catch (err: any) {
      console.error('Local stitch error:', err);
      setStitchError(err.message || '本地分块拼合发生错误，请选择较保守画幅重试');
    } finally {
      setIsStitching(false);
    }
  };

  return (
    <div className="relative w-full h-[670px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
      {/* Hidden local file picker for simulated upload */}
      <input
        type="file"
        ref={localFileInputRef}
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleLocalFilesUpload(e.target.files)}
      />

      {/* Top Bar Controls */}
      <div className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-sm text-slate-100">超清全景实时无缝缝合查看器</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            {totalWidth} × {totalHeight} px · 7.55亿像素 (8X)
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline-block truncate max-w-[180px]">
            {originalFileName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => localFileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="选择本地切片文件模拟载入"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            本地模拟载入
          </button>
          <button
            onClick={handleResetFit}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="适应视窗"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            适应
          </button>
          <button
            onClick={handleZoom100}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="100% 点对点原画"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            100% 原画
          </button>
          <button
            onClick={handleExportView100}
            className="px-2.5 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            📸 截取特写
          </button>
        </div>
      </div>

      {/* Main Interactive Pan/Zoom Canvas Viewport */}
      <div
        ref={viewportRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 relative overflow-hidden bg-slate-950 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          backgroundImage: `
            radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            radial-gradient(rgba(255, 255, 255, 0.05) 1px, #030712 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      >
        <div
          className="absolute origin-top-left grid grid-cols-2 grid-rows-2 select-none shadow-2xl border border-slate-700/50"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            width: `${totalWidth}px`,
            height: `${totalHeight}px`,
          }}
        >
          {activeTiles.map((t) => (
            <div key={t.id} className="relative w-full h-full overflow-hidden">
              <img
                src={t.blob ? URL.createObjectURL(t.blob) : t.canvas.toDataURL('image/png')}
                alt={t.name}
                className="w-full h-full object-cover block pointer-events-none"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-slate-300 font-mono border border-white/10 pointer-events-none">
                {t.name.split('_')[1] || t.name} ({t.width}×{t.height})
              </div>
            </div>
          ))}
        </div>

        {/* HUD Info Floating Badge */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-3 text-xs text-slate-300 z-10 shadow-lg">
          <div>
            缩放: <span className="font-bold text-indigo-400">{Math.round(scale * 100)}%</span>
          </div>
          <div className="text-slate-600">|</div>
          <div>滚轮放大 · 拖拽平移</div>
          <div className="text-slate-600">|</div>
          <div className="text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            4分块无缝实时贴合
          </div>
        </div>

        {/* Hardware Status Tag */}
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 text-[11px] text-slate-400 z-10 shadow-lg">
          <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
          <span>本地架构：512M 核显防崩溃 + 24G 物理大内存时间换空间模式</span>
        </div>
      </div>

      {/* Bottom Action Drawer with Local Time-Extended Stitching Engine */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-3 z-20">
        {/* Progress Bar & Status */}
        {isStitching && (
          <div className="p-3 rounded-xl bg-purple-950/70 border border-purple-500/40 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-purple-200">
              <div className="flex items-center gap-2 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>{stitchStatusText}</span>
              </div>
              <span className="font-mono font-bold text-purple-300">{stitchProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${stitchProgress}%` }}
              />
            </div>
          </div>
        )}

        {stitchSuccess && !isStitching && (
          <div className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{stitchStatusText}</span>
          </div>
        )}

        {stitchError && (
          <div className="px-4 py-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{stitchError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Action 1: Standard Offline ZIP Package */}
          <button
            onClick={onDownloadZip}
            disabled={isDownloadingZip || isStitching}
            className="flex-1 min-w-[220px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition-all border border-slate-700 shadow-sm"
          >
            {isDownloadingZip ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                正在打包 ZIP...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-indigo-400" />
                📦 下载 4 分块 + 离线缝合查看器 (ZIP 打包)
              </>
            )}
          </button>

          {/* Action 2: Breakthrough Local Time-Extended Stitcher (No Cloud, 24G RAM Direct Assembly!) */}
          <div className="flex-1 min-w-[380px] flex items-center gap-2">
            <select
              value={stitchPlan}
              onChange={(e) => setStitchPlan(e.target.value as any)}
              disabled={isStitching}
              className="bg-purple-950/70 border border-purple-700 text-purple-200 text-xs rounded-xl px-2.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-400 font-medium"
            >
              <option value="full_8x_png">全量 8X 巨图 (23808×31744 · 延时40秒 · 7.55亿像素无损PNG)</option>
              <option value="safe_16k_jpg">16K 旗舰单图 (16384px · 延时5秒 · 推荐兼容JPG)</option>
              <option value="safe_12k_png">12K 无损单图 (12288px · 延时10秒 · PNG)</option>
              <option value="full_8x_bmp">全量 8X 巨图 (23808×31744 · 2.11GB 原始BMP备选)</option>
            </select>

            <button
              onClick={handleTriggerLocalStitch}
              disabled={isStitching}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 disabled:opacity-60 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all border border-purple-400/30 cursor-pointer"
            >
              {isStitching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  本地时间换空间拼合中...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4 text-purple-200" />
                  ⚡ 纯本地延时分块缝合：直接导出单张巨图
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
