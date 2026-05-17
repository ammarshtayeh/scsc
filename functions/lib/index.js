"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateArticle = exports.removeEventRegistration = exports.setEventRegistrationCheckIn = exports.deleteArticle = exports.upsertArticle = exports.deleteOrder = exports.updateOrderStatus = exports.deleteUserAdmin = exports.sendUserPasswordResetAdmin = exports.createUserAdmin = exports.updateUserAdmin = exports.deleteBoardMember = exports.upsertBoardMember = exports.deleteProduct = exports.upsertProduct = exports.upsertHomeSettings = exports.deleteArchivedEvent = exports.upsertArchivedEvent = exports.deleteEvent = exports.upsertEvent = exports.setUserRole = exports.verifyMembership = exports.issueMembershipQrPass = exports.sendContactEmail = void 0;
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
function cleanString(value, fallback = "") {
    return typeof value === "string" ? value.trim() || fallback : fallback;
}
function resolveMemberGrade(specialization, preferredGrade) {
    if (preferredGrade === "first" || preferredGrade === "second") {
        return preferredGrade;
    }
    return cleanString(specialization) === "مستحضرات تجميل والعناية بالبشرة" ? "first" : "second";
}
function getErrorCode(error) {
    return typeof error === "object" && error !== null && "code" in error
        ? String(error.code || "")
        : "";
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
const IMAGE_SOURCE_PATTERN = /^(https?:\/\/.+|data:image\/.+|blob:.+|\/.+\.[a-z0-9]+([?#].*)?)$/i;
function isValidImageSource(value) {
    return typeof value === "string" && IMAGE_SOURCE_PATTERN.test(value.trim());
}
function cleanImageString(value, fallback = "") {
    return isValidImageSource(value) ? cleanString(value) : fallback;
}
function cleanImageStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .filter((entry) => isValidImageSource(entry))
        .map((entry) => cleanString(entry))
        .filter(Boolean);
}
const VIDEO_SOURCE_PATTERN = /^(https?:\/\/.+|data:video\/.+|blob:.+|\/.+\.[a-z0-9]+([?#].*)?)$/i;
function isValidVideoSource(value) {
    return typeof value === "string" && VIDEO_SOURCE_PATTERN.test(value.trim());
}
function cleanVideoString(value, fallback = "") {
    return isValidVideoSource(value) ? cleanString(value) : fallback;
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
async function deleteQueryBatch(query, batchSize = 300) {
    const snapshot = await query.limit(batchSize).get();
    if (snapshot.empty) {
        return 0;
    }
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    return snapshot.size + (snapshot.size >= batchSize ? await deleteQueryBatch(query, batchSize) : 0);
}
async function sendOrderStatusEmail(orderId, status) {
    var _a;
    const transporter = createTransport();
    if (!transporter || !process.env.CONTACT_EMAIL) {
        return;
    }
    const orderSnap = await db.collection("orders").doc(orderId).get();
    const orderData = orderSnap.data();
    if (!(orderData === null || orderData === void 0 ? void 0 : orderData.userId)) {
        return;
    }
    const userSnap = await db.collection("users").doc(orderData.userId).get();
    const userData = userSnap.data();
    if (!(userData === null || userData === void 0 ? void 0 : userData.email)) {
        return;
    }
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: userData.email,
        subject: `SCSC Order ${orderId} is ${status}`,
        text: `Hello ${userData.displayName || "SCSC member"},\n\nYour order ${orderId} status is now ${status}.\n\nTotal: ${(_a = orderData.total) !== null && _a !== void 0 ? _a : ""}\n\nSCSC`
    });
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
        coverImage: cleanImageString(data.coverImage),
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
    const { id, cleanupRegistrations } = request.data;
    if (!id) {
        throw new https_1.HttpsError("invalid-argument", "Event ID is required.");
    }
    const registrationsSnap = await db
        .collection("events")
        .doc(id)
        .collection("registrations")
        .limit(1)
        .get();
    if (!registrationsSnap.empty && !cleanupRegistrations) {
        throw new https_1.HttpsError("failed-precondition", "This event has registrations. Confirm cleanup before deleting it.");
    }
    if (cleanupRegistrations) {
        const allRegistrationsSnap = await db.collection("events").doc(id).collection("registrations").get();
        const batch = db.batch();
        allRegistrationsSnap.docs.forEach((registrationDoc) => {
            batch.delete(registrationDoc.ref);
            batch.set(db.collection("users").doc(registrationDoc.id), {
                registeredEventIds: firestore_1.FieldValue.arrayRemove(id),
                lastEventCancellationAt: new Date().toISOString()
            }, { merge: true });
        });
        await batch.commit();
    }
    await db.collection("events").doc(id).delete();
    return { success: true };
});
exports.upsertArchivedEvent = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    var _a, _b, _c, _d;
    requireAdminOrModerator(request);
    const data = request.data;
    const requestedId = cleanString(data.id);
    const id = requestedId || db.collection("archivedEvents").doc().id;
    const title = cleanString(data.title);
    const eventDate = cleanString(data.eventDate);
    const isNewRecord = !requestedId;
    if (!title || !eventDate) {
        throw new https_1.HttpsError("invalid-argument", "Archived event title and date are required.");
    }
    const payload = {
        slug: cleanString(data.slug) || slugify(title) || id,
        title,
        excerpt: cleanString(data.excerpt),
        description: cleanStringArray(data.description),
        eventDate,
        venue: cleanString(data.venue, "TBA"),
        images: cleanImageStringArray(data.images),
        tags: cleanStringArray(data.tags),
        updatedAt: new Date().toISOString(),
        updatedBy: ((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid) || "unknown"
    };
    if (isNewRecord) {
        payload.createdAt = new Date().toISOString();
        payload.createdBy = ((_b = request.auth) === null || _b === void 0 ? void 0 : _b.uid) || "unknown";
        payload.createdByRole = ((_d = (_c = request.auth) === null || _c === void 0 ? void 0 : _c.token) === null || _d === void 0 ? void 0 : _d.role) || "unknown";
    }
    await db.collection("archivedEvents").doc(id).set(payload, { merge: true });
    return { success: true, id };
});
exports.deleteArchivedEvent = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdminOrModerator(request);
    const { id } = request.data;
    if (!id) {
        throw new https_1.HttpsError("invalid-argument", "Archived event ID is required.");
    }
    await db.collection("archivedEvents").doc(id).delete();
    return { success: true };
});
exports.upsertHomeSettings = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    var _a;
    requireAdmin(request);
    const { slides, partnerEyebrow, partnerTitle, partnerDescription, partners, featuredVideo, storeEyebrow, storeTitle, storeDescription, storeCtaLabel, storeCtaHref, storePerks } = request.data;
    const payload = {
        updatedAt: new Date().toISOString(),
        updatedBy: ((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid) || "unknown"
    };
    if (typeof slides !== "undefined") {
        if (!Array.isArray(slides)) {
            throw new https_1.HttpsError("invalid-argument", "Home page slides must be an array.");
        }
        const cleanSlides = slides
            .slice(0, 6)
            .map((slide) => ({
            image: cleanImageString(slide.image),
            title: cleanString(slide.title),
            caption: cleanString(slide.caption)
        }))
            .filter((slide) => slide.image || slide.title || slide.caption);
        if (!cleanSlides.length ||
            cleanSlides.some((slide) => !slide.image || !slide.title || !slide.caption)) {
            throw new https_1.HttpsError("invalid-argument", "Each home page slide must include an image, title, and caption.");
        }
        payload.slides = cleanSlides;
    }
    if (typeof partners !== "undefined") {
        if (!Array.isArray(partners)) {
            throw new https_1.HttpsError("invalid-argument", "Partners must be an array.");
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
            throw new https_1.HttpsError("invalid-argument", "Each partner must include a name, tagline, and logo.");
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
    if ((cleanFeaturedVideo === null || cleanFeaturedVideo === void 0 ? void 0 : cleanFeaturedVideo.enabled) && !cleanFeaturedVideo.url) {
        throw new https_1.HttpsError("invalid-argument", "Home page video URL is required when the video section is enabled.");
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
    await db.collection("siteSettings").doc("home").set(payload, { merge: true });
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
        images: cleanImageStringArray(data.images),
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
exports.upsertBoardMember = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdmin(request);
    const data = request.data;
    const id = cleanString(data.id) || db.collection("boardMembers").doc().id;
    const name = cleanString(data.name);
    const role = cleanString(data.role);
    const year = cleanString(data.year);
    if (!name || !role || !year) {
        throw new https_1.HttpsError("invalid-argument", "Board member name, role, and year are required.");
    }
    await db.collection("boardMembers").doc(id).set({
        name,
        role,
        year,
        order: Math.max(1, cleanNumber(data.order, 99)),
        image: cleanImageString(data.image),
        bio: cleanString(data.bio),
        updatedAt: new Date().toISOString()
    }, { merge: true });
    return { success: true, id };
});
exports.deleteBoardMember = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdmin(request);
    const { id } = request.data;
    if (!id) {
        throw new https_1.HttpsError("invalid-argument", "Board member ID is required.");
    }
    await db.collection("boardMembers").doc(id).delete();
    return { success: true };
});
exports.updateUserAdmin = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdmin(request);
    const { uid, displayName, email, phone, studentId, specialization, memberGrade, accountStatus, role, membershipStatus, membershipExpiresAt } = request.data;
    if (!uid) {
        throw new https_1.HttpsError("invalid-argument", "User ID is required.");
    }
    const allowedRoles = ["admin", "moderator", "user"];
    const allowedStatuses = ["active", "expired", "pendingRenewal"];
    const allowedGrades = ["first", "second"];
    const allowedAccountStatuses = ["new", "approved", "rejected"];
    const payload = {
        updatedAt: new Date().toISOString()
    };
    const authUpdates = {};
    if (typeof displayName === "string") {
        const nextDisplayName = cleanString(displayName);
        if (!nextDisplayName) {
            throw new https_1.HttpsError("invalid-argument", "Display name is required.");
        }
        payload.displayName = nextDisplayName;
        authUpdates.displayName = nextDisplayName;
    }
    if (typeof email === "string") {
        const nextEmail = cleanString(email).toLowerCase();
        if (!nextEmail) {
            throw new https_1.HttpsError("invalid-argument", "Email is required.");
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
    if (hasMemberGrade && !allowedGrades.includes(memberGrade)) {
        throw new https_1.HttpsError("invalid-argument", "Invalid member grade.");
    }
    if (hasSpecialization || hasMemberGrade) {
        payload.memberGrade = resolveMemberGrade(hasSpecialization ? specialization : undefined, hasMemberGrade ? memberGrade : undefined);
    }
    if (typeof accountStatus === "string") {
        if (!allowedAccountStatuses.includes(accountStatus)) {
            throw new https_1.HttpsError("invalid-argument", "Invalid account status.");
        }
        payload.accountStatus = accountStatus;
    }
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
    if (Object.keys(authUpdates).length) {
        await (0, auth_1.getAuth)().updateUser(uid, authUpdates);
    }
    await db.collection("users").doc(uid).set(payload, { merge: true });
    return { success: true };
});
exports.createUserAdmin = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdmin(request);
    const { displayName, email, password, phone, studentId, specialization, memberGrade, accountStatus, role, membershipStatus } = request.data;
    const nextDisplayName = cleanString(displayName);
    const nextEmail = cleanString(email).toLowerCase();
    const nextPassword = typeof password === "string" ? password : "";
    const nextRole = role || "user";
    const nextMembershipStatus = membershipStatus || "active";
    const nextSpecialization = cleanString(specialization);
    const nextMemberGrade = resolveMemberGrade(nextSpecialization, memberGrade);
    const nextAccountStatus = accountStatus || "approved";
    if (!nextDisplayName) {
        throw new https_1.HttpsError("invalid-argument", "Display name is required.");
    }
    if (!nextEmail) {
        throw new https_1.HttpsError("invalid-argument", "Email is required.");
    }
    if (nextPassword.length < 8) {
        throw new https_1.HttpsError("invalid-argument", "Password must be at least 8 characters.");
    }
    if (!["admin", "moderator", "user"].includes(nextRole)) {
        throw new https_1.HttpsError("invalid-argument", "Invalid role.");
    }
    if (!["active", "expired", "pendingRenewal"].includes(nextMembershipStatus)) {
        throw new https_1.HttpsError("invalid-argument", "Invalid membership status.");
    }
    if (memberGrade && !["first", "second"].includes(memberGrade)) {
        throw new https_1.HttpsError("invalid-argument", "Invalid member grade.");
    }
    if (!["new", "approved", "rejected"].includes(nextAccountStatus)) {
        throw new https_1.HttpsError("invalid-argument", "Invalid account status.");
    }
    try {
        const userRecord = await (0, auth_1.getAuth)().createUser({
            displayName: nextDisplayName,
            email: nextEmail,
            password: nextPassword
        });
        if (nextRole !== "user") {
            await (0, auth_1.getAuth)().setCustomUserClaims(userRecord.uid, { role: nextRole });
        }
        const joinedAt = new Date().toISOString();
        await db.collection("users").doc(userRecord.uid).set({
            membershipId: `SCSC-${userRecord.uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase()}`,
            displayName: nextDisplayName,
            email: nextEmail,
            phone: cleanString(phone),
            studentId: cleanString(studentId),
            specialization: nextSpecialization,
            memberGrade: nextMemberGrade,
            accountStatus: nextAccountStatus,
            company: "",
            photoURL: "",
            role: nextRole,
            membershipStatus: nextMembershipStatus,
            membershipExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
            joinedAt,
            qrToken: (0, uuid_1.v4)(),
            savedArticleIds: [],
            registeredEventIds: [],
            activeQrSessionId: null,
            activeQrSessionExpiresAt: null,
            lastQrIssuedAt: null,
            lastQrScanAt: null,
            discountRate: 0.12,
            updatedAt: joinedAt
        });
        return { success: true, uid: userRecord.uid };
    }
    catch (error) {
        const code = getErrorCode(error);
        if (code.includes("email-already-exists")) {
            throw new https_1.HttpsError("already-exists", "This email is already in use.");
        }
        if (code.includes("invalid-email")) {
            throw new https_1.HttpsError("invalid-argument", "The email address is invalid.");
        }
        if (code.includes("invalid-password")) {
            throw new https_1.HttpsError("invalid-argument", "The password does not meet Firebase requirements.");
        }
        throw new https_1.HttpsError("internal", error instanceof Error ? error.message : "Unable to create user.");
    }
});
exports.sendUserPasswordResetAdmin = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdmin(request);
    const { uid, email } = request.data;
    if (!uid && !email) {
        throw new https_1.HttpsError("invalid-argument", "User ID or email is required.");
    }
    const auth = (0, auth_1.getAuth)();
    const userRecord = uid
        ? await auth.getUser(uid)
        : await auth.getUserByEmail(cleanString(email).toLowerCase());
    const userEmail = cleanString(userRecord.email).toLowerCase();
    if (!userEmail) {
        throw new https_1.HttpsError("failed-precondition", "Selected user does not have an email address.");
    }
    const resetLink = await auth.generatePasswordResetLink(userEmail);
    const transporter = createTransport();
    if (transporter) {
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: userEmail,
            subject: "Reset your SCSC password",
            text: `Hello ${userRecord.displayName || "SCSC member"},\n\n` +
                `Use the secure link below to reset your password:\n${resetLink}\n\n` +
                "If you did not request this change, you can ignore this email.\n\nSCSC"
        });
        return { success: true, emailed: true };
    }
    return { success: true, emailed: false, resetLink };
});
exports.deleteUserAdmin = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    var _a;
    requireAdmin(request);
    const { uid } = request.data;
    if (!uid) {
        throw new https_1.HttpsError("invalid-argument", "User ID is required.");
    }
    if (uid === ((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("failed-precondition", "Cannot delete your own admin account.");
    }
    await (0, auth_1.getAuth)().deleteUser(uid);
    await db.collection("users").doc(uid).delete();
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
    await sendOrderStatusEmail(id, status);
    return { success: true };
});
exports.deleteOrder = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdmin(request);
    const { id } = request.data;
    if (!id) {
        throw new https_1.HttpsError("invalid-argument", "Order ID is required.");
    }
    await db.collection("orders").doc(id).delete();
    return { success: true };
});
exports.upsertArticle = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdminOrModerator(request);
    const data = request.data;
    const id = cleanString(data.id) || db.collection("articles").doc().id;
    const title = cleanString(data.title);
    const excerpt = cleanString(data.excerpt);
    const category = cleanString(data.category, "Others");
    const allowedCategories = ["Skin Care", "Makeup", "Hair Care", "Others"];
    if (!title || !excerpt || !allowedCategories.includes(category)) {
        throw new https_1.HttpsError("invalid-argument", "Article title, excerpt, and category are required.");
    }
    const references = Array.isArray(data.references)
        ? data.references
            .map((entry) => {
            const reference = entry;
            return {
                label: cleanString(reference.label),
                url: cleanString(reference.url)
            };
        })
            .filter((entry) => entry.label && entry.url)
        : [];
    await db.collection("articles").doc(id).set({
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
    }, { merge: true });
    return { success: true, id };
});
exports.deleteArticle = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdmin(request);
    const { id } = request.data;
    if (!id) {
        throw new https_1.HttpsError("invalid-argument", "Article ID is required.");
    }
    await db.collection("articles").doc(id).delete();
    await deleteQueryBatch(db.collection("moderationLogs").where("targetId", "==", id));
    return { success: true };
});
exports.setEventRegistrationCheckIn = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    var _a;
    requireAdminOrModerator(request);
    const { eventId, userId, checkedIn } = request.data;
    if (!eventId || !userId || typeof checkedIn !== "boolean") {
        throw new https_1.HttpsError("invalid-argument", "Event ID, user ID, and check-in status are required.");
    }
    await db
        .collection("events")
        .doc(eventId)
        .collection("registrations")
        .doc(userId)
        .set({
        checkedInAt: checkedIn ? new Date().toISOString() : null,
        checkedInBy: checkedIn ? ((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid) || "unknown" : null
    }, { merge: true });
    return { success: true };
});
exports.removeEventRegistration = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    requireAdminOrModerator(request);
    const { eventId, userId } = request.data;
    if (!eventId || !userId) {
        throw new https_1.HttpsError("invalid-argument", "Event ID and user ID are required.");
    }
    const eventRef = db.collection("events").doc(eventId);
    const registrationRef = eventRef.collection("registrations").doc(userId);
    const userRef = db.collection("users").doc(userId);
    await db.runTransaction(async (transaction) => {
        var _a;
        const [eventSnap, registrationSnap] = await Promise.all([
            transaction.get(eventRef),
            transaction.get(registrationRef)
        ]);
        if (!eventSnap.exists || !registrationSnap.exists) {
            return;
        }
        const registeredCount = Number(((_a = eventSnap.data()) === null || _a === void 0 ? void 0 : _a.registeredCount) || 0);
        transaction.delete(registrationRef);
        transaction.update(eventRef, {
            registeredCount: Math.max(0, registeredCount - 1)
        });
        transaction.set(userRef, {
            registeredEventIds: firestore_1.FieldValue.arrayRemove(eventId),
            lastEventCancellationAt: new Date().toISOString()
        }, { merge: true });
    });
    return { success: true };
});
exports.moderateArticle = (0, https_1.onCall)(publicCallableOptions, async (request) => {
    var _a;
    requireAdminOrModerator(request);
    const { id, approved } = request.data;
    if (!id || typeof approved !== "boolean") {
        throw new https_1.HttpsError("invalid-argument", "Article ID and approval status are required.");
    }
    const moderatedAt = new Date().toISOString();
    const moderatorId = ((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid) || "unknown";
    await db.runTransaction(async (transaction) => {
        transaction.set(db.collection("articles").doc(id), {
            approved,
            moderatedAt,
            moderatedBy: moderatorId
        }, { merge: true });
        transaction.set(db.collection("moderationLogs").doc(), {
            targetType: "article",
            targetId: id,
            action: approved ? "approved" : "rejected",
            moderatorId,
            createdAt: moderatedAt
        });
    });
    return { success: true };
});
