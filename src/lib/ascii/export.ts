import type { AsciiAnimationResult, AsciiResult, AsciiSettings } from "../../types/studio";

// ─── TXT Export ───────────────────────────────────────────────────────────────

export function exportAsTxt(result: AsciiResult, filename = "ascii-art"): void {
  const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${filename}.txt`);
}

export function exportTextAsTxt(text: string, filename = "ascii-art"): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${filename}.txt`);
}

// ─── HTML Export ─────────────────────────────────────────────────────────────

export function exportAsHtml(
  result: AsciiResult,
  settings: AsciiSettings,
  filename = "ascii-art"
): void {
  const { background, foreground, fontSize, lineHeight } = settings;

  const lines = result.cells
    .map((row) => {
      const spans = row
        .map(
          (cell) =>
            `<span style="color:${cell.color}">${escapeHtml(cell.char)}</span>`
        )
        .join("");
      return `<div>${spans}</div>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ASCII Art — ASCII Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: ${background};
      color: ${foreground};
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      padding: 20px;
      white-space: pre;
    }
    .ascii-container {
      display: inline-block;
    }
    div {
      white-space: pre;
      letter-spacing: 0;
    }
  </style>
</head>
<body>
<div class="ascii-container">
${lines}
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  triggerDownload(blob, `${filename}.html`);
}

// ─── Animated HTML Export (Video/GIF) ─────────────────────────────────────────

export function exportAsAnimatedHtml(
  anim: AsciiAnimationResult,
  settings: AsciiSettings,
  filename = "ascii-animation"
): void {
  const { background, foreground, fontSize, lineHeight } = settings;
  const safeFrames = anim.framesText.map((t) => escapeJsString(t));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ASCII Animation — ASCII Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: ${background};
      color: ${foreground};
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      padding: 16px;
    }
    .bar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      font-size: 12px;
      color: rgba(255,255,255,0.75);
    }
    button {
      appearance: none;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.9);
      padding: 6px 10px;
      border-radius: 8px;
      cursor: pointer;
    }
    button:hover { background: rgba(255,255,255,0.09); }
    pre {
      white-space: pre;
      margin: 0;
      user-select: text;
    }
  </style>
</head>
<body>
  <div class="bar">
    <button id="toggle">Pause</button>
    <span id="meta">${anim.frameCount} frames @ ${anim.fps}fps</span>
    <span id="idx"></span>
  </div>
  <pre id="ascii"></pre>
  <script>
    const frames = ${JSON.stringify(safeFrames)};
    const fps = ${Math.max(1, anim.fps)};
    let playing = true;
    let i = 0;
    const el = document.getElementById("ascii");
    const idx = document.getElementById("idx");
    const btn = document.getElementById("toggle");

    function render() {
      el.textContent = frames[i] || "";
      idx.textContent = "Frame " + (i + 1) + "/" + frames.length;
    }
    render();

    btn.addEventListener("click", () => {
      playing = !playing;
      btn.textContent = playing ? "Pause" : "Play";
    });

    setInterval(() => {
      if (!playing) return;
      i = (i + 1) % frames.length;
      render();
    }, 1000 / fps);
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  triggerDownload(blob, `${filename}.html`);
}

// ─── PNG Export ───────────────────────────────────────────────────────────────

export async function exportAsPng(
  result: AsciiResult,
  settings: AsciiSettings,
  filename = "ascii-art",
  scale = 2
): Promise<void> {
  const { background, foreground, fontSize, lineHeight, mode } = settings;

  const fontPx = fontSize * scale;
  const lineH = fontPx * lineHeight;
  const font = `${fontPx}px "JetBrains Mono", "Courier New", monospace`;

  // Karakterin piksel genişliği
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d")!;
  measureCtx.font = font;
  const charWidth = measureCtx.measureText("M").width;

  const canvasWidth = Math.ceil(result.cols * charWidth);
  const canvasHeight = Math.ceil(result.rows * lineH);

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext("2d")!;

  // Arka plan
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.font = font;
  ctx.textBaseline = "top";

  // Karakterleri çiz
  for (let y = 0; y < result.rows; y++) {
    const row = result.cells[y];
    for (let x = 0; x < result.cols; x++) {
      const cell = row[x];
      ctx.fillStyle = mode === "color" ? cell.color : foreground;
      ctx.fillText(cell.char, x * charWidth, y * lineH);
    }
  }

  canvas.toBlob((blob) => {
    if (blob) triggerDownload(blob, `${filename}.png`);
  }, "image/png");
}

// ─── SVG Export ───────────────────────────────────────────────────────────────

export function exportAsSvg(
  result: AsciiResult,
  settings: AsciiSettings,
  filename = "ascii-art"
): void {
  const { background, foreground, fontSize, lineHeight, mode } = settings;

  const lineH = fontSize * lineHeight;
  // SVG monospace karakter genişliği yaklaşık 0.6 * fontSize
  const charW = fontSize * 0.6;
  const svgWidth = result.cols * charW;
  const svgHeight = result.rows * lineH;

  const textElements = result.cells
    .flatMap((row, y) =>
      row.map((cell, x) => {
        const color = mode === "color" ? cell.color : foreground;
        const cx = x * charW;
        const cy = y * lineH + fontSize;
        return `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" fill="${color}">${escapeHtml(cell.char)}</text>`;
      })
    )
    .join("\n");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <rect width="100%" height="100%" fill="${background}"/>
  <g font-family="'JetBrains Mono','Courier New',monospace" font-size="${fontSize}" dominant-baseline="auto">
${textElements}
  </g>
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, `${filename}.svg`);
}

// ─── Panoya Kopyala ───────────────────────────────────────────────────────────

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
}

// ─── Yardımcı ────────────────────────────────────────────────────────────────

function escapeHtml(char: string): string {
  return char
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/ /g, "&nbsp;");
}

function escapeJsString(s: string): string {
  // For embedding in JSON string safely; JSON.stringify handles most,
  // but we also neutralize closing script tags to be safe.
  return s.replace(/<\/script>/gi, "<\\/script>");
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
