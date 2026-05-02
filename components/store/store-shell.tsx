"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/hooks/useLocale";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { translateProductCategory } from "@/lib/i18n/helpers";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Product } from "@/types";

export function StoreShell({ products }: { products: Product[] }) {
  const { dictionary, locale } = useLocale();
  const { pushToast } = useToast();
  const { items, total, addProduct, updateQuantity, checkout } = useCart(products);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [company, setCompany] = useState("All");
  const [maxPrice, setMaxPrice] = useState(100);

  const companies = useMemo(
    () => [dictionary.common.all, ...Array.from(new Set(products.map((product) => product.company)))],
    [dictionary.common.all, products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || product.category === category;
      const matchesCompany = company === "All" || product.company === company;
      const matchesPrice = (product.memberPrice ?? product.price) <= maxPrice;
      return matchesSearch && matchesCategory && matchesCompany && matchesPrice;
    });
  }, [products, search, category, company, maxPrice]);

  async function handleCheckout() {
    try {
      const order = await checkout();
      pushToast(`${dictionary.store.orderConfirmedPrefix} ${order.id}.`, "success");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : dictionary.store.checkoutError,
        "error"
      );
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr_0.82fr]">
        <Card className="space-y-5 xl:sticky xl:top-24">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {dictionary.store.filters}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{dictionary.store.filtersText}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-primary">
              {dictionary.store.search}
            </label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
              placeholder={dictionary.store.searchPlaceholder}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-primary">
              {dictionary.store.category}
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            >
              <option value="All">{dictionary.common.all}</option>
              {PRODUCT_CATEGORIES.map((entry) => (
                <option key={entry} value={entry}>
                  {translateProductCategory(entry, locale)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-primary">
              {dictionary.store.company}
            </label>
            <select
              value={company === "All" ? dictionary.common.all : company}
              onChange={(event) =>
                setCompany(
                  event.target.value === dictionary.common.all ? "All" : event.target.value
                )
              }
              className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            >
              {companies.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-primary">
              {dictionary.store.maxPrice}: {formatCurrency(maxPrice, "USD", locale)}
            </label>
            <input
              type="range"
              min={10}
              max={100}
              step={1}
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              className="w-full accent-[#0B3B78]"
            />
          </div>
        </Card>

        <div className="space-y-6">
          {filteredProducts.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredProducts.map((product) => (
                <Card key={product.id} interactive className="overflow-hidden p-0">
                  <div className="relative h-52 sm:h-56">
                    <SmartImage
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                          {product.name}
                        </h2>
                        <p className="text-sm text-slate-500">{product.company}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-brand-primary">
                          {formatCurrency(product.memberPrice ?? product.price, "USD", locale)}
                        </p>
                        {product.memberPrice ? (
                          <p className="text-xs text-slate-400 line-through">
                            {formatCurrency(product.price, "USD", locale)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-sm leading-7 text-slate-600">{product.description}</p>
                    <div className="grid gap-3 sm:flex sm:flex-wrap">
                      <Link href={`/store/${product.slug}`} className="w-full sm:w-auto">
                        <Button variant="secondary" className="w-full sm:w-auto">{dictionary.store.viewDetails}</Button>
                      </Link>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={async () => {
                          try {
                            await addProduct(product.id);
                            pushToast(dictionary.store.addedToCart, "success");
                          } catch (error) {
                            pushToast(
                              error instanceof Error
                                ? error.message
                                : dictionary.store.addToCartError,
                              "error"
                            );
                          }
                        }}
                      >
                        {dictionary.store.addToCart}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title={dictionary.store.noProductsTitle}
              description={dictionary.store.noProductsDescription}
            />
          )}
        </div>

        <Card className="space-y-5 xl:sticky xl:top-24">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {dictionary.store.cart}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{dictionary.store.cartText}</p>
          </div>
          <div className="space-y-4">
            {items.length ? (
              items.map((item) => (
                <div key={item?.product.id} className="rounded-2xl border border-brand-primary/10 p-4">
                  <h3 className="font-medium text-brand-primary">{item?.product.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatCurrency(item?.lineTotal || 0, "USD", locale)}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-10 w-10 rounded-full px-0"
                      onClick={() => updateQuantity(item!.product.id, item!.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="text-sm font-medium">
                      {formatNumber(item?.quantity || 0, locale)}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-10 w-10 rounded-full px-0"
                      onClick={() => updateQuantity(item!.product.id, item!.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">{dictionary.store.emptyCart}</p>
            )}
          </div>
          <div className="rounded-2xl bg-brand-sky p-4">
            <p className="text-sm text-slate-600">{dictionary.store.estimatedTotal}</p>
            <p className="mt-2 font-heading text-3xl font-bold text-brand-primary">
              {formatCurrency(total, "USD", locale)}
            </p>
          </div>
          <Button className="w-full" disabled={!items.length} onClick={handleCheckout}>
            {dictionary.store.checkout}
          </Button>
        </Card>
      </div>
    </section>
  );
}
