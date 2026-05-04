// ─── Görsel Yükleme ───────────────────────────────────────────────────────────

const MAX_DIMENSION = 2048;

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Geçersiz dosya türü. Lütfen bir görsel dosyası yükleyin."));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görsel yüklenirken hata oluştu."));
    };

    img.src = url;
  });
}

export function imageToImageData(
  img: HTMLImageElement,
  maxDimension = MAX_DIMENSION
): ImageData {
  let { width, height } = img;

  // Büyük görseli küçült
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  // Şeffaf arka plan için beyaz dolgu
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.drawImage(img, 0, 0, width, height);

  return ctx.getImageData(0, 0, width, height);
}

export function canvasToImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
