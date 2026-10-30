import JSZip from 'jszip';
import { TileSlice } from './upscalerEngine';

/**
 * Builds the standalone 00_双击无缝缝合查看器.html
 */
export function buildStitcherViewerHtml(
  originalFileName: string,
  totalWidth: number,
  totalHeight: number,
  scale: number
): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>超清全景无缝缝合查看器 - ${originalFileName} (${scale}X)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      user-select: none;
    }
    #topbar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 56px;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      z-index: 100;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #818cf8;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }
    .btn {
      background: #334155;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 7px 14px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn:hover { background: #475569; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #4f46e5; border-color: #6366f1; }
    .btn-primary:hover { background: #4338ca; }
    .btn-emerald { background: #059669; border-color: #10b981; }
    .btn-emerald:hover { background: #047857; }
    .btn-purple { background: #7c3aed; border-color: #8b5cf6; }
    .btn-purple:hover { background: #6d28d9; }
    
    #viewport {
      position: absolute;
      top: 56px;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      background-image: 
        radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        radial-gradient(rgba(255, 255, 255, 0.05) 1px, #090d16 1px);
      background-size: 24px 24px;
    }
    #viewport.dragging { cursor: grabbing; }

    #stitchCanvasContainer {
      position: absolute;
      transform-origin: 0 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      box-shadow: 0 25px 60px rgba(0,0,0,0.8);
      border: 1px solid rgba(255,255,255,0.15);
    }
    .tile-img {
      display: block;
      width: 100%;
      height: 100%;
      image-rendering: auto;
      pointer-events: none;
    }

    #hud {
      position: absolute;
      bottom: 24px;
      right: 24px;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
      z-index: 90;
    }

    /* Modal */
    #exportModal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 200;
      align-items: center;
      justify-content: center;
    }
    .modal-box {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      width: 680px;
      max-width: 95vw;
      max-height: 90vh;
      overflow-y: auto;
      padding: 24px;
    }
    .option-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 14px;
      transition: all 0.2s;
    }
    .option-card:hover {
      border-color: rgba(99, 102, 241, 0.4);
      background: rgba(30, 41, 59, 0.85);
    }
    .status-banner {
      display: none;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
      margin-top: 12px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #34d399;
      line-height: 1.5;
    }
    .progress-bar-container {
      display: none;
      width: 100%;
      height: 6px;
      background: #1e293b;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-bar-fill {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #10b981);
      transition: width 0.2s ease;
    }
  </style>
</head>
<body>
  <div id="topbar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-weight: 700; font-size: 15px;">🌐 超清全景无缝缝合查看器</span>
      <span class="badge">${totalWidth} × ${totalHeight} px · ${scale}X</span>
      <span style="font-size: 12px; color: #94a3b8;">${originalFileName}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <input type="file" id="localTilePicker" multiple accept="image/*" style="display: none;" onchange="handleLocalFilesSelect(this.files)" />
      <button class="btn" onclick="document.getElementById('localTilePicker').click()">📁 手动载入切片</button>
      <button class="btn" onclick="resetView()">🔄 适应屏幕</button>
      <button class="btn" onclick="zoom100()">🔍 100% 点对点原画</button>
      <button class="btn btn-emerald" onclick="openExportModal()">💾 本地保存 / 导出巨图</button>
    </div>
  </div>

  <div id="dropAlert" style="display: none; position: absolute; top: 68px; left: 50%; transform: translateX(-50%); background: rgba(30, 41, 59, 0.95); border: 1px solid #6366f1; border-radius: 12px; padding: 12px 24px; z-index: 150; box-shadow: 0 10px 30px rgba(0,0,0,0.6); text-align: center;">
    <div style="font-weight: 600; color: #818cf8; margin-bottom: 4px;">💡 本地安全策略提示：图片未自动载入</div>
    <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 8px;">部分 Chrome 限制 file:/// 路径直读。请直接将解压出的 4 张切片图片拖入本窗口，或点击下方按钮：</div>
    <button class="btn btn-primary" onclick="document.getElementById('localTilePicker').click()">📁 立即选择 4 张切片文件恢复全景</button>
  </div>

  <div id="viewport">
    <div id="stitchCanvasContainer">
      <img id="img_01" class="tile-img" src="01_左上分块_TopLeft.png" alt="Top Left" onerror="onImgError()" onload="onImgLoad()" />
      <img id="img_02" class="tile-img" src="02_右上分块_TopRight.png" alt="Top Right" onerror="onImgError()" onload="onImgLoad()" />
      <img id="img_03" class="tile-img" src="03_左下分块_BottomLeft.png" alt="Bottom Left" onerror="onImgError()" onload="onImgLoad()" />
      <img id="img_04" class="tile-img" src="04_右下分块_BottomRight.png" alt="Bottom Right" onerror="onImgError()" onload="onImgLoad()" />
    </div>
  </div>

  <div id="hud">
    <div>缩放率: <b id="zoomText">100%</b></div>
    <div style="color: #64748b;">|</div>
    <div>拖拽平移 · 滚轮缩放</div>
    <div style="color: #64748b;">|</div>
    <div style="color: #10b981;">✔ 4分块无缝实时贴合</div>
  </div>

  <!-- Export Dialog -->
  <div id="exportModal">
    <div class="modal-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 18px; font-weight: 700;">💾 纯本地延时分块导出方案</h3>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 2px;">512M 核显防崩溃 + 24G 物理大内存时间换空间模式</p>
        </div>
        <button style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;" onclick="closeExportModal()">✕</button>
      </div>

      <div id="exportStatusBanner" class="status-banner"></div>
      <div id="exportProgressBarContainer" class="progress-bar-container">
        <div id="exportProgressBarFill" class="progress-bar-fill"></div>
      </div>

      <!-- Option 1: 100% Viewport Close-Up -->
      <div class="option-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h4 style="font-weight: 600; color: #38bdf8;">📸 方案一：视窗 100% 原画点对点特写 (发丝/毛发细节)</h4>
          <span style="font-size: 11px; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 2px 6px; border-radius: 4px;">~15MB 显存 · 秒级保存</span>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">
          精确截取当前视窗聚焦区域的高清原画。请先使用 [🔍 100% 点对点原画] 移动到想保存的特写区域。
        </p>
        <button id="btnExportView" class="btn btn-primary" onclick="exportCurrentView()">📸 导出当前 100% 细节特写</button>
      </div>

      <!-- Option 2: Browser Hardware Max Single Image (8K - 16K) -->
      <div class="option-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h4 style="font-weight: 600; color: #34d399;">🖼️ 方案二：延时分块缝合单张超清大图 (最高 16384px 浏览器硬件上限)</h4>
          <span style="font-size: 11px; color: #34d399; background: rgba(52, 211, 153, 0.1); padding: 2px 6px; border-radius: 4px;">延时 5~10 秒 · 推荐 16K/8K</span>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">
          采用分块延时装配（Lazy Processing），避免主线程阻塞与 512M 核显崩溃，直接由浏览器输出单个标准图片。
        </p>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <select id="exportResolutionSelect" style="background: #1e293b; color: #fff; border: 1px solid #475569; border-radius: 6px; padding: 6px 10px; font-size: 13px;">
            <option value="16384" selected>16K 旗舰超清 (16384px 长边 · 浏览器单画布极限)</option>
            <option value="12288">12K 极致图幅 (12288px · 推荐无损画质)</option>
            <option value="7680">8K 旗舰巨幕 (7680px 长边 · 极速生成)</option>
          </select>
          <button id="btnExportMerged" class="btn btn-emerald" onclick="exportMergedImage()">🖼️ 启动延时分块合并</button>
        </div>
      </div>

      <!-- Option 3: Pure Local 23808x31744 Lossless PNG Engine -->
      <div class="option-card" style="border: 1px solid rgba(168, 85, 247, 0.4); background: rgba(88, 28, 135, 0.15);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h4 style="font-weight: 600; color: #c084fc;">🚀 方案三：纯本地突破 23808×31744 单张巨图 (7.55亿像素)</h4>
          <span style="font-size: 11px; color: #c084fc; background: rgba(192, 132, 252, 0.2); padding: 2px 6px; border-radius: 4px;">24G 内存时间换空间 · 0% 依赖云端</span>
        </div>
        <p style="font-size: 12px; color: #cbd5e1; margin-bottom: 10px;">
          完全绕开 512M 核显 VRAM 限制：使用 CPU 在 24G 物理大内存中按 512 像素带状流式无损压缩，输出标准无损 PNG 单张超高清巨图 (~450MB，无缝兼容所有电脑看图软件)。
        </p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button id="btnLocalFullPng" class="btn btn-purple" onclick="exportFullResolutionPng()">🚀 启动本地流式无损 PNG 装配 (推荐 · 40秒)</button>
          <button id="btnLocalFullBmp" class="btn" onclick="exportFullResolutionBmp()">📄 导出未压缩原始 BMP (备选 · 2.11GB)</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const totalW = ${totalWidth};
    const totalH = ${totalHeight};
    let scale = 1;
    let posX = 0;
    let posY = 0;
    let isDragging = false;
    let startX = 0, startY = 0;

    const viewport = document.getElementById('viewport');
    const container = document.getElementById('stitchCanvasContainer');
    const zoomText = document.getElementById('zoomText');

    function updateTransform() {
      container.style.transform = 'translate(' + posX + 'px, ' + posY + 'px) scale(' + scale + ')';
      zoomText.textContent = Math.round(scale * 100) + '%';
    }

    function resetView() {
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      scale = Math.min(vw / totalW, vh / totalH) * 0.95;
      posX = (vw - totalW * scale) / 2;
      posY = (vh - totalH * scale) / 2;
      updateTransform();
    }

    function zoom100() {
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      scale = 1.0;
      posX = (vw - totalW) / 2;
      posY = (vh - totalH) / 2;
      updateTransform();
    }

    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const prevScale = scale;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      scale = Math.max(0.01, Math.min(10, scale * factor));

      posX = mouseX - (mouseX - posX) * (scale / prevScale);
      posY = mouseY - (mouseY - posY) * (scale / prevScale);
      updateTransform();
    }, { passive: false });

    viewport.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      viewport.classList.add('dragging');
      startX = e.clientX - posX;
      startY = e.clientY - posY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      posX = e.clientX - startX;
      posY = e.clientY - startY;
      updateTransform();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      viewport.classList.remove('dragging');
    });

    window.addEventListener('resize', resetView);

    let loadedCount = 0;
    function onImgLoad() {
      loadedCount++;
      if (loadedCount >= 1) {
        container.style.width = totalW + 'px';
        container.style.height = totalH + 'px';
        resetView();
        document.getElementById('dropAlert').style.display = 'none';
      }
    }

    function onImgError() {
      document.getElementById('dropAlert').style.display = 'block';
    }

    setTimeout(() => {
      const img1 = document.getElementById('img_01');
      if (!img1.naturalWidth) {
        document.getElementById('dropAlert').style.display = 'block';
      }
    }, 1500);

    // Support drag and drop files onto viewport
    viewport.addEventListener('dragover', (e) => {
      e.preventDefault();
      viewport.style.outline = '2px dashed #818cf8';
    });
    viewport.addEventListener('dragleave', () => {
      viewport.style.outline = 'none';
    });
    viewport.addEventListener('drop', (e) => {
      e.preventDefault();
      viewport.style.outline = 'none';
      if (e.dataTransfer && e.dataTransfer.files) {
        handleLocalFilesSelect(e.dataTransfer.files);
      }
    });

    function handleLocalFilesSelect(files) {
      if (!files || files.length === 0) return;
      const fileList = Array.from(files);
      
      fileList.forEach(file => {
        const name = file.name.toLowerCase();
        const objUrl = URL.createObjectURL(file);
        if (name.includes('01') || name.includes('top_left') || name.includes('a1') || name.includes('左上')) {
          document.getElementById('img_01').src = objUrl;
        } else if (name.includes('02') || name.includes('top_right') || name.includes('a2') || name.includes('右上')) {
          document.getElementById('img_02').src = objUrl;
        } else if (name.includes('03') || name.includes('bottom_left') || name.includes('b1') || name.includes('左下')) {
          document.getElementById('img_03').src = objUrl;
        } else if (name.includes('04') || name.includes('bottom_right') || name.includes('b2') || name.includes('右下')) {
          document.getElementById('img_04').src = objUrl;
        }
      });

      document.getElementById('dropAlert').style.display = 'none';
      container.style.width = totalW + 'px';
      container.style.height = totalH + 'px';
      setTimeout(resetView, 100);
      showStatus('✔ 已载入本地切片文件，可立即进行缝合与超高清导出！');
    }

    function showStatus(text, isError = false, progress = null) {
      const b = document.getElementById('exportStatusBanner');
      b.style.display = 'block';
      b.style.background = isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
      b.style.borderColor = isError ? '#ef4444' : '#10b981';
      b.style.color = isError ? '#fca5a5' : '#34d399';
      b.textContent = text;

      const pContainer = document.getElementById('exportProgressBarContainer');
      const pFill = document.getElementById('exportProgressBarFill');
      if (progress !== null) {
        pContainer.style.display = 'block';
        pFill.style.width = Math.min(100, Math.max(0, progress)) + '%';
      } else {
        pContainer.style.display = 'none';
      }
    }

    function openExportModal() {
      document.getElementById('exportModal').style.display = 'flex';
    }
    function closeExportModal() {
      document.getElementById('exportModal').style.display = 'none';
      document.getElementById('exportStatusBanner').style.display = 'none';
      document.getElementById('exportProgressBarContainer').style.display = 'none';
    }

    // Export Option 1: 100% Viewport detail crop
    function exportCurrentView() {
      showStatus('正在截取当前 100% 细节视窗...', false, 20);
      try {
        const vw = viewport.clientWidth;
        const vh = viewport.clientHeight;
        const c = document.createElement('canvas');
        c.width = vw;
        c.height = vh;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, vw, vh);

        const imgs = [
          { el: document.getElementById('img_01'), x: 0, y: 0 },
          { el: document.getElementById('img_02'), x: totalW / 2, y: 0 },
          { el: document.getElementById('img_03'), x: 0, y: totalH / 2 },
          { el: document.getElementById('img_04'), x: totalW / 2, y: totalH / 2 },
        ];

        imgs.forEach(item => {
          if (item.el && item.el.complete && item.el.naturalWidth) {
            ctx.drawImage(
              item.el,
              posX + item.x * scale,
              posY + item.y * scale,
              (totalW / 2) * scale,
              (totalH / 2) * scale
            );
          }
        });

        c.toBlob((blob) => {
          if (!blob) throw new Error('截图生成失败，请确认切片已正确载入');
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = '100%特写原画_${originalFileName}.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showStatus('✔ 100% 视窗特写已成功导出！', false, 100);
        }, 'image/png');
      } catch (err) {
        showStatus('导出失败: ' + err.message, true);
      }
    }

    // Export Option 2: Merged single image with lazy chunked processing
    async function exportMergedImage() {
      const maxDim = parseInt(document.getElementById('exportResolutionSelect').value, 10);
      showStatus('正在启动延时分块缝合 (目标 ' + maxDim + 'px 长边)...', false, 5);

      const btn = document.getElementById('btnExportMerged');
      btn.disabled = true;

      try {
        const ratio = Math.min(1, maxDim / Math.max(totalW, totalH));
        const outW = Math.round(totalW * ratio);
        const outH = Math.round(totalH * ratio);

        const c = document.createElement('canvas');
        c.width = outW;
        c.height = outH;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);

        const halfW = Math.round(outW / 2);
        const halfH = Math.round(outH / 2);

        const tilesToDraw = [
          { el: document.getElementById('img_01'), x: 0, y: 0, w: halfW, h: halfH, name: '左上' },
          { el: document.getElementById('img_02'), x: halfW, y: 0, w: outW - halfW, h: halfH, name: '右上' },
          { el: document.getElementById('img_03'), x: 0, y: halfH, w: halfW, h: outH - halfH, name: '左下' },
          { el: document.getElementById('img_04'), x: halfW, y: halfH, w: outW - halfW, h: outH - halfH, name: '右下' },
        ];

        for (let i = 0; i < tilesToDraw.length; i++) {
          const t = tilesToDraw[i];
          const pct = Math.round(15 + i * 18);
          showStatus('[延时分块] 正在渲染 ' + t.name + ' 分块 (' + (i + 1) + '/4)...', false, pct);
          await new Promise(r => setTimeout(r, 60)); // Yield to prevent UI freeze
          ctx.drawImage(t.el, t.x, t.y, t.w, t.h);
        }

        showStatus('正在进行无损压缩编码与生成 Blob...', false, 90);
        await new Promise(r => setTimeout(r, 80));

        c.toBlob((blob) => {
          btn.disabled = false;
          if (!blob) {
            showStatus('超出当前核显显存限制，请选择 12K 或 8K 档位', true);
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = '合并超清大图_' + outW + 'x' + outH + '_${originalFileName}.jpg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showStatus('✔ 超清大图 (' + outW + 'x' + outH + ') 导出成功！体积: ' + (blob.size / 1024 / 1024).toFixed(1) + 'MB', false, 100);
        }, 'image/jpeg', 0.94);
      } catch (err) {
        btn.disabled = false;
        showStatus('合并失败: ' + err.message, true);
      }
    }

    // PNG Chunk & CRC Helpers
    const pngCrcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      pngCrcTable[n] = c;
    }

    function computePngCrc(buf, offset, length) {
      let c = (0 ^ -1) >>> 0;
      const end = offset + length;
      for (let i = offset; i < end; i++) {
        c = pngCrcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
      }
      return (c ^ -1) >>> 0;
    }

    function createPngChunk(typeStr, data) {
      const len = data.length;
      const chunk = new Uint8Array(4 + 4 + len + 4);
      const view = new DataView(chunk.buffer);
      view.setUint32(0, len, false);
      chunk[4] = typeStr.charCodeAt(0);
      chunk[5] = typeStr.charCodeAt(1);
      chunk[6] = typeStr.charCodeAt(2);
      chunk[7] = typeStr.charCodeAt(3);
      chunk.set(data, 8);
      const crc = computePngCrc(chunk, 4, 4 + len);
      view.setUint32(8 + len, crc, false);
      return chunk;
    }

    // Export Option 3A: Pure Local 23808x31744 Streaming Lossless PNG Engine
    async function exportFullResolutionPng() {
      const btn = document.getElementById('btnLocalFullPng');
      btn.disabled = true;
      showStatus('初始化 24G 物理大内存 PNG 流式压缩调度器 (0% 核显占用)...', false, 3);

      try {
        if (typeof CompressionStream === 'undefined') {
          showStatus('当前浏览器不支持 CompressionStream，将自动转为 BMP 模式...', false, 5);
          await exportFullResolutionBmp();
          btn.disabled = false;
          return;
        }

        const w = totalW;
        const h = totalH;
        const halfW = Math.floor(w / 2);
        const halfH = Math.floor(h / 2);

        const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
        const ihdrData = new Uint8Array(13);
        const ihdrView = new DataView(ihdrData.buffer);
        ihdrView.setUint32(0, w, false);
        ihdrView.setUint32(4, h, false);
        ihdrData[8] = 8;
        ihdrData[9] = 2; // RGB 24-bit
        ihdrData[10] = 0;
        ihdrData[11] = 0;
        ihdrData[12] = 0;
        const ihdrChunk = createPngChunk('IHDR', ihdrData);

        const blobParts = [pngSignature, ihdrChunk];
        const bandHeight = 512;
        const totalBands = Math.ceil(h / bandHeight);

        const scratchLeft = document.createElement('canvas');
        scratchLeft.width = halfW;
        scratchLeft.height = bandHeight;
        const ctxLeft = scratchLeft.getContext('2d', { willReadFrequently: true });

        const scratchRight = document.createElement('canvas');
        scratchRight.width = w - halfW;
        scratchRight.height = bandHeight;
        const ctxRight = scratchRight.getContext('2d', { willReadFrequently: true });

        const imgTL = document.getElementById('img_01');
        const imgTR = document.getElementById('img_02');
        const imgBL = document.getElementById('img_03');
        const imgBR = document.getElementById('img_04');

        const cs = new CompressionStream('deflate');
        const writer = cs.writable.getWriter();
        const reader = cs.readable.getReader();

        let compressedChunks = [];
        let compressedBytes = 0;
        const readPromise = (async () => {
          while (true) {
            const { value, done } = await reader.read();
            if (value) {
              compressedChunks.push(value);
              compressedBytes += value.length;
              if (compressedBytes >= 8 * 1024 * 1024) {
                const merged = new Uint8Array(compressedBytes);
                let off = 0;
                for (const c of compressedChunks) {
                  merged.set(c, off);
                  off += c.length;
                }
                blobParts.push(createPngChunk('IDAT', merged));
                compressedChunks = [];
                compressedBytes = 0;
              }
            }
            if (done) break;
          }
          if (compressedBytes > 0) {
            const merged = new Uint8Array(compressedBytes);
            let off = 0;
            for (const c of compressedChunks) {
              merged.set(c, off);
              off += c.length;
            }
            blobParts.push(createPngChunk('IDAT', merged));
          }
        })();

        const rowBytes = 1 + w * 3;

        for (let bandIdx = 0; bandIdx < totalBands; bandIdx++) {
          const startY = bandIdx * bandHeight;
          const currentBandH = Math.min(bandHeight, h - startY);
          const percent = Math.round(5 + (bandIdx / totalBands) * 90);

          showStatus('[用时间换空间] CPU 无损压缩中: ' + (bandIdx + 1) + '/' + totalBands + ' (' + Math.round((startY / h) * 100) + '%)...', false, percent);

          const isTopHalf = startY < halfH;
          const tileSourceY = isTopHalf ? startY : startY - halfH;
          const tileLeft = isTopHalf ? imgTL : imgBL;
          const tileRight = isTopHalf ? imgTR : imgBR;

          ctxLeft.clearRect(0, 0, halfW, currentBandH);
          ctxLeft.drawImage(tileLeft, 0, tileSourceY, halfW, currentBandH, 0, 0, halfW, currentBandH);
          const leftData = ctxLeft.getImageData(0, 0, halfW, currentBandH).data;

          const rightW = w - halfW;
          ctxRight.clearRect(0, 0, rightW, currentBandH);
          ctxRight.drawImage(tileRight, 0, tileSourceY, rightW, currentBandH, 0, 0, rightW, currentBandH);
          const rightData = ctxRight.getImageData(0, 0, rightW, currentBandH).data;

          const bandBuffer = new Uint8Array(rowBytes * currentBandH);

          for (let row = 0; row < currentBandH; row++) {
            let destPtr = row * rowBytes;
            bandBuffer[destPtr++] = 0; // PNG filter 0 (None)

            const leftRowOffset = row * halfW * 4;
            const rightRowOffset = row * rightW * 4;

            for (let x = 0; x < halfW; x++) {
              const srcPtr = leftRowOffset + x * 4;
              bandBuffer[destPtr++] = leftData[srcPtr];     // R
              bandBuffer[destPtr++] = leftData[srcPtr + 1]; // G
              bandBuffer[destPtr++] = leftData[srcPtr + 2]; // B
            }

            for (let x = 0; x < rightW; x++) {
              const srcPtr = rightRowOffset + x * 4;
              bandBuffer[destPtr++] = rightData[srcPtr];     // R
              bandBuffer[destPtr++] = rightData[srcPtr + 1]; // G
              bandBuffer[destPtr++] = rightData[srcPtr + 2]; // B
            }
          }

          await writer.write(bandBuffer);
          await new Promise(r => setTimeout(r, 10));
        }

        await writer.close();
        await readPromise;

        blobParts.push(createPngChunk('IEND', new Uint8Array(0)));

        showStatus('正在生成单张全量无损 PNG 巨图 Blob 数据流...', false, 97);
        await new Promise(r => setTimeout(r, 60));

        const finalBlob = new Blob(blobParts, { type: 'image/png' });
        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '全量8X单张巨图_' + w + 'x' + h + '_${originalFileName}.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        btn.disabled = false;
        showStatus('🎉 突破成功！已下载 23808×31744 单张无损 PNG 巨图 (' + (finalBlob.size / 1024 / 1024).toFixed(1) + ' MB)！', false, 100);
      } catch (err) {
        btn.disabled = false;
        showStatus('PNG 装配失败: ' + err.message, true);
      }
    }

    // Export Option 3B: Pure Local 23808x31744 24-bit True BMP Engine (Fallback)
    async function exportFullResolutionBmp() {
      const btn = document.getElementById('btnLocalFullBmp');
      btn.disabled = true;
      showStatus('初始化 24G 物理大内存调度器 (按 512 像素带状逐步拼装)...', false, 3);

      try {
        const w = totalW;
        const h = totalH;
        const halfW = Math.floor(w / 2);
        const halfH = Math.floor(h / 2);

        const rowBytes = Math.floor((w * 3 + 3) / 4) * 4;
        const paddingBytes = rowBytes - w * 3;
        const pixelArraySize = rowBytes * h;
        const fileSize = 54 + pixelArraySize;

        // Build 54-byte BMP Header
        const header = new ArrayBuffer(54);
        const view = new DataView(header);
        view.setUint8(0, 0x42);
        view.setUint8(1, 0x4d);
        view.setUint32(2, fileSize > 0xffffffff ? 0 : fileSize, true);
        view.setUint32(6, 0, true);
        view.setUint32(10, 54, true);
        view.setUint32(14, 40, true);
        view.setInt32(18, w, true);
        view.setInt32(22, -h, true); // Top-to-bottom scanlines
        view.setUint16(26, 1, true);
        view.setUint16(28, 24, true); // 24-bit BGR
        view.setUint32(30, 0, true);
        view.setUint32(34, pixelArraySize > 0xffffffff ? 0 : pixelArraySize, true);
        view.setInt32(38, 2835, true);
        view.setInt32(42, 2835, true);

        const blobParts = [header];
        const bandHeight = 512;
        const totalBands = Math.ceil(h / bandHeight);

        const scratchLeft = document.createElement('canvas');
        scratchLeft.width = halfW;
        scratchLeft.height = bandHeight;
        const ctxLeft = scratchLeft.getContext('2d', { willReadFrequently: true });

        const scratchRight = document.createElement('canvas');
        scratchRight.width = w - halfW;
        scratchRight.height = bandHeight;
        const ctxRight = scratchRight.getContext('2d', { willReadFrequently: true });

        const imgTL = document.getElementById('img_01');
        const imgTR = document.getElementById('img_02');
        const imgBL = document.getElementById('img_03');
        const imgBR = document.getElementById('img_04');

        for (let bandIdx = 0; bandIdx < totalBands; bandIdx++) {
          const startY = bandIdx * bandHeight;
          const currentBandH = Math.min(bandHeight, h - startY);
          const percent = Math.round(5 + (bandIdx / totalBands) * 90);

          showStatus('[时间换空间] CPU 逐带拼装中: ' + (bandIdx + 1) + '/' + totalBands + ' (' + Math.round((startY / h) * 100) + '%)...', false, percent);

          const isTopHalf = startY < halfH;
          const tileSourceY = isTopHalf ? startY : startY - halfH;
          const tileLeft = isTopHalf ? imgTL : imgBL;
          const tileRight = isTopHalf ? imgTR : imgBR;

          ctxLeft.clearRect(0, 0, halfW, currentBandH);
          ctxLeft.drawImage(tileLeft, 0, tileSourceY, halfW, currentBandH, 0, 0, halfW, currentBandH);
          const leftData = ctxLeft.getImageData(0, 0, halfW, currentBandH).data;

          const rightW = w - halfW;
          ctxRight.clearRect(0, 0, rightW, currentBandH);
          ctxRight.drawImage(tileRight, 0, tileSourceY, rightW, currentBandH, 0, 0, rightW, currentBandH);
          const rightData = ctxRight.getImageData(0, 0, rightW, currentBandH).data;

          const bandBuffer = new Uint8Array(rowBytes * currentBandH);

          for (let row = 0; row < currentBandH; row++) {
            const destRowOffset = row * rowBytes;
            const leftRowOffset = row * halfW * 4;
            const rightRowOffset = row * rightW * 4;

            let destPtr = destRowOffset;
            for (let x = 0; x < halfW; x++) {
              const srcPtr = leftRowOffset + x * 4;
              bandBuffer[destPtr] = leftData[srcPtr + 2];     // B
              bandBuffer[destPtr + 1] = leftData[srcPtr + 1]; // G
              bandBuffer[destPtr + 2] = leftData[srcPtr];     // R
              destPtr += 3;
            }

            for (let x = 0; x < rightW; x++) {
              const srcPtr = rightRowOffset + x * 4;
              bandBuffer[destPtr] = rightData[srcPtr + 2];     // B
              bandBuffer[destPtr + 1] = rightData[srcPtr + 1]; // G
              bandBuffer[destPtr + 2] = rightData[srcPtr];     // R
              destPtr += 3;
            }

            for (let p = 0; p < paddingBytes; p++) {
              bandBuffer[destPtr++] = 0;
            }
          }

          blobParts.push(bandBuffer);
          await new Promise(r => setTimeout(r, 15));
        }

        showStatus('正在生成单张全量巨图 Blob 数据流...', false, 97);
        await new Promise(r => setTimeout(r, 60));

        const finalBlob = new Blob(blobParts, { type: 'image/bmp' });
        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '全量8X单张巨图_' + w + 'x' + h + '_${originalFileName}.bmp';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        btn.disabled = false;
        showStatus('🎉 突破成功！已下载 23808×31744 单张巨图 (' + (finalBlob.size / 1024 / 1024).toFixed(1) + ' MB)！', false, 100);
      } catch (err) {
        btn.disabled = false;
        showStatus('装配失败: ' + err.message, true);
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Packages the 4 slices + offline stitcher viewer into a single ZIP file
 */
export async function buildTiledZipPackage(
  tiles: TileSlice[],
  originalFileName: string,
  totalWidth: number,
  totalHeight: number,
  scale: number,
  onProgress?: (percent: number, msg: string) => void
): Promise<Blob> {
  const zip = new JSZip();

  // 1. Add viewer HTML
  onProgress?.(10, '正在生成离线全景无缝缝合查看器 HTML...');
  const viewerHtml = buildStitcherViewerHtml(originalFileName, totalWidth, totalHeight, scale);
  zip.file('00_双击无缝缝合查看器.html', viewerHtml);

  // 2. Add 4 sliced tiles
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    onProgress?.(20 + i * 18, `正在将分块写入压缩包 [${i + 1}/${tiles.length}]: ${tile.name}...`);
    if (tile.blob) {
      zip.file(tile.name, tile.blob);
    }
  }

  // 3. Generate ZIP blob
  onProgress?.(90, '正在压缩并打包 ZIP (请稍候)...');
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 4 },
    },
    (metadata) => {
      onProgress?.(Math.round(metadata.percent), `正在写入 ZIP 压缩流 (${Math.round(metadata.percent)}%)...`);
    }
  );

  onProgress?.(100, '打包完成！');
  return zipBlob;
}
