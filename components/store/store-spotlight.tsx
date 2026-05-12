"use client";

import { Check, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function StoreSpotlight({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  perks
}: {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  perks: string[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative bg-gradient-to-br from-brand-primary via-[#11488d] to-[#0d2e5c] p-6 text-white sm:p-8">
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-brand-accent/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="relative max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent">
                {eyebrow}
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">{title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/88 sm:text-base">{description}</p>
              <Link href={ctaHref} className="mt-6 inline-flex">
                <Button variant="accent" size="lg">
                  <ShoppingBag className="h-5 w-5" />
                  {ctaLabel}
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:p-8">
            {perks.map((perk) => (
              <div
                key={perk}
                className="rounded-2xl border border-brand-primary/10 bg-white/80 p-4 text-sm font-medium text-brand-primary dark:border-white/10 dark:bg-white/5 dark:text-brand-ink"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-full bg-brand-accent/15 p-2 text-brand-accent">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="leading-7">{perk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
