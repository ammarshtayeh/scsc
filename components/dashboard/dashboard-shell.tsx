"use client";

import { CheckCircle2, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  deleteEventAdmin,
  deleteProductAdmin,
  moderateArticleAdmin,
  updateOrderStatusAdmin,
  updateUserAdmin,
  upsertEventAdmin,
  upsertProductAdmin
} from "@/lib/firebase/functions";
import {
  translateArticleCategory,
  translateOrderStatus,
  translateProductCategory,
  translateRole
} from "@/lib/i18n/helpers";
import { formatCurrency, formatDateLong, formatDateTime, formatNumber } from "@/lib/utils";
import type {
  Article,
  DashboardStats,
  EventItem,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  Role,
  UserProfile
} from "@/types";

type Locale = "en" | "ar";

const productCategories: ProductCategory[] = ["Skin Care", "Body Care", "Makeup", "Masks"];
const orderStatuses: OrderStatus[] = ["pending", "confirmed", "processing", "delivered"];
const roles: Role[] = ["admin", "moderator", "user"];
const membershipStatuses: UserProfile["membershipStatus"][] = [
  "active",
  "expired",
  "pendingRenewal"
];

function splitLines(value: string) {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function DashboardShell({
  stats,
  events,
  products,
  users,
  orders,
  articles,
  locale,
  labels
}: {
  stats: DashboardStats;
  events: EventItem[];
  products: Product[];
  users: UserProfile[];
  orders: Order[];
  articles: Article[];
  locale: Locale;
  labels: {
    totalUsers: string;
    upcomingEvents: string;
    totalOrders: string;
    registeredCompanies: string;
    eventManagement: string;
    productManagement: string;
    userManagement: string;
    orders: string;
    moderation: string;
    addEvent: string;
    addProduct: string;
    edit: string;
    review: string;
    approved: string;
    pending: string;
    items: string;
  };
}) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    startsAt: "",
    venue: "",
    capacity: "40",
    coverImage: "",
    excerpt: "",
    description: "",
    tags: ""
  });
  const [productForm, setProductForm] = useState({
    name: "",
    price: "10",
    memberPrice: "9",
    stock: "10",
    category: "Skin Care" as ProductCategory,
    company: "",
    image: "",
    description: "",
    longDescription: ""
  });

  const statCards = useMemo(
    () => [
      { label: labels.totalUsers, value: stats.totalUsers },
      { label: labels.upcomingEvents, value: stats.upcomingEvents },
      { label: labels.totalOrders, value: stats.totalOrders },
      { label: labels.registeredCompanies, value: stats.registeredCompanies }
    ],
    [labels, stats]
  );

  async function runAction(name: string, action: () => Promise<unknown>) {
    try {
      setLoadingAction(name);
      await action();
      pushToast("Saved successfully.", "success");
      router.refresh();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Action failed.", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.32fr_0.68fr]">
        <Sidebar />

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <Card key={card.label}>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="mt-3 font-heading text-4xl font-bold text-brand-primary">
                  {formatNumber(card.value, locale)}
                </p>
              </Card>
            ))}
          </div>

          <Card id="events" className="space-y-5">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {labels.eventManagement}
            </h2>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void runAction("create-event", () =>
                  upsertEventAdmin({
                    title: eventForm.title,
                    startsAt: eventForm.startsAt,
                    venue: eventForm.venue,
                    capacity: Number(eventForm.capacity),
                    coverImage: eventForm.coverImage,
                    excerpt: eventForm.excerpt,
                    description: splitLines(eventForm.description),
                    tags: splitCsv(eventForm.tags),
                    registeredCount: 0
                  })
                );
              }}
            >
              <input required placeholder="Event title" value={eventForm.title} onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))} className="rounded-xl border border-brand-primary/10 px-4 py-3" />
              <input required type="datetime-local" value={eventForm.startsAt} onChange={(event) => setEventForm((current) => ({ ...current, startsAt: event.target.value }))} className="rounded-xl border border-brand-primary/10 px-4 py-3" />
              <input placeholder="Venue" value={eventForm.venue} onChange={(event) => setEventForm((current) => ({ ...current, venue: event.target.value }))} className="rounded-xl border border-brand-primary/10 px-4 py-3" />
              <input required type="number" min={1} placeholder="Capacity" value={eventForm.capacity} onChange={(event) => setEventForm((current) => ({ ...current, capacity: event.target.value }))} className="rounded-xl border border-brand-primary/10 px-4 py-3" />
              <input placeholder="Cover image URL" value={eventForm.coverImage} onChange={(event) => setEventForm((current) => ({ ...current, coverImage: event.target.value }))} className="rounded-xl border border-brand-primary/10 px-4 py-3 md:col-span-2" />
              <textarea placeholder="Short description" value={eventForm.excerpt} onChange={(event) => setEventForm((current) => ({ ...current, excerpt: event.target.value }))} className="min-h-24 rounded-xl border border-brand-primary/10 px-4 py-3 md:col-span-2" />
              <textarea placeholder="Full description, one paragraph per line" value={eventForm.description} onChange={(event) => setEventForm((current) => ({ ...current, description: event.target.value }))} className="min-h-24 rounded-xl border border-brand-primary/10 px-4 py-3 md:col-span-2" />
              <input placeholder="Tags separated by comma" value={eventForm.tags} onChange={(event) => setEventForm((current) => ({ ...current, tags: event.target.value }))} className="rounded-xl border border-brand-primary/10 px-4 py-3 md:col-span-2" />
              <Button loading={loadingAction === "create-event"} type="submit" className="md:col-span-2">
                <Save className="h-4 w-4" />
                {labels.addEvent}
              </Button>
            </form>

            <div className="grid gap-4">
              {events.map((event) => (
                <div key={event.id} className="rounded-2xl border border-brand-primary/10 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-brand-primary">{event.title}</p>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(event.startsAt, locale)} - {event.venue}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge>
                        {formatNumber(event.registeredCount, locale)}/{formatNumber(event.capacity, locale)}
                      </Badge>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={loadingAction === `delete-event-${event.id}`}
                        onClick={() => runAction(`delete-event-${event.id}`, () => deleteEventAdmin(event.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card id="products" className="space-y-5">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {labels.productManagement}
            </h2>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void runAction("create-product", () =>
                  upsertProductAdmin({
                    name: productForm.name,
                    price: Number(productForm.price),
                    memberPrice: Number(productForm.memberPrice),
                    stock: Number(productForm.stock),
                    category: productForm.category,
                    company: productForm.company,
                    images: productForm.image ? [productForm.image] : [],
                    description: productForm.description,
                    longDescription: splitLines(productForm.longDescription)
                  })
                );
              }}
            >
              <input required placeholder="Product name" value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} className="rounded-xl border border-brand-primary/10 px-4 py-3" />
              <input placeholder="Company" value={productForm.company} onChange={(event) => setProductForm((current) => ({ ...current, company: event.target.value }))} className="rounded-xl border border-brand-primary/10 px-4 py-3" />
              <select value={productForm.category} onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value as ProductCategory }))} className="rounded-xl border border-brand-primary/10 px-4 py-3">
                {productCategories.map((entry) => (
                  <option key={entry} value={entry}>
                    {translateProductCategory(entry, locale)}
                  </option>
                ))}
              </select>
              <input required type="number" min={0} value={productForm.stock} onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))} className="rounded-xl border border-brand-primary/10 px-4 py-3" />
              <input required type="number" min={0.01} step="0.01" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} className="rounded-xl border border-brand-primary/10 px-4 py-3" />
              <input type="number" min={0.01} step="0.01" value={productForm.memberPrice} onChange={(event) => setProductForm((current) => ({ ...current, memberPrice: event.target.value }))} className="rounded-xl border border-brand-primary/10 px-4 py-3" />
              <input placeholder="Image URL" value={productForm.image} onChange={(event) => setProductForm((current) => ({ ...current, image: event.target.value }))} className="rounded-xl border border-brand-primary/10 px-4 py-3 md:col-span-2" />
              <textarea placeholder="Short description" value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} className="min-h-24 rounded-xl border border-brand-primary/10 px-4 py-3 md:col-span-2" />
              <textarea placeholder="Long description, one paragraph per line" value={productForm.longDescription} onChange={(event) => setProductForm((current) => ({ ...current, longDescription: event.target.value }))} className="min-h-24 rounded-xl border border-brand-primary/10 px-4 py-3 md:col-span-2" />
              <Button loading={loadingAction === "create-product"} type="submit" className="md:col-span-2">
                <Save className="h-4 w-4" />
                {labels.addProduct}
              </Button>
            </form>

            <div className="grid gap-4">
              {products.map((product) => (
                <div key={product.id} className="flex flex-col gap-3 rounded-2xl border border-brand-primary/10 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-brand-primary">{product.name}</p>
                    <p className="text-sm text-slate-500">
                      {product.company} - {translateProductCategory(product.category, locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge>
                      {formatNumber(product.stock, locale)}
                    </Badge>
                    <span className="text-sm font-medium text-brand-primary">
                      {formatCurrency(product.memberPrice ?? product.price, "USD", locale)}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={loadingAction === `delete-product-${product.id}`}
                      onClick={() => runAction(`delete-product-${product.id}`, () => deleteProductAdmin(product.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card id="users" className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {labels.userManagement}
            </h2>
            <div className="grid gap-4">
              {users.map((entry) => (
                <div key={entry.id} className="grid gap-3 rounded-2xl border border-brand-primary/10 p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                  <div>
                    <p className="font-medium text-brand-primary">{entry.displayName}</p>
                    <p className="text-sm text-slate-500">{entry.email}</p>
                  </div>
                  <select defaultValue={entry.role} id={`role-${entry.id}`} className="rounded-xl border border-brand-primary/10 px-3 py-2">
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {translateRole(role, locale)}
                      </option>
                    ))}
                  </select>
                  <select defaultValue={entry.membershipStatus} id={`status-${entry.id}`} className="rounded-xl border border-brand-primary/10 px-3 py-2">
                    {membershipStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={loadingAction === `user-${entry.id}`}
                    onClick={() => {
                      const role = (document.getElementById(`role-${entry.id}`) as HTMLSelectElement).value as Role;
                      const membershipStatus = (document.getElementById(`status-${entry.id}`) as HTMLSelectElement).value as UserProfile["membershipStatus"];
                      void runAction(`user-${entry.id}`, () =>
                        updateUserAdmin({
                          uid: entry.id,
                          role,
                          membershipStatus
                        })
                      );
                    }}
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card id="orders" className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {labels.orders}
            </h2>
            <div className="grid gap-4">
              {orders.map((order) => (
                <div key={order.id} className="grid gap-3 rounded-2xl border border-brand-primary/10 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <p className="font-medium text-brand-primary">{order.id}</p>
                    <p className="text-sm text-slate-500">
                      {formatDateLong(order.createdAt, locale)} - {formatNumber(order.items.length, locale)} {labels.items}
                    </p>
                  </div>
                  <select defaultValue={order.status} id={`order-${order.id}`} className="rounded-xl border border-brand-primary/10 px-3 py-2">
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {translateOrderStatus(status, locale)}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={loadingAction === `order-${order.id}`}
                    onClick={() => {
                      const status = (document.getElementById(`order-${order.id}`) as HTMLSelectElement).value as OrderStatus;
                      void runAction(`order-${order.id}`, () =>
                        updateOrderStatusAdmin({
                          id: order.id,
                          status
                        })
                      );
                    }}
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card id="moderation" className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {labels.moderation}
            </h2>
            <div className="grid gap-4">
              {articles.map((article) => (
                <div key={article.id} className="flex flex-col gap-3 rounded-2xl border border-brand-primary/10 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-brand-primary">{article.title}</p>
                    <p className="text-sm text-slate-500">
                      {translateArticleCategory(article.category, locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge>{article.approved ? labels.approved : labels.pending}</Badge>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={loadingAction === `article-${article.id}`}
                      onClick={() =>
                        runAction(`article-${article.id}`, () =>
                          moderateArticleAdmin({
                            id: article.id,
                            approved: !article.approved
                          })
                        )
                      }
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {article.approved ? "Reject" : "Approve"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
