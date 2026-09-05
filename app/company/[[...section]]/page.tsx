import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CompanyDashboardShell } from "@/components/company/company-dashboard-shell";
import { getDefaultRedirectByRole } from "@/lib/auth-redirect";
import {
  getJobApplicationsByOwner,
  getJobsByOwner,
  getOrdersForCompany,
  getProductsByCompany,
  getUserProfileById
} from "@/lib/firebase/queries";
import { resolveUserRoleFromUid } from "@/lib/firebase/resolve-user-role";
import { getSessionFromCookies } from "@/lib/firebase/session";
import type { UserProfile } from "@/types";

export const dynamic = "force-dynamic";

export default async function CompanySectionPage() {
  const session = await getSessionFromCookies(cookies());

  if (!session) {
    redirect("/auth/login?redirect=/company");
  }

  const role =
    session.role === "admin" || session.role === "company"
      ? session.role
      : await resolveUserRoleFromUid(session.uid, session.role);

  if (role !== "company" && role !== "admin") {
    redirect(getDefaultRedirectByRole(role));
  }

  const companyId = session.uid;
  const [companyProfile, initialProducts, initialOrders, initialJobs, initialApplications] =
    await Promise.all([
      getUserProfileById(companyId),
      getProductsByCompany(companyId),
      getOrdersForCompany(companyId),
      getJobsByOwner(companyId),
      getJobApplicationsByOwner(companyId)
    ]);

  const fallbackCompany: UserProfile = {
    id: companyId,
    displayName: "Partner Company",
    email: "",
    role: "company",
    membershipStatus: "active",
    joinedAt: new Date().toISOString()
  };

  return (
    <main className="min-h-screen pb-16 pt-6">
      <CompanyDashboardShell
        company={companyProfile || fallbackCompany}
        initialProducts={initialProducts}
        initialOrders={initialOrders}
        initialJobs={initialJobs}
        initialApplications={initialApplications}
      />
    </main>
  );
}
