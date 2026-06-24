"use client";

import Image from "next/image";

import { SmartImage } from "@/components/ui/smart-image";
import { cn, formatDateShort } from "@/lib/utils";
import type { AppLocale } from "@/lib/i18n/config";

export interface VerifiedMembershipPaperCardLabels {
  associationShort: string;
  associationLine: string;
  university: string;
  nameLabel: string;
  studentIdLabel: string;
  degreeLabel: string;
  memberIdLabel: string;
  expLabel: string;
  verifiedStamp: string;
  notProvided: string;
}

export interface VerifiedMembershipPaperCardData {
  memberName?: string;
  memberId?: string;
  studentId?: string;
  degree?: string;
  membershipExpiryDate?: string;
  photoURL?: string;
}

interface VerifiedMembershipPaperCardProps {
  locale: AppLocale;
  labels: VerifiedMembershipPaperCardLabels;
  data: VerifiedMembershipPaperCardData;
  valid?: boolean;
  className?: string;
}

function formatExpiryLabel(value: string | undefined, locale: AppLocale) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return locale === "ar" ? `${month}/${year}` : `${month}/${year}`;
}

export function VerifiedMembershipPaperCard({
  locale,
  labels,
  data,
  valid = true,
  className
}: VerifiedMembershipPaperCardProps) {
  const isArabic = locale === "ar";

  return (
    <article
      dir={isArabic ? "rtl" : "ltr"}
      className={cn(
        "relative mx-auto w-full max-w-[680px] overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-[#fcfbfa] shadow-[0_28px_70px_rgba(11,59,120,0.18),0_2px_0_rgba(255,255,255,0.9)_inset]",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_10%,rgba(242,195,24,0.08),transparent_28%),radial-gradient(circle_at_88%_88%,rgba(11,59,120,0.06),transparent_32%)]",
        "after:pointer-events-none after:absolute after:inset-0 after:opacity-[0.035] after:[background-image:linear-gradient(rgba(11,59,120,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(11,59,120,0.35)_1px,transparent_1px)] after:[background-size:18px_18px]",
        className
      )}
    >
      <div className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full bg-brand-primary/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-8 top-8 h-32 w-32 rounded-full bg-brand-accent/15 blur-2xl" />

      <div className="relative aspect-[1.72/1] min-h-[220px] p-5 sm:p-6">
        <div className="pointer-events-none absolute left-0 top-0 h-24 w-32 overflow-hidden">
          <div className="absolute -left-8 top-2 h-16 w-36 rotate-[-18deg] rounded-full bg-brand-primary/90" />
          <div className="absolute -left-10 top-8 h-10 w-32 rotate-[-18deg] rounded-full bg-brand-primary/55" />
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-3 bg-brand-primary" />
        <div className="pointer-events-none absolute bottom-3 right-0 h-10 w-28 skew-x-[-18deg] bg-brand-accent/90" />

        <div className="relative flex h-full flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className={cn("min-w-0", isArabic ? "text-right" : "text-left")}>
              <p className="font-heading text-2xl font-bold tracking-[0.18em] text-brand-primary sm:text-[1.65rem]">
                {labels.associationShort}
              </p>
              <p className="mt-1 max-w-[14rem] font-heading text-sm font-semibold leading-5 text-brand-accent-strong sm:text-base">
                {labels.associationLine}
              </p>
              <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-slate-500">
                {labels.university}
              </p>
            </div>

            {valid ? (
              <div className="shrink-0 rounded-full border-2 border-emerald-500/40 bg-emerald-50 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-emerald-700 shadow-sm">
                {labels.verifiedStamp}
              </div>
            ) : null}
          </div>

          <div className="grid flex-1 items-center gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
            <div className="mx-auto flex flex-col items-center gap-3 sm:mx-0">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-[3px] border-brand-accent/70 bg-white shadow-[0_10px_30px_rgba(11,59,120,0.15)] ring-4 ring-brand-primary/10 sm:h-28 sm:w-28">
                {data.photoURL ? (
                  <SmartImage
                    src={data.photoURL}
                    alt={data.memberName || labels.nameLabel}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src="/favicon.svg"
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover p-1.5"
                  />
                )}
              </div>
              <div className="hidden rounded-full border border-brand-primary/15 bg-white/80 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-brand-primary sm:block">
                {labels.memberIdLabel}: {data.memberId || labels.notProvided}
              </div>
            </div>

            <div className="space-y-3 text-sm sm:text-base">
              <PaperField
                label={labels.nameLabel}
                value={data.memberName || labels.notProvided}
                align={isArabic ? "right" : "left"}
              />
              <PaperField
                label={labels.studentIdLabel}
                value={data.studentId || labels.notProvided}
                align={isArabic ? "right" : "left"}
              />
              <PaperField
                label={labels.degreeLabel}
                value={data.degree || labels.notProvided}
                align={isArabic ? "right" : "left"}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-brand-primary/10 pt-3">
            <p className="text-xs font-medium text-slate-500 sm:hidden">
              {labels.memberIdLabel}: {data.memberId || labels.notProvided}
            </p>
            <p className="font-heading text-sm font-bold tracking-[0.12em] text-brand-primary sm:text-base">
              {labels.expLabel}: {formatExpiryLabel(data.membershipExpiryDate, locale)}
            </p>
            {data.membershipExpiryDate ? (
              <p className="text-xs text-slate-500">
                {formatDateShort(data.membershipExpiryDate, locale)}
              </p>
            ) : null}
          </div>
        </div>

        {!valid ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
            <div className="rotate-[-16deg] rounded-xl border-4 border-red-500/70 px-6 py-3 text-2xl font-black uppercase tracking-[0.28em] text-red-600/85">
              {locale === "ar" ? "غير صالحة" : "Invalid"}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function PaperField({
  label,
  value,
  align
}: {
  label: string;
  value: string;
  align: "left" | "right";
}) {
  return (
    <div className={cn("min-w-0", align === "right" ? "text-right" : "text-left")}>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-brand-primary/70">
        {label}
      </p>
      <p className="mt-1 truncate font-heading text-lg font-semibold text-brand-primary sm:text-xl">
        {value}
      </p>
    </div>
  );
}
