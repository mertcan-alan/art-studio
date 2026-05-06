import { useStudioStore } from "../../store/studioStore";
import { useUiStore } from "../../store/uiStore";
import { CHARSETS } from "../../lib/charsets";
import { EFFECT_DESCRIPTIONS } from "../../lib/effects";
import { Slider } from "../ui/Slider";
import { Toggle } from "../ui/Toggle";
import { cn } from "../../utils/cn";
import type { EffectType } from "../../types/studio";

const EFFECT_TYPES: EffectType[] = [
  "none", "fisheye", "barrel", "vignette", "scanlines",
  "glitch", "pixelate", "blur", "edge_glow", "chromatic", "crt",
];

export function SettingsPanel() {
  const { settings, updateSettings, effectSettings, updateEffectSettings } = useStudioStore();
  const { cursorFxEnabled, setCursorFxEnabled } = useUiStore();

  return (
    <div className="space-y-4 pb-4">
      {/* ── Arayüz ─────────────────────────────────────────── */}
      <Section title="Arayüz">
        <Toggle
          label="Arka Plan Efekti"
          checked={cursorFxEnabled}
          onChange={setCursorFxEnabled}
          description="İmleci çok hafif takip eden premium arka plan ışığı"
        />
      </Section>

      {/* ── Çıktı ──────────────────────────────────────────── */}
      <Section title="Çıktı">
        <Slider
          label="Genişlik (sütun)"
          value={settings.width}
          min={20}
          max={300}
          step={5}
          onChange={(v) => updateSettings({ width: v })}
          unit=" col"
        />
        <Slider
          label="Yazı Boyutu"
          value={settings.fontSize}
          min={6}
          max={20}
          step={1}
          onChange={(v) => updateSettings({ fontSize: v })}
          unit="px"
        />
        <Slider
          label="Satır Aralığı"
          value={settings.lineHeight}
          min={0.8}
          max={2.0}
          step={0.05}
          onChange={(v) => updateSettings({ lineHeight: v })}
          format={(v) => v.toFixed(2)}
        />
      </Section>

      {/* ── Görüntü ────────────────────────────────────────── */}
      <Section title="Görüntü Ayarları">
        <Slider
          label="Kontrast"
          value={settings.contrast}
          min={0.1}
          max={3.0}
          step={0.05}
          onChange={(v) => updateSettings({ contrast: v })}
          format={(v) => v.toFixed(2)}
          unit="x"
        />
        <Slider
          label="Parlaklık"
          value={settings.brightness}
          min={-100}
          max={100}
          step={1}
          onChange={(v) => updateSettings({ brightness: v })}
          unit=""
        />
        <Slider
          label="Gamma"
          value={settings.gamma}
          min={0.1}
          max={3.0}
          step={0.05}
          onChange={(v) => updateSettings({ gamma: v })}
          format={(v) => v.toFixed(2)}
        />
        <Toggle
          label="Renkleri Ters Çevir"
          checked={settings.invert}
          onChange={(v) => updateSettings({ invert: v })}
          description="Koyu-açık karakterleri ters çevirir"
        />
      </Section>

      {/* ── Renk Modu ──────────────────────────────────────── */}
      <Section title="Renk Modu">
        <div className="grid grid-cols-2 gap-2">
          {(["mono", "color"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSettings({ mode })}
              className={cn(
                "rounded-lg py-2 text-xs font-medium border transition-all",
                settings.mode === mode
                  ? "bg-accent/10 border-accent text-accent"
                  : "bg-surface border-border text-text-muted hover:border-border-hover"
              )}
            >
              {mode === "mono" ? "⬛ Mono" : "🌈 Renkli"}
            </button>
          ))}
        </div>

        {settings.mode === "color" && (
          <Slider
            label="Renk Doygunluğu"
            value={settings.colorSaturation}
            min={0}
            max={3}
            step={0.05}
            onChange={(v) => updateSettings({ colorSaturation: v })}
            format={(v) => v.toFixed(2)}
            unit="x"
          />
        )}
      </Section>

      {/* ── Efektler ───────────────────────────────────────── */}
      <Section title="Efektler">
        <p className="text-[10px] text-text-dim leading-snug -mt-1 mb-1">
          Dışa aktarma sırasında uygulanacak görsel efekt. PNG, GIF ve video çıktılarına işlenir.
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {EFFECT_TYPES.map((type) => {
            const info = EFFECT_DESCRIPTIONS[type];
            const isActive = effectSettings.type === type;
            return (
              <button
                key={type}
                onClick={() => updateEffectSettings({ type })}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left transition-all",
                  isActive
                    ? "bg-accent/10 border-accent shadow-sm shadow-accent/10"
                    : "bg-surface border-border hover:border-border-hover"
                )}
              >
                <span className="text-sm flex-shrink-0">{info.icon}</span>
                <div className="min-w-0">
                  <span
                    className={cn(
                      "text-[11px] font-medium block truncate",
                      isActive ? "text-accent" : "text-text"
                    )}
                  >
                    {info.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {effectSettings.type !== "none" && (
          <div className="mt-2 space-y-2">
            <p className="text-[10px] text-text-dim">
              {EFFECT_DESCRIPTIONS[effectSettings.type].description}
            </p>
            <Slider
              label="Yoğunluk"
              value={effectSettings.intensity}
              min={0.05}
              max={1.0}
              step={0.05}
              onChange={(v) => updateEffectSettings({ intensity: v })}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </div>
        )}
      </Section>

      {/* ── Renkler ────────────────────────────────────────── */}
      <Section title="Renkler">
        <div className="space-y-2">
          <ColorPicker
            label="Ön Plan"
            value={settings.foreground}
            onChange={(v) => updateSettings({ foreground: v })}
          />
          <ColorPicker
            label="Arka Plan"
            value={settings.background}
            onChange={(v) => updateSettings({ background: v })}
          />
        </div>
      </Section>

      {/* ── Karakter Seti ──────────────────────────────────── */}
      <Section title="Karakter Seti">
        <div className="space-y-1.5">
          {CHARSETS.map((cs) => (
            <button
              key={cs.id}
              onClick={() => updateSettings({ charsetId: cs.id })}
              className={cn(
                "w-full text-left rounded-lg px-3 py-2 border transition-all",
                settings.charsetId === cs.id
                  ? "bg-accent/5 border-accent"
                  : "bg-surface border-border hover:border-border-hover"
              )}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className={cn(
                    "text-xs font-medium",
                    settings.charsetId === cs.id ? "text-accent" : "text-text"
                  )}
                >
                  {cs.name}
                </span>
                {settings.charsetId === cs.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </div>
              <p className="text-[10px] text-text-dim">{cs.description}</p>
              <p
                className="text-[9px] text-text-dim font-mono mt-1 truncate"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {cs.chars.slice(0, 40)}
              </p>
            </button>
          ))}

          {/* Custom */}
          {settings.charsetId === "custom" && (
            <textarea
              value={settings.customCharset}
              onChange={(e) => updateSettings({ customCharset: e.target.value })}
              placeholder="Karakterleri koyu→açık sıraya göre yaz..."
              rows={2}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text font-mono resize-none focus:outline-none focus:border-accent transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
          )}
        </div>
      </Section>
    </div>
  );
}

// ─── Alt Bileşenler ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <h4 className="text-[10px] font-semibold text-text-dim uppercase tracking-wider px-1">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-text-muted flex-1">{label}</label>
      <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-2 py-1">
        <label className="relative cursor-pointer">
          <div
            className="w-5 h-5 rounded-md border border-border"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 bg-transparent text-xs text-text-muted font-mono focus:outline-none focus:text-text"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        />
      </div>
    </div>
  );
}
