import * as React from "react";

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-white/70 bg-white/92 p-5 shadow-card backdrop-blur-xl ring-1 ring-brand-primary/5 dark:border-white/10 dark:bg-[#0f1b2e]/92 dark:shadow-[0_18px_46px_rgba(3,8,18,0.42)] dark:ring-white/8 sm:rounded-[28px] sm:p-6",
        interactive &&
          "cursor-pointer transition-all duration-300 sm:hover:-translate-y-1.5 sm:hover:scale-[1.02] sm:hover:border-brand-accent/35 sm:hover:shadow-elevated dark:sm:hover:border-brand-accent/30 dark:sm:hover:shadow-[0_28px_75px_rgba(0,0,0,0.45)]",
        className
      )}
      {...props}
    />
  );
}
