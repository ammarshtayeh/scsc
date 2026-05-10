import "server-only";

import { FieldPath } from "firebase-admin/firestore";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type {
  Article,
  BoardMember,
  DashboardStats,
  EventRegistration,
  EventItem,
  Order,
  Product,
  UserProfile
} from "@/types";

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

  let query = adminDb.collection("events").orderBy("startsAt", "asc");
  if (typeof limit === "number") {
    query = query.limit(limit);
  }
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => convertDoc<EventItem>(doc.id, doc.data()));
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
  return convertDoc<EventItem>(doc.id, doc.data());
}

export async function getAllProducts(): Promise<Product[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb.collection("products").orderBy(FieldPath.documentId()).get();
  return snapshot.docs.map((doc) => convertDoc<Product>(doc.id, doc.data()));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return null;
  }

  const snapshot = await adminDb.collection("products").where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return convertDoc<Product>(doc.id, doc.data());
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
        const registeredAt =
          typeof data.registeredAt === "string"
            ? data.registeredAt
            : typeof data.createdAt?.toDate === "function"
              ? data.createdAt.toDate().toISOString()
              : undefined;

        return convertDoc<EventRegistration>(doc.id, {
          ...doc.data(),
          eventId: eventDoc.id,
          userId: doc.id,
          displayName: data.displayName || user?.displayName,
          email: data.email || user?.email,
          registeredAt
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

  const [users, events, orders, products] = await Promise.all([
    adminDb.collection("users").count().get(),
    adminDb.collection("events").count().get(),
    adminDb.collection("orders").count().get(),
    adminDb.collection("products").select("company").get()
  ]);

  const companySet = new Set(products.docs.map((doc) => doc.get("company")).filter(Boolean));

  return {
    totalUsers: users.data().count,
    upcomingEvents: events.data().count,
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
  return doc.exists ? convertDoc<UserProfile>(doc.id, doc.data() || {}) : null;
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

  const snapshot = await adminDb.collection("users").orderBy("joinedAt", "desc").get();
  return snapshot.docs.map((doc) => convertDoc<UserProfile>(doc.id, doc.data()));
}

export async function getAllOrders(): Promise<Order[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return [];
  }

  const snapshot = await adminDb.collection("orders").orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => convertDoc<Order>(doc.id, doc.data()));
}
