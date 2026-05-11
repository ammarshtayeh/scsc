"use client";

import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { STORE_CURRENCY } from "@/lib/constants";
import { db } from "@/lib/firebase/firebase";
import { translateOrderStatus } from "@/lib/i18n/helpers";
import { formatCurrency, formatDateLong, formatNumber } from "@/lib/utils";
import type { Order } from "@/types";

function normalizeDateValue(value: unknown, fallback = new Date().toISOString()) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return fallback;
}

function normalizeOrder(id: string, data: Record<string, unknown>): Order {
  const deliveryInfo =
    typeof data.deliveryInfo === "object" && data.deliveryInfo !== null
      ? (data.deliveryInfo as Order["deliveryInfo"])
      : undefined;

  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    createdAt: normalizeDateValue(data.createdAt),
    status: (data.status as Order["status"]) || "pending",
    subtotal: typeof data.subtotal === "number" ? data.subtotal : 0,
    discount: typeof data.discount === "number" ? data.discount : 0,
    total: typeof data.total === "number" ? data.total : 0,
    items: Array.isArray(data.items) ? (data.items as Order["items"]) : [],
    deliveryInfo
  };
}

export function OrderDetailShell({ orderId }: { orderId: string }) {
  const { user, loading: authLoading } = useAuth();
  const { dictionary, locale } = useLocale();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (authLoading) {
        return;
      }

      if (!user || !db) {
        setLoading(false);
        return;
      }

      const snapshot = await getDoc(doc(db, "orders", orderId));
      if (!snapshot.exists()) {
        setOrder(null);
        setLoading(false);
        return;
      }

      const nextOrder = normalizeOrder(snapshot.id, snapshot.data() as Record<string, unknown>);
      setOrder(nextOrder.userId === user.id ? nextOrder : null);
      setLoading(false);
    }

    void loadOrder();
  }, [authLoading, orderId, user]);

  if (loading || authLoading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>{dictionary.profile.loadingProfile}</Card>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="space-y-4">
          <p className="text-sm text-slate-600">{dictionary.common.noData}</p>
          <Link href="/profile">
            <Button variant="secondary">{dictionary.profile.backToDashboard}</Button>
          </Link>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">{formatDateLong(order.createdAt, locale)}</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold text-brand-primary">
                {order.id}
              </h2>
            </div>
            <Badge>{translateOrderStatus(order.status, locale)}</Badge>
          </div>

          <div className="grid gap-3">
            {order.items.map((item) => (
              <div
                key={item.productId}
                className="grid gap-2 rounded-2xl border border-brand-primary/10 p-4 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-medium text-brand-primary">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatNumber(item.quantity, locale)} x {formatCurrency(item.price, STORE_CURRENCY, locale)}
                  </p>
                </div>
                <p className="font-medium text-brand-primary">
                  {formatCurrency(item.price * item.quantity, STORE_CURRENCY, locale)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-brand-primary">
              {dictionary.store.estimatedTotal}
            </h2>
            <div className="grid gap-2 text-sm text-slate-600">
              <p>{dictionary.store.subtotal}: {formatCurrency(order.subtotal, STORE_CURRENCY, locale)}</p>
              <p>{dictionary.store.discount}: {formatCurrency(order.discount, STORE_CURRENCY, locale)}</p>
              <p className="text-lg font-semibold text-brand-primary">
                {dictionary.store.total}: {formatCurrency(order.total, STORE_CURRENCY, locale)}
              </p>
            </div>
          </Card>

          {order.deliveryInfo ? (
            <Card className="space-y-3">
              <h2 className="font-heading text-xl font-semibold text-brand-primary">
                {dictionary.store.deliveryTitle}
              </h2>
              <div className="grid gap-2 text-sm text-slate-600">
                <p>{dictionary.store.deliveryName}: {order.deliveryInfo.contactName}</p>
                <p>{dictionary.store.deliveryPhone}: {order.deliveryInfo.phone}</p>
                <p>{dictionary.store.deliveryAddress}: {order.deliveryInfo.address}</p>
                {order.deliveryInfo.notes ? (
                  <p>{dictionary.store.deliveryNotes}: {order.deliveryInfo.notes}</p>
                ) : null}
              </div>
            </Card>
          ) : null}

          <Link href="/profile" className="block">
            <Button variant="secondary" className="w-full">
              {dictionary.profile.backToDashboard}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
