"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { ImageSlider } from "@/components/sections/image-slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/useLocale";
import type { EventItem } from "@/types";

interface HeroSectionProps {
  slides: Array<{ image: string; title: string; caption: string }>;
  featuredEvent?: EventItem | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
};

export function HeroSection({ slides, featuredEvent }: HeroSectionProps) {
  const { dictionary, direction } = useLocale();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-grid" />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:gap-10 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/78 p-6 shadow-elevated backdrop-blur-xl dark:border-white/10 dark:bg-[#0e1b2e]/92 dark:shadow-[0_28px_72px_rgba(0,0,0,0.4)] sm:rounded-[34px] sm:p-10"
        >
          <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-brand-accent/18 blur-3xl dark:bg-brand-accent/14" />
          <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-brand-sky blur-3xl dark:bg-[#173257]" />
          <div className="relative">
            <motion.div variants={itemVariants}>
              <Badge className="border-brand-accent/30 bg-brand-accent/15 text-brand-accent">
                <Sparkles className="h-4 w-4" />
                {dictionary.home.badge}
              </Badge>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-6 font-heading text-4xl font-bold leading-tight text-brand-primary dark:text-brand-ink sm:mt-8 sm:text-5xl lg:text-6xl"
            >
              {dictionary.home.title}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-5 max-w-2xl text-base leading-7 text-brand-muted dark:text-[#d7e3f3] sm:mt-6 sm:text-lg sm:leading-8"
            >
              {dictionary.home.description}
            </motion.p>

            <motion.div variants={itemVariants} className="mt-7 grid gap-4 sm:mt-8 sm:grid-cols-2">
              <div className="rounded-2xl border border-brand-primary/15 bg-white/82 p-5 transition-shadow dark:border-brand-accent/18 dark:bg-white/[0.06] dark:shadow-[0_16px_40px_rgba(0,0,0,0.22)] sm:p-6 sm:hover:shadow-card">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-accent dark:text-[#f5d669]">
                  {dictionary.home.visionLabel}
                </p>
                <p className="mt-4 text-sm leading-7 text-brand-text dark:text-[#eef4fd]">
                  {dictionary.home.visionText}
                </p>
              </div>
              <div className="rounded-2xl border border-brand-primary/15 bg-white/82 p-5 transition-shadow dark:border-brand-accent/18 dark:bg-white/[0.06] dark:shadow-[0_16px_40px_rgba(0,0,0,0.22)] sm:p-6 sm:hover:shadow-card">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-accent dark:text-[#f5d669]">
                  {dictionary.home.missionLabel}
                </p>
                <p className="mt-4 text-sm leading-7 text-brand-text dark:text-[#eef4fd]">
                  {dictionary.home.missionText}
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-7 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap sm:gap-4">
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <Button size="lg" className="group w-full sm:w-auto">
                  {dictionary.home.joinCta}
                  <ArrowRight
                    className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${
                      direction === "rtl" ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </Link>
              <Link href={featuredEvent ? `/events/${featuredEvent.slug}` : "/events"} className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  {featuredEvent
                    ? dictionary.home.featuredEventCta
                    : dictionary.home.viewEventsCta}
                </Button>
              </Link>
            </motion.div>

            {featuredEvent ? (
              <motion.div
                variants={itemVariants}
                className="mt-7 rounded-2xl border border-brand-accent/30 bg-gradient-to-r from-brand-primary to-brand-primary/90 p-5 text-white shadow-glow dark:from-[#1a2c47] dark:to-[#21385a] sm:mt-8 sm:p-6"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-white/80">
                  {dictionary.home.featuredEventLabel}
                </p>
                <h2 className="mt-3 font-heading text-2xl font-bold leading-tight">
                  {featuredEvent.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/90">
                  {featuredEvent.excerpt}
                </p>
              </motion.div>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="lg:pt-8"
        >
          <ImageSlider slides={slides} />
        </motion.div>
      </div>
    </section>
  );
}
