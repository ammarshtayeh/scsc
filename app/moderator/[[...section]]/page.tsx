import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";
import { getDefaultRedirectByRole } from "@/lib/auth-redirect";
import { getSessionFromCookies } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export default async function ModeratorPage({
  params
}: {
  params: { section?: string[] };
}) {
  const session = await getSessionFromCookies(cookies());

  if (!session) {
    redirect("/auth/login?redirect=/moderator");
  }

  if (session.role !== "moderator" && session.role !== "admin") {
    redirect(getDefaultRedirectByRole(session.role));
  }

  return <DashboardPageContent mode="moderator" section={params.section?.[0]} />;
}
