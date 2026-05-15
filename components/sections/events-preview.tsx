"use client";

import { motion } from "framer-motion";
import { CalendarRange, MapPin } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SmartImage } from "@/components/ui/smart-image";
import { useLocale } from "@/hooks/useLocale";
import { translateEventTag } from "@/lib/i18n/helpers";
import { formatDateTime } from "@/lib/utils";
import type { EventItem } from "@/types";

export function EventsPreview({ events }: { events: EventItem[] }) {
  const { dictionary, locale } = useLocale();

  if (!events.length) {
    return null;
  }

  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-soft backdrop-blur-xl dark:border-white/12 dark:bg-brand-surface sm:rounded-[32px] sm:p-8">
          <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent-strong">
                {dictionary.home.upcomingEventsLabel}
              </p>
              <h2 className="mt-3 font-heading text-2xl font-bold text-brand-primary dark:text-brand-ink sm:text-3xl">
                {dictionary.home.upcomingEventsTitle}
              </h2>
            </div>
            <Link href="/events" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">{dictionary.common.seeAllEvents}</Button>
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {events.slice(0, 3).map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
              >
                <Card interactive className="h-full overflow-hidden p-0">
                  <div className="relative h-48 sm:h-56">
                    <SmartImage
                      src={event.coverImage}
                      alt={event.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>
                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <Badge key={tag}>{translateEventTag(tag, locale)}</Badge>
                      ))}
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-brand-primary dark:text-brand-ink">
                      {event.title}
                    </h3>
                    <p className="text-sm font-medium leading-7 text-slate-700 dark:text-[#dfe8f6]">
                      {event.excerpt}
                    </p>
                    <div className="space-y-2 text-sm font-medium text-slate-700 dark:text-[#d7e2f2]">
                      <p className="flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-brand-accent-strong dark:text-[#f5d669]" />
                        {formatDateTime(event.startsAt, locale)}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-brand-accent-strong dark:text-[#f5d669]" />
                        {event.venue}
                      </p>
                    </div>
                    <Link href={`/events/${event.slug}`} className="block sm:inline-block">
                      <Button variant="ghost" className="w-full sm:w-auto">{dictionary.common.eventDetails}</Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
