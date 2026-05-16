"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { CalendarDays, Images, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { useLocale } from "@/hooks/useLocale";
import { db } from "@/lib/firebase/firebase";
import { cn, formatDateLong, sanitizeImageSources } from "@/lib/utils";
import type { ArchivedEvent, Role } from "@/types";

interface EventArchiveProps {
  initialEvents: ArchivedEvent[];
}

function normalizeArchivedEvent(id: string, data: Record<string, unknown>): ArchivedEvent {
  const createdByRole =
    typeof data.createdByRole === "string" &&
    ["admin", "moderator", "user"].includes(data.createdByRole)
      ? (data.createdByRole as Role)
      : undefined;

  return {
    id,
    slug: typeof data.slug === "string" && data.slug.trim() ? data.slug.trim() : id,
    title:
      typeof data.title === "string" && data.title.trim() ? data.title.trim() : "Archived event",
    excerpt: typeof data.excerpt === "string" ? data.excerpt.trim() : "",
    description: Array.isArray(data.description)
      ? data.description
          .filter((entry): entry is string => typeof entry === "string")
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [],
    eventDate: typeof data.eventDate === "string" ? data.eventDate : "",
    venue: typeof data.venue === "string" && data.venue.trim() ? data.venue.trim() : "TBA",
    images: sanitizeImageSources(data.images),
    tags: Array.isArray(data.tags)
      ? data.tags
          .filter((entry): entry is string => typeof entry === "string")
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [],
    createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined,
    createdBy: typeof data.createdBy === "string" ? data.createdBy : undefined,
    createdByRole,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
    updatedBy: typeof data.updatedBy === "string" ? data.updatedBy : undefined
  };
}

function getArchiveYear(event: ArchivedEvent) {
  const date = new Date(event.eventDate);
  if (!Number.isNaN(date.getTime())) {
    return String(date.getFullYear());
  }

  return event.eventDate.slice(0, 4) || "Archive";
}

export function EventArchive({ initialEvents }: EventArchiveProps) {
  const { locale } = useLocale();
  const [events, setEvents] = useState(initialEvents);
  const years = useMemo(
    () =>
      Array.from(new Set(events.map((event) => getArchiveYear(event)))).sort(
        (a, b) => Number(b) - Number(a)
      ),
    [events]
  );
  const [selectedYear, setSelectedYear] = useState(years[0] || "");

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    if (!db) {
      return;
    }

    let mounted = true;

    async function loadArchivedEvents() {
      const snapshot = await getDocs(
        query(collection(db!, "archivedEvents"), orderBy("eventDate", "desc"))
      );
      if (!mounted) {
        return;
      }

      setEvents(
        snapshot.docs.map((entry) =>
          normalizeArchivedEvent(entry.id, entry.data() as Record<string, unknown>)
        )
      );
    }

    void loadArchivedEvents().catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!years.length) {
      setSelectedYear("");
      return;
    }

    if (!years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [selectedYear, years]);

  const visibleEvents = useMemo(() => {
    const nextEvents = selectedYear
      ? events.filter((event) => getArchiveYear(event) === selectedYear)
      : events;

    return [...nextEvents].sort(
      (a, b) => new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime()
    );
  }, [events, selectedYear]);

  const labels =
    locale === "ar"
      ? {
          eyebrow: "أرشيف الفعاليات",
          title: "فعاليات سابقة موثقة بالصور",
          description:
            "هنا يمكن استعراض الفعاليات السابقة التي يضيفها فريق الإدارة مع أكثر من صورة لكل فعالية وبطريقة سهلة وواضحة.",
          emptyTitle: "لا توجد فعاليات مؤرشفة بعد",
          emptyDescription: "ستظهر الفعاليات السابقة هنا فور إضافتها من لوحة التحكم.",
          photos: "صور",
          morePhotos: "صور إضافية",
          details: "تفاصيل الفعالية"
        }
      : {
          eyebrow: "Events archive",
          title: "Past events documented with photos",
          description:
            "Browse previously completed activities added by the team, including multi-image galleries for each event.",
          emptyTitle: "No archived events yet",
          emptyDescription: "Past events will appear here once they are added from the dashboard.",
          photos: "photos",
          morePhotos: "More photos",
          details: "Event details"
        };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-brand-primary/10 bg-white/82 p-8 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1829]/92 dark:shadow-[0_26px_70px_rgba(0,0,0,0.36)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent-strong">
              {labels.eyebrow}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-brand-primary dark:text-brand-ink">
              {labels.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-[#d7e2f2]">
              {labels.description}
            </p>
          </div>
          {years.length ? (
            <div className="flex flex-wrap gap-2">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    year === selectedYear
                      ? "bg-brand-primary text-white dark:bg-brand-accent dark:text-brand-primary"
                      : "bg-brand-sky text-brand-primary hover:bg-brand-primary hover:text-white dark:bg-white/8 dark:text-brand-ink dark:hover:bg-brand-accent dark:hover:text-brand-primary"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          {visibleEvents.length ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {visibleEvents.map((event) => {
                const primaryImage = event.images[0];
                const extraImages = event.images.slice(1);

                return (
                  <Card key={event.id} className="overflow-hidden p-0">
                    <div className="relative h-72 bg-[radial-gradient(circle_at_top,rgba(242,195,24,0.18),transparent_35%),linear-gradient(135deg,#0c2038,#143f6b)]">
                      {primaryImage ? (
                        <SmartImage
                          src={primaryImage}
                          alt={event.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1280px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Images className="h-12 w-12 text-white/75" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-[#06172b]/88 via-[#06172b]/35 to-transparent px-5 py-4 text-white">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Images className="h-4 w-4" />
                          <span>
                            {event.images.length} {labels.photos}
                          </span>
                        </div>
                        <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-medium">
                          {getArchiveYear(event)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-5 p-6">
                      <div className="space-y-3">
                        <h3 className="font-heading text-2xl font-semibold text-brand-primary dark:text-brand-ink">
                          {event.title}
                        </h3>
                        <div className="grid gap-2 text-sm text-slate-600 dark:text-[#d7e2f2]">
                          <p className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-brand-accent-strong" />
                            {formatDateLong(event.eventDate, locale)}
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-brand-accent-strong" />
                            {event.venue}
                          </p>
                        </div>
                        {event.excerpt ? (
                          <p className="text-sm leading-7 text-slate-700 dark:text-[#e4edf8]">
                            {event.excerpt}
                          </p>
                        ) : null}
                      </div>

                      {extraImages.length ? (
                        <div>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-[#b7c9df]">
                            {labels.morePhotos}
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            {extraImages.slice(0, 3).map((image, index) => (
                              <div key={`${event.id}-${index}`} className="relative h-24 overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/8">
                                <SmartImage
                                  src={image}
                                  alt={`${event.title} ${index + 2}`}
                                  fill
                                  className="object-cover"
                                  sizes="160px"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <details className="rounded-2xl border border-brand-primary/10 bg-brand-sky/35 p-4 dark:border-white/10 dark:bg-white/5">
                        <summary className="cursor-pointer text-sm font-semibold text-brand-primary dark:text-brand-ink">
                          {labels.details}
                        </summary>
                        <div className="mt-4 space-y-4">
                          {event.description.map((paragraph, index) => (
                            <p
                              key={index}
                              className="text-sm leading-7 text-slate-700 dark:text-[#e4edf8]"
                            >
                              {paragraph}
                            </p>
                          ))}
                          {event.images.length > 1 ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {event.images.map((image, index) => (
                                <div
                                  key={`${event.id}-gallery-${index}`}
                                  className="relative h-40 overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/8"
                                >
                                  <SmartImage
                                    src={image}
                                    alt={`${event.title} ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 40vw"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </details>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={labels.emptyTitle}
              description={labels.emptyDescription}
            />
          )}
        </div>
      </div>
    </section>
  );
}
