import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHero } from "@/components/ui/page-hero";
import { SmartImage } from "@/components/ui/smart-image";
import { getUpcomingEvents } from "@/lib/firebase/queries";
import { translateEventTag } from "@/lib/i18n/helpers";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";
import { formatDateTime, safeNumber } from "@/lib/utils";

const PAGE_SIZE = 9;

export default async function EventsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const dictionary = getServerDictionary();
  const locale = getServerLocale();
  const events = await getUpcomingEvents();
  const currentPage = Math.max(1, safeNumber(searchParams?.page as string, 1));
  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const paginatedEvents = events.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <PageHero
        eyebrow={dictionary.events.eyebrow}
        title={dictionary.events.title}
        description={dictionary.events.description}
      />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {paginatedEvents.length ? (
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
        ) : (
          <EmptyState
            title={dictionary.events.emptyTitle}
            description={dictionary.events.emptyDescription}
          />
        )}
      </section>
      <div className="pb-16">
        <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/events" />
      </div>
    </>
  );
}
