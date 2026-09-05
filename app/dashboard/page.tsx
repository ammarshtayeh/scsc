import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDefaultRedirectByRole, getManagementPortalHref, getProfileHref } from "@/lib/auth-redirect";
import { getSessionFromCookies } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSessionFromCookies(cookies());

  if (!session) {
    redirect("/auth/login?redirect=/dashboard");
  }

  redirect(getManagementPortalHref(session.role) || getProfileHref() || getDefaultRedirectByRole(session.role));
}
