"use client";

import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";
import { sanitizeImageSource } from "@/lib/utils";
import type { EventItem } from "@/types";

function toIsoDate(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value && typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function cleanNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? Math.max(0, next) : 0;
}

function cleanStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim()))
    : [];
}

export function mapEventDoc(id: string, data: Record<string, unknown>): EventItem {
  return {
    id,
    slug: cleanString(data.slug, id),
    title: cleanString(data.title, "Untitled event"),
    excerpt: cleanString(data.excerpt),
    description: cleanStringArray(data.description),
    coverImage: sanitizeImageSource(data.coverImage),
    startsAt: toIsoDate(data.startsAt),
    venue: cleanString(data.venue, "TBA"),
    capacity: cleanNumber(data.capacity),
    registeredCount: cleanNumber(data.registeredCount),
    tags: cleanStringArray(data.tags),
    isFeatured: Boolean(data.isFeatured)
  };
}

export async function fetchEventsClient(): Promise<EventItem[]> {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(collection(db, "events"));
  return snapshot.docs
    .map((entry) => mapEventDoc(entry.id, entry.data() as Record<string, unknown>))
    .sort((a, b) => new Date(a.startsAt || 0).getTime() - new Date(b.startsAt || 0).getTime());
}

export async function fetchEventBySlugClient(slug: string): Promise<EventItem | null> {
  if (!db || !slug) {
    return null;
  }

  const bySlug = await getDocs(query(collection(db, "events"), where("slug", "==", slug)));
  if (bySlug.docs.length > 0) {
    const entry = bySlug.docs[0];
    return mapEventDoc(entry.id, entry.data() as Record<string, unknown>);
  }

  const byId = await getDoc(doc(db, "events", slug));
  return byId.exists() ? mapEventDoc(byId.id, byId.data() as Record<string, unknown>) : null;
}
