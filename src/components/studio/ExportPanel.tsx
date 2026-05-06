import { useState } from "react";
import { Download, Copy, Check, FileText, FileImage, Code, Globe, Film, Image } from "lucide-react";
import { useStudioStore } from "../../store/studioStore";
import {
  exportAsTxt,
  exportAsPng,
  exportAsHtml,
  exportAsSvg,
  exportAsAnimatedHtml,
  exportTextAsTxt,
  exportAnimationAsPng,
  exportAnimationAsGif,
  exportAnimationAsVideo,
  copyToClipboard,
} from "../../lib/ascii/export";
import { cn } from "../../utils/cn";

export function ExportPanel() {
  const { result, animationResult, settings, effectSettings } = useStudioStore();
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);

  if (!result && !animationResult) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center border border-border">
          <Download size={16} className="text-text-dim" />
        </div>
        <p className="text-xs text-text-dim">
          Önce bir görsel yükleyip ASCII'ye dönüştür
        </p>
      </div>
    );
  }

  const filename = "ascii-studio-export";

  const handleCopy = async () => {
    const ok = await copyToClipboard(result?.text ?? animationResult?.framesText?.[0] ?? "");
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handle = async (id: string, fn: () => void | Promise<void>) => {
    setExporting(id);
    setExportProgress(0);
    try {
      await fn();
    } catch (err) {
      console.error("Export hatası:", err);
    } finally {
      setTimeout(() => {
        setExporting(null);
        setExportProgress(0);
      }, 600);
    }
  };

  const EXPORTS = animationResult
    ? [
        {
          id: "png_frame",
          label: "PNG",
          description: "İlk frame (görsel)",
          icon: <Image size={14} />,
          fn: () => exportAnimationAsPng(animationResult, settings, filename, 2, effectSettings),
        },
        {
          id: "gif",
          label: "GIF",
          description: "Animasyonlu GIF",
          icon: <FileImage size={14} />,
          fn: () =>
            exportAnimationAsGif(
              animationResult,
              settings,
              filename,
              1,
              effectSettings,
              (p) => setExportProgress(p)
            ),
        },
        {
          id: "video",
          label: "Video",
          description: "WebM video dosyası",
          icon: <Film size={14} />,
          fn: () =>
            exportAnimationAsVideo(
              animationResult,
              settings,
              filename,
              1,
              effectSettings,
              (p) => setExportProgress(p)
            ),
        },
        {
          id: "txt",
          label: "TXT",
          description: "İlk frame (düz metin)",
          icon: <FileText size={14} />,
          fn: () => exportTextAsTxt(animationResult.framesText[0] ?? "", filename),
        },
        {
          id: "html_anim",
          label: "HTML",
          description: "Oynatılabilir animasyon",
          icon: <Globe size={14} />,
          fn: () => exportAsAnimatedHtml(animationResult, settings, filename),
        },
      ]
    : [
        {
          id: "txt",
          label: "TXT",
          description: "Düz metin dosyası",
          icon: <FileText size={14} />,
          fn: () => exportAsTxt(result!, filename),
        },
        {
          id: "png",
          label: "PNG",
          description: "Yüksek kalite görsel",
          icon: <FileImage size={14} />,
          fn: () => exportAsPng(result!, settings, filename, 2, effectSettings),
        },
        {
          id: "svg",
          label: "SVG",
          description: "Vektör grafik",
          icon: <Code size={14} />,
          fn: () => exportAsSvg(result!, settings, filename),
        },
        {
          id: "html",
          label: "HTML",
          description: "Renkli web sayfası",
          icon: <Globe size={14} />,
          fn: () => exportAsHtml(result!, settings, filename),
        },
      ];

  return (
    <div className="space-y-3">
      {/* İstatistikler */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Satır", value: (result ?? animationResult)!.rows },
          { label: "Sütun", value: (result ?? animationResult)!.cols },
          {
            label: animationResult ? "Frame" : "Karakter",
            value: animationResult
              ? animationResult.frameCount
            : (result!.rows * result!.cols).toLocaleString(),
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-border rounded-lg px-2 py-2 text-center">
            <p className="text-sm font-bold text-accent font-mono tabular-nums">
              {stat.value}
            </p>
            <p className="text-[10px] text-text-dim">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Efekt bilgisi */}
      {effectSettings.type !== "none" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-accent/5 border border-accent/20 rounded-lg">
          <span className="text-[10px] text-accent font-medium">
            ✨ Efekt aktif: dışa aktarmalara uygulanacak
          </span>
        </div>
      )}

      {/* Kopyala */}
      <button
        onClick={handleCopy}
        className={cn(
          "w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium border transition-all",
          copied
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-surface border-border text-text-muted hover:border-border-hover hover:text-text"
        )}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Kopyalandı!" : "Panoya Kopyala"}
      </button>

      {/* Export butonları */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-text-dim uppercase tracking-wider font-medium">
          Dışa Aktar
        </p>
        <div className="grid grid-cols-2 gap-2">
          {EXPORTS.map((exp) => (
            <button
              key={exp.id}
              onClick={() => handle(exp.id, exp.fn)}
              disabled={exporting === exp.id}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-all",
                exporting === exp.id
                  ? "bg-accent/10 border-accent"
                  : "bg-surface border-border hover:border-border-hover"
              )}
            >
              <div className="flex items-center gap-1.5">
                {exporting === exp.id ? (
                  <span className="h-3 w-3 rounded-full border border-accent border-t-transparent animate-spin" />
                ) : (
                  <span className="text-accent">{exp.icon}</span>
                )}
                <span className="text-xs font-bold text-text">{exp.label}</span>
              </div>
              <p className="text-[10px] text-text-dim">{exp.description}</p>
              {exporting === exp.id && exportProgress > 0 && (
                <div className="w-full bg-border rounded-full h-1 mt-1">
                  <div
                    className="bg-accent h-1 rounded-full transition-all duration-200"
                    style={{ width: `${Math.round(exportProgress * 100)}%` }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
