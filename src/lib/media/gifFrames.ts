import { decompressFrames, parseGIF } from "gifuct-js";

type ProgressCb = (progress01: number, status: string) => void;

export async function extractGifFramesAsImageData(
  objectUrl: string,
  opts: {
    maxFrames: number;
    maxDimension: number;
    onProgress?: ProgressCb;
    signal?: AbortSignal;
  }
): Promise<{ frames: ImageData[]; fps: number; durationSec: number }> {
  const { maxFrames, maxDimension, onProgress, signal } = opts;

  const buf = await fetch(objectUrl).then((r) => r.arrayBuffer());
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const gif = parseGIF(buf);
  const rawFrames = decompressFrames(gif, true);
  if (rawFrames.length === 0) throw new Error("GIF frame okunamadı.");

  // Canvas composition
  const w0 = rawFrames[0].dims.width;
  const h0 = rawFrames[0].dims.height;
  const scale = Math.min(1, maxDimension / Math.max(w0, h0));
  const w = Math.max(2, Math.round(w0 * scale));
  const h = Math.max(2, Math.round(h0 * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w0;
  canvas.height = h0;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext("2d", { willReadFrequently: true })!;

  // total duration from frame delays (in hundredths of a second)
  const delaysCs = rawFrames.map((f) => (typeof f.delay === "number" ? f.delay : 10));
  const totalCs = delaysCs.reduce((a, b) => a + b, 0);
  const durationSec = totalCs / 100;
  const fps = durationSec > 0 ? Math.max(1, Math.round(rawFrames.length / durationSec)) : 10;

  const frames: ImageData[] = [];
  const takeCount = Math.min(maxFrames, rawFrames.length);
  const stride = rawFrames.length <= takeCount ? 1 : Math.ceil(rawFrames.length / takeCount);

  for (let i = 0, outI = 0; i < rawFrames.length && frames.length < takeCount; i += stride, outI++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    onProgress?.(frames.length / takeCount, `GIF frame ${frames.length + 1}/${takeCount}`);

    const f = rawFrames[i];
    const imgData = ctx.createImageData(f.dims.width, f.dims.height);
    imgData.data.set(f.patch);
    ctx.putImageData(imgData, f.dims.left, f.dims.top);

    // scale down if needed
    outCtx.clearRect(0, 0, w, h);
    outCtx.drawImage(canvas, 0, 0, w0, h0, 0, 0, w, h);
    frames.push(outCtx.getImageData(0, 0, w, h));
    void outI;
  }

  onProgress?.(1, `GIF frame okuma tamam (${frames.length})`);
  return { frames, fps, durationSec };
}

