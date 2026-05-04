import { Upload, Brush, Palette, Download, Settings } from "lucide-react";
import { useStudioStore } from "../../store/studioStore";
import { Tooltip } from "../ui/Tooltip";
import { cn } from "../../utils/cn";
import type { ActiveTool } from "../../types/studio";

const TOOLS: { id: ActiveTool; icon: React.ReactNode; label: string }[] = [
  { id: "upload", icon: <Upload size={16} />, label: "Görsel Yükle" },
  { id: "draw", icon: <Brush size={16} />, label: "Fırça / Çizim" },
  { id: "presets", icon: <Palette size={16} />, label: "Stiller & Presetler" },
];

export function LeftToolbar({
  onSettingsClick,
  onExportClick,
  showSettings,
  showExport,
}: {
  onSettingsClick: () => void;
  onExportClick: () => void;
  showSettings: boolean;
  showExport: boolean;
}) {
  const { activeTool, setActiveTool } = useStudioStore();

  return (
    <div className="w-12 flex flex-col items-center py-3 gap-1 bg-panel border-r border-border flex-shrink-0">
      {/* Ana Araçlar */}
      {TOOLS.map((tool) => (
        <Tooltip key={tool.id} content={tool.label} position="right">
          <button
            onClick={() => setActiveTool(tool.id)}
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
              activeTool === tool.id
                ? "bg-accent text-black"
                : "text-text-dim hover:bg-surface hover:text-text"
            )}
          >
            {tool.icon}
          </button>
        </Tooltip>
      ))}

      {/* Ayırıcı */}
      <div className="w-6 h-px bg-border my-1" />

      {/* Ayarlar */}
      <Tooltip content="Görüntü Ayarları" position="right">
        <button
          onClick={onSettingsClick}
          className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
            showSettings
              ? "bg-accent/10 text-accent border border-accent/30"
              : "text-text-dim hover:bg-surface hover:text-text"
          )}
        >
          <Settings size={16} />
        </button>
      </Tooltip>

      {/* Export */}
      <Tooltip content="Dışa Aktar" position="right">
        <button
          onClick={onExportClick}
          className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
            showExport
              ? "bg-accent/10 text-accent border border-accent/30"
              : "text-text-dim hover:bg-surface hover:text-text"
          )}
        >
          <Download size={16} />
        </button>
      </Tooltip>
    </div>
  );
}
