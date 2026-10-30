export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    // Header
    appTitle: 'AI 图像无损放大 Pro',
    subtitle: '切片 Canvas 引擎',
    navSpecs: '架构原理与极限',
    navDiagnosis: 'Gemini 视觉诊断',
    navCompare: '4K/8K 像素比对',
    btnLogs: '全量过程日志',
    btnChangeImage: '更换图片',
    btnDemoPhoto: '加载示例图片',
    btnTechSpecs: '技术规范说明',

    // Banner & Download Callout
    bannerTitle: 'AI 图像超分辨率无损放大与质量增强器',
    bannerSubtitle: '具备 Gemini 视觉质量智能诊断的切片 Canvas 高清放大引擎，最高支持 8K 无损导出。',
    btnReadQA: '查看架构问答与分析',
    completedBannerTitle: '🎉 切片放大已成功完成！',
    completedBannerSubtitle: '图像已无损扩展至',
    btnDownloadNow: '下载超高清无损大图',

    // File Upload
    dropTitle: '点击上传或将图片拖拽至此处',
    dropSubtitle: '支持 PNG、JPG、WebP（推荐输入 ≤ 4K、20MB 以内）',

    // Metadata Bar
    aspectRatio: '宽高比',
    fileSize: '文件大小',
    estRam: '估算显存',

    // Comparison Viewport
    viewportTitle: '像素比对视窗',
    original: '原图',
    upscaled: '放大图',
    splitSlider: '滑动分割',
    sideBySide: '双屏并排',
    zoomIn: '放大',
    zoomOut: '缩小',
    resetZoom: '重置缩放',
    upscaledTag: '放大后',
    originalTag: '原始输入',

    // AI Diagnosis Panel
    diagnosisTitle: 'Gemini 视觉 AI 质量诊断',
    diagnosisSubtitle: '多模态超分前噪点与压缩伪影预评估',
    btnRunDiagnosis: '运行 AI 质量诊断',
    btnReAnalyze: '重新诊断图片',
    btnAnalyzing: '诊断分析中...',
    diagnosisPromptMsg: '运行 Gemini 视觉诊断可精准分析图像压缩伪影、噪点，并自动推荐最佳放大参数。',
    qualityScore: '质量指数',
    noiseLevel: '噪点级别',
    blurriness: '模糊度',
    jpegArtifacts: 'JPEG 压痕伪影',
    aiRecParams: 'AI 推荐增强参数',
    btnApplyRec: '一键应用推荐参数',
    scale: '缩放倍数',
    denoise: '降噪度',
    sharpness: '锐化度',

    // Super-Resolution Controls
    controlsTitle: '超分辨率参数控制',
    controlsSubtitle: '切片 Canvas 与空间滤波引擎',
    scaleFactorLabel: '放大倍率选择',
    targetSize: '目标尺寸',
    denoiseLabel: '高斯降噪强度',
    sharpnessLabel: '边缘锐化强度',
    contrastBoost: '自适应对比度与边缘增强',
    tileSizeLabel: '切片分块大小',
    exportFormatLabel: '无损导出格式',
    tileLowVram: '256 px (低显存)',
    tileBalanced: '512 px (推荐平衡)',
    tileFast: '1024 px (快速计算)',
    fmtPng: 'PNG (无损原画)',
    fmtWebp: 'WebP (现代高效)',
    fmtJpeg: 'JPEG (高品质压缩)',
    btnStartUpscale: '开始切片无损放大',
    btnReRunUpscale: '重新运行切片放大',
    btnProcessing: '切片计算放大中...',
    btnDownload: '下载超高清无损大图',

    // Histogram
    histogramTitle: 'RGB 颜色通道直方图',
    red: '红通道',
    green: '绿通道',
    blue: '蓝通道',

    // Demo Samples Box
    demoTitle: '加载预设测试样图',

    // Technical Specs Modal
    modalTitle: '超分辨率技术规范与架构解析',
    modalSubtitle: '深度学习图像超分辨率 vs 文生图（Text-to-Image）扩散模型',
    tab1: '1. 模型选择与 Nano Banana',
    tab2: '2. 核心原理与算法',
    tab3: '3. 容量与分辨率极限',
    tab4: '4. AI Studio 最优技术栈',
    btnClose: '理解并关闭',

    // Modal Tab 1 Content
    m1NoticeTitle: '是否需要调用 Text-to-Image 或 Nano Banana 模型？',
    m1NoticeBody: '结论：不需要（且不建议）用纯文生图或 Nano Banana 扩散模型进行核心无损放大。',
    m1DiffusionTitle: '文生图/扩散模型（Text-to-Image / Nano Banana）',
    m1Diffusion1: '本质是“生成式隐空间采样重构（Generative Sampling）”。',
    m1Diffusion2: '放大时会“幻想（Hallucinate）”添加原图不存在的细节。',
    m1Diffusion3: '极易破坏原图中的文字、人物五官特征与精准线条，并非无损放大。',
    m1SRTitle: '超分辨率算法 + Gemini 视觉诊断（本项目方案）',
    m1SR1: '保留原图 100% 像素特征与结构真实性（Pixel Fidelity）。',
    m1SR2: 'Gemini Vision 仅作为“AI 质量诊断顾问”，提供降噪/锐化参数指导。',
    m1SR3: '客户端切块 Canvas 算法高效完成无失真 2x/4x/8x 扩展。',

    // Modal Tab 2 Content
    m2Title: '超分辨率无损放大的实现技术与数学原理',
    m2Intro: '超分辨率（Super-Resolution, SR）是通过数学插值与空间滤波，从低分辨率图像重建高分辨率图像的过程。本项目采用以下 3 层联合架构：',
    m2Step1Title: '1. 双三次/Lanczos-3 空间重采样 (Bicubic / Lanczos Resampling)',
    m2Step1Body: '在 4x4 或 6x6 邻域像素内通过三次多项式核函数或 Sinc 窗加权求和，计算新增像素点的颜色值，防止传统邻近插值的锯齿感。',
    m2Step2Title: '2. 分块切片处理算法 (Tile-based Canvas Processing)',
    m2Step2Body: '将大图切分为 512x512px 独立 Tile，在离屏 Canvas（OffscreenCanvas）中并行计算，避免单次大图重采样导致浏览器显存溢出（Out of Memory）。',
    m2Step3Title: '3. 自适应拉普拉斯锐化与高斯降噪 (Adaptive Unsharp Masking & Denoise)',
    m2Step3Body: '通过 3x3 卷积核提取图像边缘高频信号，结合 Gemini 建议的 Denoise 强度平滑 JPEG 压痕伪影，显著提升线条清晰度。',

    // Modal Tab 3 Content
    m3Title: 'AI Studio / Web 环境下的最大容量与分辨率极限',
    m3InputTitle: '输入支持上限（Input Limits）',
    m3In1: '文件体积：推荐 10MB ~ 20MB 以内（支持 PNG/JPG/WebP）。',
    m3In2: '最大像素：推荐 4K (3840x2160，约 830 万像素)。',
    m3In3: 'HTTP 传输：Express 后端配置了 50MB Payload Limit。',
    m3OutputTitle: '输出支持上限（Output Limits）',
    m3Out1: '最大输出：最高支持 16,384 x 16,384 px (约 1.34 亿像素超高清原画)。',
    m3Out2: '硬件与内存限制：超大原图 8x 理论值 (如 95,232 x 126,976px 需 48GB 内存) 会超越浏览器单页 VRAM 极限，引擎会自动启动 134 MP 峰值保护，确保不崩盘死机。',
    m3Out3: '推荐输入：为达到最佳 8 倍放大效果，建议输入 1K~4K 图像 (如 2000x3000px 入参可稳妥输出 16,000x24,000px 巨幅)。',
    m3Tip: '💡 为什么切片算法能破除内存限制？ 切片算法（Tile Engine）每次仅将小块像素加载至显存，完成后交还内存，因此即便在轻量级 AI Studio 开发环境下也能稳定输出 8K 无损大图！',

    // Modal Tab 4 Content
    m4Title: '最优技术栈方案（AI Studio 部署）',
    m4Frontend: '前端核心 (UI & 比对视窗)',
    m4FrontendSub: 'React 19 + Tailwind CSS + Split-Screen Comparison Slider',
    m4Engine: '超分计算引擎 (Upscale Engine)',
    m4EngineSub: 'HTML5 OffscreenCanvas + Tile Processing + Spatial Filters',
    m4Vision: 'AI 视觉智能诊断 (Vision AI Diagnosis)',
    m4VisionSub: 'Express Node.js + @google/genai (Gemini 3.8 Flash)',
    m4Env: '部署运行环境 (Deployment Environment)',
    m4EnvSub: 'Google AI Studio Container / Cloud Run (Port 3000 Express)',
  },
  en: {
    // Header
    appTitle: 'AI Image Upscaler Pro',
    subtitle: 'Tile Canvas Engine',
    navSpecs: 'Architecture & Limits',
    navDiagnosis: 'Gemini Vision Diagnosis',
    navCompare: '4K/8K Pixel Compare',
    btnLogs: 'System Logs',
    btnChangeImage: 'Change Image',
    btnDemoPhoto: 'Load Demo Photo',
    btnTechSpecs: 'Tech Specs',

    // Banner & Download Callout
    bannerTitle: 'AI Image Super-Resolution & Quality Enhancer',
    bannerSubtitle: 'High-precision Tile Canvas Engine with Gemini Vision Quality Diagnosis. Up to 8K Lossless Export.',
    btnReadQA: 'Read Architecture Q&A',
    completedBannerTitle: '🎉 Tile Upscale Completed Successfully!',
    completedBannerSubtitle: 'Image losslessly scaled to',
    btnDownloadNow: 'Download High-Res Image',

    // File Upload
    dropTitle: 'Click to upload or drag & drop image',
    dropSubtitle: 'Supports PNG, JPG, WebP (Max recommended input ≤ 4K, 20MB)',

    // Metadata Bar
    aspectRatio: 'Aspect Ratio',
    fileSize: 'File Size',
    estRam: 'Est RAM',

    // Comparison Viewport
    viewportTitle: 'Comparison Viewport',
    original: 'Original',
    upscaled: 'Upscaled',
    splitSlider: 'Split Slider',
    sideBySide: 'Side-by-Side',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset Zoom',
    upscaledTag: 'Upscaled',
    originalTag: 'Original Input',

    // AI Diagnosis Panel
    diagnosisTitle: 'Gemini Vision AI Quality Diagnosis',
    diagnosisSubtitle: 'Multi-modal pre-upscaling artifact & noise assessment',
    btnRunDiagnosis: 'Run AI Quality Diagnosis',
    btnReAnalyze: 'Re-Analyze Image',
    btnAnalyzing: 'Analyzing...',
    diagnosisPromptMsg: 'Run Gemini Vision Diagnosis to analyze image compression artifacts, noise, and auto-recommend upscaling parameters.',
    qualityScore: 'Quality Index',
    noiseLevel: 'Noise Level',
    blurriness: 'Blurriness',
    jpegArtifacts: 'JPEG Artifacts',
    aiRecParams: 'AI Recommended Parameters',
    btnApplyRec: 'Apply Recommended Settings',
    scale: 'Scale',
    denoise: 'Denoise',
    sharpness: 'Sharpness',

    // Super-Resolution Controls
    controlsTitle: 'Super-Resolution Controls',
    controlsSubtitle: 'Tile Canvas & Spatial Filtering Engine',
    scaleFactorLabel: 'Upscale Scale Factor',
    targetSize: 'Target Size',
    denoiseLabel: 'Denoise Level',
    sharpnessLabel: 'Edge Sharpness',
    contrastBoost: 'Adaptive Contrast & Edge Boost',
    tileSizeLabel: 'Tile Block Size',
    exportFormatLabel: 'Export Format',
    tileLowVram: '256 px (Low VRAM)',
    tileBalanced: '512 px (Balanced)',
    tileFast: '1024 px (Fast)',
    fmtPng: 'PNG (Lossless)',
    fmtWebp: 'WebP (Modern)',
    fmtJpeg: 'JPEG (Compressed)',
    btnStartUpscale: 'Start Tile Upscale',
    btnReRunUpscale: 'Re-Run Tile Upscale',
    btnProcessing: 'Upscaling Tiles...',
    btnDownload: 'Download High-Res Image',

    // Histogram
    histogramTitle: 'Color Channel Histogram',
    red: 'Red',
    green: 'Green',
    blue: 'Blue',

    // Demo Samples Box
    demoTitle: 'Try Pre-Loaded Demo Photos',

    // Technical Specs Modal
    modalTitle: 'Super-Resolution Technical Specs & Architecture',
    modalSubtitle: 'Deep Learning Image Upscaling vs Text-to-Image Diffusion Models',
    tab1: '1. Model Choice & Nano Banana',
    tab2: '2. Core Principles & Algorithms',
    tab3: '3. File Size & Pixel Limits',
    tab4: '4. Optimal AI Studio Stack',
    btnClose: 'Understood & Close',

    // Modal Tab 1 Content
    m1NoticeTitle: 'Do you need Text-to-Image or Nano Banana models?',
    m1NoticeBody: 'Conclusion: No (and not recommended) to use pure Text-to-Image or Nano Banana diffusion models for core lossless upscaling.',
    m1DiffusionTitle: 'Text-to-Image / Diffusion Models (Text-to-Image / Nano Banana)',
    m1Diffusion1: 'Essentially "Generative Latent Sampling".',
    m1Diffusion2: 'Hallucinates non-existent details during upscaling.',
    m1Diffusion3: 'Easily distorts text, facial features, and precise lines in the original photo.',
    m1SRTitle: 'Super-Resolution Algorithm + Gemini Vision Diagnosis (Our Solution)',
    m1SR1: 'Preserves 100% pixel fidelity and structure of the original image.',
    m1SR2: 'Gemini Vision acts purely as an AI quality advisor providing parameter guidance.',
    m1SR3: 'Client-side Tile Canvas engine efficiently performs distortion-free 2x/4x/8x upscale.',

    // Modal Tab 2 Content
    m2Title: 'Technical & Mathematical Principles of Lossless Upscaling',
    m2Intro: 'Super-Resolution (SR) reconstructs high-resolution images from low-resolution source files using spatial interpolation and filtering. This app uses a 3-tier combined architecture:',
    m2Step1Title: '1. Bicubic / Lanczos-3 Spatial Resampling',
    m2Step1Body: 'Uses cubic polynomial kernel or Sinc window weighted summation over 4x4 or 6x6 pixel neighborhoods to prevent staircasing artifacts.',
    m2Step2Title: '2. Tile-based Canvas Processing Engine',
    m2Step2Body: 'Splits huge images into 512x512px independent tiles, calculating in OffscreenCanvas to prevent Out of Memory crashes.',
    m2Step3Title: '3. Adaptive Unsharp Masking & Denoise Filter',
    m2Step3Body: 'Extracts high-frequency edge signals using 3x3 Laplacian convolution, paired with Gemini-guided Denoise to smooth JPEG artifacts.',

    // Modal Tab 3 Content
    m3Title: 'Maximum File & Resolution Limits in AI Studio / Web Environment',
    m3InputTitle: 'Input Limits',
    m3In1: 'File Size: Recommended 10MB ~ 20MB (PNG/JPG/WebP).',
    m3In2: 'Max Resolution: Recommended 4K (3840x2160, ~8.3 MP).',
    m3In3: 'HTTP Transfer: Express backend payload limit set to 50MB.',
    m3OutputTitle: 'Output Limits',
    m3Out1: 'Max Output: Supports up to 16,384 x 16,384 px (~134 Megapixels).',
    m3Out2: 'Hardware & RAM Limit: Extreme 8x values (e.g., 95,232 x 126,976px requiring 48GB VRAM) exceed browser memory limits. Automatically capped at 134 MP safety peak to prevent tab crashes.',
    m3Out3: 'Recommended Input: For best 8x upscale, use 1K~4K input images (e.g., 2000x3000px input outputs ~16,000x24,000px).',
    m3Tip: '💡 Why does Tile processing overcome memory limits? The Tile Engine loads small pixel blocks into GPU memory sequentially and releases memory upon completion, allowing 8K lossless export even in lightweight sandbox environments!',

    // Modal Tab 4 Content
    m4Title: 'Optimal Technology Stack (AI Studio Deployment)',
    m4Frontend: 'Frontend UI & Viewport',
    m4FrontendSub: 'React 19 + Tailwind CSS + Split-Screen Comparison Slider',
    m4Engine: 'Upscale Computation Engine',
    m4EngineSub: 'HTML5 OffscreenCanvas + Tile Processing + Spatial Filters',
    m4Vision: 'Vision AI Diagnosis',
    m4VisionSub: 'Express Node.js + @google/genai (Gemini 3.8 Flash)',
    m4Env: 'Deployment Environment',
    m4EnvSub: 'Google AI Studio Container / Cloud Run (Port 3000 Express)',
  },
};
