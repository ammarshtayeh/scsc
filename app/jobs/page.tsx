import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { getPublishedJobs } from "@/lib/firebase/queries";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function employmentLabel(type: string, ar: boolean) {
  if (!ar) return type.replace("-", " ");
  switch (type) {
    case "full-time":
      return "دوام كامل";
    case "part-time":
      return "دوام جزئي";
    case "internship":
      return "تدريب";
    case "contract":
      return "عقد";
    default:
      return type;
  }
}

export default async function JobsPage() {
  const dictionary = getServerDictionary();
  const locale = getServerLocale();
  const ar = locale === "ar";
  const jobs = await getPublishedJobs();

  return (
    <>
      <PageHero
        eyebrow={dictionary.jobs.eyebrow}
        title={dictionary.jobs.title}
        description={dictionary.jobs.description}
      />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {jobs.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {jobs.map((job) => (
              <Card key={job.id} interactive className="space-y-4 p-6">
                <div className="flex flex-wrap gap-2">
                  <Badge>{job.company}</Badge>
                  <Badge>{employmentLabel(job.employmentType, ar)}</Badge>
                  <Badge>{job.location}</Badge>
                </div>
                <h2 className="font-heading text-2xl font-semibold text-brand-primary dark:text-brand-ink">
                  {job.title}
                </h2>
                <p className="line-clamp-3 text-sm leading-7 text-slate-700 dark:text-[#dfe8f6]">
                  {job.description || dictionary.jobs.noDescription}
                </p>
                <p className="text-xs text-slate-500">
                  {dictionary.jobs.postedAt} {formatDateTime(job.createdAt, locale)}
                </p>
                <Link href={`/jobs/${job.slug}`}>
                  <Button variant="ghost">{dictionary.jobs.viewJob}</Button>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title={dictionary.jobs.emptyTitle}
            description={dictionary.jobs.emptyDescription}
          />
        )}
      </section>
    </>
  );
}
