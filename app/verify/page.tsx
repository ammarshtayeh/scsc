"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
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

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <Card className="w-full text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent">
          {dictionary.verify.eyebrow}
        </p>
        {state.loading ? (
          <h1 className="mt-4 font-heading text-4xl font-bold text-brand-primary">
            {dictionary.verify.loading}
          </h1>
        ) : state.valid ? (
          <>
            <h1 className="mt-4 font-heading text-4xl font-bold text-brand-primary">
              {dictionary.verify.valid}
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {interpolate(dictionary.verify.validBody, state.memberName)}
            </p>
            <div className="mt-6 space-y-2 text-sm text-slate-600">
              <p>{dictionary.verify.memberId}: {state.memberId}</p>
              {state.membershipExpiryDate ? (
                <p>
                  {dictionary.verify.membershipExpiry}:{" "}
                  {formatDateTime(state.membershipExpiryDate, locale)}
                </p>
              ) : null}
              {state.scannedAt ? (
                <p>
                  {dictionary.verify.verifiedAt}:{" "}
                  {formatDateTime(state.scannedAt, locale)}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-4 font-heading text-4xl font-bold text-brand-primary">
              {dictionary.verify.invalid}
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">{reasonCopy}</p>
            {state.memberId || state.memberName || state.membershipExpiryDate ? (
              <div className="mt-6 space-y-2 text-sm text-slate-600">
                {state.memberName ? (
                  <p>
                    {dictionary.verify.memberName}: {state.memberName}
                  </p>
                ) : null}
                {state.memberId ? (
                  <p>
                    {dictionary.verify.memberId}: {state.memberId}
                  </p>
                ) : null}
                {state.membershipExpiryDate ? (
                  <p>
                    {dictionary.verify.membershipExpiry}:{" "}
                    {formatDateTime(state.membershipExpiryDate, locale)}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
