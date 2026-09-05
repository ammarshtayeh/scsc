import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CompanyDashboardShell } from "@/components/company/company-dashboard-shell";
import { getDefaultRedirectByRole } from "@/lib/auth-redirect";
import {
  getOrdersForCompany,
  getProductsByCompany,
  getUserProfileById
} from "@/lib/firebase/queries";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/firebase/session";
import type { UserProfile } from "@/types";

export const dynamic = "force-dynamic";

export default async function CompanySectionPage() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    redirect("/auth/login?redirect=/company");
  }

  if (session.role !== "company" && session.role !== "admin") {
    redirect(getDefaultRedirectByRole(session.role));
  }

  const companyId = session.uid;
  const [companyProfile, initialProducts, initialOrders] = await Promise.all([
    getUserProfileById(companyId),
    getProductsByCompany(companyId),
    getOrdersForCompany(companyId)
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
      />
    </main>
  );
}
