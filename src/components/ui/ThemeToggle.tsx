import { Monitor, Moon, Sun } from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";

export function ThemeToggle({ className }: { className?: string }) {
  const { themePreference, setThemePreference } = useUiStore();

  const icon =
    themePreference === "system" ? (
      <Monitor size={14} />
    ) : themePreference === "dark" ? (
      <Moon size={14} />
    ) : (
      <Sun size={14} />
    );

  const label =
    themePreference === "system"
      ? "Tema: Sistem"
      : themePreference === "dark"
      ? "Tema: Koyu"
      : "Tema: Açık";

  return (
    <div className={className}>
      <Tooltip content={label}>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setThemePreference(
                themePreference === "system"
                  ? "dark"
                  : themePreference === "dark"
                  ? "light"
                  : "system"
              )
            }
            className="gap-1.5"
            aria-label={label}
          >
            {icon}
            <span className="hidden sm:inline text-[11px]">Tema</span>
          </Button>
        </div>
      </Tooltip>
    </div>
  );
}

