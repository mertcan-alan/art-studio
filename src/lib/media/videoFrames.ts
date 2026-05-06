type ProgressCb = (progress01: number, status: string) => void;

export async function extractVideoFramesAsImageData(
  objectUrl: string,
  opts: {
    maxFrames: number;
    maxDimension: number; // downscale longest edge
    targetFps: number;
    maxDurationSec: number;
    onProgress?: ProgressCb;
    signal?: AbortSignal;
  }
): Promise<{ frames: ImageData[]; fps: number; durationSec: number }> {
  const {
    maxFrames,
    maxDimension,
    targetFps,
    maxDurationSec,
    onProgress,
    signal,
  } = opts;

  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = objectUrl;

  const wait = (ev: string) =>
    new Promise<void>((resolve, reject) => {
      const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
      const onErr = () => reject(new Error("Video okunamadı."));
      const onOk = () => resolve();
      signal?.addEventListener("abort", onAbort, { once: true });
      video.addEventListener("error", onErr, { once: true });
      video.addEventListener(ev as any, onOk, { once: true });
    });

  await wait("loadedmetadata");

  const durationSec = Number.isFinite(video.duration) ? video.duration : 0;
  if (!durationSec || durationSec <= 0) {
    throw new Error("Video süresi okunamadı.");
  }
  if (durationSec > maxDurationSec) {
    throw new Error(`Video çok uzun. En fazla ${maxDurationSec}s destekleniyor.`);
  }

  const srcW = video.videoWidth || 0;
  const srcH = video.videoHeight || 0;
  if (!srcW || !srcH) {
    throw new Error("Video boyutu okunamadı.");
  }

  const scale = Math.min(1, maxDimension / Math.max(srcW, srcH));
  const w = Math.max(2, Math.round(srcW * scale));
  const h = Math.max(2, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  const fps = Math.max(1, Math.min(24, Math.round(targetFps)));
  const frameCount = Math.min(maxFrames, Math.max(1, Math.floor(durationSec * fps)));
  const step = durationSec / frameCount;

  const frames: ImageData[] = [];

  for (let i = 0; i < frameCount; i++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const t = Math.min(durationSec - 0.001, i * step);
    onProgress?.(i / frameCount, `Video frame ${i + 1}/${frameCount}`);

    // Seek
    video.currentTime = t;
    await wait("seeked");

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(video, 0, 0, w, h);
    frames.push(ctx.getImageData(0, 0, w, h));
  }

  onProgress?.(1, `Video frame okuma tamam (${frameCount})`);
  return { frames, fps, durationSec };
}

