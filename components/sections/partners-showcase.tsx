"use client";

import { ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { SmartImage } from "@/components/ui/smart-image";
import { useLocale } from "@/hooks/useLocale";
import type { PartnerHighlight } from "@/types";

export function PartnersShowcase({
  eyebrow,
  title,
  description,
  partners
}: {
  eyebrow: string;
  title: string;
  description: string;
  partners: PartnerHighlight[];
}) {
  const { locale } = useLocale();

  if (!partners.length) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="rounded-[30px] border border-white/70 bg-section-mesh p-6 shadow-float dark:border-white/10 dark:bg-brand-surface/84 sm:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-brand-primary dark:text-brand-ink sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-brand-mist sm:text-base">
            {description}
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {partners.map((partner) => {
            const Wrapper = partner.url ? "a" : "div";

            return (
              <Wrapper
                key={`${partner.name}-${partner.logo}`}
                {...(partner.url
                  ? { href: partner.url, target: "_blank", rel: "noreferrer" }
                  : {})}
                className="block"
              >
                <Card interactive={Boolean(partner.url)} className="h-full p-0">
                  <div className="relative h-44 overflow-hidden">
                    <SmartImage
                      src={partner.logo}
                      alt={partner.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-night/70 via-brand-night/10 to-transparent" />
                    <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                      <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                        {locale === "ar" ? "شريك" : "Partner"}
                      </span>
                      {partner.url ? (
                        <span className="rounded-full bg-white/15 p-2 text-white backdrop-blur">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-3 p-6">
                    <h3 className="font-heading text-2xl font-semibold text-brand-primary dark:text-brand-ink">
                      {partner.name}
                    </h3>
                    <p className="text-sm leading-7 text-slate-600 dark:text-brand-mist">
                      {partner.tagline}
                    </p>
                  </div>
                </Card>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
