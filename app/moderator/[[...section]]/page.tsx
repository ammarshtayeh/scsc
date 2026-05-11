import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";

export const dynamic = "force-dynamic";

export default async function ModeratorPage() {
  return <DashboardPageContent mode="moderator" />;
}
