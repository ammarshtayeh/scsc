import { EventsGrid } from "@/components/sections/events-grid";
import { Pagination } from "@/components/ui/pagination";
import { PageHero } from "@/components/ui/page-hero";
import { getUpcomingEvents } from "@/lib/firebase/queries";
import { getServerDictionary } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/page-metadata";
import { safeNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  const dictionary = getServerDictionary();
  return buildPageMetadata({
    title: dictionary.nav.events,
    description: dictionary.events.description,
    path: "/events"
  });
}

const PAGE_SIZE = 9;

export default async function EventsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const dictionary = getServerDictionary();
  const events = await getUpcomingEvents();
  const currentPage = Math.max(1, safeNumber(searchParams?.page as string, 1));
  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));

  return (
    <>
      <PageHero
        eyebrow={dictionary.events.eyebrow}
        title={dictionary.events.title}
        description={dictionary.events.description}
      />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EventsGrid initialEvents={events} currentPage={currentPage} pageSize={PAGE_SIZE} />
      </section>
      <div className="pb-16">
        <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/events" />
      </div>
    </>
  );
}
