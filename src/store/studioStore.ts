import { create } from "zustand";
import type {
  StudioState,
  AsciiSettings,
  ActiveView,
  ActiveTool,
  Preset,
  DrawSettings,
  SourceKind,
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
  sourceKind: "image",
  sourceObjectUrl: null,
  sourceDurationSec: null,
  settings: DEFAULT_SETTINGS,
  result: null,
  animationResult: null,
  isProcessing: false,
  processingProgress: 0,
  processingStatus: "",
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
      sourceKind: "image",
      sourceObjectUrl: null,
      sourceDurationSec: null,
      result: null,
      animationResult: null,
      activeTool: "upload",
    }),

  setSourceMedia: (kind: SourceKind, fileOrUrl: File | string, name: string, durationSec = null) => {
    const { sourceObjectUrl } = get();
    if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);

    const url = typeof fileOrUrl === "string" ? fileOrUrl : URL.createObjectURL(fileOrUrl);
    set({
      sourceImage: null,
      sourceImageName: name,
      sourceKind: kind,
      sourceObjectUrl: url,
      sourceDurationSec: durationSec,
      result: null,
      animationResult: null,
      activeTool: "upload",
      processingProgress: 0,
      processingStatus: "",
    });
  },

  clearSourceImage: () =>
    set((state) => {
      if (state.sourceObjectUrl) URL.revokeObjectURL(state.sourceObjectUrl);
      return {
        sourceImage: null,
        sourceImageName: "",
        sourceKind: "image",
        sourceObjectUrl: null,
        sourceDurationSec: null,
        result: null,
        animationResult: null,
        processingProgress: 0,
        processingStatus: "",
      };
    }),

  // ── Ayarlar ────────────────────────────────────────────
  updateSettings: (partial: Partial<AsciiSettings>) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  // ── Sonuç ──────────────────────────────────────────────
  setResult: (result) => set({ result }),

  setAnimationResult: (animationResult) => set({ animationResult }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  setProcessingProgress: (processingProgress, status = "") =>
    set({ processingProgress, processingStatus: status }),

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
