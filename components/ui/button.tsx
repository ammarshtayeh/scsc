"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-brand-primary via-[#11488d] to-[#0b3b78] text-white shadow-soft hover:from-[#11488d] hover:via-[#1753a1] hover:to-[#0f4a93] hover:shadow-float hover:-translate-y-0.5 active:shadow-soft transition-all dark:from-[#21467c] dark:via-[#295289] dark:to-[#1a3b66] dark:text-brand-ink dark:hover:from-[#2a558f] dark:hover:to-[#21467c]",
  secondary:
    "border border-brand-primary/15 bg-white/95 text-brand-primary hover:bg-brand-sky/85 hover:border-brand-primary/25 hover:-translate-y-0.5 shadow-card hover:shadow-soft transition-all dark:border-white/16 dark:bg-[#16253b] dark:text-brand-ink dark:hover:bg-[#1d3150]",
  ghost:
    "text-brand-primary hover:bg-brand-sky/70 transition-colors dark:text-[#f5d669] dark:hover:bg-[#16253b]",
  accent:
    "bg-gradient-to-r from-brand-accent via-[#f6cf42] to-[#efbb0f] text-brand-primary shadow-glow hover:from-[#f6cf42] hover:via-[#f8d75b] hover:to-[#f3c223] hover:shadow-float hover:-translate-y-0.5 active:shadow-glow transition-all dark:from-[#e0b11d] dark:via-[#f0c530] dark:to-[#dba910] dark:text-[#0d1625] dark:hover:from-[#f2c734] dark:hover:to-[#e6b91f]"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm font-medium",
  md: "h-11 px-5 text-sm font-medium sm:h-12 sm:px-6",
  lg: "h-12 px-6 text-sm font-semibold sm:h-14 sm:px-8 sm:text-base"
};

const baseButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-background dark:focus-visible:ring-offset-brand-night disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98]";

export function getButtonClassName({
  variant = "primary",
  size = "md",
  className
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(baseButtonClassName, variantClasses[variant], sizeClasses[size], className);
}

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
      <button ref={ref} className={getButtonClassName({ variant, size, className })} {...props}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
