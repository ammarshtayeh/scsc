import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";

export const dynamic = "force-dynamic";

export default async function ModeratorPage({
  params
}: {
  params: { section?: string[] };
}) {
  return <DashboardPageContent mode="moderator" section={params.section?.[0]} />;
}
