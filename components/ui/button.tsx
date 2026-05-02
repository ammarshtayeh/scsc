"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-primary text-white shadow-soft hover:bg-[#0f4a93] hover:shadow-elevated hover:-translate-y-0.5 active:shadow-soft transition-all dark:bg-[#21467c] dark:text-brand-ink dark:hover:bg-[#2a558f]",
  secondary:
    "border border-brand-primary/15 bg-white/95 text-brand-primary hover:bg-brand-sky/85 hover:border-brand-primary/25 hover:-translate-y-0.5 shadow-card hover:shadow-soft transition-all dark:border-white/16 dark:bg-[#16253b] dark:text-brand-ink dark:hover:bg-[#1d3150]",
  ghost:
    "text-brand-primary hover:bg-brand-sky/70 transition-colors dark:text-[#f5d669] dark:hover:bg-[#16253b]",
  accent:
    "bg-brand-accent text-brand-primary shadow-glow hover:bg-[#f6cf42] hover:shadow-elevated hover:-translate-y-0.5 active:shadow-glow transition-all dark:bg-[#e0b11d] dark:text-[#0d1625] dark:hover:bg-[#f2c734]"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm font-medium",
  md: "h-11 px-5 text-sm font-medium sm:h-12 sm:px-6",
  lg: "h-12 px-6 text-sm font-semibold sm:h-14 sm:px-8 sm:text-base"
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-background dark:focus-visible:ring-offset-brand-night disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98]",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
