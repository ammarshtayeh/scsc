"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocaleContext } from "@/components/providers/locale-provider";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useLocaleContext();
  const copy =
    locale === "ar"
      ? {
          badge: "خطأ مؤقت",
          title: "حصل خلل بسيط، الموقع ما زال شغّال",
          description:
            "حاول مرة ثانية. إذا استمرّت المشكلة ارجع للرئيسية وتابع التصفح بشكل طبيعي.",
          retry: "إعادة المحاولة",
          home: "العودة للرئيسية"
        }
      : {
          badge: "Temporary issue",
          title: "Something went wrong — the site is still available",
          description:
            "Please try again. If it continues, go home and keep browsing normally.",
          retry: "Try again",
          home: "Back to Home"
        };

  useEffect(() => {
    console.error("[app-error]", error.digest || error.message);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="w-full text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent-strong">
          {copy.badge}
        </p>
        <h1 className="mt-4 font-heading text-4xl font-bold text-brand-primary">{copy.title}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{copy.description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={reset}>
            {copy.retry}
          </Button>
          <Link href="/">
            <Button type="button" variant="secondary">
              {copy.home}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
