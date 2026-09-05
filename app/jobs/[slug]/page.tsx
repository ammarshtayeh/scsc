import { notFound } from "next/navigation";

import { JobApplyForm } from "@/components/jobs/job-apply-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { getJobBySlug } from "@/lib/firebase/queries";
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

export default async function JobDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const dictionary = getServerDictionary();
  const locale = getServerLocale();
  const ar = locale === "ar";
  const job = await getJobBySlug(params.slug);

  if (!job || !job.published) {
    notFound();
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
