import { useStudioStore } from "../../store/studioStore";
import { PRESETS } from "../../lib/presets";
import { cn } from "../../utils/cn";

export function PresetsPanel() {
  const { applyPreset, settings } = useStudioStore();

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-text-dim uppercase tracking-wider font-medium px-1">
        Stiller — Tek tıkla uygula
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((preset) => {
          const isActive =
            settings.background === preset.bg &&
            settings.foreground === preset.fg &&
            settings.charsetId === preset.settings.charsetId;

          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={cn(
                "relative flex flex-col items-start gap-1.5 rounded-xl p-3 text-left border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                isActive
                  ? "border-accent bg-accent/5 shadow-sm shadow-accent/10"
                  : "border-border bg-surface hover:border-border-hover"
              )}
            >
              {/* Renk önizleme */}
              <div
                className="w-full h-8 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold tracking-widest"
                style={{
                  backgroundColor: preset.bg,
                  color: preset.fg,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {sampleText(preset.settings.charsetId as string)}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-sm">{preset.icon}</span>
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-accent" : "text-text"
                )}>
                  {preset.name}
                </span>
              </div>

              <p className="text-[10px] text-text-dim leading-tight">
                {preset.description}
              </p>

              {isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function sampleText(charsetId: string): string {
  const samples: Record<string, string> = {
    standard: "@%#*+=-:.",
    detailed: "$@B%8&WM#oahk",
    blocks: "█▓▒░",
    minimal: "@+. ",
    binary: "10110101",
    matrix: "ﾊﾐﾋｰｳｼﾅ01",
    braille: "⣿⣷⣯⣟⡿",
    box: "╬╠╦╔═║",
    emoji: "●◉○◎◌",
  };
  return samples[charsetId] || "@%#*+";
}
