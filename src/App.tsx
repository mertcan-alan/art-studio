import { useStudioStore } from "./store/studioStore";
import { useUiStore } from "./store/uiStore";
import { HomePage } from "./components/HomePage";
import { StudioShell } from "./components/studio/StudioShell";
import { useApplyThemePreference } from "./lib/theme/applyTheme";
import { BackgroundFX } from "./components/ui/BackgroundFX";

export default function App() {
  const { activeView } = useStudioStore();
  const { themePreference } = useUiStore();

  useApplyThemePreference(themePreference);

  return (
    <div className="relative z-0 min-h-screen">
      <BackgroundFX />
      <div className="relative z-10 min-h-screen">
        {activeView === "studio" ? <StudioShell /> : <HomePage />}
      </div>
    </div>
  );
}
