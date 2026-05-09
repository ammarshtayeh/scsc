"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SmartImage } from "@/components/ui/smart-image";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/hooks/useLocale";
import { useMemberPricing } from "@/hooks/useMemberPricing";
import { translateProductCategory } from "@/lib/i18n/helpers";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductDetailClient({
  product,
  allProducts
}: {
  product: Product;
  allProducts: Product[];
}) {
  const { dictionary, locale } = useLocale();
  const { pushToast } = useToast();
  const memberPricing = useMemberPricing();
  const { addProduct } = useCart(allProducts, memberPricing.useMemberPricing);
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const displayPrice = memberPricing.useMemberPricing
    ? product.memberPrice ?? product.price
    : product.price;

  async function handleAdd() {
    try {
      await addProduct(product.id);
      pushToast(dictionary.store.addedToCart, "success");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : dictionary.store.addToCartError,
        "error"
      );
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="space-y-4 overflow-hidden">
          <div className="relative h-[420px]">
            <SmartImage
              src={activeImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {product.images.map((image) => (
              <button
                key={image}
                onClick={() => setActiveImage(image)}
                className="relative h-28 overflow-hidden rounded-2xl"
              >
                <SmartImage src={image} alt={product.name} fill className="object-cover" />
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent">
              {translateProductCategory(product.category, locale)}
            </p>
            <h1 className="mt-3 font-heading text-4xl font-bold text-brand-primary">
              {product.name}
            </h1>
            <p className="mt-3 text-sm text-slate-500">{product.company}</p>
          </div>
          <div>
            <p className="font-heading text-3xl font-bold text-brand-primary">
              {formatCurrency(displayPrice, "USD", locale)}
            </p>
            {memberPricing.useMemberPricing && product.memberPrice ? (
              <p className="mt-1 text-sm text-slate-400 line-through">
                {formatCurrency(product.price, "USD", locale)}
              </p>
            ) : null}
            {!memberPricing.useMemberPricing ? (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                {dictionary.store.renewalPrompt}
              </p>
            ) : null}
          </div>
          <p className="text-sm leading-8 text-slate-600">{product.description}</p>
          <div className="space-y-3">
            {product.longDescription.map((paragraph, index) => (
              <p key={index} className="text-sm leading-8 text-slate-700">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="rounded-2xl bg-brand-sky p-4 text-sm text-slate-600">
            {product.stock > 0
              ? `${formatNumber(product.stock, locale)} ${dictionary.store.unitsAvailable}`
              : dictionary.store.outOfStock}
          </div>
          <Button disabled={product.stock <= 0} onClick={handleAdd}>
            {dictionary.store.addToCart}
          </Button>
        </Card>
      </div>
    </section>
  );
}
