import * as React from "react";

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  surface?: "glass" | "none";
}

export function Card({ className, interactive, surface = "glass", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "showcase-panel rounded-[24px] border border-white/70 p-5 shadow-card backdrop-blur-xl ring-1 ring-brand-primary/5 dark:border-white/10 dark:shadow-[0_18px_46px_rgba(3,8,18,0.42)] dark:ring-white/8 sm:rounded-[28px] sm:p-6",
        surface === "glass" && "glass-surface",
        interactive &&
          "cursor-pointer transition-all duration-300 sm:hover:-translate-y-1.5 sm:hover:scale-[1.015] sm:hover:border-brand-accent/35 sm:hover:shadow-float dark:sm:hover:border-brand-accent/30 dark:sm:hover:shadow-[0_28px_75px_rgba(0,0,0,0.45)]",
        className
      )}
      {...props}
    />
  );
}
