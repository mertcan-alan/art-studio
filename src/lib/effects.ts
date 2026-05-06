import type { EffectType } from "../types/studio";

// ─── Efekt Uygulama ──────────────────────────────────────────────────────────

/**
 * Canvas üzerine seçilen efekti uygular.
 * Orijinal canvas'ı mutate eder.
 */
export function applyEffectToCanvas(
  canvas: HTMLCanvasElement,
  effectType: EffectType,
  intensity: number
): void {
  if (effectType === "none" || intensity <= 0) return;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);

  switch (effectType) {
    case "fisheye":
      applyFisheye(ctx, imageData, w, h, intensity);
      break;
    case "barrel":
      applyBarrel(ctx, imageData, w, h, intensity);
      break;
    case "vignette":
      applyVignette(ctx, w, h, intensity);
      break;
    case "scanlines":
      applyScanlines(ctx, w, h, intensity);
      break;
    case "glitch":
      applyGlitch(ctx, imageData, w, h, intensity);
      break;
    case "pixelate":
      applyPixelate(ctx, w, h, intensity);
      break;
    case "blur":
      applyBlur(ctx, imageData, w, h, intensity);
      break;
    case "edge_glow":
      applyEdgeGlow(ctx, imageData, w, h, intensity);
      break;
    case "chromatic":
      applyChromatic(ctx, imageData, w, h, intensity);
      break;
    case "crt":
      applyCRT(ctx, imageData, w, h, intensity);
      break;
  }
}

// ─── Efekt Açıklamaları ──────────────────────────────────────────────────────

export const EFFECT_DESCRIPTIONS: Record<EffectType, { name: string; icon: string; description: string }> = {
  none: { name: "Yok", icon: "⚪", description: "Efekt yok" },
  fisheye: { name: "Balık Gözü", icon: "🐟", description: "Merkezden dışa doğru büyütme" },
  barrel: { name: "Fıçı", icon: "🛢️", description: "Silindirik bükülme efekti" },
  vignette: { name: "Vinyet", icon: "🔲", description: "Kenarları karartma efekti" },
  scanlines: { name: "Tarama Çizgileri", icon: "📺", description: "CRT tarzı yatay çizgiler" },
  glitch: { name: "Glitch", icon: "⚡", description: "Dijital bozulma efekti" },
  pixelate: { name: "Pikselleştir", icon: "🔳", description: "Bloklu piksel efekti" },
  blur: { name: "Bulanıklık", icon: "💨", description: "Yumuşak bulanıklık efekti" },
  edge_glow: { name: "Kenar Parıltısı", icon: "✨", description: "Kenarları parlatan neon efekti" },
  chromatic: { name: "Kromatik", icon: "🌈", description: "Renk kanalı kayma efekti" },
  crt: { name: "CRT Monitör", icon: "🖥️", description: "Eski CRT monitör simülasyonu" },
};

// ─── Efekt İmplementasyonları ────────────────────────────────────────────────

function applyFisheye(
  ctx: CanvasRenderingContext2D,
  src: ImageData,
  w: number,
  h: number,
  intensity: number
): void {
  const dst = ctx.createImageData(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  const power = 1 + intensity * 2;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const theta = Math.atan2(dy, dx);
      const nr = Math.pow(r, power) * maxR / Math.max(cx, cy);
      const sx = Math.round(cx + nr * Math.cos(theta));
      const sy = Math.round(cy + nr * Math.sin(theta));

      const di = (y * w + x) * 4;
      if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
        const si = (sy * w + sx) * 4;
        dst.data[di] = src.data[si];
        dst.data[di + 1] = src.data[si + 1];
        dst.data[di + 2] = src.data[si + 2];
        dst.data[di + 3] = src.data[si + 3];
      } else {
        dst.data[di + 3] = 0;
      }
    }
  }
  ctx.putImageData(dst, 0, 0);
}

function applyBarrel(
  ctx: CanvasRenderingContext2D,
  src: ImageData,
  w: number,
  h: number,
  intensity: number
): void {
  const dst = ctx.createImageData(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const k = intensity * 0.5;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const r2 = dx * dx + dy * dy;
      const f = 1 + k * r2;
      const sx = Math.round(cx + dx * f * cx);
      const sy = Math.round(cy + dy * f * cy);

      const di = (y * w + x) * 4;
      if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
        const si = (sy * w + sx) * 4;
        dst.data[di] = src.data[si];
        dst.data[di + 1] = src.data[si + 1];
        dst.data[di + 2] = src.data[si + 2];
        dst.data[di + 3] = src.data[si + 3];
      }
    }
  }
  ctx.putImageData(dst, 0, 0);
}

function applyVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number
): void {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  const gradient = ctx.createRadialGradient(cx, cy, maxR * (0.3 + (1 - intensity) * 0.4), cx, cy, maxR);
  gradient.addColorStop(0, `rgba(0,0,0,0)`);
  gradient.addColorStop(1, `rgba(0,0,0,${0.3 + intensity * 0.6})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function applyScanlines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number
): void {
  const spacing = Math.max(2, Math.round(4 - intensity * 2));
  ctx.fillStyle = `rgba(0,0,0,${0.15 + intensity * 0.35})`;
  for (let y = 0; y < h; y += spacing) {
    ctx.fillRect(0, y, w, 1);
  }
}

function applyGlitch(
  ctx: CanvasRenderingContext2D,
  src: ImageData,
  w: number,
  h: number,
  intensity: number
): void {
  ctx.putImageData(src, 0, 0);
  const sliceCount = Math.floor(3 + intensity * 12);
  for (let i = 0; i < sliceCount; i++) {
    const y = Math.floor(Math.random() * h);
    const sliceH = Math.floor(2 + Math.random() * (10 * intensity));
    const offset = Math.floor((Math.random() - 0.5) * w * intensity * 0.3);
    const slice = ctx.getImageData(0, y, w, Math.min(sliceH, h - y));
    ctx.putImageData(slice, offset, y);
  }
}

function applyPixelate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number
): void {
  const size = Math.max(2, Math.floor(2 + intensity * 14));
  ctx.imageSmoothingEnabled = false;

  const tempCanvas = document.createElement("canvas");
  const sw = Math.max(1, Math.floor(w / size));
  const sh = Math.max(1, Math.floor(h / size));
  tempCanvas.width = sw;
  tempCanvas.height = sh;
  const tCtx = tempCanvas.getContext("2d")!;
  tCtx.drawImage(ctx.canvas, 0, 0, sw, sh);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(tempCanvas, 0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
}

function applyBlur(
  ctx: CanvasRenderingContext2D,
  _src: ImageData,
  w: number,
  h: number,
  intensity: number
): void {
  const radius = Math.max(1, Math.round(intensity * 6));
  ctx.filter = `blur(${radius}px)`;
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tCtx = tempCanvas.getContext("2d")!;
  tCtx.drawImage(ctx.canvas, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.filter = "none";
}

function applyEdgeGlow(
  ctx: CanvasRenderingContext2D,
  src: ImageData,
  w: number,
  h: number,
  intensity: number
): void {
  // Sobel-like edge detection + glow overlay
  const edges = ctx.createImageData(w, h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const l = src.data[((y) * w + (x - 1)) * 4];
      const r = src.data[((y) * w + (x + 1)) * 4];
      const t = src.data[((y - 1) * w + x) * 4];
      const b = src.data[((y + 1) * w + x) * 4];
      const edge = Math.min(255, Math.abs(l - r) + Math.abs(t - b));
      const val = edge * (0.5 + intensity);
      edges.data[idx] = Math.min(255, val * 0.3);
      edges.data[idx + 1] = Math.min(255, val * 0.8);
      edges.data[idx + 2] = Math.min(255, val);
      edges.data[idx + 3] = Math.min(255, val * intensity);
    }
  }
  // Draw edges as overlay
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tCtx = tempCanvas.getContext("2d")!;
  tCtx.putImageData(edges, 0, 0);
  ctx.globalCompositeOperation = "screen";
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}

function applyChromatic(
  ctx: CanvasRenderingContext2D,
  src: ImageData,
  w: number,
  h: number,
  intensity: number
): void {
  const offset = Math.max(1, Math.round(intensity * 6));
  const dst = ctx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const di = (y * w + x) * 4;
      // Red channel shifted left
      const rxl = Math.max(0, x - offset);
      const rl = (y * w + rxl) * 4;
      // Blue channel shifted right
      const rxr = Math.min(w - 1, x + offset);
      const rr = (y * w + rxr) * 4;

      dst.data[di] = src.data[rl];         // Red from left
      dst.data[di + 1] = src.data[di + 1]; // Green stays
      dst.data[di + 2] = src.data[rr + 2]; // Blue from right
      dst.data[di + 3] = src.data[di + 3];
    }
  }
  ctx.putImageData(dst, 0, 0);
}

function applyCRT(
  ctx: CanvasRenderingContext2D,
  src: ImageData,
  w: number,
  h: number,
  intensity: number
): void {
  // Barrel distortion
  applyBarrel(ctx, src, w, h, intensity * 0.3);
  // Scanlines
  applyScanlines(ctx, w, h, intensity * 0.6);
  // Vignette
  applyVignette(ctx, w, h, intensity * 0.8);
  // Slight chromatic aberration
  const updated = ctx.getImageData(0, 0, w, h);
  applyChromatic(ctx, updated, w, h, intensity * 0.3);
}
