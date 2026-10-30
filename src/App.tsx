import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Download,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Layers,
  Zap,
  ShieldCheck,
  ChevronRight,
  Eye,
  Info,
} from 'lucide-react';
import { executeUpscale, UpscaleResult } from './utils/upscalerEngine';
import { buildTiledZipPackage } from './utils/packageZipBuilder';
import { AutomatedMosaicViewer } from './components/AutomatedMosaicViewer';

interface QualityAnalysis {
  noiseLevel: string;
  compressionArtifacts: string;
  blurriness: string;
  qualityScore: number;
  recommendedScale: string;
  recommendedDenoise: number;
  recommendedSharpness: number;
  assessmentSummary: string;
  imageCategory: string;
}

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalMeta, setOriginalMeta] = useState<{ width: number; height: number; name: string } | null>(null);

  // Configuration
  const [scale, setScale] = useState<2 | 4 | 8>(8);
  const [mode, setMode] = useState<'fidelity' | 'ai_sr' | 'smart_ai'>('fidelity');
  const [denoiseStrength, setDenoiseStrength] = useState<number>(20);
  const [sharpnessStrength, setSharpnessStrength] = useState<number>(35);

  // AI Diagnostic State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<QualityAnalysis | null>(null);

  // Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [stageText, setStageText] = useState<string>('');
  const [result, setResult] = useState<UpscaleResult | null>(null);

  // ZIP packaging state
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [zipProgressText, setZipProgressText] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Default sample image loader
  const handleLoadSample = () => {
    // 2976 x 3968 photo proportion sample canvas
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 2976;
    sampleCanvas.height = 3968;
    const ctx = sampleCanvas.getContext('2d')!;

    // Create rich pattern with high frequency details (fur, hair, grass)
    const grad = ctx.createLinearGradient(0, 0, 2976, 3968);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#064e3b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2976, 3968);

    // Fine lines mimicking pet fur and hair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 800; i++) {
      ctx.beginPath();
      const x = 500 + Math.random() * 1900;
      const y = 800 + Math.random() * 2300;
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 100, y + 100, x + (Math.random() - 0.5) * 50, y + 200);
      ctx.stroke();
    }

    // High frequency center target
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('8X 超高清细节测试源 (2976 × 3968)', 1488, 1984);
    ctx.font = '48px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('放大 8X 目标规格: 23808 × 31744 px (7.55 亿像素)', 1488, 2080);

    const dataUrl = sampleCanvas.toDataURL('image/jpeg', 0.92);
    setImageSrc(dataUrl);
    setOriginalMeta({
      width: 2976,
      height: 3968,
      name: 'IMG_20210327_135613_Sample.jpg',
    });
    setResult(null);
    setAnalysisResult(null);

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      imageElementRef.current = img;
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageSrc(dataUrl);
      setResult(null);
      setAnalysisResult(null);

      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        imageElementRef.current = img;
        setOriginalMeta({
          width: img.naturalWidth,
          height: img.naturalHeight,
          name: file.name,
        });
      };
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini AI Image Quality Assessment
  const analyzeImageWithGemini = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          lang: 'zh',
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysisResult({
          ...data.analysis,
          source: data.source || 'algorithmic',
        });
        if (mode === 'smart_ai') {
          if (data.analysis.recommendedDenoise) setDenoiseStrength(data.analysis.recommendedDenoise);
          if (data.analysis.recommendedSharpness) setSharpnessStrength(data.analysis.recommendedSharpness);
        }
      }
    } catch {
      // Graceful fallback without alarming warnings
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Execute Upscale
  const handleStartUpscale = async () => {
    if (!imageElementRef.current || !originalMeta) return;

    setIsProcessing(true);
    setProgress(0);
    setStageText('准备启动超分辨率引擎...');

    try {
      const res = await executeUpscale(imageElementRef.current, {
        scale,
        mode,
        denoiseStrength,
        sharpnessStrength,
        onProgress: (p, text) => {
          setProgress(p);
          setStageText(text);
        },
      });
      setResult(res);
    } catch (err: any) {
      console.error('Upscale failed:', err);
      alert('处理失败: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download ZIP package (4 tiles + offline viewer)
  const handleDownloadZip = async () => {
    if (!result || !result.isTiledPackage || !originalMeta) return;
    setIsDownloadingZip(true);
    setZipProgressText('正在打包 4 张超清切片与离线缝合查看器...');

    try {
      const zipBlob = await buildTiledZipPackage(
        result.tiles,
        originalMeta.name,
        result.width,
        result.height,
        result.scale,
        (p, msg) => {
          setZipProgressText(msg);
        }
      );

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `8X超清分块缝合包_${result.width}x${result.height}_${originalMeta.name}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Failed to create zip package:', err);
      alert('打包下载失败: ' + err.message);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const calcTargetWidth = originalMeta ? originalMeta.width * scale : 0;
  const calcTargetHeight = originalMeta ? originalMeta.height * scale : 0;
  const calcTotalPixels = calcTargetWidth * calcTargetHeight;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">AI Image Upscaler Pro</h1>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-semibold">
                  全量 8X 本地流式无损版
                </span>
              </div>
              <p className="text-xs text-slate-400">图片无损放大器 · 高保真算法 · 2x2分块切片 · 本地 CPU 流式合成</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {imageSrc && (
              <button
                onClick={() => {
                  setImageFile(null);
                  setImageSrc(null);
                  setOriginalMeta(null);
                  setResult(null);
                  setAnalysisResult(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/30 flex items-center gap-1.5 transition-colors"
                title="清空当前图片与结果，重新开始"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                清空重置
              </button>
            )}
            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              载入默认测试照片
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
            >
              <Upload className="w-3.5 h-3.5" />
              选择本地图片
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {!imageSrc ? (
          /* Empty / Upload Hero State */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 min-h-[460px] rounded-3xl border-2 border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/60 flex flex-col items-center justify-center p-8 cursor-pointer transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 group-hover:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4 transition-all">
              <Upload className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-lg font-bold text-slate-100 mb-1">点击或拖拽上传任意高分辨率图片</h2>
            <p className="text-sm text-slate-400 mb-6 max-w-md text-center">
              支持 JPG、PNG、WebP 等任意常见图片格式。系统将自动自适应识别您上传图片的原始尺寸，并智能计算各倍率下的像素、预估体积与印刷尺寸。
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadSample();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              一键快速载入默认测试照片
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Top Workspace Grid: Preview / Source on Left, Configurations on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Image Source & Diagnostics (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-indigo-400" />
                      原始图像源
                    </span>
                    {originalMeta && (
                      <span className="text-slate-400 font-mono">
                        {originalMeta.width} × {originalMeta.height} px ·{' '}
                        {((originalMeta.width * originalMeta.height) / 1e6).toFixed(1)} MP
                      </span>
                    )}
                  </div>

                  <div className="relative w-full h-[320px] rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800/80">
                    <img
                      src={imageSrc}
                      alt="Source"
                      className="max-w-full max-h-full object-contain"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center gap-2 text-indigo-300 text-xs font-medium">
                        <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
                        Gemini 3.8 Flash 正在诊断画质与纹理...
                      </div>
                    )}
                  </div>

                  {/* Gemini Quality Diagnostics Banner or Manual Trigger */}
                  {analysisResult ? (
                    <div className="rounded-xl bg-slate-950/80 border border-indigo-500/20 p-3.5 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold text-indigo-200">
                            Gemini 3.8 智能画质诊断报告
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                          画质评分: {analysisResult.qualityScore} / 100
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {analysisResult.assessmentSummary}
                      </p>

                      <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">噪点水平</span>
                          <span className="text-slate-200 font-medium">{analysisResult.noiseLevel}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">压缩失真</span>
                          <span className="text-slate-200 font-medium">{analysisResult.compressionArtifacts}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">清晰度</span>
                          <span className="text-slate-200 font-medium">{analysisResult.blurriness}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">类别属性</span>
                          <span className="text-indigo-300 font-medium">{analysisResult.imageCategory}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>如需 AI 智能诊断噪点与纹理，可手动触发：</span>
                      </div>
                      <button
                        onClick={() => {
                          if (imageSrc) analyzeImageWithGemini(imageSrc);
                        }}
                        disabled={isAnalyzing}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        {isAnalyzing ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                            诊断中...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            启动 AI 智能诊断
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Processing Controls (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-400" />
                      超分辨率放大参数配置
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImageSrc(null);
                          setOriginalMeta(null);
                          setResult(null);
                          setAnalysisResult(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/30 flex items-center gap-1 transition-colors"
                        title="清空当前图片与结果"
                      >
                        <RotateCcw className="w-3 h-3 text-red-400" />
                        清空重置
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        更换图片
                      </button>
                    </div>
                  </div>

                  {/* Scale Selector with Adaptive Estimates (Pixels, File Size, Print Dimensions) */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>放大倍率与规格预估</span>
                      <span className="text-purple-400 font-mono text-[11px]">
                        原图: {originalMeta?.width} × {originalMeta?.height} px
                      </span>
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { factor: 2 as const, label: '2X 标准放大', desc: '轻量快速' },
                        { factor: 4 as const, label: '4X 超清放大', desc: '4K/8K 巨幕级' },
                        { factor: 8 as const, label: '8X 亿级像素超清巨图', desc: '分块切片 + 流式无损合成' },
                      ].map((item) => {
                        const targetW = (originalMeta?.width || 0) * item.factor;
                        const targetH = (originalMeta?.height || 0) * item.factor;
                        const megapixels = ((targetW * targetH) / 1e6).toFixed(1);
                        // Estimated uncompressed RGB vs PNG size (assuming ~4:1 lossless compression)
                        const estBytes = targetW * targetH * 3 / 4;
                        const estSizeStr = estBytes > 1024 * 1024 * 1024 
                          ? `${(estBytes / (1024 * 1024 * 1024)).toFixed(2)} GB` 
                          : `${(estBytes / (1024 * 1024)).toFixed(1)} MB`;
                        
                        // Print size at 300 DPI (standard photo print resolution: 1 inch = 2.54 cm = 300 pixels)
                        const printWidthCm = ((targetW / 300) * 2.54).toFixed(1);
                        const printHeightCm = ((targetH / 300) * 2.54).toFixed(1);

                        return (
                          <button
                            key={item.factor}
                            onClick={() => setScale(item.factor)}
                            className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                              scale === item.factor
                                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                                : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{item.label}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-indigo-300 border border-white/10">
                                {targetW} × {targetH} px ({megapixels} MP)
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                              <div>📦 预估体积: <span className="text-slate-200">{estSizeStr}</span></div>
                              <div>📏 300DPI 印刷尺寸: <span className="text-emerald-400">{printWidthCm} × {printHeightCm} cm</span></div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {scale === 8 && (
                      <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-1.5 font-semibold text-purple-300">
                          <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                          已自动激活 2x2 田字格分块 + 流式流式引擎
                        </div>
                        <p className="text-[11px] text-purple-300/80 leading-relaxed">
                          目标输出达 <b>{calcTargetWidth} × {calcTargetHeight} px (~{((calcTargetWidth * calcTargetHeight) / 1e6).toFixed(1)}亿像素)</b>
                          ，已突破浏览器 16384px 硬件上限！前端将生成 4 块超清切片，支持无损流式 PNG 巨图单张导出。
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Route Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-300">处理算法路线</label>
                    <div className="flex flex-col gap-2">
                      <div
                        onClick={() => setMode('fidelity')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          mode === 'fidelity'
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-800/30 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold flex items-center gap-2">
                            路线 A：高保真算法放大 (默认推荐)
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
                              忠实原画
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            阶梯双三次/Lanczos 重采样 + 保守拉普拉斯滤波，绝对不无中生有破坏发丝与宠物毛发真实结构。
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setMode('ai_sr');
                          setSharpnessStrength(65);
                          setDenoiseStrength(10);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          mode === 'ai_sr'
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-800/30 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold flex items-center gap-2">
                            路线 B：毛细细节保持与增强 (专用于发丝/宠物毛发/皮肤皱纹)
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded">
                              强力微距
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            采用微距定向锐化与自适应高频纹理增强，专为人物发丝、宠物毛发、衣物织物纤维及老年人面部微细皱纹设计，防止放大模糊。
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => setMode('smart_ai')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          mode === 'smart_ai'
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-800/30 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold flex items-center gap-2">
                            路线 C：AI 动态分析 + 算法执行 (智能模式)
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            由 Gemini 3.8 动态诊断画质噪点，自动校准滤波与锐化阈值，由确定性算法精准执行。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">保真边缘锐化强度</span>
                        <span className="font-mono text-indigo-400">{sharpnessStrength}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sharpnessStrength}
                        onChange={(e) => setSharpnessStrength(Number(e.target.value))}
                        className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">双边智能降噪阈值</span>
                        <span className="font-mono text-indigo-400">{denoiseStrength}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={denoiseStrength}
                        onChange={(e) => setDenoiseStrength(Number(e.target.value))}
                        className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Execution Action */}
                  <div className="pt-2">
                    <button
                      onClick={handleStartUpscale}
                      disabled={isProcessing}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin text-white" />
                          <span>正在执行超分辨率处理 ({progress}%)...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>⚡ 开始超分辨率放大 ({scale}X · {calcTargetWidth}×{calcTargetHeight})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Processing Progress Bar */}
            {isProcessing && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/30 flex flex-col gap-2 shadow-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-300 font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
                    {stageText}
                  </span>
                  <span className="font-mono font-bold text-indigo-400">{progress}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Results Area */}
            {result && (
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-base font-bold text-slate-100">超分辨率放大成果展示</h2>
                    <span className="text-xs text-slate-400 font-mono">
                      耗时: {(result.durationMs / 1000).toFixed(1)}s · 画幅: {result.width} × {result.height} px
                    </span>
                  </div>
                </div>

                {result.isTiledPackage ? (
                  /* 8X Interactive Mosaic Viewer & Stream Synthesizer */
                  <AutomatedMosaicViewer
                    tiles={result.tiles}
                    totalWidth={result.width}
                    totalHeight={result.height}
                    originalFileName={originalMeta?.name || 'upscaled'}
                    onDownloadZip={handleDownloadZip}
                    isDownloadingZip={isDownloadingZip}
                  />
                ) : (
                  /* 2X / 4X Single Image Result */
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
                    <div className="max-h-[500px] overflow-auto flex items-center justify-center bg-slate-950 rounded-xl p-4 border border-slate-800">
                      <img
                        src={result.previewCanvas.toDataURL('image/png')}
                        alt="Upscaled result"
                        className="max-w-full max-h-[460px] object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex justify-end">
                      <a
                        href={result.previewCanvas.toDataURL('image/png')}
                        download={`超高清_${result.width}x${result.height}_${originalMeta?.name || 'result'}.png`}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all"
                      >
                        <Download className="w-4 h-4" />
                        下载单张超高清图片 ({result.width} × {result.height} px)
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
