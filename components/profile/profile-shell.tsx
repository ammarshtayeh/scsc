"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where
} from "firebase/firestore";
import {
  Bookmark,
  CalendarRange,
  Clock3,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  UserCircle2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { STORE_CURRENCY } from "@/lib/constants";
import { issueMembershipQrPass } from "@/lib/firebase/functions";
import { sendPasswordReset } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/firebase";
import { isFirebaseClientConfigured } from "@/lib/firebase/firebase";
import { uploadFileToStorage } from "@/lib/firebase/storage";
import { translateOrderStatus, translateRole } from "@/lib/i18n/helpers";
import { getMembershipStatusClasses, getMembershipStatusLabel, getSecondsUntilExpiry, resolveMembershipStatus } from "@/lib/membership";
import {
  formatCurrency,
  formatDateLong,
  formatDateShort,
  formatDateTime,
  formatNumber,
  sanitizeImageSource
} from "@/lib/utils";
import type {
  Article,
  EventItem,
  MembershipQrSession,
  Order,
  UserProfile
} from "@/types";

const PROFILE_POLL_INTERVAL_MS = 8000;
const MEMBERSHIP_CARD_PATH = "/profile/membership-card";

function normalizeDateValue(value: unknown, fallback = new Date().toISOString()) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return fallback;
}

function normalizeUserProfile(id: string, data: Record<string, unknown>): UserProfile {
  return {
    id,
    membershipId:
      typeof data.membershipId === "string" ? data.membershipId : `SCSC-${id.slice(0, 8).toUpperCase()}`,
    displayName: typeof data.displayName === "string" ? data.displayName : "Association Member",
    email: typeof data.email === "string" ? data.email : "",
    role: (data.role as UserProfile["role"]) || "user",
    phone: typeof data.phone === "string" ? data.phone : "",
    studentId: typeof data.studentId === "string" ? data.studentId : "",
    specialization: typeof data.specialization === "string" ? data.specialization : "",
    memberGrade:
      data.memberGrade === "first" || data.memberGrade === "second"
        ? (data.memberGrade as UserProfile["memberGrade"])
        : "second",
    accountStatus:
      data.accountStatus === "new" || data.accountStatus === "approved" || data.accountStatus === "rejected"
        ? (data.accountStatus as UserProfile["accountStatus"])
        : "approved",
    company: typeof data.company === "string" ? data.company : "",
    photoURL: typeof data.photoURL === "string" ? data.photoURL : undefined,
    membershipStatus: (data.membershipStatus as UserProfile["membershipStatus"]) || "active",
    membershipExpiresAt: normalizeDateValue(data.membershipExpiresAt, new Date(Date.now() + 31536000000).toISOString()),
    joinedAt: normalizeDateValue(data.joinedAt),
    qrToken: typeof data.qrToken === "string" ? data.qrToken : undefined,
    savedArticleIds: Array.isArray(data.savedArticleIds) ? (data.savedArticleIds as string[]) : [],
    registeredEventIds: Array.isArray(data.registeredEventIds)
      ? (data.registeredEventIds as string[])
      : [],
    activeQrSessionId:
      typeof data.activeQrSessionId === "string" || data.activeQrSessionId === null
        ? (data.activeQrSessionId as string | null)
        : null,
    activeQrSessionExpiresAt:
      typeof data.activeQrSessionExpiresAt === "string" || data.activeQrSessionExpiresAt === null
        ? (data.activeQrSessionExpiresAt as string | null)
        : null,
    lastQrIssuedAt:
      typeof data.lastQrIssuedAt === "string" || data.lastQrIssuedAt === null
        ? (data.lastQrIssuedAt as string | null)
        : null,
    lastQrScanAt:
      typeof data.lastQrScanAt === "string" || data.lastQrScanAt === null
        ? (data.lastQrScanAt as string | null)
        : null,
    discountRate: typeof data.discountRate === "number" ? data.discountRate : 0.12
  };
}

function normalizeOrder(id: string, data: Record<string, unknown>): Order {
  const deliveryInfo =
    typeof data.deliveryInfo === "object" && data.deliveryInfo !== null
      ? (data.deliveryInfo as Order["deliveryInfo"])
      : undefined;

  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    createdAt: normalizeDateValue(data.createdAt),
    status: (data.status as Order["status"]) || "pending",
    subtotal: typeof data.subtotal === "number" ? data.subtotal : 0,
    discount: typeof data.discount === "number" ? data.discount : 0,
    total: typeof data.total === "number" ? data.total : 0,
    items: Array.isArray(data.items) ? (data.items as Order["items"]) : [],
    deliveryInfo
  };
}

function normalizeArticle(id: string, data: Record<string, unknown>): Article {
  return {
    id,
    slug: typeof data.slug === "string" ? data.slug : id,
    title: typeof data.title === "string" ? data.title : "Article",
    excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
    content: Array.isArray(data.content) ? (data.content as string[]) : [],
    coverImage: sanitizeImageSource(data.coverImage),
    category: (data.category as Article["category"]) || "Others",
    publishedAt: normalizeDateValue(data.publishedAt),
    authorName: typeof data.authorName === "string" ? data.authorName : "SCSC Team",
    approved: Boolean(data.approved),
    references: Array.isArray(data.references) ? (data.references as Article["references"]) : []
  };
}

function normalizeEvent(id: string, data: Record<string, unknown>): EventItem {
  return {
    id,
    slug: typeof data.slug === "string" ? data.slug : id,
    title: typeof data.title === "string" ? data.title : "Event",
    excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
    description: Array.isArray(data.description) ? (data.description as string[]) : [],
    coverImage: sanitizeImageSource(data.coverImage),
    startsAt: normalizeDateValue(data.startsAt),
    venue: typeof data.venue === "string" ? data.venue : "TBA",
    capacity: typeof data.capacity === "number" ? data.capacity : 0,
    registeredCount: typeof data.registeredCount === "number" ? data.registeredCount : 0,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : []
  };
}

function getDashboardHref(role?: UserProfile["role"]) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "moderator") {
    return "/moderator";
  }

  return "/profile";
}

export function ProfileShell({
  view = "dashboard"
}: {
  view?: "dashboard" | "membership-card";
}) {
  const { user } = useAuth();
  const { dictionary, locale } = useLocale();
  const { pushToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<EventItem[]>([]);
  const [qrSession, setQrSession] = useState<MembershipQrSession | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [issuingQr, setIssuingQr] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const lastObservedScanAtRef = useRef<string | null>(null);
  const qrRefreshInFlightRef = useRef(false);

  const refreshQrSession = useCallback(async (sourceProfile: UserProfile, silent = true) => {
    const resolvedStatus = resolveMembershipStatus(sourceProfile);

    if (resolvedStatus !== "active") {
      setQrSession(null);
      setQrCode("");
      setSecondsLeft(0);
      return;
    }

    if (qrRefreshInFlightRef.current) {
      return;
    }

    qrRefreshInFlightRef.current = true;
    setIssuingQr(true);

    try {
      const session = await issueMembershipQrPass({
        userId: sourceProfile.id,
        memberId: sourceProfile.membershipId || sourceProfile.id,
        fullName: sourceProfile.displayName,
        membershipExpiryDate:
          sourceProfile.membershipExpiresAt || new Date(Date.now() + 31536000000).toISOString(),
        membershipStatus: resolvedStatus
      });
      const qrValue = session.qrValue.startsWith("http")
        ? session.qrValue
        : `${window.location.origin}${session.qrValue}`;

      const generatedQr = await QRCode.toDataURL(qrValue, {
        width: 300,
        margin: 1
      });

      setQrSession({ ...session, qrValue });
      setQrCode(generatedQr);
      setSecondsLeft(getSecondsUntilExpiry(session.expiresAt));

      if (!silent) {
        pushToast(dictionary.profile.qrRefreshed, "success");
      }
    } catch (error) {
      setQrSession(null);
      setQrCode("");
      setSecondsLeft(0);

      if (!silent) {
        pushToast(
          error instanceof Error ? error.message : dictionary.profile.qrIssueError,
          "error"
        );
      }
    } finally {
      setIssuingQr(false);
      qrRefreshInFlightRef.current = false;
    }
  }, [dictionary.profile.qrIssueError, dictionary.profile.qrRefreshed, pushToast]);

  useEffect(() => {
    async function loadDashboard() {
      if (!user) {
        return;
      }

      if (!db) {
        return;
      }

      const database = db;
      const profileSnap = await getDoc(doc(database, "users", user.id));
      if (!profileSnap.exists()) {
        return;
      }

      const nextProfile = normalizeUserProfile(profileSnap.id, profileSnap.data() as Record<string, unknown>);
      lastObservedScanAtRef.current = nextProfile.lastQrScanAt || null;
      setProfile(nextProfile);

      const ordersQuery = query(
        collection(database, "orders"),
        where("userId", "==", user.id),
        orderBy("createdAt", "desc")
      );
      const ordersSnap = await getDocs(ordersQuery);
      setOrders(
        ordersSnap.docs.map((entry) =>
          normalizeOrder(entry.id, entry.data() as Record<string, unknown>)
        )
      );

      const [articleDocs, eventDocs] = await Promise.all([
        Promise.all(
          (nextProfile.savedArticleIds || []).map((articleId) =>
            getDoc(doc(database, "articles", articleId))
          )
        ),
        Promise.all(
          (nextProfile.registeredEventIds || []).map((eventId) =>
            getDoc(doc(database, "events", eventId))
          )
        )
      ]);

      setSavedArticles(
        articleDocs
          .filter((entry) => entry.exists())
          .map((entry) => normalizeArticle(entry.id, entry.data() as Record<string, unknown>))
      );
      setRegisteredEvents(
        eventDocs
          .filter((entry) => entry.exists())
          .map((entry) => normalizeEvent(entry.id, entry.data() as Record<string, unknown>))
      );
    }

    loadDashboard();
  }, [user]);

  useEffect(() => {
    if (view !== "membership-card") {
      setQrSession(null);
      setQrCode("");
      setSecondsLeft(0);
      return;
    }

    if (!profile) {
      return;
    }

    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    if (resolveMembershipStatus(profile) !== "active") {
      setQrSession(null);
      setQrCode("");
      setSecondsLeft(0);
      return;
    }

    if (!qrSession) {
      void refreshQrSession(profile, true);
    }
  }, [profile, qrSession, refreshQrSession, view]);

  useEffect(() => {
    if (!db || !user) {
      return;
    }

    const database = db;
    const timer = window.setInterval(async () => {
      const profileSnap = await getDoc(doc(database, "users", user.id));
      if (!profileSnap.exists()) {
        return;
      }

      const nextProfile = normalizeUserProfile(
        profileSnap.id,
        profileSnap.data() as Record<string, unknown>
      );

      setProfile((current) => (current ? { ...current, ...nextProfile } : nextProfile));

      const nextScanAt = nextProfile.lastQrScanAt || null;
      if (
        view === "membership-card" &&
        nextScanAt &&
        nextScanAt !== lastObservedScanAtRef.current
      ) {
        lastObservedScanAtRef.current = nextScanAt;
        await refreshQrSession(nextProfile, true);
      }
    }, PROFILE_POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [user, refreshQrSession, view]);

  useEffect(() => {
    if (!qrSession || !profile) {
      setSecondsLeft(0);
      return;
    }

    setSecondsLeft(getSecondsUntilExpiry(qrSession.expiresAt));
    const timer = window.setInterval(() => {
      const remaining = getSecondsUntilExpiry(qrSession.expiresAt);
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        window.clearInterval(timer);
        void refreshQrSession(profile, true);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [profile, qrSession, refreshQrSession]);

  useEffect(() => {
    if (view !== "membership-card" || !profile || resolveMembershipStatus(profile) !== "active") {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setQrSession(null);
        setQrCode("");
        setSecondsLeft(0);
        return;
      }

      void refreshQrSession(profile, true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [profile, refreshQrSession, view]);

  const membershipStatus = useMemo(
    () => (profile ? resolveMembershipStatus(profile) : "active"),
    [profile]
  );
  const isMembershipActive = membershipStatus === "active";
  const studentIdLabel = locale === "ar" ? "الرقم الجامعي" : "Student ID";
  const specializationLabel = locale === "ar" ? "التخصص" : "Specialization";
  const inactiveMembershipTitle =
    locale === "ar" ? "تجديد العضوية مطلوب" : "Membership renewal required";
  const inactiveMembershipDescription =
    locale === "ar"
      ? "يرجى تجديد العضوية أو التأكد من الانتساب للوصول إلى الحساب الشخصي وبطاقة العضوية."
      : "Please renew your membership or confirm your enrollment to access your personal dashboard and membership card.";

  async function handlePasswordReset() {
    if (!profile?.email) {
      pushToast(dictionary.auth.enterEmailFirst, "error");
      return;
    }

    if (!isFirebaseClientConfigured) {
      pushToast(dictionary.auth.resetNeedsFirebase, "info");
      return;
    }

    try {
      await sendPasswordReset(profile.email);
      pushToast(dictionary.auth.resetSent, "success");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : dictionary.auth.resetError, "error");
    }
  }

  const orderTotal = useMemo(
    () => orders.reduce((sum, order) => sum + order.total, 0),
    [orders]
  );

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !profile) {
      return;
    }

    try {
      setSaving(true);
      let nextPhotoURL = profile.photoURL;

      if (photoFile) {
        nextPhotoURL = await uploadFileToStorage(`images/members/${user.id}`, photoFile);
      }

      const nextProfile = {
        ...profile,
        photoURL: nextPhotoURL
      };

      if (!db) {
        throw new Error("Firebase Firestore is not configured.");
      }

      await setDoc(doc(db, "users", user.id), nextProfile, { merge: true });
      setProfile(nextProfile);
      pushToast(dictionary.profile.profileUpdated, "success");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : dictionary.profile.profileUpdateError,
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>{dictionary.profile.loadingProfile}</Card>
      </div>
    );
  }

  if (view === "membership-card") {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-accent" />
                <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                  {dictionary.profile.securityTitle}
                </h2>
              </div>
              <div className="grid gap-3 text-sm leading-7 text-slate-600">
                <p>{dictionary.profile.securityOne}</p>
                <p>{dictionary.profile.securityTwo}</p>
                <p>{dictionary.profile.securityThree}</p>
                <p>{dictionary.profile.securityFour}</p>
                <p>{dictionary.profile.securityFive}</p>
              </div>
            </Card>
          </div>

          {isMembershipActive ? (
          <Card className="space-y-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent">
                  {dictionary.profile.qrEyebrow}
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-brand-primary">
                  {dictionary.profile.qrTitle}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {dictionary.profile.membershipCardDescription}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={issuingQr}
                onClick={() => refreshQrSession(profile, false)}
                disabled={membershipStatus !== "active"}
              >
                <RefreshCcw className="h-4 w-4" />
                {dictionary.common.refresh}
              </Button>
            </div>

            {membershipStatus === "active" ? (
              <>
                {qrCode ? (
                  <div
                    className="relative w-fit max-w-full select-none overflow-hidden rounded-[2rem] border border-brand-primary/10 bg-white p-4 shadow-soft"
                    onContextMenu={(event) => event.preventDefault()}
                  >
                    <Image
                      src={qrCode}
                      alt={dictionary.profile.qrTitle}
                      width={300}
                      height={300}
                      unoptimized
                      draggable={false}
                      className="rounded-3xl bg-white"
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
                      <div className="rotate-[-18deg] text-[11px] font-semibold uppercase tracking-[0.36em] text-brand-primary/12">
                        {profile.displayName} | {profile.membershipId || profile.id}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{dictionary.profile.qrGenerating}</p>
                )}
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  {dictionary.profile.qrScreenshotWarning}
                </p>

                <div className="grid gap-3 text-sm text-slate-600">
                  <p>
                    {dictionary.profile.qrMemberId}:{" "}
                    {qrSession?.memberId || profile.membershipId || profile.id}
                  </p>
                  <p>{dictionary.profile.qrName}: {qrSession?.fullName || profile.displayName}</p>
                  <p>
                    {dictionary.profile.qrExpiryDate}:{" "}
                    {formatDateTime(
                      qrSession?.membershipExpiryDate ||
                        profile.membershipExpiresAt ||
                        new Date().toISOString(),
                      locale
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-brand-sky p-4">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Clock3 className="h-4 w-4" />
                    <p className="text-sm font-medium">
                      {dictionary.profile.qrExpiresIn} {formatNumber(secondsLeft, locale)} {dictionary.profile.secondsLabel}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-slate-600">
                    {dictionary.profile.qrHelp}
                  </p>
                </div>
              </>
            ) : (
              <EmptyState
                title={inactiveMembershipTitle}
                description={inactiveMembershipDescription}
              />
            )}
          </Card>
          ) : (
          <Card className="space-y-4">
            <EmptyState
              title={inactiveMembershipTitle}
              description={inactiveMembershipDescription}
            />
          </Card>
          )}
        </div>
      </section>
    );
  }

  if (!isMembershipActive) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="space-y-5 text-center">
          <span
            className={`mx-auto inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getMembershipStatusClasses(membershipStatus)}`}
          >
            {getMembershipStatusLabel(membershipStatus, locale)}
          </span>
          <div className="space-y-3">
            <h1 className="font-heading text-3xl font-bold text-brand-primary">
              {inactiveMembershipTitle}
            </h1>
            <p className="text-base leading-8 text-slate-600">
              {locale === "ar"
                ? "يرجى التاكد من الانتساب او تجديد العضوية والموافقة على عضويتك."
                : "Please confirm your enrollment, renew your membership, and wait for membership approval."}
            </p>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <UserCircle2 className="h-5 w-5 text-brand-accent" />
            <p className="text-sm text-slate-500">{dictionary.profile.membershipStatus}</p>
          </div>
          <span
            className={`mt-4 inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getMembershipStatusClasses(membershipStatus)}`}
          >
            {getMembershipStatusLabel(membershipStatus, locale)}
          </span>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-brand-accent" />
            <p className="text-sm text-slate-500">{dictionary.profile.orders}</p>
          </div>
          <p className="mt-4 font-heading text-3xl font-bold text-brand-primary">
            {formatNumber(orders.length, locale)}
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <CalendarRange className="h-5 w-5 text-brand-accent" />
            <p className="text-sm text-slate-500">{dictionary.profile.registeredEvents}</p>
          </div>
          <p className="mt-4 font-heading text-3xl font-bold text-brand-primary">
            {formatNumber(registeredEvents.length, locale)}
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Bookmark className="h-5 w-5 text-brand-accent" />
            <p className="text-sm text-slate-500">{dictionary.profile.savedArticles}</p>
          </div>
          <p className="mt-4 font-heading text-3xl font-bold text-brand-primary">
            {formatNumber(savedArticles.length, locale)}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-3xl bg-brand-sky">
                {profile.photoURL ? (
                  <SmartImage
                    src={profile.photoURL}
                    alt={profile.displayName}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : null}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent">
                {dictionary.profile.personalDashboard}
                </p>
                <h1 className="mt-2 font-heading text-3xl font-bold text-brand-primary">
                {profile.displayName}
                </h1>
                <p className="mt-2 text-sm text-slate-500">{profile.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {(profile.role === "admin" || profile.role === "moderator") && (
                <Link href={getDashboardHref(profile.role)}>
                  <Button variant="secondary" className="w-full sm:w-auto">
                    {dictionary.nav.dashboard}
                  </Button>
                </Link>
              )}
              {isMembershipActive ? (
                <Link href={MEMBERSHIP_CARD_PATH}>
                  <Button className="w-full sm:w-auto">
                    {dictionary.profile.viewMembershipCard}
                  </Button>
                </Link>
              ) : null}
            </div>

            <div className="grid gap-3 text-sm text-slate-600">
              <p>{dictionary.profile.memberId}: {profile.membershipId || profile.id}</p>
              <p>{dictionary.profile.role}: {translateRole(profile.role, locale)}</p>
              <p>
                {dictionary.profile.membershipExpiry}:{" "}
                {formatDateTime(
                  profile.membershipExpiresAt || new Date().toISOString(),
                  locale
                )}
              </p>
              <p>{dictionary.profile.joined}: {formatDateShort(profile.joinedAt, locale)}</p>
              <p>{dictionary.profile.phone}: {profile.phone || dictionary.common.notProvided}</p>
              <p>{studentIdLabel}: {profile.studentId || dictionary.common.notProvided}</p>
              <p>{specializationLabel}: {profile.specialization || dictionary.common.notProvided}</p>
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent">
                {dictionary.profile.membershipCardEyebrow}
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold text-brand-primary">
                {dictionary.profile.membershipCardTitle}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {dictionary.profile.membershipCardInfoDescription}
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-brand-primary/10 bg-brand-sky/70 p-4 text-sm font-medium text-slate-700 dark:border-white/12 dark:bg-[#16253b] dark:text-[#dfe8f6]">
              <p>{dictionary.profile.memberId}: {profile.membershipId || profile.id}</p>
              <p>
                {dictionary.profile.membershipStatus}:{" "}
                {getMembershipStatusLabel(membershipStatus, locale)}
              </p>
              <p>
                {dictionary.profile.membershipExpiry}:{" "}
                {formatDateTime(
                  profile.membershipExpiresAt || new Date().toISOString(),
                  locale
                )}
              </p>
              <p>{dictionary.profile.joined}: {formatDateShort(profile.joinedAt, locale)}</p>
            </div>

            <p className="text-xs leading-6 text-slate-500">
              {dictionary.profile.membershipCardOnlyHint}
            </p>

            <div className="hidden">
            {membershipStatus === "active" ? (
              <>
                {qrCode ? (
                  <div
                    className="relative w-fit max-w-full select-none overflow-hidden rounded-[2rem] border border-brand-primary/10 bg-white p-4 shadow-soft"
                    onContextMenu={(event) => event.preventDefault()}
                  >
                    <Image
                      src={qrCode}
                      alt={dictionary.profile.qrTitle}
                      width={300}
                      height={300}
                      unoptimized
                      draggable={false}
                      className="rounded-3xl bg-white"
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
                      <div className="rotate-[-18deg] text-[11px] font-semibold uppercase tracking-[0.36em] text-brand-primary/12">
                        {profile.displayName} • {profile.membershipId || profile.id}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{dictionary.profile.qrGenerating}</p>
                )}

                <div className="grid gap-3 text-sm text-slate-600">
                  <p>
                    {dictionary.profile.qrMemberId}:{" "}
                    {qrSession?.memberId || profile.membershipId || profile.id}
                  </p>
                  <p>{dictionary.profile.qrName}: {qrSession?.fullName || profile.displayName}</p>
                  <p>
                    {dictionary.profile.qrExpiryDate}:{" "}
                    {formatDateTime(
                      qrSession?.membershipExpiryDate ||
                        profile.membershipExpiresAt ||
                        new Date().toISOString(),
                      locale
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-brand-sky p-4">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Clock3 className="h-4 w-4" />
                    <p className="text-sm font-medium">
                      {dictionary.profile.qrExpiresIn} {formatNumber(secondsLeft, locale)} {dictionary.profile.secondsLabel}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-slate-600">
                    {dictionary.profile.qrHelp}
                  </p>
                </div>
              </>
            ) : (
              <EmptyState
                title={dictionary.profile.qrUnavailableTitle}
                description={dictionary.profile.qrUnavailableDescription}
              />
            )}
            </div>
          </Card>

          <Card className="hidden space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-accent" />
              <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                {dictionary.profile.securityTitle}
              </h2>
            </div>
            <div className="grid gap-3 text-sm leading-7 text-slate-600">
              <p>{dictionary.profile.securityOne}</p>
              <p>{dictionary.profile.securityTwo}</p>
              <p>{dictionary.profile.securityThree}</p>
              <p>{dictionary.profile.securityFour}</p>
              <p>{dictionary.profile.securityFive}</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {dictionary.profile.editProfile}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-primary/10 bg-brand-sky/40 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-brand-primary">
                  {dictionary.profile.changePassword}
                </p>
                <p className="text-xs leading-6 text-slate-500">
                  {dictionary.profile.changePasswordHint}
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={handlePasswordReset}>
                {dictionary.profile.changePassword}
              </Button>
            </div>
            <form onSubmit={handleSave} className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-brand-primary">
                  {dictionary.auth.fullName}
                </label>
                <input
                  value={profile.displayName}
                  onChange={(event) =>
                    setProfile((current) =>
                      current ? { ...current, displayName: event.target.value } : current
                    )
                  }
                  className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-brand-primary">
                  {dictionary.profile.phone}
                </label>
                <input
                  value={profile.phone || ""}
                  onChange={(event) =>
                    setProfile((current) =>
                      current ? { ...current, phone: event.target.value } : current
                    )
                  }
                  className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-brand-primary">
                  {studentIdLabel}
                </label>
                <input
                  value={profile.studentId || ""}
                  onChange={(event) =>
                    setProfile((current) =>
                      current ? { ...current, studentId: event.target.value } : current
                    )
                  }
                  className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-brand-primary">
                  {specializationLabel}
                </label>
                <input
                  value={profile.specialization || ""}
                  onChange={(event) =>
                    setProfile((current) =>
                      current ? { ...current, specialization: event.target.value } : current
                    )
                  }
                  className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-brand-primary">
                  {dictionary.profile.profilePhoto}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" loading={saving}>
                  {dictionary.common.saveChanges}
                </Button>
              </div>
            </form>
          </Card>

          {isMembershipActive ? (
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                {dictionary.profile.orderHistory}
              </h2>
              <Badge>{formatCurrency(orderTotal, STORE_CURRENCY, locale)}</Badge>
            </div>
            {orders.length ? (
              orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-brand-primary/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-brand-primary">{order.id}</p>
                      <p className="text-sm text-slate-500">
                        {formatDateLong(order.createdAt, locale)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-brand-primary">
                        {formatCurrency(order.total, STORE_CURRENCY, locale)}
                      </p>
                      <p className="text-sm text-slate-500">{translateOrderStatus(order.status, locale)}</p>
                    </div>
                  </div>
                  <Link
                    href={`/profile/orders/${order.id}`}
                    className="mt-4 inline-flex text-sm font-medium text-brand-primary underline decoration-brand-accent underline-offset-4"
                  >
                    {dictionary.common.readMore}
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">{dictionary.profile.noOrders}</p>
            )}
          </Card>
          ) : null}

          {isMembershipActive ? (
          <Card className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {dictionary.profile.registeredEvents}
            </h2>
            {registeredEvents.length ? (
              <div className="grid gap-4">
                {registeredEvents.map((event) => (
                  <Link key={event.id} href={`/events/${event.slug}`} className="rounded-2xl border border-brand-primary/10 p-4 transition hover:bg-brand-sky/40">
                    <p className="font-medium text-brand-primary">{event.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDateTime(event.startsAt, locale)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{event.venue}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">{dictionary.profile.noRegisteredEvents}</p>
            )}
          </Card>
          ) : null}

          {isMembershipActive ? (
          <Card className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {dictionary.profile.savedArticles}
            </h2>
            {savedArticles.length ? (
              <div className="grid gap-4">
                {savedArticles.map((article) => (
                  <Link key={article.id} href={`/education/${article.slug}`} className="rounded-2xl border border-brand-primary/10 p-4 transition hover:bg-brand-sky/40">
                    <p className="font-medium text-brand-primary">{article.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{article.excerpt}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDateLong(article.publishedAt, locale)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">{dictionary.profile.noSavedArticles}</p>
            )}
          </Card>
          ) : null}
        </div>
      </div>
    </section>
  );
}
