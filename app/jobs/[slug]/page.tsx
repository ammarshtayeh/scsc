import { JobDetailShell } from "@/components/jobs/job-detail-shell";
import { getJobBySlug } from "@/lib/firebase/queries";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const initialJob = await getJobBySlug(params.slug).catch(() => null);

  return <JobDetailShell slug={params.slug} initialJob={initialJob} />;
}
