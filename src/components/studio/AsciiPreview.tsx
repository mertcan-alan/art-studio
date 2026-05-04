import { useEffect, useRef, useCallback, useState } from "react";
import { useStudioStore } from "../../store/studioStore";
import { imageToImageData } from "../../lib/image/loadImage";
import { imageDataToAscii } from "../../lib/ascii/convert";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "../../utils/cn";

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
  const { sourceImage, settings, setResult, setIsProcessing, result, isProcessing } =
    useStudioStore();

  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<"ascii" | "source">("ascii");
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Ayarları debounce et — 150ms
  const debouncedSettings = useDebounced(settings, 150);
  const debouncedImage = useDebounced(sourceImage, 100);

  // ASCII Dönüştürme
  useEffect(() => {
    if (!debouncedImage) {
      setResult(null);
      return;
    }

    setIsProcessing(true);

    // Asenkron frame
    const raf = requestAnimationFrame(() => {
      try {
        const imageData = imageToImageData(debouncedImage);
        const asciiResult = imageDataToAscii(imageData, debouncedSettings);
        setResult(asciiResult);
      } catch (err) {
        console.error("ASCII dönüştürme hatası:", err);
        setResult(null);
      } finally {
        setIsProcessing(false);
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [debouncedImage, debouncedSettings, setResult, setIsProcessing]);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 4)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.25)), []);
  const handleZoomReset = useCallback(() => setZoom(1), []);

  // Boş state
  if (!sourceImage) {
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
              İşleniyor...
            </div>
          )}
          {result && !isProcessing && (
            <span className="text-[10px] text-text-dim font-mono">
              {result.cols} × {result.rows}
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
              <img
                src={sourceImage.src}
                alt="Kaynak"
                className="max-w-full block"
                style={{ imageRendering: "pixelated" }}
              />
            ) : (
              /* ASCII Önizleme */
              <div ref={previewRef}>
                {result ? (
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
