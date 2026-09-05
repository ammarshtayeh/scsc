import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";
import { getDefaultRedirectByRole } from "@/lib/auth-redirect";
import { resolveUserRoleFromUid } from "@/lib/firebase/resolve-user-role";
import { getSessionFromCookies } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params
}: {
  params: { section?: string[] };
}) {
  const session = await getSessionFromCookies(cookies());

  if (!session) {
    redirect("/auth/login?redirect=/admin");
  }

  const role =
    session.role === "admin"
      ? session.role
      : await resolveUserRoleFromUid(session.uid, session.role);

  if (role !== "admin") {
    redirect(getDefaultRedirectByRole(role));
  }

  return <DashboardPageContent mode="admin" section={params.section?.[0]} />;
}
