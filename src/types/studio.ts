// ─── Temel Tipler ────────────────────────────────────────────────────────────

export type AsciiMode = "mono" | "color";

export type ExportFormat = "txt" | "png" | "svg" | "html";

export type ActiveTool = "upload" | "draw" | "presets";

export type ActiveView = "home" | "studio";

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

  // Ayarlar
  settings: AsciiSettings;

  // Sonuç
  result: AsciiResult | null;
  isProcessing: boolean;

  // Çizim
  drawSettings: DrawSettings;
  drawHistory: ImageData[];
  drawHistoryIndex: number;

  // Actions
  setActiveView: (view: ActiveView) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setSourceImage: (img: HTMLImageElement, name: string) => void;
  clearSourceImage: () => void;
  updateSettings: (partial: Partial<AsciiSettings>) => void;
  setResult: (result: AsciiResult | null) => void;
  setIsProcessing: (v: boolean) => void;
  applyPreset: (preset: Preset) => void;
  updateDrawSettings: (partial: Partial<DrawSettings>) => void;
  pushDrawHistory: (data: ImageData) => void;
  undoDraw: () => ImageData | null;
  redoDraw: () => ImageData | null;
}
