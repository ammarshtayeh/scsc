import { cache } from "react";

import { JobDetailShell } from "@/components/jobs/job-detail-shell";
import { getJobBySlug } from "@/lib/firebase/queries";
import { getServerDictionary } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

const loadJob = cache(getJobBySlug);

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const dictionary = getServerDictionary();
  const loaded = await loadJob(params.slug);
  const job = loaded?.published ? loaded : null;
  const title = job ? [job.title, job.company].filter(Boolean).join(" — ") : dictionary.nav.jobs;

  return buildPageMetadata({
    title,
    description: job?.description || dictionary.jobs.description,
    path: `/jobs/${encodeURIComponent(params.slug)}`
  });
}

export default async function JobDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const initialJob = await loadJob(params.slug);

  return <JobDetailShell slug={params.slug} initialJob={initialJob} />;
}
