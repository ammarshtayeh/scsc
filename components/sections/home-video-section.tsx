"use client";

import { motion } from "framer-motion";

interface HomeVideoSectionProps {
  title: string;
  description: string;
  videoUrl: string;
}

export function HomeVideoSection({ title, description, videoUrl }: HomeVideoSectionProps) {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-surface overflow-hidden rounded-[28px] border border-white/60 p-5 shadow-float dark:border-white/10 sm:rounded-[32px] sm:p-7"
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent-strong">
              SCSC Media
            </p>
            <h2 className="font-heading text-3xl font-bold text-brand-primary dark:text-brand-ink sm:text-4xl">
              {title}
            </h2>
            <p className="text-sm leading-7 text-brand-muted dark:text-[#d7e3f3] sm:text-base">
              {description}
            </p>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-brand-primary/10 bg-slate-950 shadow-[0_20px_45px_rgba(15,23,42,0.22)]">
            <video
              key={videoUrl}
              controls
              playsInline
              preload="metadata"
              className="h-full max-h-[520px] w-full bg-black object-cover"
            >
              <source src={videoUrl} />
            </video>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
