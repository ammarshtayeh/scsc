"use client";

import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedMembershipPaperCard } from "@/components/verify/verified-membership-paper-card";
import { useLocale } from "@/hooks/useLocale";
import { verifyMembershipPass } from "@/lib/firebase/functions";
import { formatDateTime } from "@/lib/utils";
import type { VerifyMembershipResponse } from "@/types";

const verificationRequests = new Map<string, Promise<VerifyMembershipResponse>>();

function interpolate(template: string, value: string | undefined) {
  return template.replace("{name}", value || "");
}

export default function VerifyPage() {
  const { dictionary, locale } = useLocale();
  const searchParams = useSearchParams();
  const pass = searchParams.get("pass");
  const [state, setState] = useState<VerifyMembershipResponse & { loading: boolean }>({
    loading: true,
    valid: false
  });

  useEffect(() => {
    if (!pass) {
      setState({ loading: false, valid: false });
      return;
    }

    let cancelled = false;
    const existingRequest = verificationRequests.get(pass);
    const request =
      existingRequest ||
      verifyMembershipPass(pass).finally(() => {
        window.setTimeout(() => {
          verificationRequests.delete(pass);
        }, 5000);
      });

    if (!existingRequest) {
      verificationRequests.set(pass, request);
    }

    request
      .then((result) => {
        if (!cancelled) {
          setState({ loading: false, ...result });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ loading: false, valid: false, reason: "invalid" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pass]);

  const reasonCopy =
    state.reason === "duplicate"
      ? dictionary.verify.reasonDuplicate
      : state.reason === "expired"
        ? dictionary.verify.reasonExpired
        : state.reason === "inactive"
          ? dictionary.verify.reasonInactive
          : state.reason === "stale"
            ? dictionary.verify.reasonStale
            : dictionary.verify.reasonInvalid;

  const paperLabels = useMemo(
    () => ({
      associationShort: dictionary.verify.associationShort,
      associationLine: dictionary.verify.associationLine,
      university: dictionary.verify.university,
      nameLabel: dictionary.verify.nameLabel,
      studentIdLabel: dictionary.verify.studentIdLabel,
      degreeLabel: dictionary.verify.degreeLabel,
      memberIdLabel: dictionary.verify.memberId,
      expLabel: dictionary.verify.expLabel,
      verifiedStamp: dictionary.verify.verifiedStamp,
      notProvided: dictionary.common.notProvided
    }),
    [dictionary]
  );

  const hasMemberPreview =
    Boolean(state.memberName || state.memberId || state.studentId || state.degree) &&
    !state.loading;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent-strong">
          {dictionary.verify.eyebrow}
        </p>
        {state.loading ? (
          <h1 className="mt-3 font-heading text-3xl font-bold text-brand-primary sm:text-4xl">
            {dictionary.verify.loading}
          </h1>
        ) : state.valid ? (
          <h1 className="mt-3 font-heading text-3xl font-bold text-brand-primary sm:text-4xl">
            {dictionary.verify.valid}
          </h1>
        ) : (
          <h1 className="mt-3 font-heading text-3xl font-bold text-brand-primary sm:text-4xl">
            {dictionary.verify.invalid}
          </h1>
        )}
      </div>

      {state.loading ? (
        <div className="mx-auto max-w-[680px] space-y-4">
          <Skeleton className="aspect-[1.72/1] w-full rounded-[1.35rem]" />
          <Skeleton className="h-24 w-full rounded-[1.35rem]" />
        </div>
      ) : hasMemberPreview ? (
        <div className="space-y-6">
          <VerifiedMembershipPaperCard
            locale={locale}
            labels={paperLabels}
            valid={state.valid}
            data={{
              memberName: state.memberName,
              memberId: state.memberId,
              studentId: state.studentId,
              degree: state.degree,
              membershipExpiryDate: state.membershipExpiryDate,
              photoURL: state.photoURL
            }}
            className="animate-fadeIn"
          />

          <Card
            className={
              state.valid
                ? "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                : "border-red-200/80 bg-red-50/70 dark:border-red-500/20 dark:bg-red-500/10"
            }
          >
            <div className="flex items-start gap-3">
              {state.valid ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              )}
              <div className="space-y-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                {state.valid ? (
                  <p>{interpolate(dictionary.verify.validBody, state.memberName)}</p>
                ) : (
                  <p>{reasonCopy}</p>
                )}
                {state.scannedAt ? (
                  <p className="text-xs text-slate-500">
                    {dictionary.verify.verifiedAt}: {formatDateTime(state.scannedAt, locale)}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">{reasonCopy}</p>
        </Card>
      )}
    </section>
  );
}
