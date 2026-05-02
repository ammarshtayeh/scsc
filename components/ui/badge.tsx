import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3.5 py-1.5 text-xs font-semibold text-brand-accent uppercase tracking-wide dark:border-brand-accent/20 dark:bg-brand-accent/12 dark:text-[#f5d669]",
        className
      )}
    >
      {children}
    </span>
  );
}
