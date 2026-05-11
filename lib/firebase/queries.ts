import "server-only";

import { FieldPath } from "firebase-admin/firestore";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type {
  Article,
  BoardMember,
  DashboardStats,
  EventRegistration,
  EventItem,
  HomePageSettings,
  Order,
  Product,
  UserProfile
} from "@/types";

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => cleanString(entry)).filter(Boolean);
  }

  return typeof value === "string" ? [value.trim()].filter(Boolean) : [];
}

function cleanNumber(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeDateValue(value: unknown, fallback = "") {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fallback : value.toISOString();
  }

  if (typeof value === "object") {
    const maybeTimestamp = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
      nanoseconds?: number;
      _nanoseconds?: number;
    };

    if (typeof maybeTimestamp.toDate === "function") {
      const date = maybeTimestamp.toDate();
      return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
    }

    const seconds = maybeTimestamp.seconds ?? maybeTimestamp._seconds;
    const nanoseconds = maybeTimestamp.nanoseconds ?? maybeTimestamp._nanoseconds ?? 0;
    if (typeof seconds === "number") {
      return new Date(seconds * 1000 + Math.floor(nanoseconds / 1000000)).toISOString();
    }
  }

  return fallback;
}

function normalizeProduct(id: string, data: Record<string, unknown>) {
  const price = cleanNumber(data.price);

  return {
    id,
    slug: cleanString(data.slug, id) || id,
    name: cleanString(data.name, "Untitled product"),
    description: cleanString(data.description),
    longDescription: cleanStringArray(data.longDescription),
    price,
    memberPrice:
      typeof data.memberPrice === "undefined" ? undefined : cleanNumber(data.memberPrice, price),
    category: cleanString(data.category, "Skin Care") as Product["category"],
    company: cleanString(data.company, "SCSC Partner"),
    stock: Math.max(0, cleanNumber(data.stock)),
    images: cleanStringArray(data.images),
    featured: Boolean(data.featured)
  } satisfies Product;
}

function normalizeEvent(id: string, data: Record<string, unknown>) {
  return {
    id,
    slug: cleanString(data.slug, id) || id,
    title: cleanString(data.title, "Untitled event"),
    excerpt: cleanString(data.excerpt),
    description: cleanStringArray(data.description),
    coverImage: cleanString(data.coverImage),
    startsAt: normalizeDateValue(data.startsAt),
    venue: cleanString(data.venue, "TBA"),
    capacity: Math.max(0, cleanNumber(data.capacity)),
    registeredCount: Math.max(0, cleanNumber(data.registeredCount)),
    tags: cleanStringArray(data.tags),
    isFeatured: Boolean(data.isFeatured)
  } satisfies EventItem;
}

function normalizeUserProfile(id: string, data: Record<string, unknown>) {
  return {
    id,
    membershipId: cleanString(data.membershipId) || undefined,
    displayName: cleanString(data.displayName, "Association Member"),
    email: cleanString(data.email),
    role: cleanString(data.role, "user") as UserProfile["role"],
    phone: cleanString(data.phone) || undefined,
    company: cleanString(data.company) || undefined,
    photoURL: cleanString(data.photoURL) || undefined,
    membershipStatus: cleanString(data.membershipStatus, "active") as UserProfile["membershipStatus"],
    membershipExpiresAt: normalizeDateValue(data.membershipExpiresAt) || undefined,
    joinedAt: normalizeDateValue(data.joinedAt, new Date(0).toISOString()),
    qrToken: cleanString(data.qrToken) || undefined,
    savedArticleIds: cleanStringArray(data.savedArticleIds),
    registeredEventIds: cleanStringArray(data.registeredEventIds),
    activeQrSessionId: cleanString(data.activeQrSessionId) || null,
    activeQrSessionExpiresAt: normalizeDateValue(data.activeQrSessionExpiresAt) || null,
    lastQrIssuedAt: normalizeDateValue(data.lastQrIssuedAt) || null,
    lastQrScanAt: normalizeDateValue(data.lastQrScanAt) || null,
    discountRate:
      typeof data.discountRate === "undefined" ? undefined : cleanNumber(data.discountRate)
  } satisfies UserProfile;
}

function normalizeHomeSettings(data: Record<string, unknown>) {
  const slides = Array.isArray(data.slides)
    ? data.slides
        .map((entry) => {
          const slide = entry as Record<string, unknown>;
          return {
            image: cleanString(slide.image),
            title: cleanString(slide.title),
            caption: cleanString(slide.caption)
          };
        })
        .filter((slide) => slide.image || slide.title || slide.caption)
    : [];

  return {
    slides,
    updatedAt: normalizeDateValue(data.updatedAt) || undefined
  } satisfies HomePageSettings;
}

function sortByDate<T extends { publishedAt?: string; startsAt?: string; createdAt?: string }>(
  items: T[],
  field: "publishedAt" | "startsAt" | "createdAt"
) {
  return [...items].sort((a, b) => {
    return new Date(b[field] || 0).getTime() - new Date(a[field] || 0).getTime();
  });
}

function convertDoc<T>(id: string, data: Record<string, unknown>) {
  return {
    id,
    ...data
  } as T;
}

export async function getLatestArticles(limit = 3): Promise<Article[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb
    .collection("articles")
    .where("approved", "==", true)
    .get();

  return sortByDate(
    snapshot.docs.map((doc) => convertDoc<Article>(doc.id, doc.data())),
    "publishedAt"
  ).slice(0, limit);
}

export async function getHomePageSettings(): Promise<HomePageSettings | null> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return null;
  }

  const doc = await adminDb.collection("siteSettings").doc("home").get();
  return doc.exists ? normalizeHomeSettings(doc.data() || {}) : null;
}

export async function getAllArticles(category?: string): Promise<Article[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  let query = adminDb.collection("articles").where("approved", "==", true);
  if (category) {
    query = query.where("category", "==", category);
  }
  const snapshot = await query.get();
  return sortByDate(
    snapshot.docs.map((doc) => convertDoc<Article>(doc.id, doc.data())),
    "publishedAt"
  );
}

export async function getArticlesForModeration(): Promise<Article[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb.collection("articles").orderBy("publishedAt", "desc").get();
  return snapshot.docs
    .map((doc) => convertDoc<Article>(doc.id, doc.data()))
    .sort((a, b) => Number(a.approved) - Number(b.approved));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return null;
  }

  const snapshot = await adminDb
    .collection("articles")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const article = convertDoc<Article>(doc.id, doc.data());
  return article.approved ? article : null;
}

export async function getUpcomingEvents(limit?: number): Promise<EventItem[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb.collection("events").get();
  const events = snapshot.docs
    .map((doc) => normalizeEvent(doc.id, doc.data()))
    .sort((a, b) => new Date(a.startsAt || 0).getTime() - new Date(b.startsAt || 0).getTime());

  return typeof limit === "number" ? events.slice(0, limit) : events;
}

export async function getEventBySlug(slug: string): Promise<EventItem | null> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return null;
  }

  const snapshot = await adminDb.collection("events").where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return normalizeEvent(doc.id, doc.data());
}

export async function getAllProducts(): Promise<Product[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb.collection("products").orderBy(FieldPath.documentId()).get();
  return snapshot.docs.map((doc) => normalizeProduct(doc.id, doc.data()));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return null;
  }

  const snapshot = await adminDb.collection("products").where("slug", "==", slug).limit(1).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return normalizeProduct(doc.id, doc.data());
  }

  const doc = await adminDb.collection("products").doc(slug).get();
  return doc.exists ? normalizeProduct(doc.id, doc.data() || {}) : null;
}

export async function getBoardMembersByYear(): Promise<Record<string, BoardMember[]>> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return {};
  }

  const snapshot = await adminDb.collection("boardMembers").orderBy("year", "desc").get();
  return snapshot.docs.reduce<Record<string, BoardMember[]>>((acc, doc) => {
    const member = convertDoc<BoardMember>(doc.id, doc.data());
    acc[member.year] = acc[member.year] ? [...acc[member.year], member] : [member];
    return acc;
  }, {});
}

export async function getAllBoardMembers(): Promise<BoardMember[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb.collection("boardMembers").orderBy("year", "desc").get();
  return snapshot.docs.map((doc) => convertDoc<BoardMember>(doc.id, doc.data()));
}

export async function getEventRegistrationsForDashboard(): Promise<EventRegistration[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const [eventsSnapshot, usersSnapshot] = await Promise.all([
    adminDb.collection("events").get(),
    adminDb.collection("users").get()
  ]);
  const usersById = new Map(usersSnapshot.docs.map((doc) => [doc.id, doc.data()]));
  const registrations = await Promise.all(
    eventsSnapshot.docs.map(async (eventDoc) => {
      const snapshot = await eventDoc.ref.collection("registrations").get();
      return snapshot.docs.map((doc) => {
        const user = usersById.get(doc.id) as { displayName?: string; email?: string } | undefined;
        const data = doc.data();
        const registeredAt = normalizeDateValue(data.registeredAt || data.createdAt) || undefined;

        return convertDoc<EventRegistration>(doc.id, {
          ...doc.data(),
          eventId: eventDoc.id,
          userId: doc.id,
          displayName: data.displayName || user?.displayName,
          email: data.email || user?.email,
          registeredAt,
          checkedInAt: normalizeDateValue(data.checkedInAt) || null
        });
      });
    })
  );

  return registrations.flat();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return {
      totalUsers: 0,
      upcomingEvents: 0,
      totalOrders: 0,
      registeredCompanies: 0
    };
  }

  const now = Date.now();
  const [users, events, orders, products] = await Promise.all([
    adminDb.collection("users").count().get(),
    adminDb.collection("events").select("startsAt").get(),
    adminDb.collection("orders").count().get(),
    adminDb.collection("products").select("company").get()
  ]);

  const companySet = new Set(products.docs.map((doc) => doc.get("company")).filter(Boolean));
  const upcomingEvents = events.docs.filter((doc) => {
    const startsAt = normalizeDateValue(doc.get("startsAt"));
    return startsAt && new Date(startsAt).getTime() >= now;
  }).length;

  return {
    totalUsers: users.data().count,
    upcomingEvents,
    totalOrders: orders.data().count,
    registeredCompanies: companySet.size
  };
}

export async function getUserProfileById(userId?: string): Promise<UserProfile | null> {
  if (!userId) {
    return null;
  }

  if (!isFirebaseAdminConfigured || !adminDb) {
    return null;
  }

  const doc = await adminDb.collection("users").doc(userId).get();
  return doc.exists ? normalizeUserProfile(doc.id, doc.data() || {}) : null;
}

export async function getOrdersForUser(userId?: string): Promise<Order[]> {
  if (!userId) {
    return [];
  }

  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb
    .collection("orders")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => convertDoc<Order>(doc.id, doc.data()));
}

export async function getAllUsers(): Promise<UserProfile[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb.collection("users").get();
  return snapshot.docs
    .map((doc) => normalizeUserProfile(doc.id, doc.data()))
    .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
}

export async function getAllOrders(): Promise<Order[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb.collection("orders").orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => convertDoc<Order>(doc.id, doc.data()));
}
