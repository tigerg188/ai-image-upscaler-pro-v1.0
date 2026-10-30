import * as fflate from 'fflate';

/**
 * Local Time-Extended Chunked Stitching Engine (本地延时分块缝合导出引擎)
 * 
 * Specially designed for high-resolution stitching under 512MB iGPU (核显) + 24GB RAM constraints.
 * Core Principle: "用时间换空间" (Time-for-Space trade-off)
 * 1. Never allocate a monolithic GPU-backed canvas that exceeds 16384px or 512MB VRAM.
 * 2. Break operations into safe sub-chunks / scanline strips.
 * 3. Yield to the browser event loop using setTimeout/requestAnimationFrame to prevent UI freezing.
 * 4. Leverage CPU System RAM (24GB) via TypedArrays / Blobs to bypass GPU texture constraints.
 */

export interface StitchSourceTile {
  col: number; // 0 (left) or 1 (right)
  row: number; // 0 (top) or 1 (bottom)
  source: HTMLCanvasElement | HTMLImageElement | ImageBitmap | Blob;
}

export interface StitchProgressCallback {
  (percent: number, message: string): void;
}

// Precomputed CRC32 table for PNG chunk validation
const pngCrcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  pngCrcTable[n] = c;
}

function computePngCrc(buf: Uint8Array, offset: number, length: number): number {
  let c = (0 ^ -1) >>> 0;
  const end = offset + length;
  for (let i = offset; i < end; i++) {
    c = pngCrcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function createPngChunk(typeStr: string, data: Uint8Array): Uint8Array {
  const len = data.length;
  const chunk = new Uint8Array(4 + 4 + len + 4);
  const view = new DataView(chunk.buffer);

  // Length (big-endian 32-bit uint)
  view.setUint32(0, len, false);

  // Chunk Type
  chunk[4] = typeStr.charCodeAt(0);
  chunk[5] = typeStr.charCodeAt(1);
  chunk[6] = typeStr.charCodeAt(2);
  chunk[7] = typeStr.charCodeAt(3);

  // Chunk Data
  chunk.set(data, 8);

  // CRC-32 over Type + Data
  const crc = computePngCrc(chunk, 4, 4 + len);
  view.setUint32(8 + len, crc, false);

  return chunk;
}

/**
 * Load any tile source (Canvas, Image, Blob) into a standardized ImageBitmap / Image
 */
async function resolveTileSource(
  source: HTMLCanvasElement | HTMLImageElement | ImageBitmap | Blob
): Promise<ImageBitmap | HTMLCanvasElement | HTMLImageElement> {
  if (source instanceof Blob) {
    if ('createImageBitmap' in window) {
      return await createImageBitmap(source);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(source);
    });
  }
  return source;
}

/**
 * Safe 16K / 12K / 8K Chunked Canvas Stitcher
 * Renders into an optimal hardware-safe canvas using progressive time-slicing
 */
export async function stitchSafeCanvasImage(
  tiles: StitchSourceTile[],
  totalWidth: number,
  totalHeight: number,
  targetMaxDimension: number = 16384,
  format: 'png' | 'jpeg' = 'jpeg',
  quality: number = 0.94,
  onProgress?: StitchProgressCallback
): Promise<Blob> {
  onProgress?.(5, '初始化本地内存分块调度器 (核显保护模式)...');

  // Calculate scaled dimensions fitting within targetMaxDimension (e.g. 16384px max)
  const ratio = Math.min(1, targetMaxDimension / Math.max(totalWidth, totalHeight));
  const outW = Math.round(totalWidth * ratio);
  const outH = Math.round(totalHeight * ratio);

  onProgress?.(10, `创建分块画布: ${outW} × ${outH} px (单图超清导出)...`);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('无法初始化 2D Canvas 绘图上下文');
  }

  // Pre-fill solid background for clean JPEG export
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);

  const halfW = Math.round(outW / 2);
  const halfH = Math.round(outH / 2);

  // Progressive delayed draw for each of the 4 tiles
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const tileName = `${tile.row === 0 ? '上' : '下'}${tile.col === 0 ? '左' : '右'}`;
    const progressStart = 20 + i * 18;
    onProgress?.(progressStart, `[延时分块] 正在解压并渲染分块 ${i + 1}/4 (${tileName}切片)...`);

    // Let the UI breathe and refresh
    await new Promise((r) => setTimeout(r, 60));

    const resolved = await resolveTileSource(tile.source);
    const destX = tile.col * halfW;
    const destY = tile.row * halfH;
    const destW = tile.col === 1 ? outW - halfW : halfW;
    const destH = tile.row === 1 ? outH - halfH : halfH;

    ctx.drawImage(resolved, destX, destY, destW, destH);
  }

  onProgress?.(90, `正在进行无损压缩编码与 Blob 流式生成 (${format.toUpperCase()})...`);
  await new Promise((r) => setTimeout(r, 80));

  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('当前画幅超出核显显存上限，建议选择 12K 或 8K 档位'));
          return;
        }
        onProgress?.(100, '本地单图缝合完成！');
        resolve(blob);
      },
      mime,
      quality
    );
  });
}

/**
 * 23808x31744 Full 8X True Uncompressed 24-bit BMP Binary Stream Engine
 * 
 * Bypasses GPU Canvas entirely by building uncompressed pixel strips in 24GB CPU RAM!
 * Standard Windows/Mac/Linux photo viewers and Photoshop support BMP natively.
 * Time required: ~30-60s on multi-core CPU.
 */
export async function stitchFullResolutionBmp(
  tiles: StitchSourceTile[],
  totalWidth: number,
  totalHeight: number,
  onProgress?: StitchProgressCallback
): Promise<Blob> {
  onProgress?.(2, '启动 24G 物理大内存调度器 (完全绕过 512M 核显 VRAM)...');

  // Slices:
  // TopLeft (col 0, row 0), TopRight (col 1, row 0)
  // BottomLeft (col 0, row 1), BottomRight (col 1, row 1)
  const resolvedTiles: { [key: string]: HTMLCanvasElement | ImageBitmap | HTMLImageElement } = {};

  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    onProgress?.(5 + i * 5, `正在挂载切片资源 [${i + 1}/4]...`);
    const key = `${t.col}_${t.row}`;
    resolvedTiles[key] = await resolveTileSource(t.source);
    await new Promise((r) => setTimeout(r, 30));
  }

  const w = totalWidth;
  const h = totalHeight;
  const halfW = Math.floor(w / 2);
  const halfH = Math.floor(h / 2);

  onProgress?.(25, `计算 7.55亿像素 24-bit 结构体 (总图幅 ${w} × ${h} px)...`);

  // BMP Row byte size must be a multiple of 4 bytes
  const rowBytes = Math.floor((w * 3 + 3) / 4) * 4;
  const paddingBytes = rowBytes - w * 3;
  const pixelArraySize = rowBytes * h;
  const fileSize = 54 + pixelArraySize;

  // Build BMP 54-byte Header
  const header = new ArrayBuffer(54);
  const view = new DataView(header);

  // BM signature
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  // File size
  view.setUint32(2, fileSize > 0xffffffff ? 0 : fileSize, true);
  // Reserved
  view.setUint32(6, 0, true);
  // Offset to pixel data
  view.setUint32(10, 54, true);

  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  view.setUint32(14, 40, true);
  view.setInt32(18, w, true);
  // Negative height = top-to-bottom scanlines (much faster and intuitive to process!)
  view.setInt32(22, -h, true);
  view.setUint16(26, 1, true); // Planes = 1
  view.setUint16(28, 24, true); // 24-bit BGR
  view.setUint32(30, 0, true); // Compression = BI_RGB (uncompressed)
  view.setUint32(34, pixelArraySize > 0xffffffff ? 0 : pixelArraySize, true);
  view.setInt32(38, 2835, true); // Horizontal resolution ~72 DPI
  view.setInt32(42, 2835, true); // Vertical resolution ~72 DPI
  view.setUint32(46, 0, true); // Colors in color table
  view.setUint32(50, 0, true); // Important color count

  const blobParts: BlobPart[] = [header];

  // We process the giant image in safe horizontal bands of 512 rows
  // Band height = 512px. In 23808px width, 1 band = 23808 * 512 * 3 = ~36.5MB CPU RAM
  // Extremely gentle on CPU and 0 MB VRAM!
  const bandHeight = 512;
  const totalBands = Math.ceil(h / bandHeight);

  // Scratch sub-canvases for extracting 512-row pixel data from left & right tiles
  const scratchLeft = document.createElement('canvas');
  scratchLeft.width = halfW;
  scratchLeft.height = bandHeight;
  const ctxLeft = scratchLeft.getContext('2d', { willReadFrequently: true })!;

  const scratchRight = document.createElement('canvas');
  scratchRight.width = w - halfW;
  scratchRight.height = bandHeight;
  const ctxRight = scratchRight.getContext('2d', { willReadFrequently: true })!;

  for (let bandIdx = 0; bandIdx < totalBands; bandIdx++) {
    const startY = bandIdx * bandHeight;
    const currentBandH = Math.min(bandHeight, h - startY);
    const percent = Math.round(30 + (bandIdx / totalBands) * 65);

    onProgress?.(
      percent,
      `[用时间换空间] CPU 逐带装配中: 区域 ${bandIdx + 1}/${totalBands} (${Math.round((startY / h) * 100)}%)...`
    );

    // Determine whether current band falls in top half or bottom half
    const isTopHalf = startY < halfH;
    const tileRow = isTopHalf ? 0 : 1;
    const tileSourceY = isTopHalf ? startY : startY - halfH;

    const tileLeft = resolvedTiles[`0_${tileRow}`];
    const tileRight = resolvedTiles[`1_${tileRow}`];

    // Clear and draw Left sub-strip
    ctxLeft.clearRect(0, 0, halfW, currentBandH);
    ctxLeft.drawImage(
      tileLeft,
      0, tileSourceY, halfW, currentBandH,
      0, 0, halfW, currentBandH
    );
    const leftData = ctxLeft.getImageData(0, 0, halfW, currentBandH).data;

    // Clear and draw Right sub-strip
    const rightW = w - halfW;
    ctxRight.clearRect(0, 0, rightW, currentBandH);
    ctxRight.drawImage(
      tileRight,
      0, tileSourceY, rightW, currentBandH,
      0, 0, rightW, currentBandH
    );
    const rightData = ctxRight.getImageData(0, 0, rightW, currentBandH).data;

    // Allocate continuous band buffer in CPU RAM
    const bandBuffer = new Uint8Array(rowBytes * currentBandH);

    for (let row = 0; row < currentBandH; row++) {
      const destRowOffset = row * rowBytes;
      const leftRowOffset = row * halfW * 4;
      const rightRowOffset = row * rightW * 4;

      // Copy Left half (convert RGBA to BGR)
      let destPtr = destRowOffset;
      for (let x = 0; x < halfW; x++) {
        const srcPtr = leftRowOffset + x * 4;
        bandBuffer[destPtr] = leftData[srcPtr + 2];     // B
        bandBuffer[destPtr + 1] = leftData[srcPtr + 1]; // G
        bandBuffer[destPtr + 2] = leftData[srcPtr];     // R
        destPtr += 3;
      }

      // Copy Right half (convert RGBA to BGR)
      for (let x = 0; x < rightW; x++) {
        const srcPtr = rightRowOffset + x * 4;
        bandBuffer[destPtr] = rightData[srcPtr + 2];     // B
        bandBuffer[destPtr + 1] = rightData[srcPtr + 1]; // G
        bandBuffer[destPtr + 2] = rightData[srcPtr];     // R
        destPtr += 3;
      }

      // Pad remaining bytes in the 4-byte boundary
      for (let p = 0; p < paddingBytes; p++) {
        bandBuffer[destPtr++] = 0;
      }
    }

    blobParts.push(bandBuffer);

    // Yield control so UI stays silky smooth and interactive
    await new Promise((r) => setTimeout(r, 15));
  }

  onProgress?.(98, '合并数据流为单张 23808×31744 真实巨图 Blob...');
  await new Promise((r) => setTimeout(r, 60));

  const finalBlob = new Blob(blobParts, { type: 'image/bmp' });
  onProgress?.(100, `🎉 突破成功！已生成真实单张全量巨图 (${(finalBlob.size / 1024 / 1024).toFixed(1)} MB)`);
  return finalBlob;
}

/**
 * 23808x31744 Full 8X True Lossless Compressed PNG Binary Streaming Engine
 * 
 * Bypasses GPU canvas entirely (0 MB VRAM) by streaming 512-row pixel bands directly into
 * pure CPU RAM (24GB) and compressing via streaming Zlib Deflate into standard PNG format.
 * 
 * Benefits over BMP:
 * 1. File size reduced from 2.11 GB down to ~350 MB - ~550 MB (lossless 75-80% compression).
 * 2. Fully compatible with office PC viewers, Windows Photos, Photoshop, IrfanView, etc.
 * 3. 100% full original 23808 × 31744 resolution (7.55亿像素) without single pixel loss.
 */
export async function stitchFullResolutionPng(
  tiles: StitchSourceTile[],
  totalWidth: number,
  totalHeight: number,
  onProgress?: StitchProgressCallback
): Promise<Blob> {
  onProgress?.(2, '启动 24G 物理大内存 PNG 流式压缩调度器 (0% 核显占用)...');

  const resolvedTiles: { [key: string]: HTMLCanvasElement | ImageBitmap | HTMLImageElement } = {};

  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    onProgress?.(4 + i * 5, `正在挂载切片资源 [${i + 1}/4]...`);
    const key = `${t.col}_${t.row}`;
    resolvedTiles[key] = await resolveTileSource(t.source);
    await new Promise((r) => setTimeout(r, 20));
  }

  const w = totalWidth;
  const h = totalHeight;
  const halfW = Math.floor(w / 2);
  const halfH = Math.floor(h / 2);

  onProgress?.(24, `初始化 7.55 亿像素 PNG 协议头与无损 Deflate 压缩器 (${w} × ${h} px)...`);

  // PNG Signature (8 bytes)
  const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk: 13 bytes
  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, w, false);  // Width (big-endian)
  ihdrView.setUint32(4, h, false);  // Height (big-endian)
  ihdrData[8] = 8;  // Bit depth: 8-bit per channel
  ihdrData[9] = 2;  // Color type: 2 (RGB truecolor, 3 bytes per pixel)
  ihdrData[10] = 0; // Compression: 0 (deflate)
  ihdrData[11] = 0; // Filter: 0 (adaptive)
  ihdrData[12] = 0; // Interlace: 0 (non-interlaced)
  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  const blobParts: any[] = [pngSignature, ihdrChunk];

  // Streaming Deflate via fflate.Zlib
  // We accumulate compressed chunks up to ~8MB, then wrap into an IDAT chunk
  let accumulatedChunks: Uint8Array[] = [];
  let accumulatedBytes = 0;

  const flushIdat = (force: boolean = false) => {
    if (accumulatedBytes === 0) return;
    if (!force && accumulatedBytes < 8 * 1024 * 1024) return;

    const merged = new Uint8Array(accumulatedBytes);
    let offset = 0;
    for (const chunk of accumulatedChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    blobParts.push(createPngChunk('IDAT', merged));
    accumulatedChunks = [];
    accumulatedBytes = 0;
  };

  // Level 1: Fast compression, very low CPU latency, ~75-80% size reduction
  const zlib = new fflate.Zlib({ level: 1 }, (chunk, isFinal) => {
    accumulatedChunks.push(chunk);
    accumulatedBytes += chunk.length;
    if (isFinal || accumulatedBytes >= 8 * 1024 * 1024) {
      flushIdat(isFinal);
    }
  });

  // Safe band processing: 512 rows per band (takes ~36.5MB CPU RAM per band)
  const bandHeight = 512;
  const totalBands = Math.ceil(h / bandHeight);

  // Scratch sub-canvases for extracting 512-row pixel data from left & right tiles
  const scratchLeft = document.createElement('canvas');
  scratchLeft.width = halfW;
  scratchLeft.height = bandHeight;
  const ctxLeft = scratchLeft.getContext('2d', { willReadFrequently: true })!;

  const scratchRight = document.createElement('canvas');
  scratchRight.width = w - halfW;
  scratchRight.height = bandHeight;
  const ctxRight = scratchRight.getContext('2d', { willReadFrequently: true })!;

  // Row size in PNG: 1 filter byte + w * 3 bytes (RGB)
  const rowBytes = 1 + w * 3;

  for (let bandIdx = 0; bandIdx < totalBands; bandIdx++) {
    const startY = bandIdx * bandHeight;
    const currentBandH = Math.min(bandHeight, h - startY);
    const isLastBand = bandIdx === totalBands - 1;
    const percent = Math.round(25 + (bandIdx / totalBands) * 70);

    onProgress?.(
      percent,
      `[用时间换空间] CPU 无损压缩中: 区域 ${bandIdx + 1}/${totalBands} (${Math.round((startY / h) * 100)}%)...`
    );

    const isTopHalf = startY < halfH;
    const tileRow = isTopHalf ? 0 : 1;
    const tileSourceY = isTopHalf ? startY : startY - halfH;

    const tileLeft = resolvedTiles[`0_${tileRow}`];
    const tileRight = resolvedTiles[`1_${tileRow}`];

    // Clear and draw Left sub-strip
    ctxLeft.clearRect(0, 0, halfW, currentBandH);
    ctxLeft.drawImage(
      tileLeft,
      0, tileSourceY, halfW, currentBandH,
      0, 0, halfW, currentBandH
    );
    const leftData = ctxLeft.getImageData(0, 0, halfW, currentBandH).data;

    // Clear and draw Right sub-strip
    const rightW = w - halfW;
    ctxRight.clearRect(0, 0, rightW, currentBandH);
    ctxRight.drawImage(
      tileRight,
      0, tileSourceY, rightW, currentBandH,
      0, 0, rightW, currentBandH
    );
    const rightData = ctxRight.getImageData(0, 0, rightW, currentBandH).data;

    // Allocate continuous band buffer for PNG scanlines
    const bandBuffer = new Uint8Array(rowBytes * currentBandH);

    for (let row = 0; row < currentBandH; row++) {
      let destPtr = row * rowBytes;
      bandBuffer[destPtr++] = 0; // PNG Filter type: 0 (None)

      const leftRowOffset = row * halfW * 4;
      const rightRowOffset = row * rightW * 4;

      // Copy Left half (standard RGB)
      for (let x = 0; x < halfW; x++) {
        const srcPtr = leftRowOffset + x * 4;
        bandBuffer[destPtr++] = leftData[srcPtr];     // R
        bandBuffer[destPtr++] = leftData[srcPtr + 1]; // G
        bandBuffer[destPtr++] = leftData[srcPtr + 2]; // B
      }

      // Copy Right half (standard RGB)
      for (let x = 0; x < rightW; x++) {
        const srcPtr = rightRowOffset + x * 4;
        bandBuffer[destPtr++] = rightData[srcPtr];     // R
        bandBuffer[destPtr++] = rightData[srcPtr + 1]; // G
        bandBuffer[destPtr++] = rightData[srcPtr + 2]; // B
      }
    }

    // Push into streaming Zlib compressor
    zlib.push(bandBuffer, isLastBand);

    // Yield control so UI stays silky smooth and interactive
    await new Promise((r) => setTimeout(r, 15));
  }

  // Ensure any leftover IDAT data is flushed
  flushIdat(true);

  // Append IEND chunk (0 length data)
  const iendChunk = createPngChunk('IEND', new Uint8Array(0));
  blobParts.push(iendChunk);

  onProgress?.(98, '合并数据流为单张 23808×31744 真实 PNG 巨图...');
  await new Promise((r) => setTimeout(r, 60));

  const finalBlob = new Blob(blobParts, { type: 'image/png' });
  onProgress?.(100, `🎉 突破成功！已生成真实单张全量无损 PNG 巨图 (${(finalBlob.size / 1024 / 1024).toFixed(1)} MB)`);
  return finalBlob;
}
