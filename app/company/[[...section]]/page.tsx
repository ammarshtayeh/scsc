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
  let session: Awaited<ReturnType<typeof getSessionFromCookies>> = null;

  try {
    session = await getSessionFromCookies(cookies());
  } catch (error) {
    console.error("[company:session]", error instanceof Error ? error.message : error);
  }

  if (!session) {
    redirect("/auth/login?redirect=/company");
  }

  let role = session.role;
  try {
    role =
      session.role === "admin" || session.role === "company"
        ? session.role
        : await resolveUserRoleFromUid(session.uid, session.role);
  } catch (error) {
    console.error("[company:role]", error instanceof Error ? error.message : error);
    role = session.role;
  }

  if (role !== "company" && role !== "admin") {
    redirect(getDefaultRedirectByRole(role));
  }

  const companyId = session.uid;
  let companyProfile: Awaited<ReturnType<typeof getUserProfileById>> = null;
  let initialProducts: Awaited<ReturnType<typeof getProductsByCompany>> = [];
  let initialOrders: Awaited<ReturnType<typeof getOrdersForCompany>> = [];
  let initialJobs: Awaited<ReturnType<typeof getJobsByOwner>> = [];
  let initialApplications: Awaited<ReturnType<typeof getJobApplicationsByOwner>> = [];

  try {
    [companyProfile, initialProducts, initialOrders, initialJobs, initialApplications] =
      await Promise.all([
        getUserProfileById(companyId),
        getProductsByCompany(companyId),
        getOrdersForCompany(companyId),
        getJobsByOwner(companyId),
        getJobApplicationsByOwner(companyId)
      ]);
  } catch (error) {
    console.error("[company:load]", error instanceof Error ? error.message : error);
  }

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
