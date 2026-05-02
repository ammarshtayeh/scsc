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
      <svg
        viewBox="0 0 120 120"
        aria-hidden="true"
        className={cn("shrink-0", compact ? "h-11 w-11" : "h-12 w-12")}
        fill="none"
      >
        <circle cx="60" cy="60" r="55" stroke="#0B3B78" strokeWidth="4" />
        <path
          d="M17 73c12-7 23-10 33-10s21 3 33 10c-11 6-22 9-33 9s-22-3-33-9Z"
          fill="#F2C318"
          opacity="0.95"
        />
        <path
          d="M13 48c13 7 23 11 31 11 6 0 11-3 16-10 5 7 10 10 16 10 8 0 18-4 31-11-9 12-21 19-34 19-5 0-10-2-13-6-3 4-8 6-13 6-13 0-25-7-34-19Z"
          fill="#0B3B78"
        />
        <path d="M54 20h12v38H54z" fill="#7A8089" />
        <path d="M49 18h22v6H49z" fill="#F2C318" />
        <path d="M50 58c8-5 12-5 20 0v9c-8 5-12 5-20 0z" fill="#0B3B78" />
        <path
          d="M60 62c-7 5-10 10-10 15 0 5 3 8 8 10 4 2 7 4 7 7 0 2-1 4-4 6"
          stroke="#0B3B78"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M60 62c7 5 10 10 10 15 0 5-3 8-8 10-4 2-7 4-7 7 0 2 1 4 4 6"
          stroke="#0B3B78"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M60 21v79" stroke="#F2C318" strokeWidth="2.5" />
        <path
          d="M28 93c7 10 18 15 32 15s25-5 32-15"
          stroke="#0B3B78"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

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
