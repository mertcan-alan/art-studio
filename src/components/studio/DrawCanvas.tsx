import { useRef, useEffect, useCallback, useState } from "react";
import { Brush, Eraser, Minus, Square, Circle, PaintBucket, Undo2, Redo2, Trash2 } from "lucide-react";
import { useStudioStore } from "../../store/studioStore";
import { canvasToImageData } from "../../lib/image/loadImage";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { cn } from "../../utils/cn";
import type { DrawTool } from "../../types/studio";

const CANVAS_W = 600;
const CANVAS_H = 400;

export function DrawCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const lineStartRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  const {
    drawSettings,
    updateDrawSettings,
    setSourceImage,
    pushDrawHistory,
    undoDraw,
    redoDraw,
  } = useStudioStore();

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Canvas'ı başlat
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // İlk history push
    pushDrawHistory(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H));
  }, []);

  const getPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;

      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const pos = getPos(e);

      isDrawingRef.current = true;
      lastPosRef.current = pos;
      lineStartRef.current = pos;
      snapshotRef.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);

      if (drawSettings.tool === "fill") {
        smartFloodFill(ctx, Math.round(pos.x), Math.round(pos.y), drawSettings.color, {
          tolerance: 42,
          includeAlpha: true,
        });
        pushDrawHistory(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H));
        isDrawingRef.current = false;
      }
    },
    [drawSettings, getPos, pushDrawHistory]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const pos = getPos(e);
      const { tool, color, size, opacity } = drawSettings;

      ctx.globalAlpha = opacity;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (tool === "brush" || tool === "eraser") {
        ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
        ctx.strokeStyle = color;
        ctx.beginPath();
        if (lastPosRef.current) {
          ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
          ctx.lineTo(pos.x, pos.y);
        }
        ctx.stroke();
        lastPosRef.current = pos;
      } else if (tool === "line" || tool === "rect" || tool === "circle") {
        // Snapshot'tan geri dön
        if (snapshotRef.current) {
          ctx.putImageData(snapshotRef.current, 0, 0);
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.beginPath();

        const start = lineStartRef.current!;

        if (tool === "line") {
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        } else if (tool === "rect") {
          ctx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
        } else if (tool === "circle") {
          const rx = Math.abs(pos.x - start.x) / 2;
          const ry = Math.abs(pos.y - start.y) / 2;
          const cx = start.x + (pos.x - start.x) / 2;
          const cy = start.y + (pos.y - start.y) / 2;
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    },
    [drawSettings, getPos]
  );

  const endDraw = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPosRef.current = null;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    pushDrawHistory(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H));
    setCanUndo(true);
    setCanRedo(false);
  }, [pushDrawHistory]);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const data = undoDraw();
    if (data) {
      ctx.putImageData(data, 0, 0);
      setCanUndo(true);
      setCanRedo(true);
    }
  }, [undoDraw]);

  const handleRedo = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const data = redoDraw();
    if (data) {
      ctx.putImageData(data, 0, 0);
      setCanRedo(true);
    }
  }, [redoDraw]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    pushDrawHistory(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H));
  }, [pushDrawHistory]);

  const convertToAscii = useCallback(() => {
    const canvas = canvasRef.current!;
    const imgData = canvasToImageData(canvas);

    // Canvas'ı Image'e çevir
    const img = new Image();
    img.src = canvas.toDataURL("image/png");
    img.onload = () => {
      setSourceImage(img, "Çizim (Canvas)");
    };
    void imgData;
  }, [setSourceImage]);

  // ── Araçlar ───────────────────────────────────────────────────────────────
  const TOOLS: { id: DrawTool; icon: React.ReactNode; label: string }[] = [
    { id: "brush", icon: <Brush size={14} />, label: "Fırça" },
    { id: "eraser", icon: <Eraser size={14} />, label: "Silgi" },
    { id: "line", icon: <Minus size={14} />, label: "Çizgi" },
    { id: "rect", icon: <Square size={14} />, label: "Dikdörtgen" },
    { id: "circle", icon: <Circle size={14} />, label: "Elips" },
    { id: "fill", icon: <PaintBucket size={14} />, label: "Akıllı Dolgu" },
  ];

  const BRUSH_SIZES = [2, 4, 8, 16, 24, 32];
  const COLORS = [
    "#ffffff", "#ff4d4d", "#ff9900", "#ffff00",
    "#00ff88", "#00cfff", "#a855f7", "#ff69b4",
    "#888888", "#000000",
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Araç Çubuğu */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Araç seçici */}
        <div className="flex items-center gap-1 bg-surface-raised border border-border rounded-lg p-1">
          {TOOLS.map((t) => (
            <Tooltip key={t.id} content={t.label}>
              <button
                type="button"
                onClick={() => updateDrawSettings({ tool: t.id })}
                className={cn(
                  "h-7 w-7 rounded-md flex items-center justify-center transition-all",
                  drawSettings.tool === t.id
                    ? "bg-accent text-black"
                    : "text-text-muted hover:bg-surface hover:text-text"
                )}
              >
                {t.icon}
              </button>
            </Tooltip>
          ))}
        </div>

        {/* Renk seçici */}
        <div className="flex items-center gap-1 bg-surface-raised border border-border rounded-lg p-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateDrawSettings({ color: c })}
              className={cn(
                "h-5 w-5 rounded-sm border-2 transition-transform hover:scale-110",
                drawSettings.color === c ? "border-accent scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          {/* Custom renk */}
          <label className="h-5 w-5 rounded-sm border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent transition-colors overflow-hidden">
            <input
              type="color"
              value={drawSettings.color}
              onChange={(e) => updateDrawSettings({ color: e.target.value })}
              className="opacity-0 absolute w-0 h-0"
            />
            <span className="text-[8px] text-text-dim">+</span>
          </label>
        </div>

        {/* Fırça boyutu */}
        <div className="flex items-center gap-1 bg-surface-raised border border-border rounded-lg p-1">
          {BRUSH_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateDrawSettings({ size: s })}
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center transition-all",
                drawSettings.size === s ? "bg-accent" : "hover:bg-surface"
              )}
            >
              <div
                className={cn("rounded-full bg-current transition-all", drawSettings.size === s ? "bg-black" : "bg-text-dim")}
                style={{
                  width: Math.min(s * 0.6 + 2, 16),
                  height: Math.min(s * 0.6 + 2, 16),
                }}
              />
            </button>
          ))}
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center gap-1 ml-auto">
          <Tooltip content="Geri Al (Ctrl+Z)">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="h-7 w-7 rounded-md flex items-center justify-center text-text-muted hover:bg-surface hover:text-text disabled:opacity-30 transition-all"
            >
              <Undo2 size={14} />
            </button>
          </Tooltip>
          <Tooltip content="İleri Al (Ctrl+Y)">
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className="h-7 w-7 rounded-md flex items-center justify-center text-text-muted hover:bg-surface hover:text-text disabled:opacity-30 transition-all"
            >
              <Redo2 size={14} />
            </button>
          </Tooltip>
          <Tooltip content="Tuvali Temizle">
            <button
              type="button"
              onClick={handleClear}
              className="h-7 w-7 rounded-md flex items-center justify-center text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative border border-border rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "3/2" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
        />
      </div>

      {/* ASCII'ye Dönüştür */}
      <Button variant="accent" onClick={convertToAscii} className="w-full">
        Çizimi ASCII'ye Dönüştür →
      </Button>
    </div>
  );
}

// ─── Smart Flood Fill ─────────────────────────────────────────────────────────

type FillOptions = {
  tolerance: number; // 0..255 per-channel threshold
  includeAlpha: boolean;
};

function smartFloodFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fillColor: string,
  opts: FillOptions
) {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  if (x < 0 || x >= width || y < 0 || y >= height) return;

  const idx = (y * width + x) * 4;
  const targetR = data[idx];
  const targetG = data[idx + 1];
  const targetB = data[idx + 2];
  const targetA = data[idx + 3];

  // Hedef rengi hex'ten RGB'ye çevir
  const fill = hexToRgb(fillColor);
  if (!fill) return;

  if (targetR === fill.r && targetG === fill.g && targetB === fill.b && targetA === 255) return;

  const tol = Math.max(0, Math.min(255, Math.round(opts.tolerance)));
  const match = (i: number) => {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (Math.abs(r - targetR) > tol) return false;
    if (Math.abs(g - targetG) > tol) return false;
    if (Math.abs(b - targetB) > tol) return false;
    if (opts.includeAlpha && Math.abs(a - targetA) > tol) return false;
    return true;
  };

  // scanline flood fill
  const stack: [number, number][] = [[x, y]];
  const visited = new Uint8Array(width * height);

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;

    const baseOffset = cy * width + cx;
    if (visited[baseOffset] === 1) continue;

    // if seed doesn't match, skip
    const seedI = baseOffset * 4;
    if (!match(seedI)) {
      visited[baseOffset] = 1;
      continue;
    }

    let left = cx;
    let right = cx;

    while (left - 1 >= 0) {
      const o = cy * width + (left - 1);
      if (visited[o] === 1) break;
      const i = o * 4;
      if (!match(i)) break;
      left--;
    }

    while (right + 1 < width) {
      const o = cy * width + (right + 1);
      if (visited[o] === 1) break;
      const i = o * 4;
      if (!match(i)) break;
      right++;
    }

    for (let px = left; px <= right; px++) {
      const o = cy * width + px;
      if (visited[o] === 1) continue;
      const i = o * 4;
      if (!match(i)) continue;
      visited[o] = 1;
      data[i] = fill.r;
      data[i + 1] = fill.g;
      data[i + 2] = fill.b;
      data[i + 3] = 255;

      if (cy - 1 >= 0) stack.push([px, cy - 1]);
      if (cy + 1 < height) stack.push([px, cy + 1]);
    }
    visited[baseOffset] = 1;
  }

  ctx.putImageData(imageData, 0, 0);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
