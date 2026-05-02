import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-2xl bg-[length:200%_100%] bg-gradient-to-r from-brand-sky/40 via-white to-brand-sky/40",
        className
      )}
    />
  );
}
