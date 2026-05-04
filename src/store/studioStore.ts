import { create } from "zustand";
import type {
  StudioState,
  AsciiSettings,
  ActiveView,
  ActiveTool,
  Preset,
  DrawSettings,
} from "../types/studio";

// ─── Varsayılan Ayarlar ───────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AsciiSettings = {
  width: 120,
  charsetId: "detailed",
  customCharset: "",
  invert: false,
  contrast: 1.1,
  brightness: 0,
  gamma: 1.0,
  mode: "mono",
  background: "#0d1117",
  foreground: "#c9d1d9",
  fontSize: 11,
  lineHeight: 1.2,
  dithering: false,
  colorSaturation: 1.2,
};

const DEFAULT_DRAW_SETTINGS: DrawSettings = {
  tool: "brush",
  color: "#ffffff",
  size: 8,
  opacity: 1,
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStudioStore = create<StudioState>((set, get) => ({
  // ── State ──────────────────────────────────────────────
  activeView: "home",
  activeTool: "upload",
  sourceImage: null,
  sourceImageName: "",
  settings: DEFAULT_SETTINGS,
  result: null,
  isProcessing: false,
  drawSettings: DEFAULT_DRAW_SETTINGS,
  drawHistory: [],
  drawHistoryIndex: -1,

  // ── Görünüm ────────────────────────────────────────────
  setActiveView: (view: ActiveView) => set({ activeView: view }),

  setActiveTool: (tool: ActiveTool) => set({ activeTool: tool }),

  // ── Görsel ─────────────────────────────────────────────
  setSourceImage: (img: HTMLImageElement, name: string) =>
    set({
      sourceImage: img,
      sourceImageName: name,
      result: null,
      activeTool: "upload",
    }),

  clearSourceImage: () =>
    set({
      sourceImage: null,
      sourceImageName: "",
      result: null,
    }),

  // ── Ayarlar ────────────────────────────────────────────
  updateSettings: (partial: Partial<AsciiSettings>) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  // ── Sonuç ──────────────────────────────────────────────
  setResult: (result) => set({ result }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  // ── Preset ─────────────────────────────────────────────
  applyPreset: (preset: Preset) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...preset.settings,
        background: preset.bg,
        foreground: preset.fg,
      },
    })),

  // ── Çizim ──────────────────────────────────────────────
  updateDrawSettings: (partial: Partial<DrawSettings>) =>
    set((state) => ({
      drawSettings: { ...state.drawSettings, ...partial },
    })),

  pushDrawHistory: (data: ImageData) => {
    const { drawHistory, drawHistoryIndex } = get();
    // İlerideki history'yi sil
    const newHistory = drawHistory.slice(0, drawHistoryIndex + 1);
    newHistory.push(data);
    // Max 30 adım
    if (newHistory.length > 30) newHistory.shift();
    set({
      drawHistory: newHistory,
      drawHistoryIndex: newHistory.length - 1,
    });
  },

  undoDraw: () => {
    const { drawHistory, drawHistoryIndex } = get();
    if (drawHistoryIndex <= 0) return null;
    const newIndex = drawHistoryIndex - 1;
    set({ drawHistoryIndex: newIndex });
    return drawHistory[newIndex];
  },

  redoDraw: () => {
    const { drawHistory, drawHistoryIndex } = get();
    if (drawHistoryIndex >= drawHistory.length - 1) return null;
    const newIndex = drawHistoryIndex + 1;
    set({ drawHistoryIndex: newIndex });
    return drawHistory[newIndex];
  },
}));
