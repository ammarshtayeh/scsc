import { cookies } from "next/headers";

import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await verifySessionToken(cookies().get(SESSION_COOKIE_NAME)?.value);
  const mode = session?.role === "moderator" ? "moderator" : "admin";

  return <DashboardPageContent mode={mode} />;
}
