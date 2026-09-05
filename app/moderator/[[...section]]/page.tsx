import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";
import { getDefaultRedirectByRole } from "@/lib/auth-redirect";
import { resolveUserRoleFromUid } from "@/lib/firebase/resolve-user-role";
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

  const role =
    session.role === "admin" || session.role === "moderator"
      ? session.role
      : await resolveUserRoleFromUid(session.uid, session.role);

  if (role !== "moderator" && role !== "admin") {
    redirect(getDefaultRedirectByRole(role));
  }

  return <DashboardPageContent mode="moderator" section={params.section?.[0]} />;
}
