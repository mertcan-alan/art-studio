import type { AsciiResult, AsciiSettings, AsciiCell } from "../../types/studio";
import { getCharsetById } from "../charsets";

// ─── Parlaklık Hesaplama ──────────────────────────────────────────────────────

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function applyContrast(value: number, contrast: number): number {
  return (value - 128) * contrast + 128;
}

function applyBrightness(value: number, brightness: number): number {
  return value + brightness;
}

function applyGamma(value: number, gamma: number): number {
  return 255 * Math.pow(value / 255, 1 / gamma);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, value));
}

// ─── Renk Doygunluğu ─────────────────────────────────────────────────────────

function saturate(r: number, g: number, b: number, factor: number): [number, number, number] {
  const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return [
    clamp(gray + (r - gray) * factor),
    clamp(gray + (g - gray) * factor),
    clamp(gray + (b - gray) * factor),
  ];
}

// ─── Blok Ortalaması ──────────────────────────────────────────────────────────

function getBlockAverage(
  data: Uint8ClampedArray,
  srcWidth: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { r: number; g: number; b: number; a: number; lum: number; count: number } {
  let totalR = 0, totalG = 0, totalB = 0, totalLum = 0, count = 0;

  for (let py = startY; py < endY; py++) {
    for (let px = startX; px < endX; px++) {
      const idx = (py * srcWidth + px) * 4;
      const a = data[idx + 3];
      if (a < 10) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      totalR += r;
      totalG += g;
      totalB += b;
      totalLum += getLuminance(r, g, b);
      count++;
    }
  }

  if (count === 0) {
    return { r: 255, g: 255, b: 255, a: 0, lum: 255, count: 0 };
  }

  return {
    r: totalR / count,
    g: totalG / count,
    b: totalB / count,
    a: 255,
    lum: totalLum / count,
    count,
  };
}

// ─── Ana Dönüştürücü ──────────────────────────────────────────────────────────

export function imageDataToAscii(
  imageData: ImageData,
  settings: AsciiSettings
): AsciiResult {
  const {
    width: outputWidth,
    charsetId,
    customCharset,
    invert,
    contrast,
    brightness,
    gamma,
    mode,
    foreground,
    colorSaturation,
  } = settings;

  // Karakter setini belirle
  const charsetOption = getCharsetById(charsetId);
  const charset =
    charsetId === "custom" && customCharset.length > 0
      ? customCharset
      : charsetOption.chars;

  if (charset.length === 0) {
    return { text: "", rows: 0, cols: 0, cells: [] };
  }

  const srcWidth = imageData.width;
  const srcHeight = imageData.height;

  // Çıktı boyutları — karakter oranı 0.55 (monospace genişlik/yükseklik)
  const charAspect = 0.55;
  const cols = Math.max(10, Math.min(outputWidth, 500));
  const rows = Math.max(5, Math.round((cols * srcHeight) / srcWidth * charAspect));

  const blockW = srcWidth / cols;
  const blockH = srcHeight / rows;

  const textRows: string[] = [];
  const cells: AsciiCell[][] = [];

  for (let y = 0; y < rows; y++) {
    let rowText = "";
    const rowCells: AsciiCell[] = [];

    for (let x = 0; x < cols; x++) {
      const startX = Math.floor(x * blockW);
      const startY = Math.floor(y * blockH);
      const endX = Math.min(Math.floor((x + 1) * blockW), srcWidth);
      const endY = Math.min(Math.floor((y + 1) * blockH), srcHeight);

      const avg = getBlockAverage(imageData.data, srcWidth, startX, startY, endX, endY);

      // Parlaklığı uygula
      let lum = avg.lum;
      lum = applyContrast(lum, contrast);
      lum = applyBrightness(lum, brightness);
      lum = applyGamma(clamp(lum), gamma);
      lum = clamp(lum);

      if (invert) lum = 255 - lum;

      // Karakter seç
      const charIdx = Math.floor((lum / 255) * (charset.length - 1));
      const char = charset[charIdx];

      // Renk
      let color = foreground;
      if (mode === "color" && avg.count > 0) {
        let [r, g, b] = [avg.r, avg.g, avg.b];
        if (colorSaturation !== 1) {
          [r, g, b] = saturate(r, g, b, colorSaturation);
        }
        color = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
      }

      rowText += char;
      rowCells.push({ char, color });
    }

    textRows.push(rowText);
    cells.push(rowCells);
  }

  return {
    text: textRows.join("\n"),
    rows,
    cols,
    cells,
  };
}
