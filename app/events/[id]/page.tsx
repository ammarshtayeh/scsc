import { cache } from "react";

import { EventDetailShell } from "@/components/sections/event-detail-shell";
import { getEventBySlug } from "@/lib/firebase/queries";
import { getServerDictionary } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

const loadEvent = cache(getEventBySlug);

export async function generateMetadata({ params }: { params: { id: string } }) {
  const dictionary = getServerDictionary();
  const event = await loadEvent(params.id);

  return buildPageMetadata({
    title: event?.title || dictionary.nav.events,
    description: event?.excerpt || dictionary.events.description,
    path: `/events/${encodeURIComponent(params.id)}`,
    image: event?.coverImage
  });
}

export default async function EventDetailPage({
  params
}: {
  params: { id: string };
}) {
  const event = await loadEvent(params.id);

  return <EventDetailShell slug={decodeURIComponent(params.id)} initialEvent={event} />;
}
