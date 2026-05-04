import { create } from "zustand";

export type ThemePreference = "system" | "dark" | "light";

type UiState = {
  themePreference: ThemePreference;
  cursorFxEnabled: boolean;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
  setCursorFxEnabled: (enabled: boolean) => void;
};

const STORAGE_KEY = "ascii_studio_ui_v1";

function loadInitial(): Pick<UiState, "themePreference" | "cursorFxEnabled"> {
  if (typeof window === "undefined") {
    return { themePreference: "system", cursorFxEnabled: true };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { themePreference: "system", cursorFxEnabled: true };
    const parsed = JSON.parse(raw) as Partial<UiState>;
    const themePreference =
      parsed.themePreference === "dark" ||
      parsed.themePreference === "light" ||
      parsed.themePreference === "system"
        ? parsed.themePreference
        : "system";
    const cursorFxEnabled =
      typeof parsed.cursorFxEnabled === "boolean" ? parsed.cursorFxEnabled : true;
    return { themePreference, cursorFxEnabled };
  } catch {
    return { themePreference: "system", cursorFxEnabled: true };
  }
}

function persist(partial: Pick<UiState, "themePreference" | "cursorFxEnabled">) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(partial));
  } catch {
    // ignore
  }
}

export const useUiStore = create<UiState>((set, get) => {
  const initial = loadInitial();

  return {
    themePreference: initial.themePreference,
    cursorFxEnabled: initial.cursorFxEnabled,

    setThemePreference: (pref) => {
      set({ themePreference: pref });
      persist({ themePreference: pref, cursorFxEnabled: get().cursorFxEnabled });
    },

    toggleTheme: () => {
      const current = get().themePreference;
      const next = current === "dark" ? "light" : "dark";
      set({ themePreference: next });
      persist({ themePreference: next, cursorFxEnabled: get().cursorFxEnabled });
    },

    setCursorFxEnabled: (enabled) => {
      set({ cursorFxEnabled: enabled });
      persist({ themePreference: get().themePreference, cursorFxEnabled: enabled });
    },
  };
});

