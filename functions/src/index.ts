import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";

import { HttpsError, onCall } from "firebase-functions/v2/https";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";

function loadAdminApp() {
  const { getApp, initializeApp } = require("firebase-admin/app") as typeof import("firebase-admin/app");

  try {
    return getApp();
  } catch {
    return initializeApp();
  }
}

function getDb() {
  loadAdminApp();
  const { getFirestore } = require("firebase-admin/firestore") as typeof import("firebase-admin/firestore");
  return getFirestore();
}

function getAuthClient() {
  loadAdminApp();
  const { getAuth } = require("firebase-admin/auth") as typeof import("firebase-admin/auth");
  return getAuth();
}

function getFieldValue() {
  const { FieldValue } = require("firebase-admin/firestore") as typeof import("firebase-admin/firestore");
  return FieldValue;
}

const QR_LIFETIME_SECONDS = 45;
const publicCallableOptions = { invoker: "public" as const };

type MembershipStatus = "active" | "expired" | "pendingRenewal";
type Role = "admin" | "moderator" | "user";
type MemberGrade = "first" | "second";
type AccountStatus = "new" | "approved" | "rejected";
type OrderStatus = "pending" | "confirmed" | "processing" | "delivered";
type ArticleCategory = "Skin Care" | "Makeup" | "Hair Care" | "Others";

interface EncryptedMembershipPayload {
  userId: string;
  sessionId: string;
  memberId: string;
  fullName: string;
  membershipExpiryDate: string;
  accessToken: string;
  expiresAt: string;
}

function createTransport() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64");
}

function membershipSecretKey() {
  const secret = process.env.MEMBERSHIP_QR_SECRET || "development-membership-secret";
  return createHash("sha256").update(secret).digest();
}

function hashAccessToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function encryptMembershipPayload(payload: EncryptedMembershipPayload) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", membershipSecretKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return [base64UrlEncode(iv), base64UrlEncode(tag), base64UrlEncode(encrypted)].join(".");
}

function decryptMembershipPayload(value: string) {
  const [ivPart, tagPart, encryptedPart] = value.split(".");

  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("Malformed QR payload.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    membershipSecretKey(),
    base64UrlDecode(ivPart)
  );
  decipher.setAuthTag(base64UrlDecode(tagPart));
  const decrypted = Buffer.concat([
    decipher.update(base64UrlDecode(encryptedPart)),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString("utf8")) as EncryptedMembershipPayload;
}

function normalizeMembershipStatus(data: {
  membershipStatus?: MembershipStatus;
  membershipExpiresAt?: string;
}) {
  if (data.membershipStatus === "pendingRenewal") {
    return "pendingRenewal" as const;
  }

  if (data.membershipExpiresAt && new Date(data.membershipExpiresAt).getTime() < Date.now()) {
    return "expired" as const;
  }

  return (data.membershipStatus || "active") as MembershipStatus;
}

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function resolveMemberGrade(specialization?: string, preferredGrade?: string): MemberGrade {
  if (preferredGrade === "first" || preferredGrade === "second") {
    return preferredGrade;
  }

  return cleanString(specialization) === "مستحضرات تجميل والعناية بالبشرة" ? "first" : "second";
}

function getMembershipFeeAmount(memberGrade?: MemberGrade) {
  return memberGrade === "first" ? 20 : 15;
}

function buildMembershipReceiptId() {
  return `SCSC-RCP-${Date.now().toString(36).toUpperCase()}`;
}

function applyActiveMembershipFields(
  payload: Record<string, unknown>,
  existingData: Record<string, unknown>,
  membershipExpiresAt?: string
) {
  payload.accountStatus = "approved";

  const memberGrade =
    payload.memberGrade === "first" || payload.memberGrade === "second"
      ? (payload.memberGrade as MemberGrade)
      : existingData.memberGrade === "first" || existingData.memberGrade === "second"
        ? (existingData.memberGrade as MemberGrade)
        : "second";

  if (!existingData.membershipReceiptId) {
    payload.membershipPaymentStatus = "paid";
    payload.membershipPaidAt = new Date().toISOString();
    payload.membershipFeeAmount = getMembershipFeeAmount(memberGrade);
    payload.membershipReceiptId = buildMembershipReceiptId();
  }

  if (membershipExpiresAt) {
    payload.membershipExpiresAt = membershipExpiresAt;
  } else if (
    typeof existingData.membershipExpiresAt !== "string" ||
    !existingData.membershipExpiresAt.trim()
  ) {
    payload.membershipExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  }
}

function getErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code || "")
    : "";
}

function requireAdminOrModerator(request: { auth?: { token?: Record<string, unknown> } }) {
  const callerRole = request.auth?.token?.role;
  if (callerRole !== "admin" && callerRole !== "moderator") {
    throw new HttpsError("permission-denied", "Only admins or moderators can perform this action.");
  }
}

function requireAdmin(request: { auth?: { token?: Record<string, unknown> } }) {
  if (request.auth?.token?.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can perform this action.");
  }
}

const IMAGE_SOURCE_PATTERN =
  /^(https?:\/\/.+|data:image\/.+|blob:.+|\/.+\.[a-z0-9]+([?#].*)?)$/i;

function isValidImageSource(value: unknown) {
  return typeof value === "string" && IMAGE_SOURCE_PATTERN.test(value.trim());
}

function cleanImageString(value: unknown, fallback = "") {
  return isValidImageSource(value) ? cleanString(value) : fallback;
}

function cleanImageStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .filter((entry) => isValidImageSource(entry))
    .map((entry) => cleanString(entry))
    .filter(Boolean);
}

const VIDEO_SOURCE_PATTERN =
  /^(https?:\/\/.+|data:video\/.+|blob:.+|\/.+\.[a-z0-9]+([?#].*)?)$/i;

function isValidVideoSource(value: unknown) {
  return typeof value === "string" && VIDEO_SOURCE_PATTERN.test(value.trim());
}

function cleanVideoString(value: unknown, fallback = "") {
  return isValidVideoSource(value) ? cleanString(value) : fallback;
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((entry) => cleanString(entry))
    .filter(Boolean);
}

function cleanNumber(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function cleanPositiveNumber(value: unknown, fallback = 0) {
  return Math.max(0, cleanNumber(value, fallback));
}

function cleanDiscountPercent(value: unknown) {
  return Math.min(100, Math.max(0, cleanNumber(value)));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, batchSize = 300): Promise<number> {
  const snapshot = await query.limit(batchSize).get();

  if (snapshot.empty) {
    return 0;
  }

  const batch = getDb().batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  return snapshot.size + (snapshot.size >= batchSize ? await deleteQueryBatch(query, batchSize) : 0);
}

async function sendOrderStatusEmail(orderId: string, status: OrderStatus) {
  const transporter = createTransport();

  if (!transporter || !process.env.CONTACT_EMAIL) {
    return;
  }

  const orderSnap = await getDb().collection("orders").doc(orderId).get();
  const orderData = orderSnap.data() as { userId?: string; total?: number } | undefined;

  if (!orderData?.userId) {
    return;
  }

  const userSnap = await getDb().collection("users").doc(orderData.userId).get();
  const userData = userSnap.data() as { email?: string; displayName?: string } | undefined;

  if (!userData?.email) {
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: userData.email,
    subject: `SCSC Order ${orderId} is ${status}`,
    text: `Hello ${userData.displayName || "SCSC member"},\n\nYour order ${orderId} status is now ${status}.\n\nTotal: ${orderData.total ?? ""}\n\nSCSC`
  });
}

export const sendContactEmail = onCall(publicCallableOptions, async (request) => {
  const { name, email, message } = request.data as {
    name?: string;
    email?: string;
    message?: string;
  };

  if (!name || !email || !message) {
    throw new HttpsError("invalid-argument", "Name, email, and message are required.");
  }

  await getDb().collection("contacts").add({
    name,
    email,
    message,
    createdAt: new Date().toISOString()
  });

  const transporter = createTransport();

  if (transporter && process.env.CONTACT_EMAIL) {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: `SCSC Contact Form: ${name}`,
      text: `${message}\n\nSender: ${name}\nEmail: ${email}`
    });
  }

  return { success: true };
});

export const issueMembershipQrPass = onCall(publicCallableOptions, async (request) => {
  try {
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "You must be signed in to issue a QR pass.");
  }

  const userRef = getDb().collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new HttpsError("not-found", "User profile not found.");
  }

  const userData = userSnap.data() as {
    displayName?: string;
    membershipId?: string;
    membershipStatus?: MembershipStatus;
    membershipExpiresAt?: string;
    activeQrSessionId?: string | null;
  };

  const membershipStatus = normalizeMembershipStatus(userData);

  if (membershipStatus !== "active") {
    throw new HttpsError("failed-precondition", "Only active memberships can issue a QR pass.");
  }

  const now = new Date();
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + QR_LIFETIME_SECONDS * 1000).toISOString();
  const sessionId = uuidv4();
  const accessToken = uuidv4();
  const memberId = userData.membershipId || `SCSC-${userId.slice(0, 8).toUpperCase()}`;
  const fullName = userData.displayName || "Association Member";
  const membershipExpiryDate =
    userData.membershipExpiresAt || new Date(now.getTime() + 31536000000).toISOString();

  const encryptedPass = encryptMembershipPayload({
    userId,
    sessionId,
    memberId,
    fullName,
    membershipExpiryDate,
    accessToken,
    expiresAt
  });

  const nextSessionRef = userRef.collection("membershipPasses").doc(sessionId);

  await getDb().runTransaction(async (transaction) => {
    const freshUserSnap = await transaction.get(userRef);
    const freshUserData = freshUserSnap.data() as {
      activeQrSessionId?: string | null;
    } | undefined;
    const previousSessionId = freshUserData?.activeQrSessionId;

    if (previousSessionId) {
      transaction.set(
        userRef.collection("membershipPasses").doc(previousSessionId),
        {
          status: "revoked",
          revokedAt: issuedAt
        },
        { merge: true }
      );
    }

    transaction.set(nextSessionRef, {
      sessionId,
      memberId,
      fullName,
      membershipExpiryDate,
      accessTokenHash: hashAccessToken(accessToken),
      issuedAt,
      expiresAt,
      status: "active",
      usedAt: null,
      duplicateAttempts: 0
    });

    transaction.update(userRef, {
      membershipId: memberId,
      activeQrSessionId: sessionId,
      activeQrSessionExpiresAt: expiresAt,
      lastQrIssuedAt: issuedAt,
      qrToken: uuidv4()
    });
  });

  return {
    qrValue: `/verify?pass=${encodeURIComponent(encryptedPass)}`,
    sessionId,
    memberId,
    fullName,
    membershipExpiryDate,
    expiresAt,
    issuedAt,
    refreshIntervalSeconds: QR_LIFETIME_SECONDS
  };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    console.error("issueMembershipQrPass failed:", error);
    throw new HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unable to issue membership QR pass."
    );
  }
});

export const verifyMembership = onCall(publicCallableOptions, async (request) => {
  const { pass } = request.data as { pass?: string };

  if (!pass) {
    throw new HttpsError("invalid-argument", "Membership pass is required.");
  }

  let payload: EncryptedMembershipPayload;

  try {
    payload = decryptMembershipPayload(pass);
  } catch {
    return { valid: false, reason: "invalid" };
  }

  const userRef = getDb().collection("users").doc(payload.userId);
  const sessionRef = userRef.collection("membershipPasses").doc(payload.sessionId);
  const scannedAt = new Date().toISOString();

  const result = await getDb().runTransaction(async (transaction) => {
    const [userSnap, sessionSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(sessionRef)
    ]);

    if (!userSnap.exists || !sessionSnap.exists) {
      return { valid: false, reason: "invalid" as const };
    }

    const userData = userSnap.data() as {
      displayName?: string;
      membershipId?: string;
      membershipStatus?: MembershipStatus;
      membershipExpiresAt?: string;
      activeQrSessionId?: string | null;
    };

    const sessionData = sessionSnap.data() as {
      accessTokenHash?: string;
      expiresAt?: string;
      usedAt?: string | null;
      duplicateAttempts?: number;
      status?: string;
      memberId?: string;
      fullName?: string;
      membershipExpiryDate?: string;
    };

    const membershipStatus = normalizeMembershipStatus(userData);

    if (membershipStatus !== "active") {
      transaction.set(userRef.collection("qrScans").doc(), {
        sessionId: payload.sessionId,
        scannedAt,
        result: "inactive"
      });

      return {
        valid: false,
        reason: "inactive" as const,
        memberId: userData.membershipId,
        memberName: userData.displayName,
        membershipExpiryDate: userData.membershipExpiresAt
      };
    }

    if (new Date(payload.expiresAt).getTime() <= Date.now() || !sessionData.expiresAt || new Date(sessionData.expiresAt).getTime() <= Date.now()) {
      transaction.set(
        sessionRef,
        {
          status: "expired"
        },
        { merge: true }
      );
      transaction.set(userRef.collection("qrScans").doc(), {
        sessionId: payload.sessionId,
        scannedAt,
        result: "expired"
      });

      return {
        valid: false,
        reason: "expired" as const,
        memberId: sessionData.memberId,
        memberName: sessionData.fullName,
        membershipExpiryDate: sessionData.membershipExpiryDate
      };
    }

    if (userData.activeQrSessionId !== payload.sessionId || sessionData.status === "revoked") {
      transaction.set(userRef.collection("qrScans").doc(), {
        sessionId: payload.sessionId,
        scannedAt,
        result: "stale"
      });

      return {
        valid: false,
        reason: "stale" as const,
        memberId: sessionData.memberId,
        memberName: sessionData.fullName,
        membershipExpiryDate: sessionData.membershipExpiryDate
      };
    }

    if (sessionData.usedAt) {
      transaction.set(
        sessionRef,
        {
          duplicateAttempts: (sessionData.duplicateAttempts || 0) + 1
        },
        { merge: true }
      );
      transaction.set(userRef.collection("qrScans").doc(), {
        sessionId: payload.sessionId,
        scannedAt,
        result: "duplicate"
      });

      return {
        valid: false,
        reason: "duplicate" as const,
        memberId: sessionData.memberId,
        memberName: sessionData.fullName,
        membershipExpiryDate: sessionData.membershipExpiryDate
      };
    }

    if (sessionData.accessTokenHash !== hashAccessToken(payload.accessToken)) {
      transaction.set(userRef.collection("qrScans").doc(), {
        sessionId: payload.sessionId,
        scannedAt,
        result: "invalid"
      });

      return { valid: false, reason: "invalid" as const };
    }

    transaction.update(sessionRef, {
      status: "used",
      usedAt: scannedAt
    });
    transaction.update(userRef, {
      activeQrSessionId: null,
      activeQrSessionExpiresAt: null,
      lastQrScanAt: scannedAt,
      qrToken: uuidv4()
    });
    transaction.set(userRef.collection("qrScans").doc(), {
      sessionId: payload.sessionId,
      scannedAt,
      result: "approved"
    });

    return {
      valid: true,
      memberId: sessionData.memberId,
      memberName: sessionData.fullName,
      membershipExpiryDate: sessionData.membershipExpiryDate,
      scannedAt,
      newTokenIssued: true
    };
  });

  return result;
});

export const setUserRole = onCall(publicCallableOptions, async (request) => {
  requireAdmin(request);

  const { uid, role } = request.data as {
    uid?: string;
    role?: Role;
  };

  if (!uid || !role) {
    throw new HttpsError("invalid-argument", "User ID and role are required.");
  }

  await getAuthClient().setCustomUserClaims(uid, { role });
  await getDb().collection("users").doc(uid).set({ role }, { merge: true });

  return { success: true };
});

export const upsertEvent = onCall(publicCallableOptions, async (request) => {
  requireAdminOrModerator(request);

  const data = request.data as Record<string, unknown>;
  const id = cleanString(data.id) || getDb().collection("events").doc().id;
  const title = cleanString(data.title);
  const startsAt = cleanString(data.startsAt);
  const capacity = cleanNumber(data.capacity);

  if (!title || !startsAt || capacity <= 0) {
    throw new HttpsError("invalid-argument", "Event title, start date, and capacity are required.");
  }

  const payload = {
    slug: cleanString(data.slug) || slugify(title) || id,
    title,
    excerpt: cleanString(data.excerpt),
    description: cleanStringArray(data.description),
    coverImage: cleanImageString(data.coverImage),
    startsAt,
    venue: cleanString(data.venue, "TBA"),
    capacity,
    registeredCount: Math.max(0, cleanNumber(data.registeredCount)),
    tags: cleanStringArray(data.tags),
    isFeatured: Boolean(data.isFeatured),
    updatedAt: new Date().toISOString()
  };

  await getDb().collection("events").doc(id).set(payload, { merge: true });
  return { success: true, id };
});

export const deleteEvent = onCall(publicCallableOptions, async (request) => {
  requireAdminOrModerator(request);
  const { id, cleanupRegistrations } = request.data as {
    id?: string;
    cleanupRegistrations?: boolean;
  };

  if (!id) {
    throw new HttpsError("invalid-argument", "Event ID is required.");
  }

  const registrationsSnap = await getDb()
    .collection("events")
    .doc(id)
    .collection("registrations")
    .limit(1)
    .get();

  if (!registrationsSnap.empty && !cleanupRegistrations) {
    throw new HttpsError(
      "failed-precondition",
      "This event has registrations. Confirm cleanup before deleting it."
    );
  }

  if (cleanupRegistrations) {
    const allRegistrationsSnap = await getDb().collection("events").doc(id).collection("registrations").get();
    const batch = getDb().batch();

    allRegistrationsSnap.docs.forEach((registrationDoc) => {
      batch.delete(registrationDoc.ref);
      batch.set(
        getDb().collection("users").doc(registrationDoc.id),
        {
          registeredEventIds: getFieldValue().arrayRemove(id),
          lastEventCancellationAt: new Date().toISOString()
        },
        { merge: true }
      );
    });

    await batch.commit();
  }

  await getDb().collection("events").doc(id).delete();
  return { success: true };
});

export const upsertArchivedEvent = onCall(publicCallableOptions, async (request) => {
  requireAdminOrModerator(request);

  const data = request.data as Record<string, unknown>;
  const requestedId = cleanString(data.id);
  const id = requestedId || getDb().collection("archivedEvents").doc().id;
  const title = cleanString(data.title);
  const eventDate = cleanString(data.eventDate);
  const isNewRecord = !requestedId;

  if (!title || !eventDate) {
    throw new HttpsError("invalid-argument", "Archived event title and date are required.");
  }

  const payload: Record<string, unknown> = {
    slug: cleanString(data.slug) || slugify(title) || id,
    title,
    excerpt: cleanString(data.excerpt),
    description: cleanStringArray(data.description),
    eventDate,
    venue: cleanString(data.venue, "TBA"),
    images: cleanImageStringArray(data.images),
    tags: cleanStringArray(data.tags),
    updatedAt: new Date().toISOString(),
    updatedBy: request.auth?.uid || "unknown"
  };

  if (isNewRecord) {
    payload.createdAt = new Date().toISOString();
    payload.createdBy = request.auth?.uid || "unknown";
    payload.createdByRole = request.auth?.token?.role || "unknown";
  }

  await getDb().collection("archivedEvents").doc(id).set(payload, { merge: true });
  return { success: true, id };
});

export const deleteArchivedEvent = onCall(publicCallableOptions, async (request) => {
  requireAdminOrModerator(request);
  const { id } = request.data as { id?: string };

  if (!id) {
    throw new HttpsError("invalid-argument", "Archived event ID is required.");
  }

  await getDb().collection("archivedEvents").doc(id).delete();
  return { success: true };
});

export const upsertHomeSettings = onCall(publicCallableOptions, async (request) => {
  requireAdmin(request);

  const {
    slides,
    partnerEyebrow,
    partnerTitle,
    partnerDescription,
    partners,
    featuredVideo,
    storeEyebrow,
    storeTitle,
    storeDescription,
    storeCtaLabel,
    storeCtaHref,
    storePerks
  } = request.data as {
    slides?: Array<{
      image?: unknown;
      title?: unknown;
      caption?: unknown;
    }>;
    partnerEyebrow?: unknown;
    partnerTitle?: unknown;
    partnerDescription?: unknown;
    partners?: Array<{
      name?: unknown;
      tagline?: unknown;
      logo?: unknown;
      url?: unknown;
    }>;
    featuredVideo?: {
      enabled?: unknown;
      url?: unknown;
      title?: unknown;
      description?: unknown;
    };
    storeEyebrow?: unknown;
    storeTitle?: unknown;
    storeDescription?: unknown;
    storeCtaLabel?: unknown;
    storeCtaHref?: unknown;
    storePerks?: unknown;
  };

  const payload: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
    updatedBy: request.auth?.uid || "unknown"
  };

  if (typeof slides !== "undefined") {
    if (!Array.isArray(slides)) {
      throw new HttpsError("invalid-argument", "Home page slides must be an array.");
    }

    const cleanSlides = slides
      .slice(0, 6)
      .map((slide) => ({
        image: cleanImageString(slide.image),
        title: cleanString(slide.title),
        caption: cleanString(slide.caption)
      }))
      .filter((slide) => slide.image || slide.title || slide.caption);

    if (
      !cleanSlides.length ||
      cleanSlides.some((slide) => !slide.image || !slide.title || !slide.caption)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Each home page slide must include an image, title, and caption."
      );
    }

    payload.slides = cleanSlides;
  }

  if (typeof partners !== "undefined") {
    if (!Array.isArray(partners)) {
      throw new HttpsError("invalid-argument", "Partners must be an array.");
    }

    const cleanPartners = partners
      .slice(0, 6)
      .map((partner) => ({
        name: cleanString(partner.name),
        tagline: cleanString(partner.tagline),
        logo: cleanImageString(partner.logo),
        url: cleanString(partner.url)
      }))
      .filter((partner) => partner.name || partner.tagline || partner.logo || partner.url);

    if (cleanPartners.some((partner) => !partner.name || !partner.tagline || !partner.logo)) {
      throw new HttpsError(
        "invalid-argument",
        "Each partner must include a name, tagline, and logo."
      );
    }

    payload.partners = cleanPartners;
  }

  const cleanFeaturedVideo = featuredVideo
    ? {
        enabled: Boolean(featuredVideo.enabled),
        url: cleanVideoString(featuredVideo.url),
        title: cleanString(featuredVideo.title),
        description: cleanString(featuredVideo.description)
      }
    : null;

  if (cleanFeaturedVideo?.enabled && !cleanFeaturedVideo.url) {
    throw new HttpsError(
      "invalid-argument",
      "Home page video URL is required when the video section is enabled."
    );
  }

  if (typeof featuredVideo !== "undefined") {
    payload.featuredVideo = cleanFeaturedVideo;
  }

  if (typeof partnerEyebrow !== "undefined") {
    payload.partnerEyebrow = cleanString(partnerEyebrow);
  }

  if (typeof partnerTitle !== "undefined") {
    payload.partnerTitle = cleanString(partnerTitle);
  }

  if (typeof partnerDescription !== "undefined") {
    payload.partnerDescription = cleanString(partnerDescription);
  }

  if (typeof storeEyebrow !== "undefined") {
    payload.storeEyebrow = cleanString(storeEyebrow);
  }

  if (typeof storeTitle !== "undefined") {
    payload.storeTitle = cleanString(storeTitle);
  }

  if (typeof storeDescription !== "undefined") {
    payload.storeDescription = cleanString(storeDescription);
  }

  if (typeof storeCtaLabel !== "undefined") {
    payload.storeCtaLabel = cleanString(storeCtaLabel);
  }

  if (typeof storeCtaHref !== "undefined") {
    payload.storeCtaHref = cleanString(storeCtaHref);
  }

  if (typeof storePerks !== "undefined") {
    payload.storePerks = cleanStringArray(storePerks).slice(0, 6);
  }

  await getDb().collection("siteSettings").doc("home").set(
    payload,
    { merge: true }
  );

  return { success: true };
});

export const updateFinanceSettings = onCall(publicCallableOptions, async (request) => {
  requireAdmin(request);

  const data = request.data as Record<string, unknown>;
  const financeRef = getDb().collection("siteSettings").doc("finance");
  const now = new Date().toISOString();
  const updatedBy = request.auth?.uid || "unknown";

  const nextFinance = await getDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(financeRef);
    const current = snapshot.exists ? snapshot.data() || {} : {};
    const currentBalance = cleanNumber(current.balance);
    const currentTransactions = Array.isArray(current.transactions)
      ? current.transactions.filter((entry) => entry && typeof entry === "object").slice(0, 99)
      : [];

    if (typeof data.balance !== "undefined") {
      const balance = cleanNumber(data.balance);
      const payload = {
        balance,
        transactions: currentTransactions,
        updatedAt: now,
        updatedBy
      };
      transaction.set(financeRef, payload, { merge: true });
      return payload;
    }

    const transactionType = data.transactionType === "expense" ? "expense" : "income";
    const amount = cleanPositiveNumber(data.amount);
    const description = cleanString(data.description);
    const eventName = cleanString(data.eventName);

    if (amount <= 0 || !description) {
      throw new HttpsError("invalid-argument", "Amount and description are required.");
    }

    const balance =
      transactionType === "expense" ? currentBalance - amount : currentBalance + amount;
    const financeTransaction = {
      id: getDb().collection("siteSettings").doc().id,
      type: transactionType,
      amount,
      description,
      eventName,
      createdAt: now,
      createdBy: updatedBy
    };
    const payload = {
      balance,
      transactions: [financeTransaction, ...currentTransactions].slice(0, 100),
      updatedAt: now,
      updatedBy
    };
    transaction.set(financeRef, payload, { merge: true });
    return payload;
  });

  return { success: true, finance: nextFinance };
});

export const upsertProduct = onCall(publicCallableOptions, async (request) => {
  requireAdminOrModerator(request);

  const data = request.data as Record<string, unknown>;
  const id = cleanString(data.id) || getDb().collection("products").doc().id;
  const name = cleanString(data.name);
  const price = cleanNumber(data.price);
  const stock = cleanNumber(data.stock);

  if (!name || price <= 0 || stock < 0) {
    throw new HttpsError("invalid-argument", "Product name, price, and stock are required.");
  }

  const payload = {
    slug: cleanString(data.slug) || slugify(name) || id,
    name,
    description: cleanString(data.description),
    longDescription: cleanStringArray(data.longDescription),
    price,
    memberPrice: cleanNumber(data.memberPrice, price),
    discountPercent: cleanDiscountPercent(data.discountPercent),
    category: cleanString(data.category, "Skin Care"),
    company: cleanString(data.company, "SCSC Partner"),
    stock,
    images: cleanImageStringArray(data.images),
    featured: Boolean(data.featured),
    updatedAt: new Date().toISOString()
  };

  await getDb().collection("products").doc(id).set(payload, { merge: true });
  return { success: true, id };
});

export const deleteProduct = onCall(publicCallableOptions, async (request) => {
  requireAdminOrModerator(request);
  const { id } = request.data as { id?: string };

  if (!id) {
    throw new HttpsError("invalid-argument", "Product ID is required.");
  }

  await getDb().collection("products").doc(id).delete();
  return { success: true };
});

export const upsertBoardMember = onCall(publicCallableOptions, async (request) => {
  requireAdmin(request);

  const data = request.data as Record<string, unknown>;
  const id = cleanString(data.id) || getDb().collection("boardMembers").doc().id;
  const name = cleanString(data.name);
  const role = cleanString(data.role);
  const year = cleanString(data.year);

  if (!name || !role || !year) {
    throw new HttpsError("invalid-argument", "Board member name, role, and year are required.");
  }

  await getDb().collection("boardMembers").doc(id).set(
    {
      name,
      role,
      year,
      order: Math.max(1, cleanNumber(data.order, 99)),
      image: cleanImageString(data.image),
      bio: cleanString(data.bio),
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return { success: true, id };
});

export const deleteBoardMember = onCall(publicCallableOptions, async (request) => {
  requireAdmin(request);
  const { id } = request.data as { id?: string };

  if (!id) {
    throw new HttpsError("invalid-argument", "Board member ID is required.");
  }

  await getDb().collection("boardMembers").doc(id).delete();
  return { success: true };
});

export const updateUserAdmin = onCall(publicCallableOptions, async (request) => {
  requireAdmin(request);

  const {
    uid,
    displayName,
    email,
    phone,
    studentId,
    specialization,
    degree,
    memberGrade,
    accountStatus,
    role,
    membershipStatus,
    membershipExpiresAt
  } = request.data as {
    uid?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    studentId?: string;
    specialization?: string;
    degree?: string;
    memberGrade?: MemberGrade;
    accountStatus?: AccountStatus;
    role?: Role;
    membershipStatus?: MembershipStatus;
    membershipExpiresAt?: string;
  };

  if (!uid) {
    throw new HttpsError("invalid-argument", "User ID is required.");
  }

  const allowedRoles: Role[] = ["admin", "moderator", "user"];
  const allowedStatuses: MembershipStatus[] = ["active", "expired", "pendingRenewal"];
  const allowedGrades: MemberGrade[] = ["first", "second"];
  const allowedAccountStatuses: AccountStatus[] = ["new", "approved", "rejected"];
  const payload: Record<string, unknown> = {
    updatedAt: new Date().toISOString()
  };
  const authUpdates: {
    displayName?: string;
    email?: string;
  } = {};

  if (typeof displayName === "string") {
    const nextDisplayName = cleanString(displayName);
    if (!nextDisplayName) {
      throw new HttpsError("invalid-argument", "Display name is required.");
    }
    payload.displayName = nextDisplayName;
    authUpdates.displayName = nextDisplayName;
  }

  if (typeof email === "string") {
    const nextEmail = cleanString(email).toLowerCase();
    if (!nextEmail) {
      throw new HttpsError("invalid-argument", "Email is required.");
    }
    payload.email = nextEmail;
    authUpdates.email = nextEmail;
  }

  if (typeof phone === "string") {
    payload.phone = cleanString(phone);
  }

  if (typeof studentId === "string") {
    payload.studentId = cleanString(studentId);
  }

  const hasSpecialization = typeof specialization === "string";
  const hasMemberGrade = typeof memberGrade === "string";

  if (hasSpecialization) {
    payload.specialization = cleanString(specialization);
  }

  if (typeof degree === "string") {
    payload.degree = cleanString(degree);
  }

  if (hasMemberGrade && !allowedGrades.includes(memberGrade as MemberGrade)) {
    throw new HttpsError("invalid-argument", "Invalid member grade.");
  }

  if (hasSpecialization || hasMemberGrade) {
    payload.memberGrade = resolveMemberGrade(
      hasSpecialization ? specialization : undefined,
      hasMemberGrade ? memberGrade : undefined
    );
  }

  if (typeof accountStatus === "string") {
    if (!allowedAccountStatuses.includes(accountStatus as AccountStatus)) {
      throw new HttpsError("invalid-argument", "Invalid account status.");
    }
    payload.accountStatus = accountStatus;
  }

  if (role) {
    if (!allowedRoles.includes(role)) {
      throw new HttpsError("invalid-argument", "Invalid role.");
    }
    await getAuthClient().setCustomUserClaims(uid, { role });
    payload.role = role;
  }

  if (membershipStatus) {
    if (!allowedStatuses.includes(membershipStatus)) {
      throw new HttpsError("invalid-argument", "Invalid membership status.");
    }
    payload.membershipStatus = membershipStatus;
  }

  if (membershipExpiresAt) {
    payload.membershipExpiresAt = membershipExpiresAt;
  }

  const existingSnap = await getDb().collection("users").doc(uid).get();
  const existingData = (existingSnap.data() || {}) as Record<string, unknown>;

  if (membershipStatus === "active") {
    applyActiveMembershipFields(payload, existingData, membershipExpiresAt);
  }

  if (Object.keys(authUpdates).length) {
    await getAuthClient().updateUser(uid, authUpdates);
  }

  await getDb().collection("users").doc(uid).set(payload, { merge: true });
  return { success: true };
});

export const createUserAdmin = onCall(publicCallableOptions, async (request) => {
  requireAdmin(request);

  const {
    displayName,
    email,
    password,
    phone,
    studentId,
    specialization,
    degree,
    memberGrade,
    accountStatus,
    role,
    membershipStatus
  } = request.data as {
    displayName?: string;
    email?: string;
    password?: string;
    phone?: string;
    studentId?: string;
    specialization?: string;
    degree?: string;
    memberGrade?: MemberGrade;
    accountStatus?: AccountStatus;
    role?: Role;
    membershipStatus?: MembershipStatus;
  };

  const nextDisplayName = cleanString(displayName);
  const nextEmail = cleanString(email).toLowerCase();
  const nextPassword = typeof password === "string" ? password : "";
  const nextRole = role || "user";
  const nextMembershipStatus = membershipStatus || "active";
  const nextSpecialization = cleanString(specialization);
  const nextDegree = cleanString(degree);
  const nextMemberGrade = resolveMemberGrade(nextSpecialization, memberGrade);
  const nextAccountStatus =
    nextMembershipStatus === "active" ? "approved" : accountStatus || "new";

  if (!nextDisplayName) {
    throw new HttpsError("invalid-argument", "Display name is required.");
  }

  if (!nextEmail) {
    throw new HttpsError("invalid-argument", "Email is required.");
  }

  if (nextPassword.length < 8) {
    throw new HttpsError("invalid-argument", "Password must be at least 8 characters.");
  }

  if (!["admin", "moderator", "user"].includes(nextRole)) {
    throw new HttpsError("invalid-argument", "Invalid role.");
  }

  if (!["active", "expired", "pendingRenewal"].includes(nextMembershipStatus)) {
    throw new HttpsError("invalid-argument", "Invalid membership status.");
  }

  if (memberGrade && !["first", "second"].includes(memberGrade)) {
    throw new HttpsError("invalid-argument", "Invalid member grade.");
  }

  if (!["new", "approved", "rejected"].includes(nextAccountStatus)) {
    throw new HttpsError("invalid-argument", "Invalid account status.");
  }

  try {
    const userRecord = await getAuthClient().createUser({
      displayName: nextDisplayName,
      email: nextEmail,
      password: nextPassword
    });

    if (nextRole !== "user") {
      await getAuthClient().setCustomUserClaims(userRecord.uid, { role: nextRole });
    }

    const joinedAt = new Date().toISOString();
    const userPayload: Record<string, unknown> = {
      membershipId: `SCSC-${userRecord.uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase()}`,
      displayName: nextDisplayName,
      email: nextEmail,
      phone: cleanString(phone),
      studentId: cleanString(studentId),
      specialization: nextSpecialization,
      degree: nextDegree,
      memberGrade: nextMemberGrade,
      accountStatus: nextAccountStatus,
      company: "",
      photoURL: "",
      role: nextRole,
      membershipStatus: nextMembershipStatus,
      membershipExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      joinedAt,
      qrToken: uuidv4(),
      savedArticleIds: [],
      registeredEventIds: [],
      activeQrSessionId: null,
      activeQrSessionExpiresAt: null,
      lastQrIssuedAt: null,
      lastQrScanAt: null,
      discountRate: 0.12,
      updatedAt: joinedAt
    };

    if (nextMembershipStatus === "active") {
      applyActiveMembershipFields(userPayload, { memberGrade: nextMemberGrade });
    }

    await getDb().collection("users").doc(userRecord.uid).set(userPayload);

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    const code = getErrorCode(error);

    if (code.includes("email-already-exists")) {
      throw new HttpsError("already-exists", "This email is already in use.");
    }

    if (code.includes("invalid-email")) {
      throw new HttpsError("invalid-argument", "The email address is invalid.");
    }

    if (code.includes("invalid-password")) {
      throw new HttpsError("invalid-argument", "The password does not meet Firebase requirements.");
    }

    throw new HttpsError("internal", error instanceof Error ? error.message : "Unable to create user.");
  }
});

export const sendUserPasswordResetAdmin = onCall(publicCallableOptions, async (request) => {
  requireAdmin(request);

  const { uid, email } = request.data as {
    uid?: string;
    email?: string;
  };

  if (!uid && !email) {
    throw new HttpsError("invalid-argument", "User ID or email is required.");
  }

  const auth = getAuthClient();
  const userRecord = uid
    ? await auth.getUser(uid)
    : await auth.getUserByEmail(cleanString(email).toLowerCase());
  const userEmail = cleanString(userRecord.email).toLowerCase();

  if (!userEmail) {
    throw new HttpsError("failed-precondition", "Selected user does not have an email address.");
  }

  const resetLink = await auth.generatePasswordResetLink(userEmail);
  const transporter = createTransport();

  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: "Reset your SCSC password",
      text:
        `Hello ${userRecord.displayName || "SCSC member"},\n\n` +
        `Use the secure link below to reset your password:\n${resetLink}\n\n` +
        "If you did not request this change, you can ignore this email.\n\nSCSC"
    });

    return { success: true, emailed: true };
  }

  return { success: true, emailed: false, resetLink };
});

export const deleteUserAdmin = onCall(publicCallableOptions, async (request) => {
  requireAdmin(request);

  const { uid } = request.data as { uid?: string };

  if (!uid) {
    throw new HttpsError("invalid-argument", "User ID is required.");
  }

  if (uid === request.auth?.uid) {
    throw new HttpsError("failed-precondition", "Cannot delete your own admin account.");
  }

  await getAuthClient().deleteUser(uid);
  await getDb().collection("users").doc(uid).delete();
  return { success: true };
});

export const updateOrderStatus = onCall(publicCallableOptions, async (request) => {
  requireAdminOrModerator(request);

  const { id, status } = request.data as {
    id?: string;
    status?: OrderStatus;
  };
  const allowedStatuses: OrderStatus[] = ["pending", "confirmed", "processing", "delivered"];

  if (!id || !status || !allowedStatuses.includes(status)) {
    throw new HttpsError("invalid-argument", "Order ID and a valid status are required.");
  }

  await getDb().collection("orders").doc(id).set(
    {
      status,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  await sendOrderStatusEmail(id, status);

  return { success: true };
});

export const deleteOrder = onCall(publicCallableOptions, async (request) => {
  requireAdmin(request);
  const { id } = request.data as { id?: string };

  if (!id) {
    throw new HttpsError("invalid-argument", "Order ID is required.");
  }

  await getDb().collection("orders").doc(id).delete();
  return { success: true };
});

export const upsertArticle = onCall(publicCallableOptions, async (request) => {
  requireAdminOrModerator(request);

  const data = request.data as Record<string, unknown>;
  const id = cleanString(data.id) || getDb().collection("articles").doc().id;
  const title = cleanString(data.title);
  const excerpt = cleanString(data.excerpt);
  const category = cleanString(data.category, "Others") as ArticleCategory;
  const allowedCategories: ArticleCategory[] = ["Skin Care", "Makeup", "Hair Care", "Others"];

  if (!title || !excerpt || !allowedCategories.includes(category)) {
    throw new HttpsError("invalid-argument", "Article title, excerpt, and category are required.");
  }

  const references = Array.isArray(data.references)
    ? data.references
        .map((entry) => {
          const reference = entry as { label?: unknown; url?: unknown };
          return {
            label: cleanString(reference.label),
            url: cleanString(reference.url)
          };
        })
        .filter((entry) => entry.label && entry.url)
    : [];

  await getDb().collection("articles").doc(id).set(
    {
      slug: cleanString(data.slug) || slugify(title) || id,
      title,
      excerpt,
      content: cleanStringArray(data.content),
      coverImage: cleanImageString(data.coverImage),
      category,
      publishedAt: cleanString(data.publishedAt) || new Date().toISOString(),
      authorName: cleanString(data.authorName, "SCSC Editorial Team"),
      approved: Boolean(data.approved),
      references,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return { success: true, id };
});

export const deleteArticle = onCall(publicCallableOptions, async (request) => {
  requireAdmin(request);
  const { id } = request.data as { id?: string };

  if (!id) {
    throw new HttpsError("invalid-argument", "Article ID is required.");
  }

  await getDb().collection("articles").doc(id).delete();
  await deleteQueryBatch(getDb().collection("moderationLogs").where("targetId", "==", id));
  return { success: true };
});

export const setEventRegistrationCheckIn = onCall(publicCallableOptions, async (request) => {
  requireAdminOrModerator(request);

  const { eventId, userId, checkedIn } = request.data as {
    eventId?: string;
    userId?: string;
    checkedIn?: boolean;
  };

  if (!eventId || !userId || typeof checkedIn !== "boolean") {
    throw new HttpsError("invalid-argument", "Event ID, user ID, and check-in status are required.");
  }

  await getDb()
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .doc(userId)
    .set(
      {
        checkedInAt: checkedIn ? new Date().toISOString() : null,
        checkedInBy: checkedIn ? request.auth?.uid || "unknown" : null
      },
      { merge: true }
    );

  return { success: true };
});

export const removeEventRegistration = onCall(publicCallableOptions, async (request) => {
  requireAdminOrModerator(request);

  const { eventId, userId } = request.data as {
    eventId?: string;
    userId?: string;
  };

  if (!eventId || !userId) {
    throw new HttpsError("invalid-argument", "Event ID and user ID are required.");
  }

  const eventRef = getDb().collection("events").doc(eventId);
  const registrationRef = eventRef.collection("registrations").doc(userId);
  const userRef = getDb().collection("users").doc(userId);

  await getDb().runTransaction(async (transaction) => {
    const [eventSnap, registrationSnap] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(registrationRef)
    ]);

    if (!eventSnap.exists || !registrationSnap.exists) {
      return;
    }

    const registeredCount = Number(eventSnap.data()?.registeredCount || 0);
    transaction.delete(registrationRef);
    transaction.update(eventRef, {
      registeredCount: Math.max(0, registeredCount - 1)
    });
    transaction.set(
      userRef,
      {
        registeredEventIds: getFieldValue().arrayRemove(eventId),
        lastEventCancellationAt: new Date().toISOString()
      },
      { merge: true }
    );
  });

  return { success: true };
});

export const moderateArticle = onCall(publicCallableOptions, async (request) => {
  requireAdminOrModerator(request);

  const { id, approved } = request.data as {
    id?: string;
    approved?: boolean;
  };

  if (!id || typeof approved !== "boolean") {
    throw new HttpsError("invalid-argument", "Article ID and approval status are required.");
  }

  const moderatedAt = new Date().toISOString();
  const moderatorId = request.auth?.uid || "unknown";

  await getDb().runTransaction(async (transaction) => {
    transaction.set(
      getDb().collection("articles").doc(id),
      {
        approved,
        moderatedAt,
        moderatedBy: moderatorId
      },
      { merge: true }
    );
    transaction.set(getDb().collection("moderationLogs").doc(), {
      targetType: "article",
      targetId: id,
      action: approved ? "approved" : "rejected",
      moderatorId,
      createdAt: moderatedAt
    });
  });

  return { success: true };
});
