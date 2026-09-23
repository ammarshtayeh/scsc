"use client";

import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";
import { sanitizeImageSources } from "@/lib/utils";
import type { Product, ProductCategory } from "@/types";

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanNumber(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function mapProductDoc(id: string, data: Record<string, unknown>): Product {
  const price = cleanNumber(data.price);
  const memberPrice = cleanNumber(data.memberPrice, price);
  const discountPercent = cleanNumber(data.discountPercent);

  return {
    id,
    slug: cleanString(data.slug, id) || id,
    name: cleanString(data.name, "Untitled product"),
    description: cleanString(data.description),
    longDescription: Array.isArray(data.longDescription)
      ? data.longDescription.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim()))
      : [],
    price,
    memberPrice: Number.isFinite(Number(data.memberPrice)) ? memberPrice : undefined,
    discountPercent: Math.min(100, Math.max(0, discountPercent)),
    category: (cleanString(data.category, "Skin Care") || "Skin Care") as ProductCategory,
    company: cleanString(data.company, "SCSC Partner") || "SCSC Partner",
    companyId: cleanString(data.companyId) || undefined,
    stock: Math.max(0, cleanNumber(data.stock)),
    images: sanitizeImageSources(data.images),
    featured: Boolean(data.featured)
  };
}

export async function fetchAllProductsClient(): Promise<Product[]> {
  if (!db) {
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, "products"));
    return snapshot.docs
      .map((entry) => mapProductDoc(entry.id, entry.data() as Record<string, unknown>))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export async function fetchProductsByCompanyClient(companyId: string): Promise<Product[]> {
  if (!db || !companyId) {
    return [];
  }

  try {
    const [byIdSnap, byCompanySnap] = await Promise.all([
      getDocs(query(collection(db, "products"), where("companyId", "==", companyId))),
      getDocs(query(collection(db, "products"), where("company", "==", companyId)))
    ]);

    const map = new Map<string, Product>();
    byIdSnap.docs.forEach((entry) =>
      map.set(entry.id, mapProductDoc(entry.id, entry.data() as Record<string, unknown>))
    );
    byCompanySnap.docs.forEach((entry) =>
      map.set(entry.id, mapProductDoc(entry.id, entry.data() as Record<string, unknown>))
    );

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    const all = await fetchAllProductsClient();
    return all.filter(
      (product) => product.companyId === companyId || product.company === companyId
    );
  }
}
