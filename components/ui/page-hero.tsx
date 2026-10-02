interface PageHeroProps {
  /** Kept for call-site compatibility; no longer rendered. */
  eyebrow?: string;
  title: string;
  description: string;
}

export function PageHero({ title, description }: PageHeroProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-section-mesh p-6 shadow-float backdrop-blur-xl dark:border-white/10 dark:bg-brand-surface/84 dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:rounded-[36px] sm:p-10">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white/20 to-transparent dark:from-white/5" />
        <div className="relative">
          <h1 className="max-w-4xl font-heading text-3xl font-bold leading-tight text-brand-primary dark:text-brand-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-brand-mist sm:text-base sm:leading-8">{description}</p>
        </div>
      </div>
    </section>
  );
}
