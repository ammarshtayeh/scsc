import Image from "next/image";

import { cn } from "@/lib/utils";

export function SiteLogo({
  className,
  withWordmark = true,
  compact = false,
  title = "Cosmetics & Skin Care",
  university = "An-Najah National University",
  shortName = "SCSC"
}: {
  className?: string;
  withWordmark?: boolean;
  compact?: boolean;
  title?: string;
  university?: string;
  shortName?: string;
}) {
  return (
    <div className={cn("flex max-w-full min-w-0 items-center", compact ? "gap-2.5" : "gap-3", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-full border border-brand-primary/20 bg-white shadow-soft ring-1 ring-brand-accent/20 dark:border-white/10 dark:bg-white/95 dark:ring-brand-accent/30",
          compact ? "h-11 w-11" : "h-12 w-12"
        )}
      >
        <Image
          src="/favicon.svg"
          alt=""
          aria-hidden="true"
          fill
          sizes={compact ? "44px" : "48px"}
          className="object-cover p-0.5"
          priority={compact}
        />
      </div>

      {withWordmark ? (
        <div className="min-w-0 max-w-full">
          <p
            className={cn(
              "truncate font-heading font-semibold text-brand-primary dark:text-brand-ink",
              compact ? "text-[0.72rem] leading-none tracking-[0.28em]" : "text-[0.78rem] tracking-[0.34em]"
            )}
          >
            {shortName}
          </p>
          <p
            className={cn(
              "max-w-full font-heading font-semibold text-brand-primary dark:text-brand-ink",
              compact
                ? "truncate whitespace-nowrap text-[0.88rem] leading-5 xl:text-[0.95rem]"
                : "text-pretty text-[0.98rem] leading-5"
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "max-w-full text-slate-500 dark:text-brand-mist",
              compact
                ? "truncate whitespace-nowrap text-[0.68rem] leading-4 xl:text-[0.72rem]"
                : "text-pretty text-xs"
            )}
          >
            {university}
          </p>
        </div>
      ) : null}
    </div>
  );
}
