import { useEffect, useMemo, useRef, useState } from "react";
import { useUiStore } from "../../store/uiStore";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const m = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!m) return;
    const update = () => setReduced(Boolean(m.matches));
    update();

    if (typeof m.addEventListener === "function") {
      m.addEventListener("change", update);
      return () => m.removeEventListener("change", update);
    }
    // eslint-disable-next-line deprecation/deprecation
    m.addListener(update);
    // eslint-disable-next-line deprecation/deprecation
    return () => m.removeListener(update);
  }, []);

  return reduced;
}

export function BackgroundFX() {
  const { cursorFxEnabled } = useUiStore();
  const reducedMotion = usePrefersReducedMotion();
  const enabled = cursorFxEnabled && !reducedMotion;

  const rafRef = useRef<number | null>(null);
  const latest = useRef({ x: 0.5, y: 0.4 });

  const baseStyle = useMemo(() => {
    return {
      // Defaults (used until first pointer move)
      ["--mx" as never]: "55%",
      ["--my" as never]: "40%",
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;

    const updateVars = () => {
      rafRef.current = null;
      const x = Math.max(0, Math.min(1, latest.current.x));
      const y = Math.max(0, Math.min(1, latest.current.y));
      root.style.setProperty("--mx", `${(x * 100).toFixed(2)}%`);
      root.style.setProperty("--my", `${(y * 100).toFixed(2)}%`);
    };

    const onMove = (e: PointerEvent) => {
      latest.current.x = e.clientX / Math.max(1, window.innerWidth);
      latest.current.y = e.clientY / Math.max(1, window.innerHeight);
      if (rafRef.current == null) rafRef.current = window.requestAnimationFrame(updateVars);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0"
      style={baseStyle}
    >
      {/* Premium, subtle spotlight (uses theme accent via --color-accent) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(600px circle at var(--mx) var(--my), color-mix(in oklab, var(--color-accent) 22%, transparent) 0%, transparent 60%)",
          opacity: 0.55,
          filter: "blur(0px)",
        }}
      />

      {/* Secondary soft vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px circle at calc(var(--mx) * 0.9) calc(var(--my) * 0.9), rgba(255,255,255,0.06) 0%, transparent 55%)",
          opacity: 0.35,
        }}
      />
    </div>
  );
}

