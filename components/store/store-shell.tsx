"use client";

import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/hooks/useLocale";
import { useMemberPricing } from "@/hooks/useMemberPricing";
import { PRODUCT_CATEGORIES, STORE_CURRENCY } from "@/lib/constants";
import { db } from "@/lib/firebase/firebase";
import { translateProductCategory } from "@/lib/i18n/helpers";
import { formatCurrency, formatNumber, sanitizeImageSources } from "@/lib/utils";
import type { Product } from "@/types";

function normalizeClientProduct(id: string, data: Record<string, unknown>): Product {
  const price = Number(data.price);
  const memberPrice = Number(data.memberPrice);
  const discountPercent = Number(data.discountPercent);

  return {
    id,
    slug: typeof data.slug === "string" && data.slug.trim() ? data.slug.trim() : id,
    name: typeof data.name === "string" ? data.name : "Untitled product",
    description: typeof data.description === "string" ? data.description : "",
    longDescription: Array.isArray(data.longDescription)
      ? data.longDescription.filter((entry): entry is string => typeof entry === "string")
      : [],
    price: Number.isFinite(price) ? price : 0,
    memberPrice: Number.isFinite(memberPrice) ? memberPrice : undefined,
    discountPercent: Number.isFinite(discountPercent)
      ? Math.min(100, Math.max(0, discountPercent))
      : 0,
    category: (typeof data.category === "string" ? data.category : "Skin Care") as Product["category"],
    company: typeof data.company === "string" && data.company.trim() ? data.company : "SCSC Partner",
    stock: Math.max(0, Number(data.stock) || 0),
    images: sanitizeImageSources(data.images),
    featured: Boolean(data.featured)
  };
}

function getProductDetailHref(product: Product) {
  return `/store/${encodeURIComponent(product.slug || product.id)}`;
}

const STORE_MAX_PRICE = 20000;

export function StoreShell({ products: initialProducts }: { products: Product[] }) {
  const { dictionary, locale } = useLocale();
  const { pushToast } = useToast();
  const memberPricing = useMemberPricing();
  const [products, setProducts] = useState(initialProducts);
  const priceCeiling = STORE_MAX_PRICE;
  const { items, total, addProduct, updateQuantity, checkout } = useCart(
    products,
    memberPricing.useMemberPricing
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [company, setCompany] = useState("All");
  const [maxPrice, setMaxPrice] = useState(priceCeiling);
  const [deliveryForm, setDeliveryForm] = useState({
    contactName: "",
    phone: "",
    address: "",
    notes: ""
  });

  useEffect(() => {
    setMaxPrice(priceCeiling);
  }, [priceCeiling]);

  useEffect(() => {
    if (initialProducts.length || !db) {
      setProducts(initialProducts);
      return;
    }

    let mounted = true;

    async function loadClientProducts() {
      const snapshot = await getDocs(query(collection(db!, "products"), orderBy("__name__")));
      if (!mounted) {
        return;
      }

      setProducts(
        snapshot.docs.map((doc) =>
          normalizeClientProduct(doc.id, doc.data() as Record<string, unknown>)
        )
      );
    }

    void loadClientProducts().catch((error) => {
      pushToast(error instanceof Error ? error.message : dictionary.store.noProductsDescription, "error");
    });

    return () => {
      mounted = false;
    };
  }, [dictionary.store.noProductsDescription, initialProducts, pushToast]);

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
      const matchesPrice =
        (memberPricing.useMemberPricing ? product.memberPrice ?? product.price : product.price) <=
        maxPrice;
      return matchesSearch && matchesCategory && matchesCompany && matchesPrice;
    });
  }, [products, search, category, company, maxPrice, memberPricing.useMemberPricing]);

  const hasCartStockIssue = items.some((item) => item.product.stock < item.quantity);

  function getDisplayPrice(product: Product) {
    return memberPricing.useMemberPricing ? product.memberPrice ?? product.price : product.price;
  }

  async function handleCheckout() {
    if (
      !deliveryForm.contactName.trim() ||
      !deliveryForm.phone.trim() ||
      !deliveryForm.address.trim()
    ) {
      pushToast(dictionary.store.deliveryRequired, "error");
      return;
    }

    try {
      const order = await checkout(deliveryForm);
      pushToast(`${dictionary.store.orderConfirmedPrefix} ${order.id}.`, "success");
      setDeliveryForm({
        contactName: "",
        phone: "",
        address: "",
        notes: ""
      });
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : dictionary.store.checkoutError,
        "error"
      );
    }
  }

  return (
    <section id="store-grid" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr_0.82fr]">
        <Card className="space-y-5 xl:sticky xl:top-24">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {dictionary.store.filters}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{dictionary.store.filtersText}</p>
            {!memberPricing.useMemberPricing ? (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                {dictionary.store.renewalPrompt}
              </p>
            ) : null}
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
              {dictionary.store.maxPrice}: {formatCurrency(maxPrice, STORE_CURRENCY, locale)}
            </label>
            <input
              type="range"
              min={0}
              max={priceCeiling}
              step={1}
              value={maxPrice}
              disabled={priceCeiling <= 0}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              className="w-full accent-[#0B3B78]"
            />
            <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>{formatCurrency(0, STORE_CURRENCY, locale)}</span>
              <span>{formatCurrency(priceCeiling, STORE_CURRENCY, locale)}</span>
            </div>
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
                    {product.discountPercent ? (
                      <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                        {formatNumber(product.discountPercent, locale)}%
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          {product.featured ? (
                            <span className="rounded-full bg-brand-accent/15 px-3 py-1 text-xs font-semibold text-brand-accent-strong">
                              {locale === "ar" ? "منتج مميز" : "Featured"}
                            </span>
                          ) : null}
                          <span className="rounded-full bg-brand-primary/8 px-3 py-1 text-xs font-semibold text-brand-primary dark:bg-white/10 dark:text-brand-ink">
                            {locale === "ar" ? "شريك معتمد" : "Partner listing"}
                          </span>
                        </div>
                        <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                          {product.name}
                        </h2>
                        <p className="text-sm text-slate-500">{product.company}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-brand-primary">
                          {formatCurrency(getDisplayPrice(product), STORE_CURRENCY, locale)}
                        </p>
                        {memberPricing.useMemberPricing && product.memberPrice ? (
                          <p className="text-xs text-slate-400 line-through">
                            {formatCurrency(product.price, STORE_CURRENCY, locale)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-sm leading-7 text-slate-600">{product.description}</p>
                    <div className="grid gap-3 sm:flex sm:flex-wrap">
                      <Link href={getProductDetailHref(product)} className="w-full sm:w-auto">
                        <Button variant="secondary" className="w-full sm:w-auto">{dictionary.store.viewDetails}</Button>
                      </Link>
                      <Button
                        className="w-full sm:w-auto"
                        disabled={product.stock <= 0}
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
                        {product.stock <= 0 ? dictionary.store.outOfStock : dictionary.store.addToCart}
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
                    {formatCurrency(item?.lineTotal || 0, STORE_CURRENCY, locale)}
                  </p>
                  {item.product.stock < item.quantity ? (
                    <p className="mt-2 text-xs font-medium text-rose-600">
                      {dictionary.store.cartStockWarning}
                    </p>
                  ) : null}
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
                      disabled={item.product.stock <= item.quantity}
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
              {formatCurrency(total, STORE_CURRENCY, locale)}
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="font-heading text-xl font-semibold text-brand-primary">
              {dictionary.store.deliveryTitle}
            </h3>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-brand-primary">
                {dictionary.store.deliveryName}
              </span>
              <input
                value={deliveryForm.contactName}
                onChange={(event) =>
                  setDeliveryForm((current) => ({
                    ...current,
                    contactName: event.target.value
                  }))
                }
                className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-accent"
                placeholder={dictionary.store.deliveryNamePlaceholder}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-brand-primary">
                {dictionary.store.deliveryPhone}
              </span>
              <input
                value={deliveryForm.phone}
                onChange={(event) =>
                  setDeliveryForm((current) => ({
                    ...current,
                    phone: event.target.value
                  }))
                }
                className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-accent"
                placeholder={dictionary.store.deliveryPhonePlaceholder}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-brand-primary">
                {dictionary.store.deliveryAddress}
              </span>
              <textarea
                value={deliveryForm.address}
                onChange={(event) =>
                  setDeliveryForm((current) => ({
                    ...current,
                    address: event.target.value
                  }))
                }
                className="min-h-24 w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-accent"
                placeholder={dictionary.store.deliveryAddressPlaceholder}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-brand-primary">
                {dictionary.store.deliveryNotes}
              </span>
              <textarea
                value={deliveryForm.notes}
                onChange={(event) =>
                  setDeliveryForm((current) => ({
                    ...current,
                    notes: event.target.value
                  }))
                }
                className="min-h-20 w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-accent"
                placeholder={dictionary.store.deliveryNotesPlaceholder}
              />
            </label>
          </div>
          <Button className="w-full" disabled={!items.length || hasCartStockIssue} onClick={handleCheckout}>
            {dictionary.store.checkout}
          </Button>
        </Card>
      </div>
    </section>
  );
}
