import { useState } from "react";
import { ArrowLeft, Terminal, Sparkles } from "lucide-react";
import { useStudioStore } from "../../store/studioStore";
import { ThemeToggle } from "../ui/ThemeToggle";
import { AsciiPreview } from "./AsciiPreview";
import { LeftToolbar } from "./LeftToolbar";
import { UploadPanel } from "./UploadPanel";
import { DrawCanvas } from "./DrawCanvas";
import { PresetsPanel } from "./PresetsPanel";
import { SettingsPanel } from "./SettingsPanel";
import { ExportPanel } from "./ExportPanel";
import { cn } from "../../utils/cn";

export function StudioShell() {
  const { activeTool, setActiveView } = useStudioStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Sağ panel içeriği
  const rightPanelVisible = showSettings || showExport;

  const toggleSettings = () => {
    setShowSettings((v) => !v);
    setShowExport(false);
  };
  const toggleExport = () => {
    setShowExport((v) => !v);
    setShowSettings(false);
  };

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden">
      {/* ── Üst Bar ─────────────────────────────────────────── */}
      <header className="h-11 flex items-center px-3 border-b border-border bg-panel flex-shrink-0 gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
            <Terminal size={13} className="text-black" />
          </div>
          <span className="font-semibold text-text text-sm tracking-tight">
            ASCII Studio
          </span>
          <span className="text-[10px] text-text-dim font-mono border border-border rounded px-1.5 py-0.5 bg-surface">
            v1.0
          </span>
        </div>

        <div className="flex-1" />

        {/* Sağ aksiyonlar */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg px-2 py-1">
            <Sparkles size={11} className="text-accent" />
            <span className="text-[10px] text-text-dim">
              Tüm işlemler tarayıcıda — gizliliğiniz korunur
            </span>
          </div>
          <button
            onClick={() => setActiveView("home")}
            className="flex items-center gap-1.5 text-xs text-text-dim hover:text-text transition-colors"
          >
            <ArrowLeft size={13} />
            Ana Sayfa
          </button>
        </div>
      </header>

      {/* ── Ana Layout ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sol araç çubuğu */}
        <LeftToolbar
          onSettingsClick={toggleSettings}
          onExportClick={toggleExport}
          showSettings={showSettings}
          showExport={showExport}
        />

        {/* Sol Panel */}
        <div className="w-64 flex-shrink-0 border-r border-border bg-panel flex flex-col overflow-hidden">
          {/* Panel başlık */}
          <div className="h-9 flex items-center px-3 border-b border-border flex-shrink-0">
            <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">
              {activeTool === "upload" && "Görsel Yükle"}
              {activeTool === "draw" && "Fırça & Çizim"}
              {activeTool === "presets" && "Stiller"}
            </span>
          </div>

          {/* Panel içerik */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {activeTool === "upload" && <UploadPanel />}
            {activeTool === "draw" && (
              <div className="space-y-3">
                <p className="text-[10px] text-text-dim">
                  Tuvalde çizim yap, sonra ASCII'ye dönüştür
                </p>
                <DrawCanvas />
              </div>
            )}
            {activeTool === "presets" && <PresetsPanel />}
          </div>
        </div>

        {/* Ana önizleme */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <AsciiPreview />
        </div>

        {/* Sağ panel — Ayarlar / Export */}
        <div
          className={cn(
            "flex-shrink-0 border-l border-border bg-panel flex flex-col overflow-hidden transition-all duration-200",
            rightPanelVisible ? "w-64" : "w-0"
          )}
        >
          {rightPanelVisible && (
            <>
              <div className="h-9 flex items-center px-3 border-b border-border flex-shrink-0">
                <span className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">
                  {showSettings ? "Ayarlar" : "Dışa Aktar"}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {showSettings && <SettingsPanel />}
                {showExport && <ExportPanel />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Alt Status Bar ──────────────────────────────────── */}
      <StatusBar />
    </div>
  );
}

function StatusBar() {
  const { result, animationResult, sourceImage, sourceImageName, sourceKind, sourceDurationSec } = useStudioStore();

  return (
    <footer className="h-6 flex items-center px-3 gap-4 border-t border-border bg-panel flex-shrink-0">
      <span className="text-[10px] text-text-dim font-mono">
        {sourceImage
          ? `📁 ${sourceImageName} — ${sourceImage.naturalWidth}×${sourceImage.naturalHeight}px`
          : sourceDurationSec != null
            ? `📁 ${sourceImageName} — ${sourceKind.toUpperCase()} ${sourceDurationSec.toFixed(2)}s`
            : sourceImageName
              ? `📁 ${sourceImageName} — ${sourceKind.toUpperCase()}`
              : "Görsel yüklenmedi"}
      </span>
      {(result || animationResult) && (
        <>
          <span className="text-[10px] text-text-dim">|</span>
          <span className="text-[10px] text-text-dim font-mono">
            ASCII: {(result ?? animationResult)!.cols}×{(result ?? animationResult)!.rows}
            {animationResult
              ? ` — ${animationResult.frameCount} frame @ ${animationResult.fps}fps`
              : ` — ${(result!.rows * result!.cols).toLocaleString()} karakter`}
          </span>
        </>
      )}
      <div className="ml-auto flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span className="text-[10px] text-text-dim">Hazır</span>
      </div>
    </footer>
  );
}
