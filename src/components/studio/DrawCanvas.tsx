import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { Brush, Eraser, Minus, Square, Circle, Pipette, Type, Undo2, Redo2, Trash2 } from "lucide-react";
import { useStudioStore } from "../../store/studioStore";
import { canvasToImageData } from "../../lib/image/loadImage";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { cn } from "../../utils/cn";
import type { CanvasTextItem, DrawTool } from "../../types/studio";

const CANVAS_W = 600;
const CANVAS_H = 400;

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function DrawCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
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
    drawTexts,
    setDrawTexts,
    drawHistory,
    drawHistoryIndex,
  } = useStudioStore();

  const canUndo = drawHistoryIndex > 0;
  const canRedo = drawHistoryIndex >= 0 && drawHistoryIndex < drawHistory.length - 1;

  const [editing, setEditing] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    dx: number;
    dy: number;
  } | null>(null);

  // Canvas'ı başlat
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // İlk history push
    pushDrawHistory(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H), []);
  }, []);

  const renderComposite = useCallback((raster: ImageData, texts: CanvasTextItem[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(raster, 0, 0);
    for (const t of texts) {
      ctx.save();
      ctx.globalAlpha = t.opacity;
      ctx.fillStyle = t.color;
      ctx.font = `${t.fontSize}px ${t.fontFamily}`;
      ctx.textBaseline = "top";
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }, []);

  // History değişince composite'ı tekrar çiz
  useEffect(() => {
    if (drawHistoryIndex < 0) return;
    const entry = drawHistory[drawHistoryIndex];
    if (!entry) return;
    renderComposite(entry.raster, entry.texts);
  }, [drawHistory, drawHistoryIndex, renderComposite]);

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

  const canvasToCss = useCallback((p: { x: number; y: number }) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      left: (p.x / CANVAS_W) * rect.width,
      top: (p.y / CANVAS_H) * rect.height,
    };
  }, []);

  const measureTextBox = useCallback((ctx: CanvasRenderingContext2D, t: CanvasTextItem) => {
    ctx.save();
    ctx.font = `${t.fontSize}px ${t.fontFamily}`;
    const metrics = ctx.measureText(t.text || " ");
    ctx.restore();
    const w = metrics.width;
    const h = t.fontSize * 1.15;
    return { x: t.x, y: t.y, w, h };
  }, []);

  const hitTestText = useCallback(
    (pos: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext("2d")!;
      // Üstteki text'i seçmek için ters sırayla gez
      for (let i = drawTexts.length - 1; i >= 0; i--) {
        const t = drawTexts[i];
        const box = measureTextBox(ctx, t);
        if (pos.x >= box.x && pos.x <= box.x + box.w && pos.y >= box.y && pos.y <= box.y + box.h) {
          return { id: t.id, dx: pos.x - t.x, dy: pos.y - t.y };
        }
      }
      return null;
    },
    [drawTexts, measureTextBox]
  );

  const applyTextChange = useCallback(
    (nextTexts: CanvasTextItem[]) => {
      setDrawTexts(nextTexts);
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const raster = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
      renderComposite(raster, nextTexts);
    },
    [renderComposite, setDrawTexts]
  );

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const pos = getPos(e);

      if (drawSettings.tool === "text") {
        const hit = hitTestText(pos);
        if (hit) {
          setDragging(hit);
          return;
        }
        setEditing({ x: Math.round(pos.x), y: Math.round(pos.y), text: "" });
        return;
      }

      isDrawingRef.current = true;
      lastPosRef.current = pos;
      lineStartRef.current = pos;
      snapshotRef.current = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);

      if (drawSettings.tool === "fill") {
        floodFill(ctx, Math.round(pos.x), Math.round(pos.y), drawSettings.color);
        pushDrawHistory(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H));
        isDrawingRef.current = false;
      }
    },
    [drawSettings, getPos, hitTestText, pushDrawHistory]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (dragging) {
        const pos = getPos(e);
        const next = drawTexts.map((t) =>
          t.id === dragging.id ? { ...t, x: Math.round(pos.x - dragging.dx), y: Math.round(pos.y - dragging.dy) } : t
        );
        applyTextChange(next);
        return;
      }

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
    [applyTextChange, drawSettings, dragging, drawTexts, getPos]
  );

  const endDraw = useCallback(() => {
    if (dragging) {
      setDragging(null);
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      pushDrawHistory(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H), drawTexts);
      return;
    }

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPosRef.current = null;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    pushDrawHistory(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H), drawTexts);
  }, [dragging, drawTexts, pushDrawHistory]);

  const handleUndo = useCallback(() => {
    const entry = undoDraw();
    if (entry) renderComposite(entry.raster, entry.texts);
  }, [renderComposite, undoDraw]);

  const handleRedo = useCallback(() => {
    const entry = redoDraw();
    if (entry) renderComposite(entry.raster, entry.texts);
  }, [renderComposite, redoDraw]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    setDrawTexts([]);
    pushDrawHistory(ctx.getImageData(0, 0, CANVAS_W, CANVAS_H), []);
  }, [pushDrawHistory, setDrawTexts]);

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
    { id: "fill", icon: <Pipette size={14} />, label: "Dolgu" },
    { id: "text", icon: <Type size={14} />, label: "Yazı" },
  ];

  const BRUSH_SIZES = [2, 4, 8, 16, 24, 32];
  const COLORS = [
    "#ffffff", "#ff4d4d", "#ff9900", "#ffff00",
    "#00ff88", "#00cfff", "#a855f7", "#ff69b4",
    "#888888", "#000000",
  ];

  const overlayPos = useMemo(() => (editing ? canvasToCss(editing) : null), [canvasToCss, editing]);

  const commitText = useCallback(() => {
    if (!editing) return;
    const text = editing.text.trim();
    setEditing(null);
    if (!text) return;
    const item: CanvasTextItem = {
      id: newId(),
      x: editing.x,
      y: editing.y,
      text,
      color: drawSettings.color,
      fontSize: Math.max(12, Math.min(64, Math.round(drawSettings.size * 2))),
      fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      opacity: drawSettings.opacity,
    };
    const next = [...drawTexts, item];
    setDrawTexts(next);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const raster = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    renderComposite(raster, next);
    pushDrawHistory(raster, next);
  }, [drawSettings.color, drawSettings.opacity, drawSettings.size, drawTexts, editing, pushDrawHistory, renderComposite, setDrawTexts]);

  return (
    <div className="flex flex-col gap-3">
      {/* Araç Çubuğu */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Araç seçici */}
        <div className="flex items-center gap-1 bg-surface-raised border border-border rounded-lg p-1">
          {TOOLS.map((t) => (
            <Tooltip key={t.id} content={t.label}>
              <button
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
              onClick={handleUndo}
              disabled={!canUndo}
              className="h-7 w-7 rounded-md flex items-center justify-center text-text-muted hover:bg-surface hover:text-text disabled:opacity-30 transition-all"
            >
              <Undo2 size={14} />
            </button>
          </Tooltip>
          <Tooltip content="İleri Al (Ctrl+Y)">
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="h-7 w-7 rounded-md flex items-center justify-center text-text-muted hover:bg-surface hover:text-text disabled:opacity-30 transition-all"
            >
              <Redo2 size={14} />
            </button>
          </Tooltip>
          <Tooltip content="Tuvali Temizle">
            <button
              onClick={handleClear}
              className="h-7 w-7 rounded-md flex items-center justify-center text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={wrapRef}
        className="relative border border-border rounded-xl overflow-hidden bg-black"
        style={{ aspectRatio: "3/2" }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={cn(
            "w-full h-full",
            drawSettings.tool === "text" ? "cursor-text" : "cursor-crosshair"
          )}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
        />

        {editing && overlayPos && (
          <input
            autoFocus
            value={editing.text}
            onChange={(e) => setEditing({ ...editing, text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitText();
              if (e.key === "Escape") setEditing(null);
            }}
            onBlur={() => commitText()}
            className="absolute z-10 px-2 py-1 rounded-md bg-panel border border-border text-text outline-none"
            style={{
              left: overlayPos.left,
              top: overlayPos.top,
              minWidth: 180,
              fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: Math.max(12, Math.min(64, Math.round(drawSettings.size * 2))),
            }}
            placeholder="Yaz…"
          />
        )}
      </div>

      {/* ASCII'ye Dönüştür */}
      <Button variant="accent" onClick={convertToAscii} className="w-full">
        Çizimi ASCII'ye Dönüştür →
      </Button>
    </div>
  );
}

// ─── Flood Fill ───────────────────────────────────────────────────────────────

function floodFill(ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string) {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  const idx = (y * width + x) * 4;
  const targetR = data[idx];
  const targetG = data[idx + 1];
  const targetB = data[idx + 2];

  // Hedef rengi hex'ten RGB'ye çevir
  const fill = hexToRgb(fillColor);
  if (!fill) return;

  if (targetR === fill.r && targetG === fill.g && targetB === fill.b) return;

  const stack: [number, number][] = [[x, y]];
  const visited = new Set<number>();

  const matchTarget = (i: number) =>
    data[i] === targetR && data[i + 1] === targetG && data[i + 2] === targetB;

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;

    const ci = (cy * width + cx) * 4;
    if (visited.has(ci)) continue;
    if (!matchTarget(ci)) continue;

    visited.add(ci);
    data[ci] = fill.r;
    data[ci + 1] = fill.g;
    data[ci + 2] = fill.b;
    data[ci + 3] = 255;

    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
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
