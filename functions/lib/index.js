"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserRole = exports.verifyMembership = exports.issueMembershipQrPass = exports.sendContactEmail = void 0;
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
exports.sendContactEmail = (0, https_1.onCall)(async (request) => {
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
exports.issueMembershipQrPass = (0, https_1.onCall)(async (request) => {
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
exports.verifyMembership = (0, https_1.onCall)(async (request) => {
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
exports.setUserRole = (0, https_1.onCall)(async (request) => {
    var _a;
    const callerRole = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.token.role;
    if (callerRole !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only admins can assign roles.");
    }
    const { uid, role } = request.data;
    if (!uid || !role) {
        throw new https_1.HttpsError("invalid-argument", "User ID and role are required.");
    }
    await (0, auth_1.getAuth)().setCustomUserClaims(uid, { role });
    await db.collection("users").doc(uid).set({ role }, { merge: true });
    return { success: true };
});
