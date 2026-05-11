"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  ImageUp,
  LinkIcon,
  Package,
  Save,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserCog,
  Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  deleteEventAdmin,
  deleteArticleAdmin,
  deleteBoardMemberAdmin,
  deleteOrderAdmin,
  deleteProductAdmin,
  deleteUserAdmin,
  moderateArticleAdmin,
  removeEventRegistrationAdmin,
  setEventRegistrationCheckInAdmin,
  updateOrderStatusAdmin,
  updateUserAdmin,
  upsertArticleAdmin,
  upsertBoardMemberAdmin,
  upsertEventAdmin,
  upsertProductAdmin
} from "@/lib/firebase/functions";
import { uploadFileToStorage } from "@/lib/firebase/storage";
import {
  translateArticleCategory,
  translateMembershipStatus,
  translateOrderStatus,
  translateProductCategory,
  translateRole
} from "@/lib/i18n/helpers";
import { formatCurrency, formatDateLong, formatDateTime, formatNumber } from "@/lib/utils";
import type {
  Article,
  ArticleCategory,
  BoardMember,
  DashboardStats,
  EventRegistration,
  EventItem,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  Role,
  UserProfile
} from "@/types";

type Locale = "en" | "ar";
export type DashboardSection =
  | "overview"
  | "events"
  | "registrants"
  | "products"
  | "board-members"
  | "users"
  | "orders"
  | "moderation";

const productCategories: ProductCategory[] = ["Skin Care", "Body Care", "Makeup", "Masks"];
const articleCategories: ArticleCategory[] = ["Skin Care", "Makeup", "Hair Care", "Others"];
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

function toInputDateTime(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16);
  }

  return date.toISOString().slice(0, 16);
}

function getText(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function getCsvData(filename: string, rows: Record<string, unknown>[]) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function parseReferences(value: string) {
  return value
    .split("\n")
    .map((line) => {
      const [label, ...urlParts] = line.split("|");
      return {
        label: label?.trim() || "",
        url: urlParts.join("|").trim()
      };
    })
    .filter((entry) => entry.label && entry.url);
}

function referencesToText(article: Article) {
  return (article.references || [])
    .map((reference) => `${reference.label} | ${reference.url}`)
    .join("\n");
}

function cleanFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadDashboardImage(folder: "events" | "products", file: File) {
  const safeName = cleanFileName(file.name) || "image";
  const extension = safeName.includes(".") ? "" : ".jpg";
  return uploadFileToStorage(
    `images/${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}${extension}`,
    file
  );
}

const dashboardFieldClass =
  "w-full rounded-xl border border-brand-primary/10 px-4 py-3 text-sm outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 dark:border-white/12 dark:bg-[#101a2b] dark:text-brand-ink dark:placeholder:text-brand-mist/70";

const dashboardTextAreaClass = `${dashboardFieldClass} min-h-24`;

const dashboardLabelClass =
  "block space-y-2 text-sm font-semibold text-brand-primary dark:text-brand-ink";

const dashboardEditFieldClass =
  "rounded-xl border border-brand-primary/10 bg-white px-4 py-3 text-sm text-brand-primary outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 dark:border-white/12 dark:bg-[#101a2b] dark:text-brand-ink dark:placeholder:text-brand-mist/70";

const dashboardEditTextAreaClass = `${dashboardEditFieldClass} min-h-20`;

const dashboardPanelClass =
  "rounded-2xl border border-brand-primary/10 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5";

const dashboardSubtlePanelClass =
  "rounded-xl bg-brand-sky/60 p-4 dark:bg-white/10";

const dashboardMutedTextClass = "text-slate-500 dark:text-brand-mist";

function DashboardFieldLabel({
  children,
  className = "",
  label
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={`${dashboardLabelClass} ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function DashboardShell({
  stats,
  events,
  products,
  users,
  orders,
  articles,
  boardMembers,
  eventRegistrations,
  locale,
  labels,
  mode = "admin",
  activeSection = "overview"
}: {
  stats: DashboardStats;
  events: EventItem[];
  products: Product[];
  users: UserProfile[];
  orders: Order[];
  articles: Article[];
  boardMembers: BoardMember[];
  eventRegistrations: EventRegistration[];
  locale: Locale;
  mode?: "admin" | "moderator";
  activeSection?: DashboardSection;
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
    save: string;
    delete: string;
    approve: string;
    reject: string;
    actionSaved: string;
    actionFailed: string;
    eventTitlePlaceholder: string;
    eventVenuePlaceholder: string;
    eventCapacityPlaceholder: string;
    eventCoverImagePlaceholder: string;
    eventExcerptPlaceholder: string;
    eventDescriptionPlaceholder: string;
    eventTagsPlaceholder: string;
    productNamePlaceholder: string;
    productCompanyPlaceholder: string;
    productImagePlaceholder: string;
    productDescriptionPlaceholder: string;
    productLongDescriptionPlaceholder: string;
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
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
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
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const imageLabels =
    locale === "ar"
      ? {
          url: "رابط الصورة",
          upload: "رفع صورة",
          uploadMany: "رفع صور",
          eventHint: "يمكنك وضع رابط صورة أو رفع صورة من جهازك.",
          productHint: "يمكنك وضع رابط صورة أو رفع صورة واحدة أو عدة صور من جهازك.",
          selected: "تم اختيار"
        }
      : {
          url: "Image URL",
          upload: "Upload image",
          uploadMany: "Upload images",
          eventHint: "Use an image URL or upload one from your device.",
          productHint: "Use an image URL or upload one or more images from your device.",
          selected: "Selected"
        };
  const orderDetailLabels =
    locale === "ar"
      ? {
          orderItems: "عناصر الطلب",
          delivery: "بيانات التوصيل",
          subtotal: "المجموع الفرعي",
          discount: "الخصم",
          total: "الإجمالي",
          recipient: "المستلم",
          phone: "الهاتف",
          address: "العنوان",
          notes: "ملاحظات",
          noDelivery: "لا توجد بيانات توصيل"
        }
      : {
          orderItems: "Order items",
          delivery: "Delivery details",
          subtotal: "Subtotal",
          discount: "Discount",
          total: "Total",
          recipient: "Recipient",
          phone: "Phone",
          address: "Address",
          notes: "Notes",
          noDelivery: "No delivery details"
        };
  const showManagementSections = mode === "admin";
  const showOverview = showManagementSections && activeSection === "overview";
  const showModerationSection = mode === "moderator" || activeSection === "moderation";
  const showAdminSection = (section: DashboardSection) =>
    showManagementSections && activeSection === section;
  const adminLabels =
    locale === "ar"
      ? {
          edit: "تعديل",
          saveChanges: "حفظ التعديلات",
          cleanupDelete: "حذف مع تنظيف التسجيلات",
          registrants: "مسجلو الفعاليات",
          exportCsv: "تصدير CSV",
          checkIn: "تسجيل حضور",
          undoCheckIn: "إلغاء الحضور",
          removeRegistration: "إزالة التسجيل",
          boardMembers: "إدارة الهيئة الإدارية",
          addBoardMember: "إضافة عضو هيئة",
          articles: "إنشاء وتعديل المقالات",
          addArticle: "إضافة مقال",
          references: "المراجع: مرجع ورابط في كل سطر",
          featured: "مميز",
          approved: "معتمد",
          image: "رابط الصورة",
          author: "الكاتب",
          year: "السنة",
          role: "المنصب",
          bio: "نبذة"
        }
      : {
          edit: "Edit",
          saveChanges: "Save changes",
          cleanupDelete: "Delete and clean registrations",
          registrants: "Event registrants",
          exportCsv: "Export CSV",
          checkIn: "Check in",
          undoCheckIn: "Undo check-in",
          removeRegistration: "Remove registration",
          boardMembers: "Board members",
          addBoardMember: "Add board member",
          articles: "Create and edit articles",
          addArticle: "Add article",
          references: "References: one label and URL per line",
          featured: "Featured",
          approved: "Approved",
          image: "Image URL",
          author: "Author",
          year: "Year",
          role: "Role",
          bio: "Bio"
        };
  const registrationsByEvent = useMemo(() => {
    return eventRegistrations.reduce<Record<string, EventRegistration[]>>((acc, registration) => {
      acc[registration.eventId] = acc[registration.eventId]
        ? [...acc[registration.eventId], registration]
        : [registration];
      return acc;
    }, {});
  }, [eventRegistrations]);

  const statCards = useMemo(
    () => [
      { label: labels.totalUsers, value: stats.totalUsers, icon: Users },
      { label: labels.upcomingEvents, value: stats.upcomingEvents, icon: CalendarDays },
      { label: labels.totalOrders, value: stats.totalOrders, icon: ShoppingBag },
      { label: labels.registeredCompanies, value: stats.registeredCompanies, icon: ShieldCheck }
    ],
    [labels, stats]
  );

  const managementCards = useMemo(
    () => [
      {
        href: "/admin/products",
        title: labels.productManagement,
        metric: products.length,
        icon: Package
      },
      {
        href: "/admin/events",
        title: labels.eventManagement,
        metric: events.length,
        icon: CalendarDays
      },
      {
        href: "/admin/users",
        title: labels.userManagement,
        metric: users.length,
        icon: UserCog
      },
      {
        href: "/admin/orders",
        title: labels.orders,
        metric: orders.length,
        icon: ClipboardList
      },
      {
        href: "/admin/board-members",
        title: adminLabels.boardMembers,
        metric: boardMembers.length,
        icon: Users
      },
      {
        href: "/admin/moderation",
        title: labels.moderation,
        metric: articles.filter((article) => !article.approved).length,
        icon: CheckCircle2
      }
    ],
    [
      adminLabels.boardMembers,
      articles,
      boardMembers,
      events,
      labels,
      orders,
      products,
      users
    ]
  );

  async function runAction(name: string, action: () => Promise<unknown>) {
    try {
      setLoadingAction(name);
      await action();
      pushToast(labels.actionSaved, "success");
      router.refresh();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : labels.actionFailed, "error");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.32fr_0.68fr]">
        <Sidebar />

        <div className="space-y-6">
          {showOverview ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Card key={card.label} className="dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-4">
                        <p className={`text-sm ${dashboardMutedTextClass}`}>{card.label}</p>
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-primary text-white dark:bg-brand-accent">
                          <Icon className="h-5 w-5" />
                        </span>
                      </div>
                      <p className="mt-4 font-heading text-4xl font-bold text-brand-primary">
                        {formatNumber(card.value, locale)}
                      </p>
                    </Card>
                  );
                })}
              </div>

              <Card className="space-y-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                      {locale === "ar" ? "مركز الإدارة" : "Management center"}
                    </h2>
                    <p className={`mt-2 text-sm ${dashboardMutedTextClass}`}>
                      {locale === "ar"
                        ? "اختصارات مباشرة لإدارة المنتجات، المستخدمين، الفعاليات، الطلبات، والهيئة الإدارية."
                        : "Fast access to products, users, events, orders, board members, and moderation."}
                    </p>
                  </div>
                  <Badge>{locale === "ar" ? "صلاحيات كاملة" : "Full admin controls"}</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {managementCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <Link
                        key={card.href}
                        href={card.href}
                        className="group rounded-2xl border border-brand-primary/10 bg-brand-sky/55 p-4 transition hover:-translate-y-0.5 hover:border-brand-accent hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:border-brand-accent dark:hover:bg-white/15"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-primary shadow-sm dark:bg-[#101a2b] dark:text-brand-ink">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="font-heading text-2xl font-bold text-brand-primary">
                            {formatNumber(card.metric, locale)}
                          </span>
                        </div>
                        <p className="mt-4 text-sm font-semibold text-brand-primary">{card.title}</p>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            </>
          ) : null}

          {showAdminSection("events") ? (
          <Card id="events" className="space-y-5">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {labels.eventManagement}
            </h2>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void runAction("create-event", async () => {
                  const uploadedCoverImage = eventImageFile
                    ? await uploadDashboardImage("events", eventImageFile)
                    : "";

                  await upsertEventAdmin({
                    title: eventForm.title,
                    startsAt: eventForm.startsAt,
                    venue: eventForm.venue,
                    capacity: Number(eventForm.capacity),
                    coverImage: uploadedCoverImage || eventForm.coverImage,
                    excerpt: eventForm.excerpt,
                    description: splitLines(eventForm.description),
                    tags: splitCsv(eventForm.tags),
                    registeredCount: 0
                  });
                  setEventImageFile(null);
                });
              }}
            >
              <DashboardFieldLabel label={labels.eventTitlePlaceholder}>
                <input required placeholder={labels.eventTitlePlaceholder} value={eventForm.title} onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={locale === "ar" ? "تاريخ ووقت الفعالية" : "Event date and time"}>
                <input required type="datetime-local" value={eventForm.startsAt} onChange={(event) => setEventForm((current) => ({ ...current, startsAt: event.target.value }))} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={labels.eventVenuePlaceholder}>
                <input placeholder={labels.eventVenuePlaceholder} value={eventForm.venue} onChange={(event) => setEventForm((current) => ({ ...current, venue: event.target.value }))} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={labels.eventCapacityPlaceholder}>
                <input required type="number" min={1} placeholder={labels.eventCapacityPlaceholder} value={eventForm.capacity} onChange={(event) => setEventForm((current) => ({ ...current, capacity: event.target.value }))} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    <LinkIcon className="h-4 w-4" />
                    {imageLabels.url}
                  </span>
                  <input placeholder={labels.eventCoverImagePlaceholder} value={eventForm.coverImage} onChange={(event) => setEventForm((current) => ({ ...current, coverImage: event.target.value }))} className={dashboardFieldClass} />
                </label>
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    <ImageUp className="h-4 w-4" />
                    {imageLabels.upload}
                  </span>
                  <input type="file" accept="image/*" onChange={(event) => setEventImageFile(event.target.files?.[0] || null)} className={dashboardFieldClass} />
                </label>
                <p className="text-xs leading-5 text-slate-500 md:col-span-2">
                  {imageLabels.eventHint}
                  {eventImageFile ? ` ${imageLabels.selected}: ${eventImageFile.name}` : ""}
                </p>
              </div>
              <DashboardFieldLabel label={labels.eventExcerptPlaceholder} className="md:col-span-2">
                <textarea placeholder={labels.eventExcerptPlaceholder} value={eventForm.excerpt} onChange={(event) => setEventForm((current) => ({ ...current, excerpt: event.target.value }))} className={dashboardTextAreaClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={labels.eventDescriptionPlaceholder} className="md:col-span-2">
                <textarea placeholder={labels.eventDescriptionPlaceholder} value={eventForm.description} onChange={(event) => setEventForm((current) => ({ ...current, description: event.target.value }))} className={dashboardTextAreaClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={labels.eventTagsPlaceholder} className="md:col-span-2">
                <input placeholder={labels.eventTagsPlaceholder} value={eventForm.tags} onChange={(event) => setEventForm((current) => ({ ...current, tags: event.target.value }))} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <Button loading={loadingAction === "create-event"} type="submit" className="md:col-span-2">
                <Save className="h-4 w-4" />
                {labels.addEvent}
              </Button>
            </form>

            <div className="grid gap-4">
              {events.map((event) => (
                <div key={event.id} className={dashboardPanelClass}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-brand-primary">{event.title}</p>
                      <p className={`text-sm ${dashboardMutedTextClass}`}>
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
                        onClick={() => {
                          if (event.registeredCount > 0) {
                            window.alert("This event has registrations and cannot be deleted safely.");
                            return;
                          }

                          void runAction(`delete-event-${event.id}`, () => deleteEventAdmin(event.id));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        {labels.delete}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={loadingAction === `cleanup-delete-event-${event.id}`}
                        onClick={() => {
                          if (!window.confirm("Delete this event and remove all registrations?")) {
                            return;
                          }

                          void runAction(`cleanup-delete-event-${event.id}`, () =>
                            deleteEventAdmin(event.id, true)
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        {adminLabels.cleanupDelete}
                      </Button>
                    </div>
                  </div>
                  <details className={`mt-4 ${dashboardSubtlePanelClass}`}>
                    <summary className="cursor-pointer text-sm font-semibold text-brand-primary">
                      {adminLabels.edit}
                    </summary>
                    <form
                      className="mt-4 grid gap-3 md:grid-cols-2"
                      onSubmit={(submitEvent) => {
                        submitEvent.preventDefault();
                        const formData = new FormData(submitEvent.currentTarget);
                        void runAction(`edit-event-${event.id}`, () =>
                          upsertEventAdmin({
                            id: event.id,
                            title: getText(formData, "title"),
                            startsAt: getText(formData, "startsAt"),
                            venue: getText(formData, "venue"),
                            capacity: getNumber(formData, "capacity", event.capacity),
                            coverImage: getText(formData, "coverImage"),
                            excerpt: getText(formData, "excerpt"),
                            description: splitLines(getText(formData, "description")),
                            tags: splitCsv(getText(formData, "tags")),
                            registeredCount: event.registeredCount,
                            isFeatured: formData.get("isFeatured") === "on"
                          })
                        );
                      }}
                    >
                      <input name="title" required defaultValue={event.title} className={dashboardEditFieldClass} />
                      <input name="startsAt" required type="datetime-local" defaultValue={toInputDateTime(event.startsAt)} className={dashboardEditFieldClass} />
                      <input name="venue" defaultValue={event.venue} className={dashboardEditFieldClass} />
                      <input name="capacity" required type="number" min={1} defaultValue={event.capacity} className={dashboardEditFieldClass} />
                      <input name="coverImage" defaultValue={event.coverImage} className={`${dashboardEditFieldClass} md:col-span-2`} />
                      <textarea name="excerpt" defaultValue={event.excerpt} className={`${dashboardEditTextAreaClass} md:col-span-2`} />
                      <textarea name="description" defaultValue={event.description.join("\n")} className={`${dashboardEditFieldClass} min-h-24 md:col-span-2`} />
                      <input name="tags" defaultValue={event.tags.join(", ")} className={`${dashboardEditFieldClass} md:col-span-2`} />
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input name="isFeatured" type="checkbox" defaultChecked={Boolean(event.isFeatured)} />
                        {adminLabels.featured}
                      </label>
                      <Button loading={loadingAction === `edit-event-${event.id}`} type="submit">
                        <Save className="h-4 w-4" />
                        {adminLabels.saveChanges}
                      </Button>
                    </form>
                  </details>
                </div>
              ))}
            </div>
          </Card>
          ) : null}

          {showAdminSection("registrants") ? (
          <Card id="registrants" className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                {adminLabels.registrants}
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  getCsvData(
                    "event-registrations.csv",
                    eventRegistrations.map((registration) => ({
                      eventId: registration.eventId,
                      eventTitle: events.find((event) => event.id === registration.eventId)?.title || "",
                      userId: registration.userId,
                      name: registration.displayName || "",
                      email: registration.email || "",
                      registeredAt: registration.registeredAt || "",
                      checkedInAt: registration.checkedInAt || ""
                    }))
                  )
                }
              >
                <Download className="h-4 w-4" />
                {adminLabels.exportCsv}
              </Button>
            </div>
            <div className="grid gap-4">
              {events.map((event) => {
                const registrations = registrationsByEvent[event.id] || [];
                return (
                  <details key={event.id} className={dashboardPanelClass}>
                    <summary className="cursor-pointer font-medium text-brand-primary">
                      {event.title} ({formatNumber(registrations.length, locale)})
                    </summary>
                    <div className="mt-4 grid gap-3">
                      {registrations.length ? (
                        registrations.map((registration) => (
                          <div key={`${registration.eventId}-${registration.userId}`} className="grid gap-3 rounded-xl bg-brand-sky/50 p-3 dark:bg-white/10 md:grid-cols-[1fr_auto_auto] md:items-center">
                            <div className="text-sm">
                              <p className="font-medium text-brand-primary">
                                {registration.displayName || registration.userId}
                              </p>
                              <p className={dashboardMutedTextClass}>{registration.email || registration.userId}</p>
                              {registration.checkedInAt ? (
                                <p className="text-emerald-700">
                                  {adminLabels.checkIn}: {formatDateTime(registration.checkedInAt, locale)}
                                </p>
                              ) : null}
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              loading={loadingAction === `check-in-${registration.eventId}-${registration.userId}`}
                              onClick={() =>
                                runAction(`check-in-${registration.eventId}-${registration.userId}`, () =>
                                  setEventRegistrationCheckInAdmin({
                                    eventId: registration.eventId,
                                    userId: registration.userId,
                                    checkedIn: !registration.checkedInAt
                                  })
                                )
                              }
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {registration.checkedInAt ? adminLabels.undoCheckIn : adminLabels.checkIn}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              loading={loadingAction === `remove-registration-${registration.eventId}-${registration.userId}`}
                              onClick={() => {
                                if (!window.confirm("Remove this registration?")) {
                                  return;
                                }

                                void runAction(`remove-registration-${registration.eventId}-${registration.userId}`, () =>
                                  removeEventRegistrationAdmin({
                                    eventId: registration.eventId,
                                    userId: registration.userId
                                  })
                                );
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              {adminLabels.removeRegistration}
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No registrations yet.</p>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </Card>
          ) : null}

          {showAdminSection("products") ? (
          <Card id="products" className="space-y-5">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {labels.productManagement}
            </h2>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void runAction("create-product", async () => {
                  const uploadedImages = await Promise.all(
                    productImageFiles.map((file) => uploadDashboardImage("products", file))
                  );
                  const images = [...(productForm.image ? [productForm.image] : []), ...uploadedImages];

                  await upsertProductAdmin({
                    name: productForm.name,
                    price: Number(productForm.price),
                    memberPrice: Number(productForm.memberPrice),
                    stock: Number(productForm.stock),
                    category: productForm.category,
                    company: productForm.company,
                    images,
                    description: productForm.description,
                    longDescription: splitLines(productForm.longDescription)
                  });
                  setProductImageFiles([]);
                });
              }}
            >
              <DashboardFieldLabel label={labels.productNamePlaceholder}>
                <input required placeholder={labels.productNamePlaceholder} value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={labels.productCompanyPlaceholder}>
                <input placeholder={labels.productCompanyPlaceholder} value={productForm.company} onChange={(event) => setProductForm((current) => ({ ...current, company: event.target.value }))} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={locale === "ar" ? "تصنيف المنتج" : "Product category"}>
                <select value={productForm.category} onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value as ProductCategory }))} className={dashboardFieldClass}>
                  {productCategories.map((entry) => (
                    <option key={entry} value={entry}>
                      {translateProductCategory(entry, locale)}
                    </option>
                  ))}
                </select>
              </DashboardFieldLabel>
              <DashboardFieldLabel label={locale === "ar" ? "كمية المخزون" : "Stock quantity"}>
                <input required type="number" min={0} value={productForm.stock} onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={locale === "ar" ? "السعر الأساسي" : "Base price"}>
                <input required type="number" min={0.01} step="0.01" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={locale === "ar" ? "سعر الأعضاء" : "Member price"}>
                <input type="number" min={0.01} step="0.01" value={productForm.memberPrice} onChange={(event) => setProductForm((current) => ({ ...current, memberPrice: event.target.value }))} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    <LinkIcon className="h-4 w-4" />
                    {imageLabels.url}
                  </span>
                  <input placeholder={labels.productImagePlaceholder} value={productForm.image} onChange={(event) => setProductForm((current) => ({ ...current, image: event.target.value }))} className={dashboardFieldClass} />
                </label>
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    <ImageUp className="h-4 w-4" />
                    {imageLabels.uploadMany}
                  </span>
                  <input type="file" accept="image/*" multiple onChange={(event) => setProductImageFiles(Array.from(event.target.files || []))} className={dashboardFieldClass} />
                </label>
                <p className="text-xs leading-5 text-slate-500 md:col-span-2">
                  {imageLabels.productHint}
                  {productImageFiles.length
                    ? ` ${imageLabels.selected}: ${productImageFiles.map((file) => file.name).join(", ")}`
                    : ""}
                </p>
              </div>
              <DashboardFieldLabel label={labels.productDescriptionPlaceholder} className="md:col-span-2">
                <textarea placeholder={labels.productDescriptionPlaceholder} value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} className={dashboardTextAreaClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={labels.productLongDescriptionPlaceholder} className="md:col-span-2">
                <textarea placeholder={labels.productLongDescriptionPlaceholder} value={productForm.longDescription} onChange={(event) => setProductForm((current) => ({ ...current, longDescription: event.target.value }))} className={dashboardTextAreaClass} />
              </DashboardFieldLabel>
              <Button loading={loadingAction === "create-product"} type="submit" className="md:col-span-2">
                <Save className="h-4 w-4" />
                {labels.addProduct}
              </Button>
            </form>

            <div className="grid gap-4">
              {products.map((product) => (
                <div key={product.id} className={`${dashboardPanelClass} flex flex-col gap-3 md:flex-row md:items-center md:justify-between`}>
                  <div>
                    <p className="font-medium text-brand-primary">{product.name}</p>
                    <p className={`text-sm ${dashboardMutedTextClass}`}>
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
                      {labels.delete}
                    </Button>
                  </div>
                  <details className={`mt-2 md:col-span-2 ${dashboardSubtlePanelClass}`}>
                    <summary className="cursor-pointer text-sm font-semibold text-brand-primary">
                      {adminLabels.edit}
                    </summary>
                    <form
                      className="mt-4 grid gap-3 md:grid-cols-2"
                      onSubmit={(submitEvent) => {
                        submitEvent.preventDefault();
                        const formData = new FormData(submitEvent.currentTarget);
                        void runAction(`edit-product-${product.id}`, () =>
                          upsertProductAdmin({
                            id: product.id,
                            name: getText(formData, "name"),
                            price: getNumber(formData, "price", product.price),
                            memberPrice: getNumber(formData, "memberPrice", product.memberPrice ?? product.price),
                            stock: getNumber(formData, "stock", product.stock),
                            category: getText(formData, "category") as ProductCategory,
                            company: getText(formData, "company"),
                            images: splitLines(getText(formData, "images")),
                            description: getText(formData, "description"),
                            longDescription: splitLines(getText(formData, "longDescription")),
                            featured: formData.get("featured") === "on"
                          })
                        );
                      }}
                    >
                      <input name="name" required defaultValue={product.name} className={dashboardEditFieldClass} />
                      <input name="company" defaultValue={product.company} className={dashboardEditFieldClass} />
                      <select name="category" defaultValue={product.category} className={dashboardEditFieldClass}>
                        {productCategories.map((entry) => (
                          <option key={entry} value={entry}>
                            {translateProductCategory(entry, locale)}
                          </option>
                        ))}
                      </select>
                      <input name="stock" required type="number" min={0} defaultValue={product.stock} className={dashboardEditFieldClass} />
                      <input name="price" required type="number" min={0.01} step="0.01" defaultValue={product.price} className={dashboardEditFieldClass} />
                      <input name="memberPrice" type="number" min={0.01} step="0.01" defaultValue={product.memberPrice ?? product.price} className={dashboardEditFieldClass} />
                      <textarea name="images" defaultValue={product.images.join("\n")} className={`${dashboardEditTextAreaClass} md:col-span-2`} />
                      <textarea name="description" defaultValue={product.description} className={`${dashboardEditTextAreaClass} md:col-span-2`} />
                      <textarea name="longDescription" defaultValue={product.longDescription.join("\n")} className={`${dashboardEditFieldClass} min-h-24 md:col-span-2`} />
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input name="featured" type="checkbox" defaultChecked={Boolean(product.featured)} />
                        {adminLabels.featured}
                      </label>
                      <Button loading={loadingAction === `edit-product-${product.id}`} type="submit">
                        <Save className="h-4 w-4" />
                        {adminLabels.saveChanges}
                      </Button>
                    </form>
                  </details>
                </div>
              ))}
            </div>
          </Card>
          ) : null}

          {showAdminSection("board-members") ? (
          <Card id="board-members" className="space-y-5">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {adminLabels.boardMembers}
            </h2>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(submitEvent) => {
                submitEvent.preventDefault();
                const formData = new FormData(submitEvent.currentTarget);
                void runAction("create-board-member", async () => {
                  await upsertBoardMemberAdmin({
                    name: getText(formData, "name"),
                    role: getText(formData, "role"),
                    year: getText(formData, "year"),
                    image: getText(formData, "image"),
                    bio: getText(formData, "bio")
                  });
                  submitEvent.currentTarget.reset();
                });
              }}
            >
              <DashboardFieldLabel label={locale === "ar" ? "اسم عضو الهيئة" : "Board member name"}>
                <input name="name" required placeholder={adminLabels.addBoardMember} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={adminLabels.role}>
                <input name="role" required placeholder={adminLabels.role} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={adminLabels.year}>
                <input name="year" required placeholder={adminLabels.year} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={adminLabels.image}>
                <input name="image" placeholder={adminLabels.image} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={adminLabels.bio} className="md:col-span-2">
                <textarea name="bio" placeholder={adminLabels.bio} className={`${dashboardEditTextAreaClass} w-full`} />
              </DashboardFieldLabel>
              <Button loading={loadingAction === "create-board-member"} type="submit" className="md:col-span-2">
                <Save className="h-4 w-4" />
                {adminLabels.addBoardMember}
              </Button>
            </form>
            <div className="grid gap-4">
              {boardMembers.map((member) => (
                <div key={member.id} className={dashboardPanelClass}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-brand-primary">{member.name}</p>
                      <p className={`text-sm ${dashboardMutedTextClass}`}>
                        {member.role} - {member.year}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={loadingAction === `delete-board-member-${member.id}`}
                      onClick={() => runAction(`delete-board-member-${member.id}`, () => deleteBoardMemberAdmin(member.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                      {labels.delete}
                    </Button>
                  </div>
                  <details className={`mt-4 ${dashboardSubtlePanelClass}`}>
                    <summary className="cursor-pointer text-sm font-semibold text-brand-primary">
                      {adminLabels.edit}
                    </summary>
                    <form
                      className="mt-4 grid gap-3 md:grid-cols-2"
                      onSubmit={(submitEvent) => {
                        submitEvent.preventDefault();
                        const formData = new FormData(submitEvent.currentTarget);
                        void runAction(`edit-board-member-${member.id}`, () =>
                          upsertBoardMemberAdmin({
                            id: member.id,
                            name: getText(formData, "name"),
                            role: getText(formData, "role"),
                            year: getText(formData, "year"),
                            image: getText(formData, "image"),
                            bio: getText(formData, "bio")
                          })
                        );
                      }}
                    >
                      <input name="name" required defaultValue={member.name} className={dashboardEditFieldClass} />
                      <input name="role" required defaultValue={member.role} className={dashboardEditFieldClass} />
                      <input name="year" required defaultValue={member.year} className={dashboardEditFieldClass} />
                      <input name="image" defaultValue={member.image} className={dashboardEditFieldClass} />
                      <textarea name="bio" defaultValue={member.bio} className={`${dashboardEditTextAreaClass} md:col-span-2`} />
                      <Button loading={loadingAction === `edit-board-member-${member.id}`} type="submit" className="md:col-span-2">
                        <Save className="h-4 w-4" />
                        {adminLabels.saveChanges}
                      </Button>
                    </form>
                  </details>
                </div>
              ))}
            </div>
          </Card>
          ) : null}

          {showAdminSection("users") ? (
          <Card id="users" className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {labels.userManagement}
            </h2>
            <div className="grid gap-4">
              {users.map((entry) => (
                <div key={entry.id} className={`${dashboardPanelClass} grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center`}>
                  <div>
                    <p className="font-medium text-brand-primary">{entry.displayName}</p>
                    <p className={`text-sm ${dashboardMutedTextClass}`}>{entry.email}</p>
                  </div>
                  <select defaultValue={entry.role} id={`role-${entry.id}`} className={dashboardEditFieldClass}>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {translateRole(role, locale)}
                      </option>
                    ))}
                  </select>
                  <select defaultValue={entry.membershipStatus} id={`status-${entry.id}`} className={dashboardEditFieldClass}>
                    {membershipStatuses.map((status) => (
                      <option key={status} value={status}>
                        {translateMembershipStatus(status, locale)}
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
                    {labels.save}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={loadingAction === `delete-user-${entry.id}`}
                    onClick={() => {
                      if (!window.confirm("Delete this user account?")) {
                        return;
                      }

                      void runAction(`delete-user-${entry.id}`, () => deleteUserAdmin(entry.id));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    {labels.delete}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
          ) : null}

          {showAdminSection("orders") ? (
          <Card id="orders" className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {labels.orders}
            </h2>
            <div className="grid gap-4">
              {orders.map((order) => (
                <div key={order.id} className={dashboardPanelClass}>
                  <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                    <div>
                      <p className="font-medium text-brand-primary">{order.id}</p>
                      <p className={`text-sm ${dashboardMutedTextClass}`}>
                        {formatDateLong(order.createdAt, locale)} - {formatNumber(order.items.length, locale)} {labels.items}
                      </p>
                    </div>
                    <select defaultValue={order.status} id={`order-${order.id}`} className={dashboardEditFieldClass}>
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
                      {labels.save}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={loadingAction === `delete-order-${order.id}`}
                      onClick={() => {
                        if (!window.confirm("Delete this order?")) {
                          return;
                        }

                        void runAction(`delete-order-${order.id}`, () => deleteOrderAdmin(order.id));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      {labels.delete}
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-4 border-t border-brand-primary/10 pt-4 lg:grid-cols-2">
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-brand-primary">
                        {orderDetailLabels.orderItems}
                      </h3>
                      <div className="grid gap-2">
                        {order.items.map((item) => (
                          <div key={item.productId} className="rounded-xl bg-brand-sky/60 p-3 text-sm text-slate-600 dark:bg-white/10 dark:text-brand-mist">
                            <p className="font-medium text-brand-primary">{item.name}</p>
                            <p>
                              {formatNumber(item.quantity, locale)} x {formatCurrency(item.price, "USD", locale)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="grid gap-1 text-sm text-slate-600 dark:text-brand-mist">
                        <p>{orderDetailLabels.subtotal}: {formatCurrency(order.subtotal, "USD", locale)}</p>
                        <p>{orderDetailLabels.discount}: {formatCurrency(order.discount, "USD", locale)}</p>
                        <p className="font-semibold text-brand-primary">
                          {orderDetailLabels.total}: {formatCurrency(order.total, "USD", locale)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-brand-primary">
                        {orderDetailLabels.delivery}
                      </h3>
                      {order.deliveryInfo ? (
                        <div className="grid gap-2 text-sm text-slate-600 dark:text-brand-mist">
                          <p>{orderDetailLabels.recipient}: {order.deliveryInfo.contactName}</p>
                          <p>{orderDetailLabels.phone}: {order.deliveryInfo.phone}</p>
                          <p>{orderDetailLabels.address}: {order.deliveryInfo.address}</p>
                          {order.deliveryInfo.notes ? (
                            <p>{orderDetailLabels.notes}: {order.deliveryInfo.notes}</p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">{orderDetailLabels.noDelivery}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          ) : null}

          {showModerationSection ? (
          <Card id="moderation" className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-brand-primary">
              {adminLabels.articles}
            </h2>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(submitEvent) => {
                submitEvent.preventDefault();
                const formData = new FormData(submitEvent.currentTarget);
                void runAction("create-article", async () => {
                  await upsertArticleAdmin({
                    title: getText(formData, "title"),
                    excerpt: getText(formData, "excerpt"),
                    category: getText(formData, "category") as ArticleCategory,
                    coverImage: getText(formData, "coverImage"),
                    authorName: getText(formData, "authorName"),
                    content: splitLines(getText(formData, "content")),
                    references: parseReferences(getText(formData, "references")),
                    approved: formData.get("approved") === "on"
                  });
                  submitEvent.currentTarget.reset();
                });
              }}
            >
              <DashboardFieldLabel label={locale === "ar" ? "عنوان المقال" : "Article title"}>
                <input name="title" required placeholder="Article title" className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={adminLabels.author}>
                <input name="authorName" placeholder={adminLabels.author} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={locale === "ar" ? "تصنيف المقال" : "Article category"}>
                <select name="category" className={dashboardFieldClass}>
                  {articleCategories.map((entry) => (
                    <option key={entry} value={entry}>
                      {translateArticleCategory(entry, locale)}
                    </option>
                  ))}
                </select>
              </DashboardFieldLabel>
              <DashboardFieldLabel label={adminLabels.image}>
                <input name="coverImage" placeholder={adminLabels.image} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={locale === "ar" ? "ملخص المقال" : "Article excerpt"} className="md:col-span-2">
                <textarea name="excerpt" required placeholder="Excerpt" className={`${dashboardEditTextAreaClass} w-full`} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={locale === "ar" ? "محتوى المقال" : "Article content"} className="md:col-span-2">
                <textarea name="content" placeholder="Content, one paragraph per line" className={dashboardTextAreaClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={adminLabels.references} className="md:col-span-2">
                <textarea name="references" placeholder={adminLabels.references} className={`${dashboardEditTextAreaClass} w-full`} />
              </DashboardFieldLabel>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input name="approved" type="checkbox" />
                {adminLabels.approved}
              </label>
              <Button loading={loadingAction === "create-article"} type="submit">
                <Save className="h-4 w-4" />
                {adminLabels.addArticle}
              </Button>
            </form>
            <div className="grid gap-4">
              {articles.map((article) => (
                <div key={article.id} className={dashboardPanelClass}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-brand-primary">{article.title}</p>
                      <p className={`text-sm ${dashboardMutedTextClass}`}>
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
                        {article.approved ? labels.reject : labels.approve}
                      </Button>
                      {showManagementSections ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={loadingAction === `delete-article-${article.id}`}
                          onClick={() => {
                            if (!window.confirm("Delete this article?")) {
                              return;
                            }

                            void runAction(`delete-article-${article.id}`, () => deleteArticleAdmin(article.id));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          {labels.delete}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <details className={`mt-4 ${dashboardSubtlePanelClass}`}>
                    <summary className="cursor-pointer text-sm font-semibold text-brand-primary">
                      {adminLabels.edit}
                    </summary>
                    <form
                      className="mt-4 grid gap-3 md:grid-cols-2"
                      onSubmit={(submitEvent) => {
                        submitEvent.preventDefault();
                        const formData = new FormData(submitEvent.currentTarget);
                        void runAction(`edit-article-${article.id}`, () =>
                          upsertArticleAdmin({
                            id: article.id,
                            title: getText(formData, "title"),
                            excerpt: getText(formData, "excerpt"),
                            category: getText(formData, "category") as ArticleCategory,
                            coverImage: getText(formData, "coverImage"),
                            authorName: getText(formData, "authorName"),
                            publishedAt: getText(formData, "publishedAt"),
                            content: splitLines(getText(formData, "content")),
                            references: parseReferences(getText(formData, "references")),
                            approved: formData.get("approved") === "on"
                          })
                        );
                      }}
                    >
                      <input name="title" required defaultValue={article.title} className={dashboardEditFieldClass} />
                      <input name="authorName" defaultValue={article.authorName} className={dashboardEditFieldClass} />
                      <select name="category" defaultValue={article.category} className={dashboardEditFieldClass}>
                        {articleCategories.map((entry) => (
                          <option key={entry} value={entry}>
                            {translateArticleCategory(entry, locale)}
                          </option>
                        ))}
                      </select>
                      <input name="publishedAt" type="datetime-local" defaultValue={toInputDateTime(article.publishedAt)} className={dashboardEditFieldClass} />
                      <input name="coverImage" defaultValue={article.coverImage} className={`${dashboardEditFieldClass} md:col-span-2`} />
                      <textarea name="excerpt" required defaultValue={article.excerpt} className={`${dashboardEditTextAreaClass} md:col-span-2`} />
                      <textarea name="content" defaultValue={article.content.join("\n")} className={`${dashboardEditFieldClass} min-h-24 md:col-span-2`} />
                      <textarea name="references" defaultValue={referencesToText(article)} className={`${dashboardEditTextAreaClass} md:col-span-2`} />
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input name="approved" type="checkbox" defaultChecked={article.approved} />
                        {adminLabels.approved}
                      </label>
                      <Button loading={loadingAction === `edit-article-${article.id}`} type="submit">
                        <Save className="h-4 w-4" />
                        {adminLabels.saveChanges}
                      </Button>
                    </form>
                  </details>
                </div>
              ))}
            </div>
          </Card>
          ) : null}
        </div>
      </div>
    </section>
  );
}
