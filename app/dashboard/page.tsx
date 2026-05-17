import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";
import { getDefaultRedirectByRole } from "@/lib/auth-redirect";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await verifySessionToken(cookies().get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/auth/login");
  }

  redirect(getDefaultRedirectByRole(session.role));

  return <DashboardPageContent mode="admin" />;
}
