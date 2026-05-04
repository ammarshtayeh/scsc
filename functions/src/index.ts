import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";

initializeApp();

const db = getFirestore();
const QR_LIFETIME_SECONDS = 45;

type MembershipStatus = "active" | "expired" | "pendingRenewal";
type Role = "admin" | "moderator" | "user";
type OrderStatus = "pending" | "confirmed" | "processing" | "delivered";

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

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const sendContactEmail = onCall(async (request) => {
  const { name, email, message } = request.data as {
    name?: string;
    email?: string;
    message?: string;
  };

  if (!name || !email || !message) {
    throw new HttpsError("invalid-argument", "Name, email, and message are required.");
  }

  await db.collection("contacts").add({
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

export const issueMembershipQrPass = onCall(async (request) => {
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "You must be signed in to issue a QR pass.");
  }

  const userRef = db.collection("users").doc(userId);
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

  await db.runTransaction(async (transaction) => {
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
});

export const verifyMembership = onCall(async (request) => {
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

  const userRef = db.collection("users").doc(payload.userId);
  const sessionRef = userRef.collection("membershipPasses").doc(payload.sessionId);
  const scannedAt = new Date().toISOString();

  const result = await db.runTransaction(async (transaction) => {
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

export const setUserRole = onCall(async (request) => {
  requireAdmin(request);

  const { uid, role } = request.data as {
    uid?: string;
    role?: Role;
  };

  if (!uid || !role) {
    throw new HttpsError("invalid-argument", "User ID and role are required.");
  }

  await getAuth().setCustomUserClaims(uid, { role });
  await db.collection("users").doc(uid).set({ role }, { merge: true });

  return { success: true };
});

export const upsertEvent = onCall(async (request) => {
  requireAdminOrModerator(request);

  const data = request.data as Record<string, unknown>;
  const id = cleanString(data.id) || db.collection("events").doc().id;
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
    coverImage: cleanString(data.coverImage),
    startsAt,
    venue: cleanString(data.venue, "TBA"),
    capacity,
    registeredCount: Math.max(0, cleanNumber(data.registeredCount)),
    tags: cleanStringArray(data.tags),
    isFeatured: Boolean(data.isFeatured),
    updatedAt: new Date().toISOString()
  };

  await db.collection("events").doc(id).set(payload, { merge: true });
  return { success: true, id };
});

export const deleteEvent = onCall(async (request) => {
  requireAdminOrModerator(request);
  const { id } = request.data as { id?: string };

  if (!id) {
    throw new HttpsError("invalid-argument", "Event ID is required.");
  }

  await db.collection("events").doc(id).delete();
  return { success: true };
});

export const upsertProduct = onCall(async (request) => {
  requireAdminOrModerator(request);

  const data = request.data as Record<string, unknown>;
  const id = cleanString(data.id) || db.collection("products").doc().id;
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
    category: cleanString(data.category, "Skin Care"),
    company: cleanString(data.company, "SCSC Partner"),
    stock,
    images: cleanStringArray(data.images),
    featured: Boolean(data.featured),
    updatedAt: new Date().toISOString()
  };

  await db.collection("products").doc(id).set(payload, { merge: true });
  return { success: true, id };
});

export const deleteProduct = onCall(async (request) => {
  requireAdminOrModerator(request);
  const { id } = request.data as { id?: string };

  if (!id) {
    throw new HttpsError("invalid-argument", "Product ID is required.");
  }

  await db.collection("products").doc(id).delete();
  return { success: true };
});

export const updateUserAdmin = onCall(async (request) => {
  requireAdmin(request);

  const { uid, role, membershipStatus, membershipExpiresAt } = request.data as {
    uid?: string;
    role?: Role;
    membershipStatus?: MembershipStatus;
    membershipExpiresAt?: string;
  };

  if (!uid) {
    throw new HttpsError("invalid-argument", "User ID is required.");
  }

  const allowedRoles: Role[] = ["admin", "moderator", "user"];
  const allowedStatuses: MembershipStatus[] = ["active", "expired", "pendingRenewal"];
  const payload: Record<string, unknown> = {
    updatedAt: new Date().toISOString()
  };

  if (role) {
    if (!allowedRoles.includes(role)) {
      throw new HttpsError("invalid-argument", "Invalid role.");
    }
    await getAuth().setCustomUserClaims(uid, { role });
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

  await db.collection("users").doc(uid).set(payload, { merge: true });
  return { success: true };
});

export const updateOrderStatus = onCall(async (request) => {
  requireAdminOrModerator(request);

  const { id, status } = request.data as {
    id?: string;
    status?: OrderStatus;
  };
  const allowedStatuses: OrderStatus[] = ["pending", "confirmed", "processing", "delivered"];

  if (!id || !status || !allowedStatuses.includes(status)) {
    throw new HttpsError("invalid-argument", "Order ID and a valid status are required.");
  }

  await db.collection("orders").doc(id).set(
    {
      status,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return { success: true };
});

export const moderateArticle = onCall(async (request) => {
  requireAdminOrModerator(request);

  const { id, approved } = request.data as {
    id?: string;
    approved?: boolean;
  };

  if (!id || typeof approved !== "boolean") {
    throw new HttpsError("invalid-argument", "Article ID and approval status are required.");
  }

  await db.collection("articles").doc(id).set(
    {
      approved,
      moderatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return { success: true };
});
