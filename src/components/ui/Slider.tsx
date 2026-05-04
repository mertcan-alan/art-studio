import { cn } from "../../utils/cn";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  className?: string;
  format?: (v: number) => string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = "",
  className,
  format,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  const display = format ? format(value) : `${value}${unit}`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-muted font-medium">{label}</label>
        <span className="text-xs text-accent font-mono font-medium tabular-nums">
          {display}
        </span>
      </div>
      <div className="relative h-4 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-[3px] rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        {/* Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-runnable-track]:h-[3px] [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-none"
        />
      </div>
    </div>
  );
}
