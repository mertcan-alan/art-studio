// ─── Temel Tipler ────────────────────────────────────────────────────────────

export type AsciiMode = "mono" | "color";

export type ExportFormat = "txt" | "png" | "svg" | "html";

export type ActiveTool = "upload" | "draw" | "presets";

export type ActiveView = "home" | "studio";

export type SourceKind = "image" | "video" | "gif";

// ─── Karakter Setleri ────────────────────────────────────────────────────────

export interface CharsetOption {
  id: string;
  name: string;
  chars: string;
  description: string;
}

// ─── Preset Tipi ─────────────────────────────────────────────────────────────

export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: Partial<AsciiSettings>;
  bg: string;
  fg: string;
}

// ─── Ayarlar ─────────────────────────────────────────────────────────────────

export interface AsciiSettings {
  width: number;
  charsetId: string;
  customCharset: string;
  invert: boolean;
  contrast: number;
  brightness: number;
  gamma: number;
  mode: AsciiMode;
  background: string;
  foreground: string;
  fontSize: number;
  lineHeight: number;
  dithering: boolean;
  colorSaturation: number;
}

// ─── ASCII Hücre / Sonuç ─────────────────────────────────────────────────────

export interface AsciiCell {
  char: string;
  color: string;
}

export interface AsciiResult {
  text: string;
  rows: number;
  cols: number;
  cells: AsciiCell[][];
}

export interface AsciiAnimationResult {
  kind: "animation";
  cols: number;
  rows: number;
  fps: number;
  frameCount: number;
  framesText: string[];
  framesCells?: AsciiCell[][][]; // her frame için renkli hücre matrisi
}

// ─── Efekt Tipleri ───────────────────────────────────────────────────────────

export type EffectType =
  | "none"
  | "fisheye"
  | "barrel"
  | "vignette"
  | "scanlines"
  | "glitch"
  | "pixelate"
  | "blur"
  | "edge_glow"
  | "chromatic"
  | "crt";

export interface EffectSettings {
  type: EffectType;
  intensity: number; // 0..1
}

// ─── Çizim Aracı ─────────────────────────────────────────────────────────────

export type DrawTool = "brush" | "eraser" | "line" | "rect" | "circle" | "fill";

export interface DrawSettings {
  tool: DrawTool;
  color: string;
  size: number;
  opacity: number;
}

// ─── Studio Store State ───────────────────────────────────────────────────────

export interface StudioState {
  // Görünüm
  activeView: ActiveView;
  activeTool: ActiveTool;

  // Görsel
  sourceImage: HTMLImageElement | null;
  sourceImageName: string;
  sourceKind: SourceKind;
  sourceObjectUrl: string | null;
  sourceDurationSec: number | null;

  // Ayarlar
  settings: AsciiSettings;

  // Efektler
  effectSettings: EffectSettings;

  // Sonuç
  result: AsciiResult | null;
  animationResult: AsciiAnimationResult | null;
  isProcessing: boolean;
  processingProgress: number; // 0..1
  processingStatus: string;

  // Çizim
  drawSettings: DrawSettings;
  drawHistory: ImageData[];
  drawHistoryIndex: number;

  // Actions
  setActiveView: (view: ActiveView) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setSourceImage: (img: HTMLImageElement, name: string) => void;
  setSourceMedia: (kind: SourceKind, fileOrUrl: File | string, name: string, durationSec?: number | null) => void;
  clearSourceImage: () => void;
  updateSettings: (partial: Partial<AsciiSettings>) => void;
  updateEffectSettings: (partial: Partial<EffectSettings>) => void;
  setResult: (result: AsciiResult | null) => void;
  setAnimationResult: (result: AsciiAnimationResult | null) => void;
  setIsProcessing: (v: boolean) => void;
  setProcessingProgress: (progress: number, status?: string) => void;
  applyPreset: (preset: Preset) => void;
  updateDrawSettings: (partial: Partial<DrawSettings>) => void;
  pushDrawHistory: (data: ImageData) => void;
  undoDraw: () => ImageData | null;
  redoDraw: () => ImageData | null;
}
