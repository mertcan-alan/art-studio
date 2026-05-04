import React from "react";
import { cn } from "../../utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-accent text-black hover:bg-accent/90 active:scale-95 shadow-sm shadow-accent/20",
    secondary:
      "bg-surface border border-border text-text-muted hover:bg-surface-hover hover:text-text active:scale-95",
    ghost:
      "text-text-muted hover:bg-surface hover:text-text active:scale-95",
    danger:
      "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 active:scale-95",
    accent:
      "bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 active:scale-95",
  };

  const sizes = {
    sm: "h-7 px-3 text-xs gap-1.5",
    md: "h-8 px-4 text-sm",
    lg: "h-10 px-5 text-sm",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
