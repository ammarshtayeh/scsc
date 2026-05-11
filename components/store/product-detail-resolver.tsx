"use client";

import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { ProductDetailClient } from "@/components/store/product-detail-client";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/hooks/useLocale";
import { db } from "@/lib/firebase/firebase";
import type { Product } from "@/types";

function normalizeProduct(id: string, data: Record<string, unknown>): Product {
  const price = Number(data.price);
  const memberPrice = Number(data.memberPrice);

  return {
    id,
    slug: typeof data.slug === "string" && data.slug.trim() ? data.slug.trim() : id,
    name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : "Untitled product",
    description: typeof data.description === "string" ? data.description : "",
    longDescription: Array.isArray(data.longDescription)
      ? data.longDescription.filter((entry): entry is string => typeof entry === "string")
      : [],
    price: Number.isFinite(price) ? price : 0,
    memberPrice: Number.isFinite(memberPrice) ? memberPrice : undefined,
    category: (typeof data.category === "string" ? data.category : "Skin Care") as Product["category"],
    company: typeof data.company === "string" && data.company.trim() ? data.company.trim() : "SCSC Partner",
    stock: Math.max(0, Number(data.stock) || 0),
    images: Array.isArray(data.images)
      ? data.images.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim()))
      : [],
    featured: Boolean(data.featured)
  };
}

export function ProductDetailResolver({ slug }: { slug: string }) {
  const { dictionary } = useLocale();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      if (!db) {
        setLoading(false);
        return;
      }

      const productsRef = collection(db, "products");
      const [slugSnapshot, idSnapshot, allSnapshot] = await Promise.all([
        getDocs(query(productsRef, where("slug", "==", slug))),
        getDoc(doc(db, "products", slug)),
        getDocs(query(productsRef, orderBy("__name__")))
      ]);

      if (!mounted) {
        return;
      }

      const allProducts = allSnapshot.docs.map((entry) =>
        normalizeProduct(entry.id, entry.data() as Record<string, unknown>)
      );
      const matchedDoc = slugSnapshot.docs[0] || (idSnapshot.exists() ? idSnapshot : null);
      const matchedProduct = matchedDoc
        ? normalizeProduct(matchedDoc.id, matchedDoc.data() as Record<string, unknown>)
        : allProducts.find((entry) => entry.slug === slug || entry.id === slug) || null;

      setProducts(allProducts);
      setProduct(matchedProduct);
      setLoading(false);
    }

    void loadProduct().catch(() => {
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="space-y-4 dark:border-white/10 dark:bg-white/5">
          <div className="h-72 animate-pulse rounded-2xl bg-brand-sky dark:bg-white/10" />
          <div className="h-8 w-2/3 animate-pulse rounded-full bg-brand-sky dark:bg-white/10" />
          <div className="h-24 animate-pulse rounded-2xl bg-brand-sky dark:bg-white/10" />
        </Card>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          title={dictionary.store.noProductsTitle}
          description={dictionary.store.noProductsDescription}
        />
      </section>
    );
  }

  return <ProductDetailClient product={product} allProducts={products} />;
}
