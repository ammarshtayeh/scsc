"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { useLocale } from "@/hooks/useLocale";
import { fetchEventsClient } from "@/lib/firebase/events-client";
import { translateEventTag } from "@/lib/i18n/helpers";
import { formatDateTime } from "@/lib/utils";
import type { EventItem } from "@/types";

export function EventsGrid({
  initialEvents,
  currentPage,
  pageSize
}: {
  initialEvents: EventItem[];
  currentPage: number;
  pageSize: number;
}) {
  const { dictionary, locale } = useLocale();
  const [events, setEvents] = useState<EventItem[]>(initialEvents);

  useEffect(() => {
    if (initialEvents.length) {
      return;
    }

    let cancelled = false;
    fetchEventsClient()
      .then((next) => {
        if (!cancelled) {
          setEvents(next);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [initialEvents.length]);

  const paginatedEvents = initialEvents.length
    ? events.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : events;

  if (!paginatedEvents.length) {
    return (
      <EmptyState
        title={dictionary.events.emptyTitle}
        description={dictionary.events.emptyDescription}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {paginatedEvents.map((event) => (
        <Card key={event.id} interactive className="overflow-hidden p-0">
          <div className="relative h-60">
            <SmartImage
              src={event.coverImage}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 50vw, 33vw"
            />
          </div>
          <div className="space-y-4 p-6">
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <Badge key={tag}>{translateEventTag(tag, locale)}</Badge>
              ))}
            </div>
            <h2 className="font-heading text-2xl font-semibold text-brand-primary dark:text-brand-ink">
              {event.title}
            </h2>
            <p className="text-sm font-medium leading-7 text-slate-700 dark:text-[#dfe8f6]">
              {event.excerpt}
            </p>
            <div className="space-y-2 text-sm font-medium text-slate-700 dark:text-[#d7e2f2]">
              <p>{formatDateTime(event.startsAt, locale)}</p>
              <p>{event.venue}</p>
            </div>
            <Link href={`/events/${event.slug}`}>
              <Button variant="ghost">{dictionary.common.viewEvent}</Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
