"use client";

import { Clock3, RefreshCcw, ShieldCheck } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteLogo } from "@/components/ui/site-logo";
import { SmartImage } from "@/components/ui/smart-image";
import {
  getMembershipStatusClasses,
  getMembershipStatusLabel
} from "@/lib/membership";
import { cn, formatDateShort, formatDateTime, formatNumber } from "@/lib/utils";
import type { AppLocale } from "@/lib/i18n/config";
import type { MembershipQrSession, UserProfile } from "@/types";

interface MembershipIdCardLabels {
  membershipCardLabel: string;
  membershipCardAssociationLine: string;
  membershipCardValidUntil: string;
  membershipCardMemberSince: string;
  memberId: string;
  membershipStatus: string;
  qrTitle: string;
  qrGenerating: string;
  qrRetry: string;
  qrExpiresIn: string;
  secondsLabel: string;
  qrScreenshotWarning: string;
  refresh: string;
  notProvided: string;
}

interface MembershipIdCardProps {
  profile: UserProfile;
  locale: AppLocale;
  labels: MembershipIdCardLabels;
  degreeLabel: string;
  studentIdLabel: string;
  specializationLabel: string;
  qrCode?: string;
  qrSession?: MembershipQrSession | null;
  qrError?: string | null;
  issuingQr?: boolean;
  secondsLeft?: number;
  onRefresh?: () => void;
  onRetry?: () => void;
}

function MemberAvatar({ profile, locale }: { profile: UserProfile; locale: AppLocale }) {
  const initials = profile.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  if (profile.photoURL) {
    return (
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.35rem] border-2 border-white/30 shadow-[0_12px_32px_rgba(0,0,0,0.28)] ring-2 ring-brand-accent/35 sm:h-28 sm:w-28">
        <SmartImage
          src={profile.photoURL}
          alt={profile.displayName}
          fill
          sizes="112px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.35rem] border-2 border-white/25 bg-white/10 text-2xl font-bold text-brand-accent shadow-[0_12px_32px_rgba(0,0,0,0.28)] ring-2 ring-brand-accent/35 backdrop-blur sm:h-28 sm:w-28"
      aria-hidden={!initials}
    >
      {initials || (locale === "ar" ? "ع" : "M")}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/55">{label}</p>
      <p className={cn("mt-0.5 truncate text-sm font-medium text-white", mono && "font-mono tracking-wide")}>
        {value}
      </p>
    </div>
  );
}

export function MembershipIdCard({
  profile,
  locale,
  labels,
  degreeLabel,
  studentIdLabel,
  specializationLabel,
  qrCode,
  qrSession,
  qrError,
  issuingQr = false,
  secondsLeft = 0,
  onRefresh,
  onRetry
}: MembershipIdCardProps) {
  const membershipStatus = profile.membershipStatus || "active";
  const memberId = profile.membershipId || profile.id;
  const expiryDate =
    qrSession?.membershipExpiryDate ||
    profile.membershipExpiresAt ||
    new Date().toISOString();
  const urgentTimer = secondsLeft > 0 && secondsLeft <= 10;

  return (
    <div className="mx-auto w-full max-w-2xl animate-fadeIn">
      <div className="relative overflow-hidden rounded-[2rem] shadow-elevated ring-1 ring-white/20 transition-transform duration-500 sm:rounded-[2.25rem] sm:hover:scale-[1.012]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B3B78] via-[#11488d] to-[#062347]" />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-accent/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#487ed6]/25 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }}
        />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent" />

        <div className="relative p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SiteLogo
              compact
              withWordmark
              shortName="SCSC"
              title={labels.membershipCardAssociationLine}
              university={locale === "ar" ? "جامعة النجاح الوطنية" : "An-Najah National University"}
              className="[&_p]:text-white [&_p:nth-child(2)]:text-white [&_p:nth-child(3)]:text-white/70"
            />
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.28em] text-brand-accent backdrop-blur">
                {labels.membershipCardLabel}
              </span>
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur",
                  getMembershipStatusClasses(membershipStatus)
                )}
              >
                {getMembershipStatusLabel(membershipStatus, locale)}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <MemberAvatar profile={profile} locale={locale} />
              <div className="min-w-0 flex-1 space-y-4">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-brand-accent">
                    {labels.qrTitle}
                  </p>
                  <h2 className="mt-1 font-heading text-2xl font-bold leading-tight text-white sm:text-3xl">
                    {profile.displayName}
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailRow label={labels.memberId} value={memberId} mono />
                  <DetailRow
                    label={studentIdLabel}
                    value={profile.studentId || labels.notProvided}
                  />
                  <DetailRow
                    label={specializationLabel}
                    value={profile.specialization || labels.notProvided}
                  />
                  <DetailRow label={degreeLabel} value={profile.degree || labels.notProvided} />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 lg:items-end">
              <div className="relative rounded-[1.6rem] bg-white p-3 shadow-glow ring-1 ring-brand-accent/30">
                {qrError ? (
                  <div className="flex h-[168px] w-[168px] flex-col items-center justify-center gap-3 rounded-[1.2rem] bg-red-50 px-4 text-center sm:h-[188px] sm:w-[188px]">
                    <p className="text-xs leading-5 text-red-700">{qrError}</p>
                    {onRetry ? (
                      <Button size="sm" variant="secondary" onClick={onRetry}>
                        {labels.qrRetry}
                      </Button>
                    ) : null}
                  </div>
                ) : qrCode ? (
                  <div
                    className="relative select-none overflow-hidden rounded-[1.2rem] bg-white"
                    onContextMenu={(event) => event.preventDefault()}
                  >
                    <Image
                      src={qrCode}
                      alt={labels.qrTitle}
                      width={188}
                      height={188}
                      unoptimized
                      draggable={false}
                      className="rounded-[1.2rem]"
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="rotate-[-18deg] text-[9px] font-semibold uppercase tracking-[0.32em] text-brand-primary/10">
                        {memberId}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Skeleton className="h-[168px] w-[168px] rounded-[1.2rem] sm:h-[188px] sm:w-[188px]" />
                    <p className="text-center text-xs text-brand-primary/70">{labels.qrGenerating}</p>
                  </div>
                )}
              </div>

              {qrCode && !qrError ? (
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur",
                    urgentTimer
                      ? "border-red-300/40 bg-red-500/20 text-red-100"
                      : "border-white/20 bg-white/10 text-white"
                  )}
                >
                  <Clock3 className={cn("h-3.5 w-3.5", urgentTimer && "animate-pulse")} />
                  {labels.qrExpiresIn} {formatNumber(secondsLeft, locale)} {labels.secondsLabel}
                </div>
              ) : null}

              {onRefresh ? (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={issuingQr}
                  onClick={onRefresh}
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                >
                  <RefreshCcw className="h-4 w-4" />
                  {labels.refresh}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/15 pt-5">
            <div className="grid gap-2 text-xs text-white/70 sm:grid-cols-2 sm:gap-x-8">
              <p>
                <span className="font-semibold text-white/90">{labels.membershipCardMemberSince}: </span>
                {formatDateShort(profile.joinedAt, locale)}
              </p>
              <p>
                <span className="font-semibold text-white/90">{labels.membershipCardValidUntil}: </span>
                {formatDateTime(expiryDate, locale)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <ShieldCheck className="h-4 w-4 text-brand-accent" />
              <span>SCSC-NNU</span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-center text-sm font-medium text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
        {labels.qrScreenshotWarning}
      </p>
    </div>
  );
}
