import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { useStudioStore } from "../../store/studioStore";
import { imageToImageData } from "../../lib/image/loadImage";
import { imageDataToAscii, imageDataToAsciiText } from "../../lib/ascii/convert";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "../../utils/cn";
import { extractVideoFramesAsImageData } from "../../lib/media/videoFrames";
import { extractGifFramesAsImageData } from "../../lib/media/gifFrames";

// Debounce hook
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function AsciiPreview() {
  const {
    sourceImage,
    sourceKind,
    sourceObjectUrl,
    sourceDurationSec,
    settings,
    setResult,
    setAnimationResult,
    setIsProcessing,
    setProcessingProgress,
    result,
    animationResult,
    isProcessing,
    processingProgress,
    processingStatus,
  } = useStudioStore();

  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<"ascii" | "source">("ascii");
  const [playing, setPlaying] = useState(true);
  const [frameIndex, setFrameIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Ayarları debounce et — 150ms
  const debouncedSettings = useDebounced(settings, 150);
  const debouncedImage = useDebounced(sourceImage, 100);
  const debouncedKind = useDebounced(sourceKind, 50);
  const debouncedUrl = useDebounced(sourceObjectUrl, 80);
  const debouncedDuration = useDebounced(sourceDurationSec, 80);

  const isAnimatedSource = debouncedKind === "video" || debouncedKind === "gif";

  // ASCII Dönüştürme (statik veya animasyon)
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    // reset
    setAnimationResult(null);
    setProcessingProgress(0, "");

    if (!debouncedImage && !debouncedUrl) {
      setResult(null);
      return;
    }

    setIsProcessing(true);

    const run = async () => {
      try {
        if (!isAnimatedSource) {
          // Statik görsel
          const img = debouncedImage;
          if (!img) {
            setResult(null);
            return;
          }
          const imageData = imageToImageData(img);
          const asciiResult = imageDataToAscii(imageData, debouncedSettings);
          setResult(asciiResult);
          return;
        }

        // Animasyon (mono text-only; stabilite için)
        if (!debouncedUrl) {
          setResult(null);
          return;
        }

        const MAX_DURATION_SEC = 10;
        const MAX_FRAMES = 60;
        const MAX_DIMENSION = 480;
        const TARGET_FPS = 8;
        const BUDGET_MS = 8000;

        if (debouncedKind === "video") {
          if (debouncedDuration != null && debouncedDuration > MAX_DURATION_SEC) {
            throw new Error(`Video çok uzun. En fazla ${MAX_DURATION_SEC}s destekleniyor.`);
          }
        }

        const { frames, fps, durationSec } =
          debouncedKind === "video"
            ? await extractVideoFramesAsImageData(debouncedUrl, {
                maxFrames: MAX_FRAMES,
                maxDimension: MAX_DIMENSION,
                targetFps: TARGET_FPS,
                maxDurationSec: MAX_DURATION_SEC,
                signal,
                onProgress: (p, s) => setProcessingProgress(p * 0.4, s),
              })
            : await extractGifFramesAsImageData(debouncedUrl, {
                maxFrames: MAX_FRAMES,
                maxDimension: MAX_DIMENSION,
                signal,
                onProgress: (p, s) => setProcessingProgress(p * 0.4, s),
              });

        // Benchmark first 3 frames, then decide how many to keep
        const testCount = Math.min(3, frames.length);
        const t0 = performance.now();
        for (let i = 0; i < testCount; i++) {
          if (signal.aborted) throw new DOMException("Aborted", "AbortError");
          imageDataToAsciiText(frames[i], debouncedSettings);
        }
        const perFrame = (performance.now() - t0) / Math.max(1, testCount);
        const estTotal = perFrame * frames.length;

        let keptFrames = frames;
        let keptFps = fps;
        if (estTotal > BUDGET_MS && frames.length > 6) {
          const ratio = Math.min(0.8, BUDGET_MS / estTotal);
          const keep = Math.max(6, Math.floor(frames.length * ratio));
          const stride = Math.ceil(frames.length / keep);
          keptFrames = frames.filter((_, idx) => idx % stride === 0).slice(0, keep);
          keptFps = Math.max(1, Math.round((fps * keptFrames.length) / frames.length));
        }

        const framesText: string[] = [];
        const framesCells: import("../../types/studio").AsciiCell[][][] = [];
        let cols = 0;
        let rows = 0;
        for (let i = 0; i < keptFrames.length; i++) {
          if (signal.aborted) throw new DOMException("Aborted", "AbortError");
          setProcessingProgress(0.4 + (i / keptFrames.length) * 0.6, `ASCII frame ${i + 1}/${keptFrames.length}`);
          const out = imageDataToAscii(keptFrames[i], debouncedSettings);
          framesText.push(out.text);
          framesCells.push(out.cells);
          cols = out.cols;
          rows = out.rows;
        }

        setResult(null);
        setAnimationResult({
          kind: "animation",
          cols,
          rows,
          fps: keptFps,
          frameCount: framesText.length,
          framesText,
          framesCells,
        });
        setFrameIndex(0);
        setPlaying(true);
        void durationSec;
      } catch (err) {
        console.error("ASCII dönüştürme hatası:", err);
        setResult(null);
        setAnimationResult(null);
      } finally {
        setIsProcessing(false);
        setProcessingProgress(0, "");
      }
    };

    void run();

    return () => abortRef.current?.abort();
  }, [
    debouncedImage,
    debouncedKind,
    debouncedUrl,
    debouncedDuration,
    debouncedSettings,
    isAnimatedSource,
    setAnimationResult,
    setIsProcessing,
    setProcessingProgress,
    setResult,
  ]);

  // Animasyon oynatma
  useEffect(() => {
    if (!animationResult || !playing) return;
    const interval = window.setInterval(() => {
      setFrameIndex((i) => (i + 1) % animationResult.frameCount);
    }, 1000 / Math.max(1, animationResult.fps));
    return () => window.clearInterval(interval);
  }, [animationResult, playing]);

  const activeAsciiText = useMemo(() => {
    if (!animationResult) return null;
    return animationResult.framesText[Math.max(0, Math.min(frameIndex, animationResult.frameCount - 1))] ?? "";
  }, [animationResult, frameIndex]);

  const activeFrameCells = useMemo(() => {
    if (!animationResult?.framesCells) return null;
    const idx = Math.max(0, Math.min(frameIndex, animationResult.frameCount - 1));
    return animationResult.framesCells[idx] ?? null;
  }, [animationResult, frameIndex]);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 4)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.25)), []);
  const handleZoomReset = useCallback(() => setZoom(1), []);

  // Boş state
  if (!sourceImage && !sourceObjectUrl) {
    return (
      <EmptyState />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Üst Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-panel flex-shrink-0">
        {/* Sol: Görünüm seçici */}
        <div className="flex items-center gap-1 bg-surface rounded-lg p-1">
          <button
            onClick={() => setViewMode("ascii")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-all",
              viewMode === "ascii"
                ? "bg-accent text-black"
                : "text-text-muted hover:text-text"
            )}
          >
            ASCII
          </button>
          <button
            onClick={() => setViewMode("source")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-all",
              viewMode === "source"
                ? "bg-accent text-black"
                : "text-text-muted hover:text-text"
            )}
          >
            Kaynak
          </button>
        </div>

        {/* Orta: İşleniyor göstergesi */}
        <div className="flex items-center gap-2">
          {isProcessing && (
            <div className="flex items-center gap-1.5 text-xs text-text-dim">
              <span className="w-3 h-3 rounded-full border border-accent border-t-transparent animate-spin" />
              {processingStatus || "İşleniyor..."}
            </div>
          )}
          {processingProgress > 0 && isProcessing && (
            <span className="text-[10px] text-text-dim font-mono">
              {Math.round(processingProgress * 100)}%
            </span>
          )}
          {result && !isProcessing && (
            <span className="text-[10px] text-text-dim font-mono">
              {result.cols} × {result.rows}
            </span>
          )}
          {animationResult && !isProcessing && (
            <span className="text-[10px] text-text-dim font-mono">
              {animationResult.cols} × {animationResult.rows} — {animationResult.frameCount}f @ {animationResult.fps}fps
            </span>
          )}
        </div>

        {/* Sağ: Zoom kontrolleri */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="h-6 w-6 rounded flex items-center justify-center text-text-dim hover:text-text hover:bg-surface transition-all"
          >
            <ZoomOut size={12} />
          </button>
          <button
            onClick={handleZoomReset}
            className="px-2 h-6 text-[10px] font-mono text-text-dim hover:text-text transition-colors tabular-nums"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="h-6 w-6 rounded flex items-center justify-center text-text-dim hover:text-text hover:bg-surface transition-all"
          >
            <ZoomIn size={12} />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => setZoom(1)}
            className="h-6 w-6 rounded flex items-center justify-center text-text-dim hover:text-text hover:bg-surface transition-all"
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      {/* Önizleme Alanı */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative"
        style={{ background: settings.background }}
      >
        <div
          className="flex items-start justify-start p-4 min-w-full min-h-full"
          style={{ transformOrigin: "top left" }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              transition: "transform 0.15s ease",
            }}
          >
            {viewMode === "source" ? (
              /* Kaynak Görsel */
              sourceImage ? (
                <img
                  src={sourceImage.src}
                  alt="Kaynak"
                  className="max-w-full block"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : sourceKind === "video" && sourceObjectUrl ? (
                <video
                  src={sourceObjectUrl}
                  className="max-w-full block"
                  muted
                  playsInline
                  controls
                />
              ) : sourceKind === "gif" && sourceObjectUrl ? (
                <img
                  src={sourceObjectUrl}
                  alt="Kaynak GIF"
                  className="max-w-full block"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : null
            ) : (
              /* ASCII Önizleme */
              <div ref={previewRef}>
                {animationResult ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPlaying((p) => !p)}
                        className="px-2 py-1 text-[11px] rounded border border-border bg-surface text-text-muted hover:text-text hover:border-border-hover transition-colors"
                      >
                        {playing ? "Duraklat" : "Oynat"}
                      </button>
                      <span className="text-[10px] text-text-dim font-mono">
                        Frame {frameIndex + 1}/{animationResult.frameCount}
                      </span>
                    </div>
                    <pre
                      style={{
                        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                        fontSize: `${settings.fontSize}px`,
                        lineHeight: settings.lineHeight,
                        letterSpacing: "0",
                        whiteSpace: "pre",
                        color: settings.foreground,
                        userSelect: "text",
                        margin: 0,
                        padding: 0,
                        display: "block",
                      }}
                      aria-label="ASCII animasyon çıktısı"
                    >
                      {settings.mode === "color" && activeFrameCells
                        ? activeFrameCells.map((row, y) => (
                            <span key={y} style={{ display: "block" }}>
                              {row.map((cell, x) => (
                                <span key={x} style={{ color: cell.color }}>
                                  {cell.char}
                                </span>
                              ))}
                            </span>
                          ))
                        : (activeAsciiText ?? "")}
                    </pre>
                  </div>
                ) : result ? (
                  <AsciiRenderer result={result} settings={settings} />
                ) : (
                  <div className="text-text-dim text-xs font-mono">
                    Yükleniyor...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ASCII Renderer ───────────────────────────────────────────────────────────

function AsciiRenderer({
  result,
  settings,
}: {
  result: import("../../types/studio").AsciiResult;
  settings: import("../../types/studio").AsciiSettings;
}) {
  const { fontSize, lineHeight, mode, foreground } = settings;

  return (
    <pre
      style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight,
        letterSpacing: "0",
        whiteSpace: "pre",
        color: foreground,
        userSelect: "text",
        margin: 0,
        padding: 0,
        display: "block",
      }}
      aria-label="ASCII art çıktısı"
    >
      {result.cells.map((row, y) => (
        <span key={y} style={{ display: "block" }}>
          {row.map((cell, x) =>
            mode === "color" ? (
              <span key={x} style={{ color: cell.color }}>
                {cell.char}
              </span>
            ) : (
              cell.char
            )
          )}
        </span>
      ))}
    </pre>
  );
}

// ─── Boş State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full select-none">
      <div className="text-center space-y-4 max-w-sm">
        {/* ASCII Art Logo */}
        <pre
          className="text-[8px] leading-tight font-mono mx-auto inline-block"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: "#24242a",
          }}
        >
{`  █████╗  ███████╗ ██████╗ ██╗██╗
 ██╔══██╗ ██╔════╝██╔════╝ ██║██║
 ███████║ ███████╗██║      ██║██║
 ██╔══██║ ╚════██║██║      ██║██║
 ██║  ██║ ███████║╚██████╗ ██║██║
 ╚═╝  ╚═╝ ╚══════╝ ╚═════╝ ╚═╝╚═╝`}
        </pre>

        <div className="space-y-1">
          <p className="text-text-muted text-sm font-medium">
            ASCII Studio hazır
          </p>
          <p className="text-text-dim text-xs">
            Sol panelden görsel yükle, fırça ile çiz
            <br />
            ya da bir preset seç — sonuç burada görünür
          </p>
        </div>

        {/* İnce gözlemci grid efekti */}
        <div className="grid grid-cols-8 gap-1 opacity-20">
          {"@%#*+=-:.".split("").map((c, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-mono text-accent"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
