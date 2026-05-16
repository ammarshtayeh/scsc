"use client";

import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  Home,
  Images,
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
import { useCallback, useEffect, useMemo, useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SmartImage } from "@/components/ui/smart-image";
import { useToast } from "@/components/ui/toast";
import { STORE_CURRENCY } from "@/lib/constants";
import {
  deleteArchivedEventAdmin,
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
  upsertArchivedEventAdmin,
  upsertArticleAdmin,
  upsertBoardMemberAdmin,
  upsertEventAdmin,
  upsertHomeSettingsAdmin,
  upsertProductAdmin
} from "@/lib/firebase/functions";
import { db } from "@/lib/firebase/firebase";
import { deleteFileFromStorage, uploadFileToStorage } from "@/lib/firebase/storage";
import {
  translateArticleCategory,
  translateMembershipStatus,
  translateOrderStatus,
  translateProductCategory,
  translateRole
} from "@/lib/i18n/helpers";
import {
  formatCurrency,
  formatDateLong,
  formatDateTime,
  formatNumber,
  sanitizeImageSource,
  sanitizeImageSources,
  sanitizeVideoSource
} from "@/lib/utils";
import type {
  Article,
  ArchivedEvent,
  ArticleCategory,
  BoardMember,
  DashboardStats,
  EventRegistration,
  EventItem,
  HomePageSettings,
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
  | "home"
  | "events"
  | "event-archive"
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

function getTexts(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
}

function getNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function normalizeDashboardProduct(id: string, data: Record<string, unknown>): Product {
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
    category: (typeof data.category === "string" ? data.category : "Skin Care") as ProductCategory,
    company: typeof data.company === "string" && data.company.trim() ? data.company.trim() : "SCSC Partner",
    stock: Math.max(0, Number(data.stock) || 0),
    images: sanitizeImageSources(data.images),
    featured: Boolean(data.featured)
  };
}

function normalizeDashboardBoardMember(id: string, data: Record<string, unknown>): BoardMember {
  const order = Number(data.order);

  return {
    id,
    name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : "Board member",
    role: typeof data.role === "string" && data.role.trim() ? data.role.trim() : "Board member",
    year: typeof data.year === "string" && data.year.trim()
      ? data.year.trim()
      : String(new Date().getFullYear()),
    order: Number.isFinite(order) ? order : 99,
    image: sanitizeImageSource(data.image),
    bio: typeof data.bio === "string" ? data.bio : ""
  };
}

function normalizeDashboardArchivedEvent(id: string, data: Record<string, unknown>): ArchivedEvent {
  return {
    id,
    slug: typeof data.slug === "string" && data.slug.trim() ? data.slug.trim() : id,
    title:
      typeof data.title === "string" && data.title.trim()
        ? data.title.trim()
        : "Archived event",
    excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
    description: Array.isArray(data.description)
      ? data.description.filter((entry): entry is string => typeof entry === "string")
      : [],
    eventDate: normalizeDashboardDateValue(data.eventDate),
    venue: typeof data.venue === "string" && data.venue.trim() ? data.venue.trim() : "TBA",
    images: sanitizeImageSources(data.images),
    tags: Array.isArray(data.tags)
      ? data.tags.filter((entry): entry is string => typeof entry === "string")
      : [],
    createdAt: normalizeDashboardDateValue(data.createdAt) || undefined,
    createdBy: typeof data.createdBy === "string" ? data.createdBy : undefined,
    createdByRole: typeof data.createdByRole === "string" ? data.createdByRole as Role : undefined,
    updatedAt: normalizeDashboardDateValue(data.updatedAt) || undefined,
    updatedBy: typeof data.updatedBy === "string" ? data.updatedBy : undefined
  };
}

function normalizeDashboardUser(id: string, data: Record<string, unknown>): UserProfile {
  return {
    id,
    membershipId:
      typeof data.membershipId === "string" && data.membershipId.trim()
        ? data.membershipId.trim()
        : undefined,
    displayName:
      typeof data.displayName === "string" && data.displayName.trim()
        ? data.displayName.trim()
        : typeof data.email === "string" && data.email.includes("@")
          ? data.email.split("@")[0]
          : "Association Member",
    email: typeof data.email === "string" ? data.email.trim() : "",
    role: (typeof data.role === "string" ? data.role : "user") as Role,
    phone: typeof data.phone === "string" && data.phone.trim() ? data.phone.trim() : undefined,
    company: typeof data.company === "string" && data.company.trim() ? data.company.trim() : undefined,
    photoURL: typeof data.photoURL === "string" && data.photoURL.trim() ? data.photoURL.trim() : undefined,
    membershipStatus:
      (typeof data.membershipStatus === "string" ? data.membershipStatus : "active") as UserProfile["membershipStatus"],
    membershipExpiresAt:
      typeof data.membershipExpiresAt === "string" && data.membershipExpiresAt.trim()
        ? data.membershipExpiresAt.trim()
        : undefined,
    joinedAt:
      typeof data.joinedAt === "string" && data.joinedAt.trim()
        ? data.joinedAt.trim()
        : new Date(0).toISOString(),
    qrToken: typeof data.qrToken === "string" && data.qrToken.trim() ? data.qrToken.trim() : undefined,
    savedArticleIds: Array.isArray(data.savedArticleIds)
      ? data.savedArticleIds.filter((entry): entry is string => typeof entry === "string")
      : [],
    registeredEventIds: Array.isArray(data.registeredEventIds)
      ? data.registeredEventIds.filter((entry): entry is string => typeof entry === "string")
      : [],
    activeQrSessionId:
      typeof data.activeQrSessionId === "string" ? data.activeQrSessionId : null,
    activeQrSessionExpiresAt:
      typeof data.activeQrSessionExpiresAt === "string" ? data.activeQrSessionExpiresAt : null,
    lastQrIssuedAt: typeof data.lastQrIssuedAt === "string" ? data.lastQrIssuedAt : null,
    lastQrScanAt: typeof data.lastQrScanAt === "string" ? data.lastQrScanAt : null,
    discountRate: typeof data.discountRate === "number" ? data.discountRate : undefined
  };
}

function normalizeDashboardHomeSettings(data: Record<string, unknown>): HomePageSettings {
  return {
    slides: Array.isArray(data.slides)
      ? data.slides
          .map((entry) => {
            const slide = entry as Record<string, unknown>;
            return {
              image: sanitizeImageSource(slide.image),
              title: typeof slide.title === "string" ? slide.title.trim() : "",
              caption: typeof slide.caption === "string" ? slide.caption.trim() : ""
            };
          })
          .filter((slide) => slide.image || slide.title || slide.caption)
      : [],
    partnerEyebrow:
      typeof data.partnerEyebrow === "string" && data.partnerEyebrow.trim()
        ? data.partnerEyebrow.trim()
        : undefined,
    partnerTitle:
      typeof data.partnerTitle === "string" && data.partnerTitle.trim()
        ? data.partnerTitle.trim()
        : undefined,
    partnerDescription:
      typeof data.partnerDescription === "string" && data.partnerDescription.trim()
        ? data.partnerDescription.trim()
        : undefined,
    partners: Array.isArray(data.partners)
      ? data.partners
          .map((entry) => {
            const partner = entry as Record<string, unknown>;
            return {
              name: typeof partner.name === "string" ? partner.name.trim() : "",
              tagline: typeof partner.tagline === "string" ? partner.tagline.trim() : "",
              logo: sanitizeImageSource(partner.logo),
              url: typeof partner.url === "string" && partner.url.trim() ? partner.url.trim() : undefined
            };
          })
          .filter((partner) => partner.name || partner.tagline || partner.logo || partner.url)
      : [],
    featuredVideo:
      typeof data.featuredVideo === "object" && data.featuredVideo
        ? {
            enabled: Boolean((data.featuredVideo as Record<string, unknown>).enabled),
            url: sanitizeVideoSource((data.featuredVideo as Record<string, unknown>).url),
            title:
              typeof (data.featuredVideo as Record<string, unknown>).title === "string"
                ? ((data.featuredVideo as Record<string, unknown>).title as string).trim()
                : undefined,
            description:
              typeof (data.featuredVideo as Record<string, unknown>).description === "string"
                ? ((data.featuredVideo as Record<string, unknown>).description as string).trim()
                : undefined
          }
        : undefined,
    storeEyebrow:
      typeof data.storeEyebrow === "string" && data.storeEyebrow.trim()
        ? data.storeEyebrow.trim()
        : undefined,
    storeTitle:
      typeof data.storeTitle === "string" && data.storeTitle.trim()
        ? data.storeTitle.trim()
        : undefined,
    storeDescription:
      typeof data.storeDescription === "string" && data.storeDescription.trim()
        ? data.storeDescription.trim()
        : undefined,
    storeCtaLabel:
      typeof data.storeCtaLabel === "string" && data.storeCtaLabel.trim()
        ? data.storeCtaLabel.trim()
        : undefined,
    storeCtaHref:
      typeof data.storeCtaHref === "string" && data.storeCtaHref.trim()
        ? data.storeCtaHref.trim()
        : undefined,
    storePerks: Array.isArray(data.storePerks)
      ? data.storePerks.filter((entry): entry is string => typeof entry === "string")
      : [],
    updatedAt:
      typeof data.updatedAt === "string" && data.updatedAt.trim() ? data.updatedAt.trim() : undefined
  };
}

function normalizeDashboardDateValue(value: unknown) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  }

  if (typeof value === "object") {
    const maybeTimestamp = value as {
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
    };

    if (typeof maybeTimestamp.toDate === "function") {
      const date = maybeTimestamp.toDate();
      return Number.isNaN(date.getTime()) ? "" : date.toISOString();
    }

    if (typeof maybeTimestamp.seconds === "number") {
      return new Date(
        maybeTimestamp.seconds * 1000 + Math.floor((maybeTimestamp.nanoseconds || 0) / 1000000)
      ).toISOString();
    }
  }

  return "";
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

function isWebPlayableHomepageVideo(value: string) {
  return /\.(mp4|webm|ogv|ogg)([?#].*)?$/i.test(value.trim());
}

async function uploadDashboardAsset(pathPrefix: string, file: File) {
  const safeName = cleanFileName(file.name) || "image";
  const extension = safeName.includes(".") ? "" : ".jpg";
  return uploadFileToStorage(
    `${pathPrefix}/${Date.now()}-${crypto.randomUUID()}-${safeName}${extension}`,
    file
  );
}

async function uploadDashboardImage(
  folder: "events" | "archived-events" | "products" | "board" | "home",
  file: File
) {
  return uploadDashboardAsset(`images/${folder}`, file);
}

async function uploadDashboardVideo(file: File) {
  const safeName = cleanFileName(file.name) || "video.mp4";
  const extension = safeName.includes(".") ? "" : ".mp4";
  return uploadFileToStorage(
    `videos/home/${Date.now()}-${crypto.randomUUID()}-${safeName}${extension}`,
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
  archivedEvents,
  products,
  users,
  orders,
  articles,
  boardMembers,
  eventRegistrations,
  homeSettings,
  locale,
  labels,
  mode = "admin",
  activeSection = "overview"
}: {
  stats: DashboardStats;
  events: EventItem[];
  archivedEvents: ArchivedEvent[];
  products: Product[];
  users: UserProfile[];
  orders: Order[];
  articles: Article[];
  boardMembers: BoardMember[];
  eventRegistrations: EventRegistration[];
  homeSettings: HomePageSettings | null;
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
  const [localStats, setLocalStats] = useState(stats);
  const [localCounts, setLocalCounts] = useState({
    products: products.length,
    events: events.length,
    archivedEvents: archivedEvents.length,
    users: users.length,
    orders: orders.length,
    boardMembers: boardMembers.length,
    pendingArticles: articles.filter((article) => !article.approved).length
  });
  const [localArchivedEvents, setLocalArchivedEvents] = useState(archivedEvents);
  const [localProducts, setLocalProducts] = useState(products);
  const [localBoardMembers, setLocalBoardMembers] = useState(boardMembers);
  const [localUsers, setLocalUsers] = useState(users);
  const [resolvedHomeSettings, setResolvedHomeSettings] = useState(homeSettings);
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
  const [archivedEventForm, setArchivedEventForm] = useState({
    title: "",
    eventDate: "",
    venue: "",
    excerpt: "",
    description: "",
    tags: "",
    images: ""
  });
  const [archivedEventImageFiles, setArchivedEventImageFiles] = useState<File[]>([]);
  const [productForm, setProductForm] = useState({
    name: "",
    price: "10",
    memberPrice: "9",
    stock: "10",
    category: "Skin Care" as ProductCategory,
    company: "",
    image: "",
    imageTwo: "",
    description: "",
    longDescription: ""
  });
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [boardMemberImageFile, setBoardMemberImageFile] = useState<File | null>(null);
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
  const boardRolePresets =
    locale === "ar"
      ? [
          "رئيس الجمعية",
          "نائبة رئيس الجمعية",
          "لجنة العلاقات العامة",
          "لجنة المبادرات والمشاريع",
          "لجنة الانشطة",
          "أمين الصندوق",
          "اللجنة الاعلامية",
          "لجنة البحث العلمي والتدريب",
          "لجنة شؤون الاعضاء"
        ]
      : [
          "Association president",
          "Association vice president",
          "Public relations committee",
          "Initiatives and projects committee",
          "Activities committee",
          "Treasurer",
          "Media committee",
          "Scientific research and training committee",
          "Member affairs committee"
        ];
  const defaultHomeSlides =
    locale === "ar"
      ? [
          {
            image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
            title: "مجتمع مهني نابض",
            caption: "فعاليات ومساحات تعارف تجمع العاملين والمهتمين في قطاع مستحضرات التجميل."
          },
          {
            image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1200&q=80",
            title: "تعلم وتطوير",
            caption: "ورش ومحتوى علمي يساعد الأعضاء على تطوير مهاراتهم بثقة."
          },
          {
            image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=1200&q=80",
            title: "منتجات وفرص",
            caption: "منصة تربط الأعضاء بمنتجات مختارة وفرص تعاون داخل القطاع."
          }
        ]
      : [
          {
            image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
            title: "A vibrant professional community",
            caption: "Events and networking spaces for cosmetics professionals and enthusiasts."
          },
          {
            image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1200&q=80",
            title: "Learning and development",
            caption: "Workshops and science-backed content that help members build confidence."
          },
          {
            image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=1200&q=80",
            title: "Products and opportunities",
            caption: "A platform connecting members with curated products and sector partnerships."
          }
        ];
  const editableHomeSlides = defaultHomeSlides.map((slide, index) => ({
    image: resolvedHomeSettings?.slides[index]?.image || slide.image,
    title: resolvedHomeSettings?.slides[index]?.title || slide.title,
    caption: resolvedHomeSettings?.slides[index]?.caption || slide.caption
  }));
  const defaultPartners =
    locale === "ar"
      ? [
          {
            name: "شركاء الجمال والعناية",
            tagline: "علامات وشركات تتعاون مع الجمعية للوصول للطلبة بشكل مرتب وموثوق.",
            logo: defaultHomeSlides[0].image,
            url: ""
          },
          {
            name: "مختبرات ومورّدون",
            tagline: "شراكات تربط المجتمع الطلابي بالقطاع من خلال منتجات وتجارب مفيدة.",
            logo: defaultHomeSlides[1].image,
            url: ""
          },
          {
            name: "داعمون للنشاط الطلابي",
            tagline: "منتجات وفرص تظهر داخل متجر الجمعية مع حضور بصري أقوى.",
            logo: defaultHomeSlides[2].image,
            url: ""
          }
        ]
      : [
          {
            name: "Beauty and care partners",
            tagline: "Brands collaborating with the association to reach students through a trusted channel.",
            logo: defaultHomeSlides[0].image,
            url: ""
          },
          {
            name: "Labs and suppliers",
            tagline: "Partnerships connecting the student community with useful products and experiences.",
            logo: defaultHomeSlides[1].image,
            url: ""
          },
          {
            name: "Student activity supporters",
            tagline: "Products and opportunities featured in the store with stronger visual presence.",
            logo: defaultHomeSlides[2].image,
            url: ""
          }
        ];
  const editablePartners = defaultPartners.map((partner, index) => ({
    name: resolvedHomeSettings?.partners?.[index]?.name || partner.name,
    tagline: resolvedHomeSettings?.partners?.[index]?.tagline || partner.tagline,
    logo: resolvedHomeSettings?.partners?.[index]?.logo || partner.logo,
    url: resolvedHomeSettings?.partners?.[index]?.url || partner.url
  }));
  const homeContentLabels =
    locale === "ar"
      ? {
          partnerSection: "قسم الشركاء",
          partnerEyebrow: "عنوان صغير للشركاء",
          partnerTitle: "عنوان قسم الشركاء",
          partnerDescription: "وصف قسم الشركاء",
          partnerName: "اسم الشريك",
          partnerTagline: "وصف الشريك",
          partnerLogo: "صورة أو شعار الشريك",
          partnerUrl: "رابط الشريك",
          storeSection: "قسم الترويج للمتجر",
          storeEyebrow: "عنوان صغير للمتجر",
          storeTitle: "عنوان ترويجي للمتجر",
          storeDescription: "وصف ترويجي للمتجر",
          storeCtaLabel: "نص زر المتجر",
          storeCtaHref: "رابط زر المتجر",
          storePerks: "مزايا المتجر، سطر لكل ميزة"
        }
      : {
          partnerSection: "Partner section",
          partnerEyebrow: "Partner eyebrow",
          partnerTitle: "Partner section title",
          partnerDescription: "Partner section description",
          partnerName: "Partner name",
          partnerTagline: "Partner tagline",
          partnerLogo: "Partner logo or image",
          partnerUrl: "Partner URL",
          videoSection: "Featured video section",
          videoEnabled: "Show the video on the home page",
          videoTitle: "Video title",
          videoDescription: "Video description",
          videoUrl: "Video URL",
          videoUpload: "Upload video",
          storeSection: "Store promotion section",
          storeEyebrow: "Store eyebrow",
          storeTitle: "Store promotional title",
          storeDescription: "Store promotional description",
          storeCtaLabel: "Store button label",
          storeCtaHref: "Store button URL",
          storePerks: "Store perks, one per line"
        };
  const homeVideoLabels =
    locale === "ar"
      ? {
          section: "قسم الفيديو",
          enabled: "إظهار الفيديو في الصفحة الرئيسية",
          title: "عنوان الفيديو",
          description: "وصف الفيديو",
          url: "رابط الفيديو",
          upload: "رفع فيديو"
        }
      : {
          section: "Featured video section",
          enabled: "Show the video on the home page",
          title: "Video title",
          description: "Video description",
          url: "Video URL",
          upload: "Upload video"
        };
  const homeVideoManagementLabels =
    locale === "ar"
      ? {
          current: "الفيديو الحالي",
          remove: "حذف الفيديو الحالي",
          replaceHint: "عند رفع فيديو جديد سيتم استبدال الحالي.",
          formatHint: "لضمان ظهور الفيديو في الرئيسية استخدم MP4 أو WebM أو OGG."
        }
      : {
          current: "Current video",
          remove: "Remove current video",
          replaceHint: "Uploading a new video will replace the current one.",
          formatHint: "Use MP4, WebM, or OGG to ensure the video renders on the homepage."
        };
  const currentBoardYear = String(new Date().getFullYear());
  const showManagementSections = mode === "admin";
  const showOverview = showManagementSections && activeSection === "overview";
  const showModerationSection = activeSection === "moderation";
  const showArchiveSection = activeSection === "event-archive";
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
          eventArchive: "أرشيف الفعاليات السابقة",
          addArchivedEvent: "إضافة فعالية سابقة",
          archivedEventGuidance:
            "هذا القسم مخصص لإضافة الفعاليات السابقة مع أكثر من صورة لكل فعالية. يمكن للمدير والمشرف تنظيم الأرشيف بسهولة دون أي معرفة برمجية.",
          archivedEventDate: "تاريخ الفعالية السابقة",
          archivedEventImages: "روابط الصور، كل صورة في سطر",
          archivedEventImagesHint:
            "أضيفوا روابط الصور أو ارفعوا عدة صور من الجهاز، وسيتم حفظها كلها داخل نفس الفعالية.",
          archivedEventDeleteConfirm: "هل تريد حذف هذه الفعالية من الأرشيف؟",
          archivedEventPhotoCount: "عدد الصور",
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
          order: "ترتيب الظهور",
          role: "المنصب",
          bio: "نبذة",
          homeSettings: "الصفحة الرئيسية",
          homeGuidance: "حدّث صور السلايدر الرئيسية والعناوين والوصف الظاهر في أول صفحة.",
          slide: "الشريحة",
          slideTitle: "عنوان الشريحة",
          slideCaption: "وصف الشريحة",
          productGuidance: "أضيفوا المنتج مرة واحدة هنا وسيظهر مباشرة في متجر الأعضاء وصفحة التفاصيل. يمكنكم رفع الصور، تعديل السعر والمخزون، أو حذف المنتج بدون أي تعديل برمجي.",
          boardGuidance: "أي تعديل هنا يظهر في صفحة من نحن والهيكل التنظيمي. ارفعوا الصورة، اختاروا المنصب، ثم احفظوا بدون الحاجة لأي تعديل برمجي.",
          details: "معاينة",
          confirmDeleteProduct: "هل تريد حذف هذا المنتج من متجر الأعضاء؟",
          confirmDeleteBoardMember: "هل تريد حذف عضو الهيئة الإدارية؟"
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
          eventArchive: "Past events archive",
          addArchivedEvent: "Add archived event",
          archivedEventGuidance:
            "Use this section to add previous events with multiple photos per event. Admins and moderators can keep the archive tidy without touching code.",
          archivedEventDate: "Past event date",
          archivedEventImages: "Image URLs, one per line",
          archivedEventImagesHint:
            "Paste image URLs or upload multiple files from the device and they will all be saved inside the same archived event.",
          archivedEventDeleteConfirm: "Delete this archived event?",
          archivedEventPhotoCount: "Photo count",
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
          order: "Display order",
          role: "Role",
          bio: "Bio",
          homeSettings: "Home page",
          homeGuidance: "Update the main slider images, titles, and captions shown on the first page.",
          slide: "Slide",
          slideTitle: "Slide title",
          slideCaption: "Slide caption",
          productGuidance: "Add a product once here and it appears immediately in the member store and detail page. Upload photos, adjust pricing and stock, or delete it without touching code.",
          boardGuidance: "Changes here power the About page and organizational structure. Upload a photo, choose a role, and save without touching code.",
          details: "Preview",
          confirmDeleteProduct: "Delete this product from the member store?",
          confirmDeleteBoardMember: "Delete this board member?"
        };
  const refreshClientProducts = useCallback(async () => {
    if (!db) {
      setLocalProducts(products);
      return;
    }

    const snapshot = await getDocs(query(collection(db, "products"), orderBy("__name__")));
    const nextProducts = snapshot.docs.map((entry) =>
      normalizeDashboardProduct(entry.id, entry.data() as Record<string, unknown>)
    );
    setLocalProducts(nextProducts);
    setLocalCounts((current) => ({ ...current, products: nextProducts.length }));
  }, [products]);
  const refreshClientArchivedEvents = useCallback(async () => {
    if (!db) {
      setLocalArchivedEvents(archivedEvents);
      return;
    }

    const snapshot = await getDocs(query(collection(db, "archivedEvents"), orderBy("eventDate", "desc")));
    const nextArchivedEvents = snapshot.docs.map((entry) =>
      normalizeDashboardArchivedEvent(entry.id, entry.data() as Record<string, unknown>)
    );
    setLocalArchivedEvents(nextArchivedEvents);
    setLocalCounts((current) => ({ ...current, archivedEvents: nextArchivedEvents.length }));
  }, [archivedEvents]);
  const refreshClientBoardMembers = useCallback(async () => {
    if (!db) {
      setLocalBoardMembers(boardMembers);
      return;
    }

    const snapshot = await getDocs(query(collection(db, "boardMembers"), orderBy("year", "desc")));
    const nextBoardMembers = snapshot.docs
      .map((entry) =>
        normalizeDashboardBoardMember(entry.id, entry.data() as Record<string, unknown>)
      )
      .sort((a, b) => {
        const yearDiff = Number(b.year) - Number(a.year);
        return yearDiff || (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name);
      });
    setLocalBoardMembers(nextBoardMembers);
    setLocalCounts((current) => ({ ...current, boardMembers: nextBoardMembers.length }));
  }, [boardMembers]);
  const refreshClientStats = useCallback(async () => {
    if (!db) {
      setLocalStats(stats);
      return;
    }

    const now = Date.now();
    const [
      usersSnapshot,
      upcomingEventsSnapshot,
      totalEventsSnapshot,
      archivedEventsSnapshot,
      ordersSnapshot,
      productSnapshot,
      boardMembersSnapshot,
      articlesSnapshot
    ] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "events")),
      getDocs(collection(db, "events")),
      getDocs(collection(db, "archivedEvents")),
      getDocs(collection(db, "orders")),
      getDocs(collection(db, "products")),
      getDocs(collection(db, "boardMembers")),
      getDocs(collection(db, "articles"))
    ]);
    const companySet = new Set(
      productSnapshot.docs
        .map((entry) => entry.data().company)
        .filter((company): company is string => typeof company === "string" && Boolean(company.trim()))
    );

    setLocalStats({
      totalUsers: usersSnapshot.docs.length,
      upcomingEvents: upcomingEventsSnapshot.docs.filter((entry) => {
        const startsAt = normalizeDashboardDateValue(entry.data().startsAt);
        return startsAt && new Date(startsAt).getTime() >= now;
      }).length,
      totalOrders: ordersSnapshot.docs.length,
      registeredCompanies: companySet.size
    });
    setLocalCounts({
      products: productSnapshot.docs.length,
      events: totalEventsSnapshot.docs.length,
      archivedEvents: archivedEventsSnapshot.docs.length,
      users: usersSnapshot.docs.length,
      orders: ordersSnapshot.docs.length,
      boardMembers: boardMembersSnapshot.docs.length,
      pendingArticles: articlesSnapshot.docs.filter((article) => article.data().approved !== true).length
    });
  }, [stats]);

  const refreshClientUsers = useCallback(async () => {
    if (!db) {
      setLocalUsers(users);
      return;
    }

    const usersSnapshot = await getDocs(collection(db, "users"));
    const nextUsers = usersSnapshot.docs
      .map((entry) => normalizeDashboardUser(entry.id, entry.data() as Record<string, unknown>))
      .sort((a, b) => {
        return (
          new Date(b.joinedAt || 0).getTime() - new Date(a.joinedAt || 0).getTime() ||
          a.displayName.localeCompare(b.displayName)
        );
      });

    setLocalUsers(nextUsers);
    setLocalCounts((current) => ({ ...current, users: nextUsers.length }));
  }, [users]);

  const refreshClientHomeSettings = useCallback(async () => {
    if (!db) {
      setResolvedHomeSettings(homeSettings);
      return;
    }

    const homeDocSnapshot = await getDocs(query(collection(db, "siteSettings")));
    const homeDoc = homeDocSnapshot.docs.find((entry) => entry.id === "home");
    if (!homeDoc) {
      return;
    }

    setResolvedHomeSettings(normalizeDashboardHomeSettings(homeDoc.data() as Record<string, unknown>));
  }, [homeSettings]);

  useEffect(() => {
    setLocalStats(stats);
    setLocalCounts({
      products: products.length,
      events: events.length,
      archivedEvents: archivedEvents.length,
      users: users.length,
      orders: orders.length,
      boardMembers: boardMembers.length,
      pendingArticles: articles.filter((article) => !article.approved).length
    });
    setLocalArchivedEvents(archivedEvents);
    setLocalProducts(products);
    setLocalBoardMembers(boardMembers);
    setLocalUsers(users);
    setResolvedHomeSettings(homeSettings);
  }, [archivedEvents, articles, boardMembers, events, homeSettings, orders, products, stats, users]);

  useEffect(() => {
    if (activeSection !== "products") {
      return;
    }

    void refreshClientProducts().catch(() => undefined);
  }, [activeSection, refreshClientProducts]);

  useEffect(() => {
    if (activeSection === "overview") {
      void Promise.all([
        refreshClientStats(),
        refreshClientArchivedEvents(),
        refreshClientProducts(),
        refreshClientBoardMembers(),
        refreshClientUsers(),
        refreshClientHomeSettings()
      ]).catch(() => undefined);
    }

    if (activeSection === "event-archive") {
      void refreshClientArchivedEvents().catch(() => undefined);
    }

    if (activeSection === "board-members") {
      void refreshClientBoardMembers().catch(() => undefined);
    }

    if (activeSection === "users") {
      void refreshClientUsers().catch(() => undefined);
    }

    if (activeSection === "home") {
      void refreshClientHomeSettings().catch(() => undefined);
    }
  }, [
    activeSection,
    refreshClientArchivedEvents,
    refreshClientBoardMembers,
    refreshClientHomeSettings,
    refreshClientProducts,
    refreshClientStats,
    refreshClientUsers
  ]);

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
      { label: labels.totalUsers, value: localStats.totalUsers, icon: Users },
      { label: labels.upcomingEvents, value: localStats.upcomingEvents, icon: CalendarDays },
      { label: labels.totalOrders, value: localStats.totalOrders, icon: ShoppingBag },
      { label: labels.registeredCompanies, value: localStats.registeredCompanies, icon: ShieldCheck }
    ],
    [labels, localStats]
  );

  const managementCards = useMemo(
    () => [
      {
        href: "/admin/home",
        title: adminLabels.homeSettings,
        metric: editableHomeSlides.length,
        icon: Home
      },
      {
        href: "/admin/products",
        title: labels.productManagement,
        metric: localCounts.products,
        icon: Package
      },
      {
        href: "/admin/events",
        title: labels.eventManagement,
        metric: localCounts.events,
        icon: CalendarDays
      },
      {
        href: "/admin/event-archive",
        title: adminLabels.eventArchive,
        metric: localCounts.archivedEvents,
        icon: Images
      },
      {
        href: "/admin/users",
        title: labels.userManagement,
        metric: localCounts.users,
        icon: UserCog
      },
      {
        href: "/admin/orders",
        title: labels.orders,
        metric: localCounts.orders,
        icon: ClipboardList
      },
      {
        href: "/admin/board-members",
        title: adminLabels.boardMembers,
        metric: localCounts.boardMembers,
        icon: Users
      },
      {
        href: "/admin/moderation",
        title: labels.moderation,
        metric: localCounts.pendingArticles,
        icon: CheckCircle2
      }
    ],
    [
      adminLabels.boardMembers,
      adminLabels.eventArchive,
      adminLabels.homeSettings,
      editableHomeSlides.length,
      labels,
      localCounts
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

  async function saveHomeSlide(index: number, formData: FormData) {
    const slides = await Promise.all(
      editableHomeSlides.map(async (slide, slideIndex) => {
        if (slideIndex !== index) {
          return slide;
        }

        const imageFile = formData.get(`homeSlideFile-${slideIndex}`);
        const uploadedImage =
          imageFile instanceof File && imageFile.size > 0
            ? await uploadDashboardImage("home", imageFile)
            : "";

        return {
          image: uploadedImage || getText(formData, `homeSlideImage-${slideIndex}`) || slide.image,
          title: getText(formData, `homeSlideTitle-${slideIndex}`),
          caption: getText(formData, `homeSlideCaption-${slideIndex}`)
        };
      })
    );

    await upsertHomeSettingsAdmin({ slides });
  }

  async function saveHomePartners(formData: FormData) {
    const partners = await Promise.all(
      editablePartners.map(async (partner, index) => {
        const imageFile = formData.get(`partnerLogoFile-${index}`);
        const uploadedLogo =
          imageFile instanceof File && imageFile.size > 0
            ? await uploadDashboardImage("home", imageFile)
            : "";

        return {
          name: getText(formData, `partnerName-${index}`) || partner.name,
          tagline: getText(formData, `partnerTagline-${index}`) || partner.tagline,
          logo: uploadedLogo || getText(formData, `partnerLogo-${index}`) || partner.logo,
          url: getText(formData, `partnerUrl-${index}`)
        };
      })
    );

    await upsertHomeSettingsAdmin({
      partnerEyebrow: getText(formData, "partnerEyebrow"),
      partnerTitle: getText(formData, "partnerTitle"),
      partnerDescription: getText(formData, "partnerDescription"),
      partners
    });
  }

  async function saveHomeVideo(formData: FormData) {
    const currentVideoUrl = resolvedHomeSettings?.featuredVideo?.url || "";
    const shouldRemoveCurrentVideo = formData.get("featuredVideoRemove") === "on";
    const manualVideoUrl = getText(formData, "featuredVideoUrl");
    const videoFile = formData.get("featuredVideoFile");

    if (manualVideoUrl && !isWebPlayableHomepageVideo(manualVideoUrl)) {
      throw new Error(
        locale === "ar"
          ? "فيديو الصفحة الرئيسية يجب أن يكون بصيغة قابلة للعرض على الويب مثل MP4 أو WebM أو OGG."
          : "Homepage video must use a web-playable format such as MP4, WebM, or OGG."
      );
    }

    if (videoFile instanceof File && videoFile.size > 0 && !isWebPlayableHomepageVideo(videoFile.name)) {
      throw new Error(
        locale === "ar"
          ? "رفع فيديو الرئيسية يدعم حاليًا MP4 وWebM وOGG فقط لضمان ظهوره في المتصفح."
          : "Homepage video uploads currently support MP4, WebM, and OGG only so they render reliably in browsers."
      );
    }

    const uploadedVideo =
      videoFile instanceof File && videoFile.size > 0 ? await uploadDashboardVideo(videoFile) : "";
    const nextVideoUrl = uploadedVideo || (shouldRemoveCurrentVideo ? "" : manualVideoUrl || currentVideoUrl);

    if (uploadedVideo && currentVideoUrl && currentVideoUrl !== uploadedVideo) {
      await deleteFileFromStorage(currentVideoUrl);
    } else if (manualVideoUrl && currentVideoUrl && manualVideoUrl !== currentVideoUrl) {
      await deleteFileFromStorage(currentVideoUrl);
    } else if (shouldRemoveCurrentVideo && currentVideoUrl && !uploadedVideo && !manualVideoUrl) {
      await deleteFileFromStorage(currentVideoUrl);
    }

    await upsertHomeSettingsAdmin({
      featuredVideo: {
        enabled: formData.get("featuredVideoEnabled") === "on" && Boolean(nextVideoUrl),
        url: nextVideoUrl,
        title: getText(formData, "featuredVideoTitle"),
        description: getText(formData, "featuredVideoDescription")
      }
    });
    setResolvedHomeSettings((current) => ({
      slides: current?.slides || [],
      partners: current?.partners || [],
      ...current,
      featuredVideo: {
        enabled: formData.get("featuredVideoEnabled") === "on" && Boolean(nextVideoUrl),
        url: nextVideoUrl,
        title: getText(formData, "featuredVideoTitle") || undefined,
        description: getText(formData, "featuredVideoDescription") || undefined
      },
      updatedAt: new Date().toISOString()
    }));
  }

  async function saveHomeStore(formData: FormData) {
    await upsertHomeSettingsAdmin({
      storeEyebrow: getText(formData, "storeEyebrow"),
      storeTitle: getText(formData, "storeTitle"),
      storeDescription: getText(formData, "storeDescription"),
      storeCtaLabel: getText(formData, "storeCtaLabel"),
      storeCtaHref: getText(formData, "storeCtaHref"),
      storePerks: splitLines(getText(formData, "storePerks"))
    });
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
                        ? "اختصارات مباشرة لإدارة المنتجات، الفعاليات القادمة، أرشيف الفعاليات، المستخدمين، الطلبات، والهيئة الإدارية."
                        : "Fast access to products, live events, archived events, users, orders, board members, and moderation."}
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

          {showAdminSection("home") ? (
          <Card id="home" className="space-y-5">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                {adminLabels.homeSettings}
              </h2>
              <p className={`mt-2 text-sm leading-7 ${dashboardMutedTextClass}`}>
                {adminLabels.homeGuidance}
              </p>
            </div>
            <div className="grid gap-4">
              {editableHomeSlides.map((slide, index) => (
                <form
                  key={`home-slide-${index}`}
                  className={`${dashboardPanelClass} grid gap-3 md:grid-cols-2`}
                  onSubmit={(submitEvent) => {
                    submitEvent.preventDefault();
                    const formData = new FormData(submitEvent.currentTarget);
                    void runAction(`save-home-slide-${index}`, () => saveHomeSlide(index, formData));
                  }}
                >
                  <h3 className="font-heading text-xl font-semibold text-brand-primary md:col-span-2">
                    {adminLabels.slide} {formatNumber(index + 1, locale)}
                  </h3>
                  <DashboardFieldLabel label={adminLabels.slideTitle}>
                    <input
                      name={`homeSlideTitle-${index}`}
                      required
                      defaultValue={slide.title}
                      className={dashboardFieldClass}
                    />
                  </DashboardFieldLabel>
                  <DashboardFieldLabel label={imageLabels.url}>
                    <input
                      name={`homeSlideImage-${index}`}
                      required
                      defaultValue={slide.image}
                      className={dashboardFieldClass}
                    />
                  </DashboardFieldLabel>
                  <DashboardFieldLabel label={adminLabels.slideCaption} className="md:col-span-2">
                    <textarea
                      name={`homeSlideCaption-${index}`}
                      required
                      defaultValue={slide.caption}
                      className={dashboardTextAreaClass}
                    />
                  </DashboardFieldLabel>
                  <DashboardFieldLabel label={imageLabels.upload} className="md:col-span-2">
                    <input
                      name={`homeSlideFile-${index}`}
                      type="file"
                      accept="image/*"
                      className={dashboardFieldClass}
                    />
                  </DashboardFieldLabel>
                  <div className="md:col-span-2">
                    <Button loading={loadingAction === `save-home-slide-${index}`} type="submit">
                      <Save className="h-4 w-4" />
                      {labels.save}
                    </Button>
                  </div>
                </form>
              ))}
              <form
                className={`${dashboardPanelClass} grid gap-3 md:grid-cols-2`}
                onSubmit={(submitEvent) => {
                  submitEvent.preventDefault();
                  const formData = new FormData(submitEvent.currentTarget);
                  void runAction("save-home-partners", () => saveHomePartners(formData));
                }}
              >
                <h3 className="font-heading text-xl font-semibold text-brand-primary md:col-span-2">
                  {homeContentLabels.partnerSection}
                </h3>
                <DashboardFieldLabel label={homeContentLabels.partnerEyebrow}>
                  <input
                    name="partnerEyebrow"
                    defaultValue={homeSettings?.partnerEyebrow || ""}
                    className={dashboardFieldClass}
                  />
                </DashboardFieldLabel>
                <DashboardFieldLabel label={homeContentLabels.partnerTitle}>
                  <input
                    name="partnerTitle"
                    defaultValue={homeSettings?.partnerTitle || ""}
                    className={dashboardFieldClass}
                  />
                </DashboardFieldLabel>
                <DashboardFieldLabel label={homeContentLabels.partnerDescription} className="md:col-span-2">
                  <textarea
                    name="partnerDescription"
                    defaultValue={homeSettings?.partnerDescription || ""}
                    className={dashboardTextAreaClass}
                  />
                </DashboardFieldLabel>
                {editablePartners.map((partner, index) => (
                  <div key={`partner-${index}`} className="grid gap-3 rounded-2xl border border-brand-primary/10 p-4 md:col-span-2 md:grid-cols-2">
                    <DashboardFieldLabel label={`${homeContentLabels.partnerName} ${formatNumber(index + 1, locale)}`}>
                      <input
                        name={`partnerName-${index}`}
                        defaultValue={partner.name}
                        className={dashboardFieldClass}
                      />
                    </DashboardFieldLabel>
                    <DashboardFieldLabel label={homeContentLabels.partnerUrl}>
                      <input
                        name={`partnerUrl-${index}`}
                        defaultValue={partner.url}
                        className={dashboardFieldClass}
                      />
                    </DashboardFieldLabel>
                    <DashboardFieldLabel label={homeContentLabels.partnerLogo}>
                      <input
                        name={`partnerLogo-${index}`}
                        defaultValue={partner.logo}
                        className={dashboardFieldClass}
                      />
                    </DashboardFieldLabel>
                    <DashboardFieldLabel label={imageLabels.upload}>
                      <input
                        name={`partnerLogoFile-${index}`}
                        type="file"
                        accept="image/*"
                        className={dashboardFieldClass}
                      />
                    </DashboardFieldLabel>
                    <DashboardFieldLabel label={homeContentLabels.partnerTagline} className="md:col-span-2">
                      <textarea
                        name={`partnerTagline-${index}`}
                        defaultValue={partner.tagline}
                        className={dashboardTextAreaClass}
                      />
                    </DashboardFieldLabel>
                  </div>
                ))}
                <div className="md:col-span-2">
                  <Button loading={loadingAction === "save-home-partners"} type="submit">
                    <Save className="h-4 w-4" />
                    {labels.save}
                  </Button>
                </div>
              </form>
              <form
                key={`home-video-${resolvedHomeSettings?.featuredVideo?.url || "empty"}-${resolvedHomeSettings?.updatedAt || ""}`}
                className={`${dashboardPanelClass} grid gap-3 md:grid-cols-2`}
                onSubmit={(submitEvent) => {
                  submitEvent.preventDefault();
                  const formData = new FormData(submitEvent.currentTarget);
                  void runAction("save-home-video", () => saveHomeVideo(formData));
                }}
              >
                <h3 className="font-heading text-xl font-semibold text-brand-primary md:col-span-2">
                  {homeVideoLabels.section}
                </h3>
                {resolvedHomeSettings?.featuredVideo?.url ? (
                  <div className="rounded-2xl border border-brand-primary/10 bg-brand-sky/40 p-4 md:col-span-2">
                    <p className="mb-3 text-sm font-semibold text-brand-primary">
                      {homeVideoManagementLabels.current}
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-brand-primary/10 bg-slate-950">
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        className="max-h-72 w-full bg-black object-cover"
                      >
                        <source src={resolvedHomeSettings.featuredVideo.url} />
                      </video>
                    </div>
                    <p className={`mt-3 text-sm ${dashboardMutedTextClass}`}>
                      {homeVideoManagementLabels.replaceHint}
                    </p>
                    {!isWebPlayableHomepageVideo(resolvedHomeSettings.featuredVideo.url) ? (
                      <p className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-300">
                        {homeVideoManagementLabels.formatHint}
                      </p>
                    ) : null}
                    <label className="mt-3 flex items-center gap-2 text-sm font-medium text-brand-primary">
                      <input name="featuredVideoRemove" type="checkbox" />
                      {homeVideoManagementLabels.remove}
                    </label>
                  </div>
                ) : null}
                <label className="flex items-center gap-2 text-sm font-medium text-brand-primary md:col-span-2">
                  <input
                    name="featuredVideoEnabled"
                    type="checkbox"
                    defaultChecked={Boolean(resolvedHomeSettings?.featuredVideo?.enabled)}
                  />
                  {homeVideoLabels.enabled}
                </label>
                <DashboardFieldLabel label={homeVideoLabels.title}>
                  <input
                    name="featuredVideoTitle"
                    defaultValue={resolvedHomeSettings?.featuredVideo?.title || ""}
                    className={dashboardFieldClass}
                  />
                </DashboardFieldLabel>
                <DashboardFieldLabel label={homeVideoLabels.url}>
                  <input
                    name="featuredVideoUrl"
                    defaultValue={resolvedHomeSettings?.featuredVideo?.url || ""}
                    className={dashboardFieldClass}
                  />
                </DashboardFieldLabel>
                <DashboardFieldLabel label={homeVideoLabels.description} className="md:col-span-2">
                  <textarea
                    name="featuredVideoDescription"
                    defaultValue={resolvedHomeSettings?.featuredVideo?.description || ""}
                    className={dashboardTextAreaClass}
                  />
                </DashboardFieldLabel>
                <DashboardFieldLabel label={homeVideoLabels.upload} className="md:col-span-2">
                  <input
                    name="featuredVideoFile"
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    className={dashboardFieldClass}
                  />
                </DashboardFieldLabel>
                <p className={`text-sm md:col-span-2 ${dashboardMutedTextClass}`}>
                  {homeVideoManagementLabels.formatHint}
                </p>
                <div className="md:col-span-2">
                  <Button loading={loadingAction === "save-home-video"} type="submit">
                    <Save className="h-4 w-4" />
                    {labels.save}
                  </Button>
                </div>
              </form>
              <form
                className={`${dashboardPanelClass} grid gap-3 md:grid-cols-2`}
                onSubmit={(submitEvent) => {
                  submitEvent.preventDefault();
                  const formData = new FormData(submitEvent.currentTarget);
                  void runAction("save-home-store", () => saveHomeStore(formData));
                }}
              >
                <h3 className="font-heading text-xl font-semibold text-brand-primary md:col-span-2">
                  {homeContentLabels.storeSection}
                </h3>
                <DashboardFieldLabel label={homeContentLabels.storeEyebrow}>
                  <input
                    name="storeEyebrow"
                    defaultValue={homeSettings?.storeEyebrow || ""}
                    className={dashboardFieldClass}
                  />
                </DashboardFieldLabel>
                <DashboardFieldLabel label={homeContentLabels.storeTitle}>
                  <input
                    name="storeTitle"
                    defaultValue={homeSettings?.storeTitle || ""}
                    className={dashboardFieldClass}
                  />
                </DashboardFieldLabel>
                <DashboardFieldLabel label={homeContentLabels.storeDescription} className="md:col-span-2">
                  <textarea
                    name="storeDescription"
                    defaultValue={homeSettings?.storeDescription || ""}
                    className={dashboardTextAreaClass}
                  />
                </DashboardFieldLabel>
                <DashboardFieldLabel label={homeContentLabels.storeCtaLabel}>
                  <input
                    name="storeCtaLabel"
                    defaultValue={homeSettings?.storeCtaLabel || ""}
                    className={dashboardFieldClass}
                  />
                </DashboardFieldLabel>
                <DashboardFieldLabel label={homeContentLabels.storeCtaHref}>
                  <input
                    name="storeCtaHref"
                    defaultValue={homeSettings?.storeCtaHref || "/store"}
                    className={dashboardFieldClass}
                  />
                </DashboardFieldLabel>
                <DashboardFieldLabel label={homeContentLabels.storePerks} className="md:col-span-2">
                  <textarea
                    name="storePerks"
                    defaultValue={(homeSettings?.storePerks || []).join("\n")}
                    className={dashboardTextAreaClass}
                  />
                </DashboardFieldLabel>
                <div className="md:col-span-2">
                  <Button loading={loadingAction === "save-home-store"} type="submit">
                    <Save className="h-4 w-4" />
                    {labels.save}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
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
                  const images = [
                    ...(productForm.image ? [productForm.image] : []),
                    ...(productForm.imageTwo ? [productForm.imageTwo] : []),
                    ...uploadedImages
                  ];

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
                  setProductForm({
                    name: "",
                    price: "10",
                    memberPrice: "9",
                    stock: "10",
                    category: "Skin Care",
                    company: "",
                    image: "",
                    imageTwo: "",
                    description: "",
                    longDescription: ""
                  });
                  setProductImageFiles([]);
                  await refreshClientProducts();
                });
              }}
            >
              <div className={`${dashboardSubtlePanelClass} md:col-span-2`}>
                <p className="text-sm leading-7 text-slate-600 dark:text-brand-mist">
                  {adminLabels.productGuidance}
                </p>
              </div>
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
              <DashboardFieldLabel label={locale === "ar" ? "السعر الأساسي بالشيكل" : "Base price (ILS)"}>
                <input required type="number" min={0.01} step="0.01" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={locale === "ar" ? "سعر الأعضاء بالشيكل" : "Member price (ILS)"}>
                <input type="number" min={0.01} step="0.01" value={productForm.memberPrice} onChange={(event) => setProductForm((current) => ({ ...current, memberPrice: event.target.value }))} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    <LinkIcon className="h-4 w-4" />
                    {imageLabels.url}
                  </span>
                  <input placeholder={labels.productImagePlaceholder} value={productForm.image} onChange={(event) => setProductForm((current) => ({ ...current, image: event.target.value }))} className={dashboardFieldClass} />
                  <input
                    placeholder={labels.productImagePlaceholder}
                    value={productForm.imageTwo}
                    onChange={(event) => setProductForm((current) => ({ ...current, imageTwo: event.target.value }))}
                    className={`${dashboardFieldClass} mt-3`}
                  />
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
              {localProducts.map((product) => (
                <div key={product.id} className={`${dashboardPanelClass} grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start`}>
                  <div className="min-w-0">
                    <p className="break-words font-medium text-brand-primary">{product.name}</p>
                    <p className={`text-sm ${dashboardMutedTextClass}`}>
                      {product.company} - {translateProductCategory(product.category, locale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge>
                      {formatNumber(product.stock, locale)}
                    </Badge>
                    <span className="text-sm font-medium text-brand-primary">
                      {formatCurrency(product.memberPrice ?? product.price, STORE_CURRENCY, locale)}
                    </span>
                    <Link href={`/store/${encodeURIComponent(product.slug || product.id)}`}>
                      <Button variant="secondary" size="sm" type="button">
                        <ExternalLink className="h-4 w-4" />
                        {adminLabels.details}
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={loadingAction === `delete-product-${product.id}`}
                      onClick={() => {
                        if (!window.confirm(adminLabels.confirmDeleteProduct)) {
                          return;
                        }

                        void runAction(`delete-product-${product.id}`, async () => {
                          await deleteProductAdmin(product.id);
                          await refreshClientProducts();
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      {labels.delete}
                    </Button>
                  </div>
                  <details className={`${dashboardSubtlePanelClass} lg:col-span-2`}>
                    <summary className="cursor-pointer text-sm font-semibold text-brand-primary">
                      {adminLabels.edit}
                    </summary>
                    <form
                      className="mt-4 grid gap-3 md:grid-cols-2"
                      onSubmit={(submitEvent) => {
                        submitEvent.preventDefault();
                        const formData = new FormData(submitEvent.currentTarget);
                        void runAction(`edit-product-${product.id}`, async () => {
                          const removedImages = new Set(getTexts(formData, "removeImages"));
                          const imageUrls = getTexts(formData, "images").filter(
                            (image) => !removedImages.has(image)
                          );
                          const imageFiles = formData
                            .getAll("imageFiles")
                            .filter((entry): entry is File => entry instanceof File && entry.size > 0);
                          const uploadedImages = await Promise.all(
                            imageFiles.map((file) => uploadDashboardImage("products", file))
                          );
                          await upsertProductAdmin({
                            id: product.id,
                            name: getText(formData, "name"),
                            price: getNumber(formData, "price", product.price),
                            memberPrice: getNumber(formData, "memberPrice", product.memberPrice ?? product.price),
                            stock: getNumber(formData, "stock", product.stock),
                            category: getText(formData, "category") as ProductCategory,
                            company: getText(formData, "company"),
                            images: [...imageUrls, ...uploadedImages],
                            description: getText(formData, "description"),
                            longDescription: splitLines(getText(formData, "longDescription")),
                            featured: formData.get("featured") === "on"
                          });
                          await refreshClientProducts();
                        });
                      }}
                    >
                      <DashboardFieldLabel label={labels.productNamePlaceholder}>
                        <input name="name" required defaultValue={product.name} className={`${dashboardEditFieldClass} w-full`} />
                      </DashboardFieldLabel>
                      <DashboardFieldLabel label={labels.productCompanyPlaceholder}>
                        <input name="company" defaultValue={product.company} className={`${dashboardEditFieldClass} w-full`} />
                      </DashboardFieldLabel>
                      <DashboardFieldLabel label={locale === "ar" ? "تصنيف المنتج" : "Product category"}>
                        <select name="category" defaultValue={product.category} className={`${dashboardEditFieldClass} w-full`}>
                          {productCategories.map((entry) => (
                            <option key={entry} value={entry}>
                              {translateProductCategory(entry, locale)}
                            </option>
                          ))}
                        </select>
                      </DashboardFieldLabel>
                      <DashboardFieldLabel label={locale === "ar" ? "كمية المخزون" : "Stock quantity"}>
                        <input name="stock" required type="number" min={0} defaultValue={product.stock} className={`${dashboardEditFieldClass} w-full`} />
                      </DashboardFieldLabel>
                      <DashboardFieldLabel label={locale === "ar" ? "السعر الأساسي" : "Base price"}>
                        <input name="price" required type="number" min={0.01} step="0.01" defaultValue={product.price} className={`${dashboardEditFieldClass} w-full`} />
                      </DashboardFieldLabel>
                      <DashboardFieldLabel label={locale === "ar" ? "سعر الأعضاء" : "Member price"}>
                        <input name="memberPrice" type="number" min={0.01} step="0.01" defaultValue={product.memberPrice ?? product.price} className={`${dashboardEditFieldClass} w-full`} />
                      </DashboardFieldLabel>
                      <div className="space-y-3 md:col-span-2">
                        <p className="text-sm font-semibold text-brand-primary dark:text-brand-ink">
                          {locale === "ar" ? "صور المنتج" : "Product images"}
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          {product.images.length ? (
                            product.images.map((image, imageIndex) => (
                              <div key={`${product.id}-image-${imageIndex}`} className="rounded-xl border border-brand-primary/10 bg-white/70 p-3 dark:border-white/12 dark:bg-[#101a2b]">
                                <div className="relative mb-3 h-28 overflow-hidden rounded-lg bg-brand-sky dark:bg-white/10">
                                  <SmartImage
                                    src={image}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 280px"
                                  />
                                </div>
                                <DashboardFieldLabel label={locale === "ar" ? "رابط الصورة المحفوظة" : "Saved image URL"}>
                                  <input name="images" defaultValue={image} className={`${dashboardEditFieldClass} w-full`} />
                                </DashboardFieldLabel>
                                <label className="mt-3 flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-300">
                                  <input name="removeImages" type="checkbox" value={image} />
                                  {locale === "ar" ? "حذف هذه الصورة" : "Remove this image"}
                                </label>
                              </div>
                            ))
                          ) : (
                            <p className={`rounded-xl border border-dashed border-brand-primary/15 p-4 text-sm ${dashboardMutedTextClass}`}>
                              {locale === "ar" ? "لا توجد صور محفوظة لهذا المنتج." : "No saved images for this product."}
                            </p>
                          )}
                        </div>
                        <DashboardFieldLabel label={locale === "ar" ? "رابط صورة جديد اختياري" : "Optional new image URL"}>
                          <input
                            name="images"
                            placeholder={locale === "ar" ? "رابط صورة جديد اختياري" : "Optional new image URL"}
                            className={`${dashboardEditFieldClass} w-full`}
                          />
                        </DashboardFieldLabel>
                      </div>
                      <label className={`${dashboardLabelClass} md:col-span-2`}>
                        <span>{imageLabels.uploadMany}</span>
                        <input name="imageFiles" type="file" accept="image/*" multiple className={dashboardEditFieldClass} />
                      </label>
                      <DashboardFieldLabel label={labels.productDescriptionPlaceholder} className="md:col-span-2">
                        <textarea name="description" defaultValue={product.description} className={`${dashboardEditTextAreaClass} w-full`} />
                      </DashboardFieldLabel>
                      <DashboardFieldLabel label={labels.productLongDescriptionPlaceholder} className="md:col-span-2">
                        <textarea name="longDescription" defaultValue={product.longDescription.join("\n")} className={`${dashboardEditFieldClass} min-h-24 w-full`} />
                      </DashboardFieldLabel>
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

          {showArchiveSection ? (
          <Card id="event-archive" className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                  {adminLabels.eventArchive}
                </h2>
                <p className={`mt-2 max-w-3xl text-sm leading-7 ${dashboardMutedTextClass}`}>
                  {adminLabels.archivedEventGuidance}
                </p>
              </div>
              <Badge>
                {mode === "moderator"
                  ? locale === "ar"
                    ? "متاح للمشرف"
                    : "Moderator access"
                  : locale === "ar"
                    ? "متاح للمدير والمشرف"
                    : "Admin and moderator access"}
              </Badge>
            </div>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void runAction("create-archived-event", async () => {
                  const uploadedImages = await Promise.all(
                    archivedEventImageFiles.map((file) =>
                      uploadDashboardImage("archived-events", file)
                    )
                  );

                  await upsertArchivedEventAdmin({
                    title: archivedEventForm.title,
                    eventDate: archivedEventForm.eventDate,
                    venue: archivedEventForm.venue,
                    excerpt: archivedEventForm.excerpt,
                    description: splitLines(archivedEventForm.description),
                    tags: splitCsv(archivedEventForm.tags),
                    images: [...splitLines(archivedEventForm.images), ...uploadedImages]
                  });

                  setArchivedEventForm({
                    title: "",
                    eventDate: "",
                    venue: "",
                    excerpt: "",
                    description: "",
                    tags: "",
                    images: ""
                  });
                  setArchivedEventImageFiles([]);
                  await refreshClientArchivedEvents();
                });
              }}
            >
              <DashboardFieldLabel label={labels.eventTitlePlaceholder}>
                <input
                  required
                  value={archivedEventForm.title}
                  onChange={(event) =>
                    setArchivedEventForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder={labels.eventTitlePlaceholder}
                  className={dashboardFieldClass}
                />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={adminLabels.archivedEventDate}>
                <input
                  required
                  type="datetime-local"
                  value={archivedEventForm.eventDate}
                  onChange={(event) =>
                    setArchivedEventForm((current) => ({
                      ...current,
                      eventDate: event.target.value
                    }))
                  }
                  className={dashboardFieldClass}
                />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={labels.eventVenuePlaceholder}>
                <input
                  value={archivedEventForm.venue}
                  onChange={(event) =>
                    setArchivedEventForm((current) => ({ ...current, venue: event.target.value }))
                  }
                  placeholder={labels.eventVenuePlaceholder}
                  className={dashboardFieldClass}
                />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={labels.eventTagsPlaceholder}>
                <input
                  value={archivedEventForm.tags}
                  onChange={(event) =>
                    setArchivedEventForm((current) => ({ ...current, tags: event.target.value }))
                  }
                  placeholder={labels.eventTagsPlaceholder}
                  className={dashboardFieldClass}
                />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={labels.eventExcerptPlaceholder} className="md:col-span-2">
                <textarea
                  value={archivedEventForm.excerpt}
                  onChange={(event) =>
                    setArchivedEventForm((current) => ({ ...current, excerpt: event.target.value }))
                  }
                  placeholder={labels.eventExcerptPlaceholder}
                  className={dashboardTextAreaClass}
                />
              </DashboardFieldLabel>
              <DashboardFieldLabel
                label={labels.eventDescriptionPlaceholder}
                className="md:col-span-2"
              >
                <textarea
                  value={archivedEventForm.description}
                  onChange={(event) =>
                    setArchivedEventForm((current) => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                  placeholder={labels.eventDescriptionPlaceholder}
                  className={dashboardTextAreaClass}
                />
              </DashboardFieldLabel>
              <DashboardFieldLabel
                label={adminLabels.archivedEventImages}
                className="md:col-span-2"
              >
                <textarea
                  value={archivedEventForm.images}
                  onChange={(event) =>
                    setArchivedEventForm((current) => ({ ...current, images: event.target.value }))
                  }
                  placeholder="https://.../image-1.jpg"
                  className={dashboardTextAreaClass}
                />
              </DashboardFieldLabel>
              <DashboardFieldLabel
                label={imageLabels.uploadMany}
                className="md:col-span-2"
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) =>
                    setArchivedEventImageFiles(Array.from(event.target.files || []))
                  }
                  className={dashboardFieldClass}
                />
                <p className={`mt-2 text-xs leading-5 ${dashboardMutedTextClass}`}>
                  {adminLabels.archivedEventImagesHint}
                  {archivedEventImageFiles.length
                    ? ` ${imageLabels.selected}: ${archivedEventImageFiles
                        .map((file) => file.name)
                        .join(", ")}`
                    : ""}
                </p>
              </DashboardFieldLabel>
              <Button
                loading={loadingAction === "create-archived-event"}
                type="submit"
                className="md:col-span-2"
              >
                <Save className="h-4 w-4" />
                {adminLabels.addArchivedEvent}
              </Button>
            </form>

            <div className="grid gap-4">
              {localArchivedEvents.map((item) => (
                <div key={item.id} className={dashboardPanelClass}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/8">
                        {item.images[0] ? (
                          <SmartImage
                            src={item.images[0]}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Images className="h-7 w-7 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-brand-primary">{item.title}</p>
                        <p className={`text-sm ${dashboardMutedTextClass}`}>
                          {formatDateTime(item.eventDate, locale)} - {item.venue}
                        </p>
                        <p className={`mt-1 text-sm ${dashboardMutedTextClass}`}>
                          {adminLabels.archivedEventPhotoCount}: {formatNumber(item.images.length, locale)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={loadingAction === `delete-archived-event-${item.id}`}
                      onClick={() => {
                        if (!window.confirm(adminLabels.archivedEventDeleteConfirm)) {
                          return;
                        }

                        void runAction(`delete-archived-event-${item.id}`, async () => {
                          await deleteArchivedEventAdmin(item.id);
                          await refreshClientArchivedEvents();
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      {labels.delete}
                    </Button>
                  </div>

                  {item.excerpt ? (
                    <p className={`mt-4 text-sm leading-7 ${dashboardMutedTextClass}`}>
                      {item.excerpt}
                    </p>
                  ) : null}

                  {item.images.length ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {item.images.slice(0, 4).map((image, index) => (
                        <div
                          key={`${item.id}-preview-${index}`}
                          className="relative h-24 overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/8"
                        >
                          <SmartImage
                            src={image}
                            alt={`${item.title} ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="160px"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <details className={`mt-4 ${dashboardSubtlePanelClass}`}>
                    <summary className="cursor-pointer text-sm font-semibold text-brand-primary">
                      {adminLabels.edit}
                    </summary>
                    <form
                      className="mt-4 grid gap-3 md:grid-cols-2"
                      onSubmit={(submitEvent) => {
                        submitEvent.preventDefault();
                        const formData = new FormData(submitEvent.currentTarget);
                        void runAction(`edit-archived-event-${item.id}`, async () => {
                          const removedImages = new Set(getTexts(formData, "removeImages"));
                          const imageUrls = splitLines(getText(formData, "images")).filter(
                            (image) => !removedImages.has(image)
                          );
                          const imageFiles = formData
                            .getAll("imageFiles")
                            .filter(
                              (entry): entry is File => entry instanceof File && entry.size > 0
                            );
                          const uploadedImages = await Promise.all(
                            imageFiles.map((file) => uploadDashboardImage("archived-events", file))
                          );

                          await upsertArchivedEventAdmin({
                            id: item.id,
                            title: getText(formData, "title"),
                            eventDate: getText(formData, "eventDate"),
                            venue: getText(formData, "venue"),
                            excerpt: getText(formData, "excerpt"),
                            description: splitLines(getText(formData, "description")),
                            tags: splitCsv(getText(formData, "tags")),
                            images: [...imageUrls, ...uploadedImages]
                          });
                          await refreshClientArchivedEvents();
                        });
                      }}
                    >
                      <input
                        name="title"
                        required
                        defaultValue={item.title}
                        className={dashboardEditFieldClass}
                      />
                      <input
                        name="eventDate"
                        required
                        type="datetime-local"
                        defaultValue={toInputDateTime(item.eventDate)}
                        className={dashboardEditFieldClass}
                      />
                      <input
                        name="venue"
                        defaultValue={item.venue}
                        className={dashboardEditFieldClass}
                      />
                      <input
                        name="tags"
                        defaultValue={item.tags.join(", ")}
                        className={dashboardEditFieldClass}
                      />
                      <textarea
                        name="excerpt"
                        defaultValue={item.excerpt}
                        className={`${dashboardEditTextAreaClass} md:col-span-2`}
                      />
                      <textarea
                        name="description"
                        defaultValue={item.description.join("\n")}
                        className={`${dashboardEditTextAreaClass} md:col-span-2`}
                      />
                      <textarea
                        name="images"
                        defaultValue={item.images.join("\n")}
                        className={`${dashboardEditTextAreaClass} md:col-span-2`}
                      />
                      {item.images.length ? (
                        <div className="grid gap-3 md:col-span-2 sm:grid-cols-2 lg:grid-cols-3">
                          {item.images.map((image, index) => (
                            <label
                              key={`${item.id}-remove-${index}`}
                              className="space-y-2 rounded-2xl border border-brand-primary/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5"
                            >
                              <div className="relative h-24 overflow-hidden rounded-xl bg-slate-100 dark:bg-white/8">
                                <SmartImage
                                  src={image}
                                  alt={`${item.title} ${index + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="160px"
                                />
                              </div>
                              <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-brand-mist">
                                <input name="removeImages" type="checkbox" value={image} />
                                {locale === "ar" ? "إزالة هذه الصورة" : "Remove this photo"}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : null}
                      <input
                        name="imageFiles"
                        type="file"
                        multiple
                        accept="image/*"
                        className={`${dashboardEditFieldClass} md:col-span-2`}
                      />
                      <Button
                        loading={loadingAction === `edit-archived-event-${item.id}`}
                        type="submit"
                        className="md:col-span-2"
                      >
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
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                  {adminLabels.boardMembers}
                </h2>
                <p className={`mt-2 max-w-2xl text-sm leading-7 ${dashboardMutedTextClass}`}>
                  {adminLabels.boardGuidance}
                </p>
              </div>
              <Badge>{locale === "ar" ? "يعرض أحدث سنة تلقائياً" : "Latest year shown automatically"}</Badge>
            </div>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(submitEvent) => {
                submitEvent.preventDefault();
                const form = submitEvent.currentTarget;
                const formData = new FormData(form);
                void runAction("create-board-member", async () => {
                  const uploadedImage = boardMemberImageFile
                    ? await uploadDashboardImage("board", boardMemberImageFile)
                    : "";
                  await upsertBoardMemberAdmin({
                    name: getText(formData, "name"),
                    role: getText(formData, "role"),
                    year: getText(formData, "year"),
                    order: getNumber(formData, "order", 99),
                    image: uploadedImage || getText(formData, "image"),
                    bio: getText(formData, "bio")
                  });
                  setBoardMemberImageFile(null);
                  form.reset();
                  await refreshClientBoardMembers();
                });
              }}
            >
              <DashboardFieldLabel label={locale === "ar" ? "اسم عضو الهيئة" : "Board member name"}>
                <input name="name" required placeholder={adminLabels.addBoardMember} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={adminLabels.role}>
                <select name="role" required className={dashboardFieldClass} defaultValue={boardRolePresets[0]}>
                  {boardRolePresets.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </DashboardFieldLabel>
              <DashboardFieldLabel label={adminLabels.order}>
                <input name="order" required type="number" min={1} defaultValue={1} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={adminLabels.year}>
                <input name="year" required defaultValue={currentBoardYear} placeholder={adminLabels.year} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={adminLabels.image}>
                <input name="image" placeholder={adminLabels.image} className={dashboardFieldClass} />
              </DashboardFieldLabel>
              <DashboardFieldLabel label={locale === "ar" ? "رفع صورة من الجهاز" : "Upload photo"} className="md:col-span-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setBoardMemberImageFile(event.target.files?.[0] || null)}
                  className={dashboardFieldClass}
                />
                {boardMemberImageFile ? (
                  <span className={`block text-xs ${dashboardMutedTextClass}`}>
                    {locale === "ar" ? "تم اختيار" : "Selected"}: {boardMemberImageFile.name}
                  </span>
                ) : null}
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
              {localBoardMembers.map((member) => (
                <div key={member.id} className={dashboardPanelClass}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-brand-primary">{member.name}</p>
                      <p className={`text-sm ${dashboardMutedTextClass}`}>
                        {member.role} - {member.year} - #{formatNumber(member.order ?? 99, locale)}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={loadingAction === `delete-board-member-${member.id}`}
                      onClick={() => {
                        if (!window.confirm(adminLabels.confirmDeleteBoardMember)) {
                          return;
                        }

                        void runAction(`delete-board-member-${member.id}`, async () => {
                          await deleteBoardMemberAdmin(member.id);
                          await refreshClientBoardMembers();
                        });
                      }}
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
                        void runAction(`edit-board-member-${member.id}`, async () => {
                          const imageFile = formData.get("imageFile");
                          const uploadedImage =
                            imageFile instanceof File && imageFile.size > 0
                              ? await uploadDashboardImage("board", imageFile)
                              : "";
                          await upsertBoardMemberAdmin({
                            id: member.id,
                            name: getText(formData, "name"),
                            role: getText(formData, "role"),
                            year: getText(formData, "year"),
                            order: getNumber(formData, "order", member.order ?? 99),
                            image: uploadedImage || getText(formData, "image"),
                            bio: getText(formData, "bio")
                          });
                          await refreshClientBoardMembers();
                        });
                      }}
                    >
                      <input name="name" required defaultValue={member.name} className={dashboardEditFieldClass} />
                      <select name="role" required defaultValue={member.role} className={dashboardEditFieldClass}>
                        {[member.role, ...boardRolePresets.filter((role) => role !== member.role)].map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <input name="order" required type="number" min={1} defaultValue={member.order ?? 99} className={dashboardEditFieldClass} />
                      <input name="year" required defaultValue={member.year} className={dashboardEditFieldClass} />
                      <input name="image" defaultValue={member.image} className={dashboardEditFieldClass} />
                      <input name="imageFile" type="file" accept="image/*" className={`${dashboardEditFieldClass} md:col-span-2`} />
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
              {localUsers.map((entry) => (
                <div key={entry.id} className={`${dashboardPanelClass} grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center`}>
                  <div>
                    <p className="font-medium text-brand-primary">{entry.displayName}</p>
                    <p className={`text-sm ${dashboardMutedTextClass}`}>{entry.email}</p>
                    <p className={`text-xs ${dashboardMutedTextClass}`}>
                      {entry.membershipId || entry.id}
                      {entry.phone ? ` | ${entry.phone}` : ""}
                    </p>
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
                      void runAction(`user-${entry.id}`, async () => {
                        await updateUserAdmin({
                          uid: entry.id,
                          role,
                          membershipStatus
                        });
                        await refreshClientUsers();
                      });
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

                      void runAction(`delete-user-${entry.id}`, async () => {
                        await deleteUserAdmin(entry.id);
                        await refreshClientUsers();
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    {labels.delete}
                  </Button>
                </div>
              ))}
              {!localUsers.length ? (
                <div className={`${dashboardPanelClass} text-sm ${dashboardMutedTextClass}`}>
                  {locale === "ar"
                    ? "لا توجد بيانات مستخدمين محمّلة حاليًا. إذا كانت الحسابات موجودة في Firebase فسيتم جلبها تلقائيًا عند توفر القراءة."
                    : "No user records are currently loaded. Existing Firebase users will appear here once the dashboard can read them."}
                </div>
              ) : null}
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
                              {formatNumber(item.quantity, locale)} x {formatCurrency(item.price, STORE_CURRENCY, locale)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="grid gap-1 text-sm text-slate-600 dark:text-brand-mist">
                        <p>{orderDetailLabels.subtotal}: {formatCurrency(order.subtotal, STORE_CURRENCY, locale)}</p>
                        <p>{orderDetailLabels.discount}: {formatCurrency(order.discount, STORE_CURRENCY, locale)}</p>
                        <p className="font-semibold text-brand-primary">
                          {orderDetailLabels.total}: {formatCurrency(order.total, STORE_CURRENCY, locale)}
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
                const form = submitEvent.currentTarget;
                const formData = new FormData(form);
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
                  form.reset();
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
