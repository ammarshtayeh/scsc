import "server-only";

import { FieldPath } from "firebase-admin/firestore";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { sanitizeImageSource, sanitizeImageSources, sanitizeVideoSource } from "@/lib/utils";
import type {
  Article,
  ArchivedEvent,
  BoardMember,
  DashboardStats,
  EventRegistration,
  EventItem,
  FinanceSettings,
  FinanceTransaction,
  HomePageSettings,
  Job,
  JobApplication,
  JobApplicationStatus,
  JobEmploymentType,
  JobStatus,
  PartnerHighlight,
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

function cleanDiscountPercent(value: unknown) {
  return Math.min(100, Math.max(0, cleanNumber(value)));
}

function normalizeFinanceTransaction(data: Record<string, unknown>): FinanceTransaction {
  return {
    id: cleanString(data.id),
    type: data.type === "expense" ? "expense" : "income",
    amount: Math.max(0, cleanNumber(data.amount)),
    description: cleanString(data.description),
    eventName: cleanString(data.eventName) || undefined,
    createdAt: normalizeDateValue(data.createdAt, new Date().toISOString()),
    createdBy: cleanString(data.createdBy) || undefined
  };
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
    discountPercent: cleanDiscountPercent(data.discountPercent),
    category: cleanString(data.category, "Skin Care") as Product["category"],
    company: cleanString(data.company, "SCSC Partner"),
    companyId: cleanString(data.companyId) || undefined,
    stock: Math.max(0, cleanNumber(data.stock)),
    images: sanitizeImageSources(data.images),
    featured: Boolean(data.featured)
  } satisfies Product;
}

function normalizeJob(id: string, data: Record<string, unknown>): Job {
  const employmentType = cleanString(data.employmentType, "full-time") as JobEmploymentType;
  const status = cleanString(data.status, "open") as JobStatus;

  return {
    id,
    slug: cleanString(data.slug, id) || id,
    title: cleanString(data.title, "Untitled job"),
    description: cleanString(data.description),
    requirements: cleanStringArray(data.requirements),
    location: cleanString(data.location, "Nablus"),
    employmentType: ["full-time", "part-time", "internship", "contract"].includes(employmentType)
      ? employmentType
      : "full-time",
    company: cleanString(data.company, "SCSC"),
    ownerId: cleanString(data.ownerId),
    ownerRole: (cleanString(data.ownerRole, "admin") as Job["ownerRole"]) || "admin",
    status: status === "closed" ? "closed" : "open",
    published: data.published !== false,
    applicationCount: Math.max(0, cleanNumber(data.applicationCount)),
    createdAt: cleanString(data.createdAt, new Date(0).toISOString()),
    updatedAt: cleanString(data.updatedAt) || undefined
  };
}

function normalizeJobApplication(id: string, data: Record<string, unknown>): JobApplication {
  const status = cleanString(data.status, "pending") as JobApplicationStatus;

  return {
    id,
    jobId: cleanString(data.jobId),
    jobTitle: cleanString(data.jobTitle, "Job"),
    jobSlug: cleanString(data.jobSlug),
    ownerId: cleanString(data.ownerId),
    userId: cleanString(data.userId),
    displayName: cleanString(data.displayName),
    email: cleanString(data.email),
    phone: cleanString(data.phone) || undefined,
    coverLetter: cleanString(data.coverLetter) || undefined,
    additionalInfo: cleanString(data.additionalInfo) || undefined,
    cvUrl: cleanString(data.cvUrl),
    cvFileName: cleanString(data.cvFileName, "cv"),
    cvContentType: cleanString(data.cvContentType) || undefined,
    status: ["pending", "reviewed", "accepted", "rejected"].includes(status) ? status : "pending",
    createdAt: cleanString(data.createdAt, new Date(0).toISOString()),
    updatedAt: cleanString(data.updatedAt) || undefined
  };
}

function normalizeEvent(id: string, data: Record<string, unknown>) {
  return {
    id,
    slug: cleanString(data.slug, id) || id,
    title: cleanString(data.title, "Untitled event"),
    excerpt: cleanString(data.excerpt),
    description: cleanStringArray(data.description),
    coverImage: sanitizeImageSource(data.coverImage),
    startsAt: normalizeDateValue(data.startsAt),
    venue: cleanString(data.venue, "TBA"),
    capacity: Math.max(0, cleanNumber(data.capacity)),
    registeredCount: Math.max(0, cleanNumber(data.registeredCount)),
    tags: cleanStringArray(data.tags),
    isFeatured: Boolean(data.isFeatured)
  } satisfies EventItem;
}

function normalizeArchivedEvent(id: string, data: Record<string, unknown>) {
  return {
    id,
    slug: cleanString(data.slug, id) || id,
    title: cleanString(data.title, "Untitled archived event"),
    excerpt: cleanString(data.excerpt),
    description: cleanStringArray(data.description),
    eventDate: normalizeDateValue(data.eventDate),
    venue: cleanString(data.venue, "TBA"),
    images: sanitizeImageSources(data.images),
    tags: cleanStringArray(data.tags),
    createdAt: normalizeDateValue(data.createdAt) || undefined,
    createdBy: cleanString(data.createdBy) || undefined,
    createdByRole: cleanString(data.createdByRole) as ArchivedEvent["createdByRole"],
    updatedAt: normalizeDateValue(data.updatedAt) || undefined,
    updatedBy: cleanString(data.updatedBy) || undefined
  } satisfies ArchivedEvent;
}

function normalizeUserProfile(id: string, data: Record<string, unknown>) {
  return {
    id,
    membershipId: cleanString(data.membershipId) || undefined,
    displayName: cleanString(data.displayName, "Association Member"),
    email: cleanString(data.email),
    role: cleanString(data.role, "user") as UserProfile["role"],
    phone: cleanString(data.phone) || undefined,
    studentId: cleanString(data.studentId) || undefined,
    specialization: cleanString(data.specialization) || undefined,
    degree: cleanString(data.degree) || undefined,
    memberGrade: cleanString(data.memberGrade) as UserProfile["memberGrade"] | undefined,
    accountStatus: cleanString(data.accountStatus, "approved") as UserProfile["accountStatus"],
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
            image: sanitizeImageSource(slide.image),
            title: cleanString(slide.title),
            caption: cleanString(slide.caption)
          };
        })
        .filter((slide) => slide.image || slide.title || slide.caption)
    : [];

  const partners = Array.isArray(data.partners)
    ? data.partners
        .map((entry) => {
          const partner = entry as Record<string, unknown>;
          return {
            name: cleanString(partner.name),
            tagline: cleanString(partner.tagline),
            logo: sanitizeImageSource(partner.logo),
            url: cleanString(partner.url) || undefined
          } satisfies PartnerHighlight;
        })
        .filter((partner) => partner.name || partner.tagline || partner.logo || partner.url)
    : [];

  return {
    slides,
    partnerEyebrow: cleanString(data.partnerEyebrow) || undefined,
    partnerTitle: cleanString(data.partnerTitle) || undefined,
    partnerDescription: cleanString(data.partnerDescription) || undefined,
    partners,
    featuredVideo:
      typeof data.featuredVideo === "object" && data.featuredVideo
        ? {
            enabled: Boolean((data.featuredVideo as Record<string, unknown>).enabled),
            url: sanitizeVideoSource((data.featuredVideo as Record<string, unknown>).url),
            title: cleanString((data.featuredVideo as Record<string, unknown>).title) || undefined,
            description:
              cleanString((data.featuredVideo as Record<string, unknown>).description) || undefined
          }
        : undefined,
    storeEyebrow: cleanString(data.storeEyebrow) || undefined,
    storeTitle: cleanString(data.storeTitle) || undefined,
    storeDescription: cleanString(data.storeDescription) || undefined,
    storeCtaLabel: cleanString(data.storeCtaLabel) || undefined,
    storeCtaHref: cleanString(data.storeCtaHref) || undefined,
    storePerks: cleanStringArray(data.storePerks),
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

export async function getFinanceSettings(): Promise<FinanceSettings> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return { balance: 0, transactions: [] };
  }

  const doc = await adminDb.collection("siteSettings").doc("finance").get();
  const data = doc.exists ? doc.data() || {} : {};

  return {
    balance: cleanNumber(data.balance),
    transactions: Array.isArray(data.transactions)
      ? data.transactions
          .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
          .map(normalizeFinanceTransaction)
      : [],
    updatedAt: normalizeDateValue(data.updatedAt) || undefined,
    updatedBy: cleanString(data.updatedBy) || undefined
  };
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

export async function getArchivedEvents(limit?: number): Promise<ArchivedEvent[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb.collection("archivedEvents").get();
  const archivedEvents = snapshot.docs
    .map((doc) => normalizeArchivedEvent(doc.id, doc.data()))
    .sort((a, b) => new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime());

  return typeof limit === "number" ? archivedEvents.slice(0, limit) : archivedEvents;
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

export async function getProductsByCompany(companyId: string): Promise<Product[]> {
  if (!isFirebaseAdminConfigured || !adminDb || !companyId) {
    return [];
  }

  const [byIdSnap, byCompanySnap] = await Promise.all([
    adminDb.collection("products").where("companyId", "==", companyId).get(),
    adminDb.collection("products").where("company", "==", companyId).get()
  ]);

  const map = new Map<string, Product>();
  byIdSnap.docs.forEach((doc) => map.set(doc.id, normalizeProduct(doc.id, doc.data())));
  byCompanySnap.docs.forEach((doc) => map.set(doc.id, normalizeProduct(doc.id, doc.data())));

  return Array.from(map.values());
}

export async function getAllCompanies(): Promise<UserProfile[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb.collection("users").where("role", "==", "company").get();
  return snapshot.docs.map((doc) => normalizeUserProfile(doc.id, doc.data()));
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
  const [users, events, orders, products, companyUsers] = await Promise.all([
    adminDb.collection("users").count().get(),
    adminDb.collection("events").select("startsAt").get(),
    adminDb.collection("orders").count().get(),
    adminDb.collection("products").select("company").get(),
    adminDb.collection("users").where("role", "==", "company").count().get()
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
    registeredCompanies: Math.max(companyUsers.data().count, companySet.size)
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

export async function getOrdersForCompany(companyId: string): Promise<Order[]> {
  if (!isFirebaseAdminConfigured || !adminDb || !companyId) {
    return [];
  }

  try {
    const snapshot = await adminDb
      .collection("orders")
      .where("companyIds", "array-contains", companyId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => convertDoc<Order>(doc.id, doc.data()));
  } catch {
    // Fallback if composite index is not ready yet.
    const snapshot = await adminDb.collection("orders").orderBy("createdAt", "desc").get();
    return snapshot.docs
      .map((doc) => convertDoc<Order>(doc.id, doc.data()))
      .filter((order) => {
        if (Array.isArray(order.companyIds) && order.companyIds.includes(companyId)) {
          return true;
        }

        return (order.items || []).some((item) => item.companyId === companyId);
      });
  }
}

export async function getPublishedJobs(): Promise<Job[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  try {
    const snapshot = await adminDb
      .collection("jobs")
      .where("published", "==", true)
      .where("status", "==", "open")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => normalizeJob(doc.id, doc.data()));
  } catch {
    const snapshot = await adminDb.collection("jobs").get();
    return snapshot.docs
      .map((doc) => normalizeJob(doc.id, doc.data()))
      .filter((job) => job.published && job.status === "open")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function getAllJobs(): Promise<Job[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb.collection("jobs").get();
  return snapshot.docs
    .map((doc) => normalizeJob(doc.id, doc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getJobsByOwner(ownerId: string): Promise<Job[]> {
  if (!isFirebaseAdminConfigured || !adminDb || !ownerId) {
    return [];
  }

  try {
    const snapshot = await adminDb
      .collection("jobs")
      .where("ownerId", "==", ownerId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => normalizeJob(doc.id, doc.data()));
  } catch {
    const snapshot = await adminDb.collection("jobs").where("ownerId", "==", ownerId).get();
    return snapshot.docs
      .map((doc) => normalizeJob(doc.id, doc.data()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function getJobBySlug(slug: string): Promise<Job | null> {
  if (!isFirebaseAdminConfigured || !adminDb || !slug) {
    return null;
  }

  const snapshot = await adminDb.collection("jobs").where("slug", "==", slug).limit(1).get();
  if (!snapshot.empty) {
    return normalizeJob(snapshot.docs[0].id, snapshot.docs[0].data());
  }

  const doc = await adminDb.collection("jobs").doc(slug).get();
  return doc.exists ? normalizeJob(doc.id, doc.data() || {}) : null;
}

export async function getJobApplicationsByOwner(ownerId: string): Promise<JobApplication[]> {
  if (!isFirebaseAdminConfigured || !adminDb || !ownerId) {
    return [];
  }

  try {
    const snapshot = await adminDb
      .collection("jobApplications")
      .where("ownerId", "==", ownerId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => normalizeJobApplication(doc.id, doc.data()));
  } catch {
    const snapshot = await adminDb
      .collection("jobApplications")
      .where("ownerId", "==", ownerId)
      .get();

    return snapshot.docs
      .map((doc) => normalizeJobApplication(doc.id, doc.data()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function getAllJobApplications(): Promise<JobApplication[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb.collection("jobApplications").get();
  return snapshot.docs
    .map((doc) => normalizeJobApplication(doc.id, doc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
