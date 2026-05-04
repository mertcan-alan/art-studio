import { cn } from "../../utils/cn";

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
  description?: string;
}

export function Toggle({ label, checked, onChange, className, description }: ToggleProps) {
  return (
    <label
      className={cn(
        "flex items-center justify-between cursor-pointer group",
        className
      )}
    >
      <div>
        <span className="text-xs font-medium text-text-muted group-hover:text-text transition-colors">
          {label}
        </span>
        {description && (
          <p className="text-[10px] text-text-dim mt-0.5">{description}</p>
        )}
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-8 h-4 rounded-full transition-all duration-200 flex-shrink-0",
          checked ? "bg-accent" : "bg-border"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all duration-200",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </div>
    </label>
  );
}
