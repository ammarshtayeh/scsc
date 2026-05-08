"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateArticle = exports.updateOrderStatus = exports.updateUserAdmin = exports.deleteProduct = exports.upsertProduct = exports.deleteEvent = exports.upsertEvent = exports.setUserRole = exports.verifyMembership = exports.issueMembershipQrPass = exports.sendContactEmail = void 0;
const crypto_1 = require("crypto");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const nodemailer_1 = __importDefault(require("nodemailer"));
const uuid_1 = require("uuid");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const QR_LIFETIME_SECONDS = 45;
const publicCallableOptions = { invoker: "public" };
function createTransport() {
    if (!process.env.SMTP_HOST ||
        !process.env.SMTP_PORT ||
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASS) {
        return null;
    }
    return nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}
function base64UrlEncode(buffer) {
    return buffer
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}
function base64UrlDecode(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    return Buffer.from(normalized + padding, "base64");
}
function membershipSecretKey() {
    const secret = process.env.MEMBERSHIP_QR_SECRET || "development-membership-secret";
    return (0, crypto_1.createHash)("sha256").update(secret).digest();
}
function hashAccessToken(value) {
    return (0, crypto_1.createHash)("sha256").update(value).digest("hex");
}
function encryptMembershipPayload(payload) {
    const iv = (0, crypto_1.randomBytes)(12);
    const cipher = (0, crypto_1.createCipheriv)("aes-256-gcm", membershipSecretKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(payload), "utf8"),
        cipher.final()
    ]);
    const tag = cipher.getAuthTag();
    return [base64UrlEncode(iv), base64UrlEncode(tag), base64UrlEncode(encrypted)].join(".");
}
function decryptMembershipPayload(value) {
    const [ivPart, tagPart, encryptedPart] = value.split(".");
    if (!ivPart || !tagPart || !encryptedPart) {
        throw new Error("Malformed QR payload.");
    }
    const decipher = (0, crypto_1.createDecipheriv)("aes-256-gcm", membershipSecretKey(), base64UrlDecode(ivPart));
    decipher.setAuthTag(base64UrlDecode(tagPart));
    const decrypted = Buffer.concat([
        decipher.update(base64UrlDecode(encryptedPart)),
        decipher.final()
    ]);
    return JSON.parse(decrypted.toString("utf8"));
}
function normalizeMembershipStatus(data) {
    if (data.membershipStatus === "pendingRenewal") {
        return "pendingRenewal";
    }
    if (data.membershipExpiresAt && new Date(data.membershipExpiresAt).getTime() < Date.now()) {
        return "expired";
    }
    return (data.membershipStatus || "active");
}
function requireAdminOrModerator(request) {
    var _a, _b;
    const callerRole = (_b = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.token) === null || _b === void 0 ? void 0 : _b.role;
    if (callerRole !== "admin" && callerRole !== "moderator") {
        throw new https_1.HttpsError("permission-denied", "Only admins or moderators can perform this action.");
    }
}
function requireAdmin(request) {
    var _a, _b;
    if (((_b = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.token) === null || _b === void 0 ? void 0 : _b.role) !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only admins can perform this action.");
    }
}
function cleanString(value, fallback = "") {
    return typeof value === "string" ? value.trim() : fallback;
}
function cleanStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((entry) => cleanString(entry))
        .filter(Boolean);
}
function cleanNumber(value, fallback = 0) {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
}
function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
exports.sendContactEmail = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    const { name, email, message } = request.data;
    if (!name || !email || !message) {
        throw new https_1.HttpsError("invalid-argument", "Name, email, and message are required.");
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
exports.issueMembershipQrPass = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    var _a;
    const userId = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!userId) {
        throw new https_1.HttpsError("unauthenticated", "You must be signed in to issue a QR pass.");
    }
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        throw new https_1.HttpsError("not-found", "User profile not found.");
    }
    const userData = userSnap.data();
    const membershipStatus = normalizeMembershipStatus(userData);
    if (membershipStatus !== "active") {
        throw new https_1.HttpsError("failed-precondition", "Only active memberships can issue a QR pass.");
    }
    const now = new Date();
    const issuedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + QR_LIFETIME_SECONDS * 1000).toISOString();
    const sessionId = (0, uuid_1.v4)();
    const accessToken = (0, uuid_1.v4)();
    const memberId = userData.membershipId || `SCSC-${userId.slice(0, 8).toUpperCase()}`;
    const fullName = userData.displayName || "Association Member";
    const membershipExpiryDate = userData.membershipExpiresAt || new Date(now.getTime() + 31536000000).toISOString();
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
        const freshUserData = freshUserSnap.data();
        const previousSessionId = freshUserData === null || freshUserData === void 0 ? void 0 : freshUserData.activeQrSessionId;
        if (previousSessionId) {
            transaction.set(userRef.collection("membershipPasses").doc(previousSessionId), {
                status: "revoked",
                revokedAt: issuedAt
            }, { merge: true });
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
            qrToken: (0, uuid_1.v4)()
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
exports.verifyMembership = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    const { pass } = request.data;
    if (!pass) {
        throw new https_1.HttpsError("invalid-argument", "Membership pass is required.");
    }
    let payload;
    try {
        payload = decryptMembershipPayload(pass);
    }
    catch {
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
            return { valid: false, reason: "invalid" };
        }
        const userData = userSnap.data();
        const sessionData = sessionSnap.data();
        const membershipStatus = normalizeMembershipStatus(userData);
        if (membershipStatus !== "active") {
            transaction.set(userRef.collection("qrScans").doc(), {
                sessionId: payload.sessionId,
                scannedAt,
                result: "inactive"
            });
            return {
                valid: false,
                reason: "inactive",
                memberId: userData.membershipId,
                memberName: userData.displayName,
                membershipExpiryDate: userData.membershipExpiresAt
            };
        }
        if (new Date(payload.expiresAt).getTime() <= Date.now() || !sessionData.expiresAt || new Date(sessionData.expiresAt).getTime() <= Date.now()) {
            transaction.set(sessionRef, {
                status: "expired"
            }, { merge: true });
            transaction.set(userRef.collection("qrScans").doc(), {
                sessionId: payload.sessionId,
                scannedAt,
                result: "expired"
            });
            return {
                valid: false,
                reason: "expired",
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
                reason: "stale",
                memberId: sessionData.memberId,
                memberName: sessionData.fullName,
                membershipExpiryDate: sessionData.membershipExpiryDate
            };
        }
        if (sessionData.usedAt) {
            transaction.set(sessionRef, {
                duplicateAttempts: (sessionData.duplicateAttempts || 0) + 1
            }, { merge: true });
            transaction.set(userRef.collection("qrScans").doc(), {
                sessionId: payload.sessionId,
                scannedAt,
                result: "duplicate"
            });
            return {
                valid: false,
                reason: "duplicate",
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
            return { valid: false, reason: "invalid" };
        }
        transaction.update(sessionRef, {
            status: "used",
            usedAt: scannedAt
        });
        transaction.update(userRef, {
            activeQrSessionId: null,
            activeQrSessionExpiresAt: null,
            lastQrScanAt: scannedAt,
            qrToken: (0, uuid_1.v4)()
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
exports.setUserRole = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdmin(request);
    const { uid, role } = request.data;
    if (!uid || !role) {
        throw new https_1.HttpsError("invalid-argument", "User ID and role are required.");
    }
    await (0, auth_1.getAuth)().setCustomUserClaims(uid, { role });
    await db.collection("users").doc(uid).set({ role }, { merge: true });
    return { success: true };
});
exports.upsertEvent = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdminOrModerator(request);
    const data = request.data;
    const id = cleanString(data.id) || db.collection("events").doc().id;
    const title = cleanString(data.title);
    const startsAt = cleanString(data.startsAt);
    const capacity = cleanNumber(data.capacity);
    if (!title || !startsAt || capacity <= 0) {
        throw new https_1.HttpsError("invalid-argument", "Event title, start date, and capacity are required.");
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
exports.deleteEvent = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdminOrModerator(request);
    const { id } = request.data;
    if (!id) {
        throw new https_1.HttpsError("invalid-argument", "Event ID is required.");
    }
    await db.collection("events").doc(id).delete();
    return { success: true };
});
exports.upsertProduct = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdminOrModerator(request);
    const data = request.data;
    const id = cleanString(data.id) || db.collection("products").doc().id;
    const name = cleanString(data.name);
    const price = cleanNumber(data.price);
    const stock = cleanNumber(data.stock);
    if (!name || price <= 0 || stock < 0) {
        throw new https_1.HttpsError("invalid-argument", "Product name, price, and stock are required.");
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
exports.deleteProduct = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdminOrModerator(request);
    const { id } = request.data;
    if (!id) {
        throw new https_1.HttpsError("invalid-argument", "Product ID is required.");
    }
    await db.collection("products").doc(id).delete();
    return { success: true };
});
exports.updateUserAdmin = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdmin(request);
    const { uid, role, membershipStatus, membershipExpiresAt } = request.data;
    if (!uid) {
        throw new https_1.HttpsError("invalid-argument", "User ID is required.");
    }
    const allowedRoles = ["admin", "moderator", "user"];
    const allowedStatuses = ["active", "expired", "pendingRenewal"];
    const payload = {
        updatedAt: new Date().toISOString()
    };
    if (role) {
        if (!allowedRoles.includes(role)) {
            throw new https_1.HttpsError("invalid-argument", "Invalid role.");
        }
        await (0, auth_1.getAuth)().setCustomUserClaims(uid, { role });
        payload.role = role;
    }
    if (membershipStatus) {
        if (!allowedStatuses.includes(membershipStatus)) {
            throw new https_1.HttpsError("invalid-argument", "Invalid membership status.");
        }
        payload.membershipStatus = membershipStatus;
    }
    if (membershipExpiresAt) {
        payload.membershipExpiresAt = membershipExpiresAt;
    }
    await db.collection("users").doc(uid).set(payload, { merge: true });
    return { success: true };
});
exports.updateOrderStatus = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdminOrModerator(request);
    const { id, status } = request.data;
    const allowedStatuses = ["pending", "confirmed", "processing", "delivered"];
    if (!id || !status || !allowedStatuses.includes(status)) {
        throw new https_1.HttpsError("invalid-argument", "Order ID and a valid status are required.");
    }
    await db.collection("orders").doc(id).set({
        status,
        updatedAt: new Date().toISOString()
    }, { merge: true });
    return { success: true };
});
exports.moderateArticle = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdminOrModerator(request);
    const { id, approved } = request.data;
    if (!id || typeof approved !== "boolean") {
        throw new https_1.HttpsError("invalid-argument", "Article ID and approval status are required.");
    }
    await db.collection("articles").doc(id).set({
        approved,
        moderatedAt: new Date().toISOString()
    }, { merge: true });
    return { success: true };
});
