import { useEffect } from "react";
import type { ThemePreference } from "../../store/uiStore";

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemePreference(pref: ThemePreference) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const effective = pref === "system" ? getSystemTheme() : pref;

  root.dataset.theme = effective;
  root.dataset.themePreference = pref;

  // Helps built-in form controls match the theme.
  root.style.colorScheme = effective;
}

export function useApplyThemePreference(pref: ThemePreference) {
  useEffect(() => {
    applyThemePreference(pref);

    if (typeof window === "undefined") return;
    if (pref !== "system") return;

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;

    const onChange = () => applyThemePreference("system");

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    // Safari fallback
    // eslint-disable-next-line deprecation/deprecation
    media.addListener(onChange);
    // eslint-disable-next-line deprecation/deprecation
    return () => media.removeListener(onChange);
  }, [pref]);
}

