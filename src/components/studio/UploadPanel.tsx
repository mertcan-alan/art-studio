import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon, X, Trash2 } from "lucide-react";
import { useStudioStore } from "../../store/studioStore";
import { loadImageFromFile } from "../../lib/image/loadImage";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export function UploadPanel() {
  const {
    sourceImage,
    sourceImageName,
    sourceKind,
    sourceObjectUrl,
    sourceDurationSec,
    setSourceImage,
    setSourceMedia,
    clearSourceImage,
  } =
    useStudioStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      try {
        if (file.type.startsWith("image/") && file.type !== "image/gif") {
          const img = await loadImageFromFile(file);
          setSourceImage(img, file.name);
          return;
        }

        if (file.type === "image/gif") {
          // GIF: sadece objectURL ile sakla, decode/convert preview tarafında yapılacak
          setSourceMedia("gif", file, file.name, null);
          return;
        }

        if (file.type.startsWith("video/")) {
          const url = URL.createObjectURL(file);
          const video = document.createElement("video");
          video.preload = "metadata";
          video.muted = true;
          video.playsInline = true;
          video.src = url;

          const durationSec = await new Promise<number>((resolve, reject) => {
            const onLoaded = () => resolve(video.duration || 0);
            const onError = () => reject(new Error("Video metadata okunamadı."));
            video.addEventListener("loadedmetadata", onLoaded, { once: true });
            video.addEventListener("error", onError, { once: true });
          });

          URL.revokeObjectURL(url);
          setSourceMedia("video", file, file.name, Number.isFinite(durationSec) ? durationSec : null);
          return;
        }

        throw new Error("Desteklenmeyen dosya türü. Görsel, GIF veya video yükleyin.");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Bir hata oluştu");
      } finally {
        setLoading(false);
      }
    },
    [setSourceImage, setSourceMedia]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [], "video/*": [] },
    multiple: false,
    onDrop: (files) => files[0] && handleFile(files[0]),
  });

  const hasSource = !!sourceImage || !!sourceObjectUrl;

  // Kaynak varsa göster
  if (hasSource) {
    return (
      <div className="space-y-3">
        {/* Önizleme */}
        <div className="relative rounded-lg overflow-hidden border border-border bg-surface-raised group">
          {sourceImage ? (
            <img
              src={sourceImage.src}
              alt="Yüklenen görsel"
              className="w-full object-contain max-h-48"
            />
          ) : sourceKind === "video" && sourceObjectUrl ? (
            <video
              src={sourceObjectUrl}
              className="w-full object-contain max-h-48 bg-black"
              muted
              playsInline
              controls
            />
          ) : sourceKind === "gif" && sourceObjectUrl ? (
            <img
              src={sourceObjectUrl}
              alt="Yüklenen GIF"
              className="w-full object-contain max-h-48"
            />
          ) : null}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={clearSourceImage}
            >
              <Trash2 size={12} />
              Kaldır
            </Button>
          </div>
        </div>

        {/* Dosya bilgisi */}
        <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg border border-border">
          <ImageIcon size={14} className="text-accent flex-shrink-0" />
          <span className="text-xs text-text-muted truncate flex-1">
            {sourceImageName}
          </span>
          {sourceImage ? (
            <span className="text-[10px] text-text-dim font-mono">
              {sourceImage.naturalWidth} × {sourceImage.naturalHeight}
            </span>
          ) : sourceKind === "video" && sourceDurationSec != null ? (
            <span className="text-[10px] text-text-dim font-mono">
              {sourceDurationSec.toFixed(2)}s
            </span>
          ) : (
            <span className="text-[10px] text-text-dim font-mono">
              {sourceKind.toUpperCase()}
            </span>
          )}
          <button
            onClick={clearSourceImage}
            className="text-text-dim hover:text-red-400 transition-colors"
          >
            <X size={12} />
          </button>
        </div>

        {/* Yeni yükle */}
        <div
          {...getRootProps()}
          className="border border-dashed border-border rounded-lg px-4 py-3 text-center cursor-pointer hover:border-accent/50 transition-colors"
        >
          <input {...getInputProps()} />
          <p className="text-xs text-text-dim">
            Farklı bir görsel yüklemek için tıkla veya sürükle
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl px-4 py-8 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-accent bg-accent/5 scale-[0.99]"
            : "border-border hover:border-accent/50 hover:bg-surface"
        )}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            "mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all",
            isDragActive ? "bg-accent/20 scale-110" : "bg-surface-raised"
          )}
        >
          <Upload
            size={22}
            className={isDragActive ? "text-accent" : "text-text-dim"}
          />
        </div>

        {isDragActive ? (
          <p className="text-sm font-medium text-accent">Bırak!</p>
        ) : (
          <>
            <p className="text-sm font-medium text-text mb-1">
              Medya yükle
            </p>
            <p className="text-xs text-text-dim">
              PNG, JPG, WebP, GIF, SVG, MP4, WebM, MOV
              <br />
              Sürükle bırak veya tıkla
            </p>
          </>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-text-muted px-1">
          <span className="h-3 w-3 rounded-full border border-accent border-t-transparent animate-spin" />
          Görsel işleniyor...
        </div>
      )}

      {/* Hata */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400 flex items-start gap-2">
          <X size={12} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Örnek görseller */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-text-dim uppercase tracking-wider font-medium px-1">
          Demo görseller
        </p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_IMAGES.map((d) => (
            <button
              key={d.label}
              onClick={() => loadDemo(d.url, d.label, setSourceImage, setError, setLoading)}
              className="aspect-square rounded-lg overflow-hidden border border-border hover:border-accent/50 transition-colors relative group bg-surface"
            >
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {d.emoji}
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[9px] text-white font-medium">{d.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Demo Görseller ───────────────────────────────────────────────────────────

const DEMO_IMAGES = [
  { label: "Dağlar", emoji: "🏔️", url: "https://picsum.photos/seed/mountain/400/400" },
  { label: "Şehir", emoji: "🌆", url: "https://picsum.photos/seed/city/400/400" },
  { label: "Orman", emoji: "🌲", url: "https://picsum.photos/seed/forest/400/400" },
];

async function loadDemo(
  url: string,
  name: string,
  setSourceImage: (img: HTMLImageElement, name: string) => void,
  setError: (e: string | null) => void,
  setLoading: (v: boolean) => void
) {
  setLoading(true);
  setError(null);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Demo görsel yüklenemedi"));
      img.src = url;
    });
    setSourceImage(img, name);
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : "Hata");
  } finally {
    setLoading(false);
  }
}
