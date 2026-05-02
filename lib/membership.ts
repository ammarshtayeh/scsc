import type { MembershipStatus, UserProfile } from "@/types";
import type { AppLocale } from "@/lib/i18n/config";
import { translateMembershipStatus } from "@/lib/i18n/helpers";

export function resolveMembershipStatus(profile: Pick<UserProfile, "membershipStatus" | "membershipExpiresAt">): MembershipStatus {
  if (profile.membershipStatus === "pendingRenewal") {
    return "pendingRenewal";
  }

  if (profile.membershipExpiresAt && new Date(profile.membershipExpiresAt).getTime() < Date.now()) {
    return "expired";
  }

  return profile.membershipStatus;
}

export function getMembershipStatusLabel(status: MembershipStatus, locale: AppLocale = "en") {
  return translateMembershipStatus(status, locale);
}

export function getMembershipStatusClasses(status: MembershipStatus) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "pendingRenewal") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-rose-50 text-rose-700 border-rose-200";
}

export function getSecondsUntilExpiry(expiresAt?: string | null) {
  if (!expiresAt) {
    return 0;
  }

  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}
