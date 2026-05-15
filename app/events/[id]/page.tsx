import { CalendarRange, MapPin, Users } from "lucide-react";
import { notFound } from "next/navigation";

import { EventRegisterCard } from "@/components/sections/event-register-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { SmartImage } from "@/components/ui/smart-image";
import { getEventBySlug } from "@/lib/firebase/queries";
import { translateEventTag } from "@/lib/i18n/helpers";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";
import { formatDateTime, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params
}: {
  params: { id: string };
}) {
  const dictionary = getServerDictionary();
  const locale = getServerLocale();
  const event = await getEventBySlug(params.id);

  if (!event) {
    notFound();
  }

  return (
    <>
      <PageHero
        eyebrow={dictionary.events.eventDetailEyebrow}
        title={event.title}
        description={event.excerpt}
      />
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden p-0">
            <div className="relative h-[380px]">
              <SmartImage
                src={event.coverImage}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>
            <div className="space-y-6 p-8">
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <Badge key={tag}>{translateEventTag(tag, locale)}</Badge>
                ))}
              </div>
              <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                <p className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-brand-accent-strong dark:text-[#f5d669]" />
                  {formatDateTime(event.startsAt, locale)}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-accent-strong dark:text-[#f5d669]" />
                  {event.venue}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-accent-strong dark:text-[#f5d669]" />
                  {formatNumber(event.registeredCount, locale)}/{formatNumber(event.capacity, locale)} {dictionary.events.registeredSuffix}
                </p>
              </div>
              {event.description.map((paragraph, index) => (
                <p key={index} className="text-sm leading-8 text-slate-700">
                  {paragraph}
                </p>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <EventRegisterCard
              eventId={event.id}
              capacity={event.capacity}
              registeredCount={event.registeredCount}
            />
            <Card>
              <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                {dictionary.events.attendanceNotesTitle}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {dictionary.events.attendanceNotesBody}
              </p>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
