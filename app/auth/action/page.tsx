import { Suspense } from "react";

import { AuthActionHandler } from "@/components/auth/auth-action-handler";
import { PageHero } from "@/components/ui/page-hero";
import { getServerLocale } from "@/lib/i18n/server";

export const metadata = {
  title: "Account",
  robots: { index: false, follow: false }
};

export default function AuthActionPage() {
  const ar = getServerLocale() === "ar";

  return (
    <>
      <PageHero
        eyebrow={ar ? "حسابك" : "Your account"}
        title={ar ? "إدارة الحساب" : "Account management"}
        description={
          ar
            ? "أكمل الخطوة المطلوبة لحسابك بشكل آمن."
            : "Securely complete the requested step for your account."
        }
      />
      <div className="mx-auto flex max-w-7xl justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <AuthActionHandler />
        </Suspense>
      </div>
    </>
  );
}
