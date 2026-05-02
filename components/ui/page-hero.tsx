import { Badge } from "@/components/ui/badge";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-section-mesh p-6 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-brand-surface/84 dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:rounded-[36px] sm:p-10">
        <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-brand-accent/20 blur-3xl dark:bg-brand-accent/14" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-brand-sky blur-3xl dark:bg-[#173257]" />
        <div className="relative">
          <Badge>{eyebrow}</Badge>
          <h1 className="mt-4 max-w-4xl font-heading text-3xl font-bold leading-tight text-brand-primary dark:text-brand-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-brand-mist sm:text-base sm:leading-8">{description}</p>
        </div>
      </div>
    </section>
  );
}
