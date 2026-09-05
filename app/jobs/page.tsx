import { JobsPublicShell } from "@/components/jobs/jobs-public-shell";
import { PageHero } from "@/components/ui/page-hero";
import { getPublishedJobs } from "@/lib/firebase/queries";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const dictionary = getServerDictionary();
  const initialJobs = await getPublishedJobs().catch(() => []);

  return (
    <>
      <PageHero
        eyebrow={dictionary.jobs.eyebrow}
        title={dictionary.jobs.title}
        description={dictionary.jobs.description}
      />
      <JobsPublicShell initialJobs={initialJobs} />
    </>
  );
}
