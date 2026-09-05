"use client";

import { useEffect, useState } from "react";

import { JobApplyForm } from "@/components/jobs/job-apply-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/hooks/useLocale";
import { fetchJobBySlugClient } from "@/lib/firebase/jobs-client";
import { formatDateTime } from "@/lib/utils";
import type { Job } from "@/types";

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

export function JobDetailShell({
  slug,
  initialJob = null
}: {
  slug: string;
  initialJob?: Job | null;
}) {
  const { dictionary, locale } = useLocale();
  const ar = locale === "ar";
  const [job, setJob] = useState<Job | null>(initialJob);
  const [loading, setLoading] = useState(!initialJob);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await fetchJobBySlugClient(slug);
        if (!cancelled) {
          setJob(next && next.published ? next : null);
        }
      } catch {
        if (!cancelled && initialJob) {
          setJob(initialJob);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, initialJob]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-40 rounded-[28px]" />
        <Skeleton className="h-72 rounded-[28px]" />
      </section>
    );
  }

  if (!job) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          title={dictionary.jobs.emptyTitle}
          description={dictionary.jobs.emptyDescription}
        />
      </section>
    );
  }

  return (
    <>
      <PageHero
        eyebrow={dictionary.jobs.detailEyebrow}
        title={job.title}
        description={`${job.company} · ${job.location}`}
      />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] sm:px-6 lg:px-8">
        <Card className="space-y-5 p-6">
          <div className="flex flex-wrap gap-2">
            <Badge>{employmentLabel(job.employmentType, ar)}</Badge>
            <Badge>
              {job.status === "open"
                ? ar
                  ? "مفتوحة"
                  : "Open"
                : ar
                  ? "مغلقة"
                  : "Closed"}
            </Badge>
            <Badge>{job.location}</Badge>
          </div>

          <div className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-brand-primary dark:text-brand-ink">
              {dictionary.jobs.aboutRole}
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-[#dfe8f6]">
              {job.description || dictionary.jobs.noDescription}
            </p>
          </div>

          {job.requirements.length ? (
            <div className="space-y-2">
              <h2 className="font-heading text-xl font-semibold text-brand-primary dark:text-brand-ink">
                {dictionary.jobs.requirements}
              </h2>
              <ul className="list-disc space-y-1 ps-5 text-sm text-slate-700 dark:text-[#dfe8f6]">
                {job.requirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-xs text-slate-500">
            {dictionary.jobs.postedAt} {formatDateTime(job.createdAt, locale)}
          </p>
        </Card>

        <JobApplyForm job={job} />
      </section>
    </>
  );
}
