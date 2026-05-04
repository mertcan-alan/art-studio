import React, { useEffect, useState } from "react";
import { useStudioStore } from "../store/studioStore";
import {
  Terminal,
  Upload,
  Brush,
  Palette,
  Download,
  ChevronRight,
  Zap,
  Lock,
  Cpu,
} from "lucide-react";
import { Button } from "./ui/Button";
import { ThemeToggle } from "./ui/ThemeToggle";
import { PRESETS } from "../lib/presets";

export function HomePage() {
  const { setActiveView, setActiveTool } = useStudioStore();

  const goStudio = (tool?: Parameters<typeof setActiveTool>[0]) => {
    if (tool) setActiveTool(tool);
    setActiveView("studio");
  };

  return (
    <div className="min-h-screen bg-bg text-text overflow-x-hidden">
      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-6 border-b border-border bg-bg/90 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Terminal size={14} className="text-black" />
          </div>
          <span className="font-bold text-text text-base tracking-tight">ASCII Studio</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
          >
            GitHub
          </a>
          <Button variant="primary" size="sm" onClick={() => goStudio()}>
            Studio'yu Aç
            <ChevronRight size={13} />
          </Button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 text-center relative">
        {/* Arka plan dekorasyon */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/3 blur-[120px] rounded-full" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 border border-accent/20 bg-accent/5 rounded-full px-3 py-1 text-xs text-accent mb-8 font-medium">
          <Zap size={11} />
          Tamamen ücretsiz — hesap gerekmez
        </div>

        {/* Başlık */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 max-w-3xl mx-auto">
          <span className="text-text">Görselleri </span>
          <span
            className="font-mono"
            style={{
              background: "linear-gradient(135deg, #c6ff00 0%, #00e5ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ASCII Sanatına
          </span>
          <br />
          <span className="text-text">Dönüştür</span>
        </h1>

        {/* Alt başlık */}
        <p className="text-text-muted text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Fotoğraf yükle, tuvalde çiz — saniyeler içinde
          <br />
          profesyonel ASCII art oluştur. TXT, PNG, SVG, HTML dışa aktar.
        </p>

        {/* CTA Butonları */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => goStudio("upload")}
            className="gap-2 text-sm"
          >
            <Upload size={15} />
            Görsel Yükle
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => goStudio("draw")}
            className="gap-2 text-sm"
          >
            <Brush size={15} />
            Fırça ile Çiz
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => goStudio("presets")}
            className="gap-2 text-sm"
          >
            <Palette size={15} />
            Presetleri İncele
          </Button>
        </div>

        {/* ASCII Demo */}
        <div className="mt-16 max-w-2xl mx-auto">
          <AsciiDemo />
        </div>
      </section>

      {/* ── Özellikler ──────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">Profesyonel araçlar</h2>
            <p className="text-text-muted text-sm">Her ihtiyacın için eksiksiz özellik seti</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Presetler ─────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">Hazır stiller</h2>
            <p className="text-text-muted text-sm">Tek tıkla farklı estetikler uygula</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {PRESETS.slice(0, 10).map((preset) => (
              <button
                key={preset.id}
                onClick={() => goStudio("presets")}
                className="group rounded-xl border border-border p-3 text-left hover:border-accent/50 transition-all hover:scale-[1.02]"
              >
                <div
                  className="w-full h-12 rounded-lg flex items-center justify-center text-[9px] font-mono font-bold mb-2 tracking-widest"
                  style={{ backgroundColor: preset.bg, color: preset.fg }}
                >
                  @%#*+=-:.
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs">{preset.icon}</span>
                  <span className="text-xs text-text font-medium group-hover:text-accent transition-colors">
                    {preset.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Adımlar ─────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">3 adımda ASCII sanatı</h2>
          </div>

          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-xl border border-border bg-surface hover:border-border-hover transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-text text-sm mb-1">{step.title}</h3>
                  <p className="text-text-dim text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-border text-center">
        <div className="max-w-lg mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Hemen başla</h2>
          <p className="text-text-muted text-sm">
            Kayıt, kurulum veya ödeme gerektirmez.
            <br />
            Tüm işlemler tarayıcında — gizliliğin korunur.
          </p>
          <Button variant="primary" size="lg" onClick={() => goStudio()} className="mx-auto">
            Studio'yu Aç
            <ChevronRight size={14} />
          </Button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
            <Terminal size={11} className="text-black" />
          </div>
          <span className="text-xs text-text-dim">ASCII Studio — Tarayıcıda çalışır</span>
        </div>
        <span className="text-xs text-text-dim font-mono">
          made with ♥ &amp; {'<>'} — 2025
        </span>
      </footer>
    </div>
  );
}

// ─── ASCII Demo Bileşeni ──────────────────────────────────────────────────────

const ASCII_FRAMES = [
`@@@@@@@@@@@@@@@@@@@@@@@@
@@@%%##***+++=---:::..@@
@@%##***+++=---:::... .@
@%##**++=--:::.      . @
@%#**+=-::..    .::--=+@
@@#*+=-:..  .:=+**##%%@@
@@@%#*=:.  :+**###%%@@@
@@@@%#*+=-=+*##%%@@@@@@@
@@@@@@@%####%%@@@@@@@@@@`,

`████████████████████
█▓▓▓▒▒▒░░░   ░░▒▒▓██
█▓▓▒▒░░    .  ░▒▒▓▓█
█▓▒▒░░  . . .  ░▒▒▓█
█▓▒░░.  .....  .░▒▒█
████▒░ ░░░░░░░░░▒███
█████▒▒▒▒▒▒▒▒▒▒████
████████████████████`,

`10110100011010001101
01001011010110100101
10100101101001011010
01011010010110100101
10100101101001011010
01011010010110100101
10110100011010001101`,
];

function AsciiDemo() {
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIdx((i) => (i + 1) % ASCII_FRAMES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const colors = ["#c9d1d9", "#00ff41", "#39ff14"];
  const bgs = ["#0d1117", "#000000", "#050505"];

  return (
    <div
      className="rounded-2xl border border-border overflow-hidden shadow-2xl transition-all duration-700"
      style={{ background: bgs[frameIdx] }}
    >
      {/* Terminal başlık */}
      <div className="h-8 flex items-center gap-2 px-4 border-b border-border bg-surface">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] text-text-dim font-mono ml-2">ascii-studio — preview</span>
      </div>

      {/* ASCII içerik */}
      <div className="p-6">
        <pre
          className="text-[11px] leading-tight font-mono transition-all duration-500 text-left"
          style={{
            color: colors[frameIdx],
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          }}
        >
          {ASCII_FRAMES[frameIdx]}
        </pre>
      </div>
    </div>
  );
}

// ─── Veri ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Upload size={16} />,
    title: "Görsel Yükle",
    desc: "PNG, JPG, WebP, GIF veya SVG yükle. Sürükle-bırak desteklenir.",
    accent: true,
  },
  {
    icon: <Brush size={16} />,
    title: "Fırça ile Çiz",
    desc: "Boş tuval üzerinde fırça, silgi, çizgi, dikdörtgen, elips araçlarıyla çizim yap.",
    accent: false,
  },
  {
    icon: <Palette size={16} />,
    title: "10 Hazır Preset",
    desc: "Matrix, Neon, Amber, Blueprint ve daha fazlası. Tek tıkla değiştir.",
    accent: false,
  },
  {
    icon: <Zap size={16} />,
    title: "Canlı Önizleme",
    desc: "Ayarları değiştir, sonuç anında güncellenir. Hızlı ve akıcı.",
    accent: false,
  },
  {
    icon: <Download size={16} />,
    title: "Çoklu Export",
    desc: "TXT, PNG (2x), SVG vektör ve HTML olarak dışa aktar.",
    accent: false,
  },
  {
    icon: <Lock size={16} />,
    title: "Tamamen Gizli",
    desc: "Tüm işlemler tarayıcında yapılır. Görsel sunucuya gitmez.",
    accent: false,
  },
  {
    icon: <Cpu size={16} />,
    title: "9 Karakter Seti",
    desc: "Standard, Detailed, Blocks, Binary, Matrix, Braille ve özel set.",
    accent: false,
  },
  {
    icon: <Terminal size={16} />,
    title: "Renkli ASCII",
    desc: "Orijinal görsel renklerini koruyarak renkli ASCII art üret.",
    accent: false,
  },
  {
    icon: <Cpu size={16} />,
    title: "Açık Kaynak",
    desc: "Kod tamamen şeffaf. İstediğin gibi kullan, katkıda bulun.",
    accent: false,
  },
];

const STEPS = [
  {
    title: "Görsel yükle veya fırça ile çiz",
    desc: "Sol panelden bir görsel yükle — PNG, JPG, WebP desteklenir. Ya da boş tuvalde çizim aracıyla kendi şeklini çiz.",
  },
  {
    title: "Ayarları ve stili seç",
    desc: "Genişlik, kontrast, parlaklık, karakter seti ve renk modunu ayarla. Hazır preset'lerden birini tek tıkla uygula.",
  },
  {
    title: "Dışa aktar veya kopyala",
    desc: "Sonucu panoya kopyala ya da TXT, PNG, SVG veya HTML olarak indir. Tüm işlemler tarayıcında gerçekleşir.",
  },
];

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent?: boolean;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-surface hover:border-border-hover transition-all hover:bg-surface-hover group">
      <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-3 group-hover:bg-accent/15 transition-colors">
        {icon}
      </div>
      <h3 className="font-semibold text-text text-sm mb-1">{title}</h3>
      <p className="text-text-dim text-xs leading-relaxed">{desc}</p>
    </div>
  );
}
