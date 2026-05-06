import type { AsciiAnimationResult, AsciiResult, AsciiSettings } from "../../types/studio";
import type { EffectSettings, AsciiCell } from "../../types/studio";
import { applyEffectToCanvas } from "../effects";

// ─── TXT Export ───────────────────────────────────────────────────────────────

export function exportAsTxt(result: AsciiResult, filename = "ascii-art"): void {
  const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${filename}.txt`);
}

export function exportTextAsTxt(text: string, filename = "ascii-art"): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${filename}.txt`);
}

// ─── HTML Export ─────────────────────────────────────────────────────────────

export function exportAsHtml(
  result: AsciiResult,
  settings: AsciiSettings,
  filename = "ascii-art"
): void {
  const { background, foreground, fontSize, lineHeight } = settings;

  const lines = result.cells
    .map((row) => {
      const spans = row
        .map(
          (cell) =>
            `<span style="color:${cell.color}">${escapeHtml(cell.char)}</span>`
        )
        .join("");
      return `<div>${spans}</div>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ASCII Art — ASCII Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: ${background};
      color: ${foreground};
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      padding: 20px;
      white-space: pre;
    }
    .ascii-container {
      display: inline-block;
    }
    div {
      white-space: pre;
      letter-spacing: 0;
    }
  </style>
</head>
<body>
<div class="ascii-container">
${lines}
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  triggerDownload(blob, `${filename}.html`);
}

// ─── Animated HTML Export (Video/GIF) ─────────────────────────────────────────

export function exportAsAnimatedHtml(
  anim: AsciiAnimationResult,
  settings: AsciiSettings,
  filename = "ascii-animation"
): void {
  const { background, foreground, fontSize, lineHeight } = settings;
  const safeFrames = anim.framesText.map((t) => escapeJsString(t));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ASCII Animation — ASCII Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: ${background};
      color: ${foreground};
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      padding: 16px;
    }
    .bar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      font-size: 12px;
      color: rgba(255,255,255,0.75);
    }
    button {
      appearance: none;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.9);
      padding: 6px 10px;
      border-radius: 8px;
      cursor: pointer;
    }
    button:hover { background: rgba(255,255,255,0.09); }
    pre {
      white-space: pre;
      margin: 0;
      user-select: text;
    }
  </style>
</head>
<body>
  <div class="bar">
    <button id="toggle">Pause</button>
    <span id="meta">${anim.frameCount} frames @ ${anim.fps}fps</span>
    <span id="idx"></span>
  </div>
  <pre id="ascii"></pre>
  <script>
    const frames = ${JSON.stringify(safeFrames)};
    const fps = ${Math.max(1, anim.fps)};
    let playing = true;
    let i = 0;
    const el = document.getElementById("ascii");
    const idx = document.getElementById("idx");
    const btn = document.getElementById("toggle");

    function render() {
      el.textContent = frames[i] || "";
      idx.textContent = "Frame " + (i + 1) + "/" + frames.length;
    }
    render();

    btn.addEventListener("click", () => {
      playing = !playing;
      btn.textContent = playing ? "Pause" : "Play";
    });

    setInterval(() => {
      if (!playing) return;
      i = (i + 1) % frames.length;
      render();
    }, 1000 / fps);
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  triggerDownload(blob, `${filename}.html`);
}

// ─── PNG Export ───────────────────────────────────────────────────────────────

export async function exportAsPng(
  result: AsciiResult,
  settings: AsciiSettings,
  filename = "ascii-art",
  scale = 2,
  effectSettings?: EffectSettings
): Promise<void> {
  const canvas = renderAsciiToCanvas(result.cells, settings, scale);
  if (effectSettings && effectSettings.type !== "none") {
    applyEffectToCanvas(canvas, effectSettings.type, effectSettings.intensity);
  }
  canvas.toBlob((blob) => {
    if (blob) triggerDownload(blob, `${filename}.png`);
  }, "image/png");
}

// ─── SVG Export ───────────────────────────────────────────────────────────────

export function exportAsSvg(
  result: AsciiResult,
  settings: AsciiSettings,
  filename = "ascii-art"
): void {
  const { background, foreground, fontSize, lineHeight, mode } = settings;

  const lineH = fontSize * lineHeight;
  // SVG monospace karakter genişliği yaklaşık 0.6 * fontSize
  const charW = fontSize * 0.6;
  const svgWidth = result.cols * charW;
  const svgHeight = result.rows * lineH;

  const textElements = result.cells
    .flatMap((row, y) =>
      row.map((cell, x) => {
        const color = mode === "color" ? cell.color : foreground;
        const cx = x * charW;
        const cy = y * lineH + fontSize;
        return `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" fill="${color}">${escapeHtml(cell.char)}</text>`;
      })
    )
    .join("\n");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <rect width="100%" height="100%" fill="${background}"/>
  <g font-family="'JetBrains Mono','Courier New',monospace" font-size="${fontSize}" dominant-baseline="auto">
${textElements}
  </g>
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, `${filename}.svg`);
}

// ─── Animasyon PNG Export (İlk frame) ─────────────────────────────────────────

export async function exportAnimationAsPng(
  anim: AsciiAnimationResult,
  settings: AsciiSettings,
  filename = "ascii-frame",
  scale = 2,
  effectSettings?: EffectSettings
): Promise<void> {
  const cells = anim.framesCells?.[0];
  if (!cells) {
    // Fallback: text-only first frame
    const textBlob = new Blob([anim.framesText[0] ?? ""], { type: "text/plain" });
    triggerDownload(textBlob, `${filename}.txt`);
    return;
  }
  const canvas = renderAsciiToCanvas(cells, settings, scale);
  if (effectSettings && effectSettings.type !== "none") {
    applyEffectToCanvas(canvas, effectSettings.type, effectSettings.intensity);
  }
  canvas.toBlob((blob) => {
    if (blob) triggerDownload(blob, `${filename}.png`);
  }, "image/png");
}

// ─── Animasyon GIF Export ─────────────────────────────────────────────────────

export async function exportAnimationAsGif(
  anim: AsciiAnimationResult,
  settings: AsciiSettings,
  filename = "ascii-animation",
  scale = 1,
  effectSettings?: EffectSettings,
  onProgress?: (p: number) => void
): Promise<void> {
  if (!anim.framesCells || anim.framesCells.length === 0) {
    throw new Error("Renkli frame verisi bulunamadı.");
  }

  // GIF oluşturma — canvas frame'lerinden
  const delay = Math.round(1000 / Math.max(1, anim.fps));
  const frames: HTMLCanvasElement[] = [];

  for (let i = 0; i < anim.framesCells.length; i++) {
    onProgress?.(i / anim.framesCells.length);
    const canvas = renderAsciiToCanvas(anim.framesCells[i], settings, scale);
    if (effectSettings && effectSettings.type !== "none") {
      applyEffectToCanvas(canvas, effectSettings.type, effectSettings.intensity);
    }
    frames.push(canvas);
  }

  // GIF encoder - basit bir implementasyon
  // Tarayıcıda GIF oluşturmak için canvas'ları WebM olarak yakala, sonra blob olarak kaydet
  // Daha iyi bir yaklaşım: her frame'i sırasıyla bir GIF formatına yaz
  const gifBlob = await encodeGif(frames, delay);
  onProgress?.(1);
  triggerDownload(gifBlob, `${filename}.gif`);
}

// ─── Animasyon Video (WebM) Export ────────────────────────────────────────────

export async function exportAnimationAsVideo(
  anim: AsciiAnimationResult,
  settings: AsciiSettings,
  filename = "ascii-animation",
  scale = 1,
  effectSettings?: EffectSettings,
  onProgress?: (p: number) => void
): Promise<void> {
  if (!anim.framesCells || anim.framesCells.length === 0) {
    throw new Error("Renkli frame verisi bulunamadı.");
  }

  const fps = Math.max(1, anim.fps);
  const frameDuration = 1000 / fps;

  // Tüm frame canvas'larını önceden render et
  const frameCanvases: HTMLCanvasElement[] = [];
  for (let i = 0; i < anim.framesCells.length; i++) {
    onProgress?.((i / anim.framesCells.length) * 0.5);
    const canvas = renderAsciiToCanvas(anim.framesCells[i], settings, scale);
    if (effectSettings && effectSettings.type !== "none") {
      applyEffectToCanvas(canvas, effectSettings.type, effectSettings.intensity);
    }
    frameCanvases.push(canvas);
  }

  // Boyutları ilk frame'den al
  const w = frameCanvases[0].width;
  const h = frameCanvases[0].height;

  // Video kaydı için bir canvas oluştur
  const videoCanvas = document.createElement("canvas");
  videoCanvas.width = w;
  videoCanvas.height = h;
  const vCtx = videoCanvas.getContext("2d")!;

  // MediaRecorder ile WebM oluştur
  const stream = videoCanvas.captureStream(0); // 0 = manual frame
  const track = stream.getVideoTracks()[0];

  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 4_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();

  // Frame'leri sırayla çiz — 2 loop
  const totalFrames = anim.framesCells.length * 2; // 2 loop
  for (let loop = 0; loop < 2; loop++) {
    for (let i = 0; i < frameCanvases.length; i++) {
      const globalIdx = loop * frameCanvases.length + i;
      onProgress?.(0.5 + (globalIdx / totalFrames) * 0.5);

      vCtx.clearRect(0, 0, w, h);
      vCtx.drawImage(frameCanvases[i], 0, 0);

      // Request frame from the track
      if ("requestFrame" in track) {
        (track as any).requestFrame();
      }

      // Wait for frame duration
      await new Promise((r) => setTimeout(r, frameDuration));
    }
  }

  recorder.stop();
  await done;

  onProgress?.(1);
  const videoBlob = new Blob(chunks, { type: mimeType });
  triggerDownload(videoBlob, `${filename}.webm`);
}

// ─── Ortak: ASCII Frame'i Canvas'a Render Et ─────────────────────────────────

export function renderAsciiToCanvas(
  cells: AsciiCell[][],
  settings: AsciiSettings,
  scale = 2
): HTMLCanvasElement {
  const { background, foreground, fontSize, lineHeight, mode } = settings;

  const fontPx = fontSize * scale;
  const lineH = fontPx * lineHeight;
  const font = `${fontPx}px "JetBrains Mono", "Courier New", monospace`;

  // Karakterin piksel genişliği
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d")!;
  measureCtx.font = font;
  const charWidth = measureCtx.measureText("M").width;

  const rows = cells.length;
  const cols = rows > 0 ? cells[0].length : 0;

  const canvasWidth = Math.ceil(cols * charWidth);
  const canvasHeight = Math.ceil(rows * lineH);

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext("2d")!;

  // Arka plan
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.font = font;
  ctx.textBaseline = "top";

  // Karakterleri çiz
  for (let y = 0; y < rows; y++) {
    const row = cells[y];
    for (let x = 0; x < cols; x++) {
      const cell = row[x];
      ctx.fillStyle = mode === "color" ? cell.color : foreground;
      ctx.fillText(cell.char, x * charWidth, y * lineH);
    }
  }

  return canvas;
}

// ─── GIF Encoder (basit) ─────────────────────────────────────────────────────

async function encodeGif(
  frames: HTMLCanvasElement[],
  delay: number
): Promise<Blob> {
  // GIF89a formatında basit bir encoder
  // Renkleri 256 renge düşürüp GIF oluşturuyoruz
  const w = frames[0].width;
  const h = frames[0].height;

  const parts: Uint8Array[] = [];

  // Header
  parts.push(str2bytes("GIF89a"));

  // Logical Screen Descriptor
  const lsd = new Uint8Array(7);
  lsd[0] = w & 0xff;
  lsd[1] = (w >> 8) & 0xff;
  lsd[2] = h & 0xff;
  lsd[3] = (h >> 8) & 0xff;
  lsd[4] = 0x70; // No global color table, 8 bit color resolution
  lsd[5] = 0; // bg color index
  lsd[6] = 0; // pixel aspect ratio
  parts.push(lsd);

  // Netscape extension for looping
  parts.push(new Uint8Array([
    0x21, 0xff, 0x0b,
    ...str2bytes("NETSCAPE2.0"),
    0x03, 0x01,
    0x00, 0x00, // loop forever
    0x00
  ]));

  for (const canvas of frames) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const imageData = ctx.getImageData(0, 0, w, h);
    const { palette, indices } = quantize(imageData.data, w * h);

    // Graphic Control Extension
    const delayCS = Math.round(delay / 10);
    parts.push(new Uint8Array([
      0x21, 0xf9, 0x04,
      0x00, // no transparency
      delayCS & 0xff, (delayCS >> 8) & 0xff,
      0x00, // transparent color index
      0x00
    ]));

    // Image Descriptor
    const id = new Uint8Array(10);
    id[0] = 0x2c; // Image separator
    id[1] = 0; id[2] = 0; // left
    id[3] = 0; id[4] = 0; // top
    id[5] = w & 0xff; id[6] = (w >> 8) & 0xff;
    id[7] = h & 0xff; id[8] = (h >> 8) & 0xff;
    id[9] = 0x87; // Local color table, 256 colors (2^(7+1))
    parts.push(id);

    // Local Color Table (256 * 3 bytes)
    parts.push(palette);

    // LZW Minimum Code Size
    parts.push(new Uint8Array([8]));

    // LZW compressed data
    const lzwData = lzwEncode(8, indices);
    // Split into sub-blocks (max 255 bytes each)
    let offset = 0;
    while (offset < lzwData.length) {
      const blockSize = Math.min(255, lzwData.length - offset);
      parts.push(new Uint8Array([blockSize]));
      parts.push(lzwData.slice(offset, offset + blockSize));
      offset += blockSize;
    }
    // Block terminator
    parts.push(new Uint8Array([0x00]));
  }

  // Trailer
  parts.push(new Uint8Array([0x3b]));

  return new Blob(parts as BlobPart[], { type: "image/gif" });
}

function str2bytes(s: string): Uint8Array {
  const arr = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i);
  return arr;
}

// Simple median-cut color quantization to 256 colors
function quantize(
  data: Uint8ClampedArray,
  pixelCount: number
): { palette: Uint8Array; indices: Uint8Array } {
  // Build histogram of unique colors (sampled for performance)
  const colorMap = new Map<number, [number, number, number, number]>();
  const step = Math.max(1, Math.floor(pixelCount / 10000));

  for (let i = 0; i < pixelCount; i += step) {
    const idx = i * 4;
    const r = data[idx] >> 2;
    const g = data[idx + 1] >> 2;
    const b = data[idx + 2] >> 2;
    const key = (r << 12) | (g << 6) | b;
    if (!colorMap.has(key)) {
      colorMap.set(key, [data[idx], data[idx + 1], data[idx + 2], 1]);
    } else {
      colorMap.get(key)![3]++;
    }
  }

  // Get up to 256 representative colors
  const colors = Array.from(colorMap.values());
  colors.sort((a, b) => b[3] - a[3]);
  const paletteColors: [number, number, number][] = [];
  for (let i = 0; i < Math.min(256, colors.length); i++) {
    paletteColors.push([colors[i][0], colors[i][1], colors[i][2]]);
  }
  // Pad to 256
  while (paletteColors.length < 256) {
    paletteColors.push([0, 0, 0]);
  }

  // Build palette buffer
  const palette = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    palette[i * 3] = paletteColors[i][0];
    palette[i * 3 + 1] = paletteColors[i][1];
    palette[i * 3 + 2] = paletteColors[i][2];
  }

  // Map each pixel to nearest palette color
  const indices = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    let bestDist = Infinity;
    let bestIdx = 0;
    // Search only first 64 for speed (they're sorted by frequency)
    const searchLen = Math.min(64, paletteColors.length);
    for (let j = 0; j < searchLen; j++) {
      const dr = r - paletteColors[j][0];
      const dg = g - paletteColors[j][1];
      const db = b - paletteColors[j][2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = j;
        if (dist === 0) break;
      }
    }
    indices[i] = bestIdx;
  }

  return { palette, indices };
}

// LZW Encoder for GIF
function lzwEncode(minCodeSize: number, data: Uint8Array): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoi = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoi + 1;
  const maxCode = 4096;

  const output: number[] = [];
  let buffer = 0;
  let bufferLen = 0;

  function emit(code: number) {
    buffer |= code << bufferLen;
    bufferLen += codeSize;
    while (bufferLen >= 8) {
      output.push(buffer & 0xff);
      buffer >>= 8;
      bufferLen -= 8;
    }
  }

  // Init dictionary
  const dict = new Map<string, number>();
  function resetDict() {
    dict.clear();
    for (let i = 0; i < clearCode; i++) {
      dict.set(String(i), i);
    }
    nextCode = eoi + 1;
    codeSize = minCodeSize + 1;
  }

  emit(clearCode);
  resetDict();

  if (data.length === 0) {
    emit(eoi);
    if (bufferLen > 0) output.push(buffer & 0xff);
    return new Uint8Array(output);
  }

  let w = String(data[0]);

  for (let i = 1; i < data.length; i++) {
    const k = String(data[i]);
    const wk = w + "," + k;
    if (dict.has(wk)) {
      w = wk;
    } else {
      emit(dict.get(w)!);
      if (nextCode < maxCode) {
        dict.set(wk, nextCode++);
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        emit(clearCode);
        resetDict();
      }
      w = k;
    }
  }

  emit(dict.get(w)!);
  emit(eoi);

  if (bufferLen > 0) output.push(buffer & 0xff);

  return new Uint8Array(output);
}

// ─── Panoya Kopyala ───────────────────────────────────────────────────────────

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
}

// ─── Yardımcı ────────────────────────────────────────────────────────────────

function escapeHtml(char: string): string {
  return char
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/ /g, "&nbsp;");
}

function escapeJsString(s: string): string {
  // For embedding in JSON string safely; JSON.stringify handles most,
  // but we also neutralize closing script tags to be safe.
  return s.replace(/<\/script>/gi, "<\\/script>");
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}