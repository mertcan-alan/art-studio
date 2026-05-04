import { cn } from "../../utils/cn";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, className, position = "top" }: TooltipProps) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className={cn("relative group", className)}>
      {children}
      <div
        className={cn(
          "absolute z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150",
          positionClasses[position]
        )}
      >
        <div className="bg-surface-raised border border-border text-text text-[11px] font-medium whitespace-nowrap px-2 py-1 rounded-md shadow-lg">
          {content}
        </div>
      </div>
    </div>
  );
}
