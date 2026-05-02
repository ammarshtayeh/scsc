import "server-only";

import { FieldPath } from "firebase-admin/firestore";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  getLocalizedMockArticles,
  getLocalizedMockBoardMembers,
  getLocalizedMockEvents,
  getLocalizedMockOrders,
  getLocalizedMockProducts,
  getLocalizedMockUsers,
  mockDashboardStats,
} from "@/lib/mock-data";
import { getServerLocale } from "@/lib/i18n/server";
import type {
  Article,
  BoardMember,
  DashboardStats,
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
    return sortByDate(getLocalizedMockArticles(getServerLocale()), "publishedAt").slice(0, limit);
  }

  const snapshot = await adminDb
    .collection("articles")
    .where("approved", "==", true)
    .orderBy("publishedAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => convertDoc<Article>(doc.id, doc.data()));
}

export async function getAllArticles(category?: string): Promise<Article[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    const list = sortByDate(getLocalizedMockArticles(getServerLocale()), "publishedAt");
    return category ? list.filter((item) => item.category === category) : list;
  }

  let query = adminDb.collection("articles").where("approved", "==", true);
  if (category) {
    query = query.where("category", "==", category);
  }
  const snapshot = await query.orderBy("publishedAt", "desc").get();
  return snapshot.docs.map((doc) => convertDoc<Article>(doc.id, doc.data()));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return getLocalizedMockArticles(getServerLocale()).find((article) => article.slug === slug) || null;
  }

  const snapshot = await adminDb
    .collection("articles")
    .where("slug", "==", slug)
    .where("approved", "==", true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return convertDoc<Article>(doc.id, doc.data());
}

export async function getUpcomingEvents(limit?: number): Promise<EventItem[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    const items = [...getLocalizedMockEvents(getServerLocale())].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
    return typeof limit === "number" ? items.slice(0, limit) : items;
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
    return getLocalizedMockEvents(getServerLocale()).find((event) => event.slug === slug) || null;
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
    return getLocalizedMockProducts(getServerLocale());
  }

  const snapshot = await adminDb.collection("products").orderBy(FieldPath.documentId()).get();
  return snapshot.docs.map((doc) => convertDoc<Product>(doc.id, doc.data()));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return getLocalizedMockProducts(getServerLocale()).find((product) => product.slug === slug) || null;
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
    return getLocalizedMockBoardMembers(getServerLocale()).reduce<Record<string, BoardMember[]>>((acc, member) => {
      acc[member.year] = acc[member.year] ? [...acc[member.year], member] : [member];
      return acc;
    }, {});
  }

  const snapshot = await adminDb.collection("boardMembers").orderBy("year", "desc").get();
  return snapshot.docs.reduce<Record<string, BoardMember[]>>((acc, doc) => {
    const member = convertDoc<BoardMember>(doc.id, doc.data());
    acc[member.year] = acc[member.year] ? [...acc[member.year], member] : [member];
    return acc;
  }, {});
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return mockDashboardStats;
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
  const locale = getServerLocale();

  if (!userId) {
    return getLocalizedMockUsers(locale)[0] || null;
  }

  if (!isFirebaseAdminConfigured || !adminDb) {
    return getLocalizedMockUsers(locale).find((user) => user.id === userId) || null;
  }

  const doc = await adminDb.collection("users").doc(userId).get();
  return doc.exists ? convertDoc<UserProfile>(doc.id, doc.data() || {}) : null;
}

export async function getOrdersForUser(userId?: string): Promise<Order[]> {
  const locale = getServerLocale();

  if (!userId) {
    return getLocalizedMockOrders(locale);
  }

  if (!isFirebaseAdminConfigured || !adminDb) {
    return getLocalizedMockOrders(locale).filter((order) => order.userId === userId);
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
    return getLocalizedMockUsers(getServerLocale());
  }

  const snapshot = await adminDb.collection("users").orderBy("joinedAt", "desc").get();
  return snapshot.docs.map((doc) => convertDoc<UserProfile>(doc.id, doc.data()));
}

export async function getAllOrders(): Promise<Order[]> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return getLocalizedMockOrders(getServerLocale());
  }

  const snapshot = await adminDb.collection("orders").orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => convertDoc<Order>(doc.id, doc.data()));
}
