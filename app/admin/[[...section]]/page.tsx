import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params
}: {
  params: { section?: string[] };
}) {
  return <DashboardPageContent mode="admin" section={params.section?.[0]} />;
}
