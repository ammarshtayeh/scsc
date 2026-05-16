import { clsx, type ClassValue } from "clsx";
import { arSA, enUS } from "date-fns/locale";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

import { getIntlLocale, type AppLocale } from "@/lib/i18n/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const arabicIndicDigits = /[\u0660-\u0669\u06f0-\u06f9]/g;

const digitMap: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9"
};

function getLatinNumberLocale(locale: AppLocale) {
  return `${getIntlLocale(locale)}-u-nu-latn`;
}

function normalizeDigits(value: string) {
  return value.replace(arabicIndicDigits, (digit) => digitMap[digit] || digit);
}

export function formatCurrency(amount: number, currency = "ILS", locale: AppLocale = "en") {
  return new Intl.NumberFormat(getLatinNumberLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    numberingSystem: "latn"
  }).format(amount);
}

export function formatNumber(value: number, locale: AppLocale = "en") {
  return new Intl.NumberFormat(getLatinNumberLocale(locale), {
    numberingSystem: "latn"
  }).format(value);
}

export function formatDate(
  date: string | number | Date,
  pattern = "MMM d, yyyy",
  locale: AppLocale = "en"
) {
  return normalizeDigits(
    format(new Date(date), pattern, {
      locale: locale === "ar" ? arSA : enUS
    })
  );
}

export function formatDateShort(date: string | number | Date, locale: AppLocale = "en") {
  return new Intl.DateTimeFormat(getLatinNumberLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    numberingSystem: "latn"
  }).format(new Date(date));
}

export function formatDateLong(date: string | number | Date, locale: AppLocale = "en") {
  return new Intl.DateTimeFormat(getLatinNumberLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    numberingSystem: "latn"
  }).format(new Date(date));
}

export function formatDateTime(date: string | number | Date, locale: AppLocale = "en") {
  return new Intl.DateTimeFormat(getLatinNumberLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    numberingSystem: "latn"
  }).format(new Date(date));
}

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function absoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return new URL(path, base).toString();
}

export function safeNumber(value: string | number | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const IMAGE_SOURCE_PATTERN =
  /^(https?:\/\/.+|data:image\/.+|blob:.+|\/.+\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)([?#].*)?)$/i;

const VIDEO_SOURCE_PATTERN =
  /^(https?:\/\/.+|blob:.+|\/.+\.(mp4|m4v|mov|ogg|ogv|webm)([?#].*)?)$/i;

export function isValidImageSource(value: unknown) {
  return typeof value === "string" && IMAGE_SOURCE_PATTERN.test(value.trim());
}

export function sanitizeImageSource(value: unknown, fallback = "") {
  return isValidImageSource(value) ? String(value).trim() : fallback;
}

export function sanitizeImageSources(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => isValidImageSource(entry)).map((entry) => entry.trim())
    : [];
}

export function isValidVideoSource(value: unknown) {
  return typeof value === "string" && VIDEO_SOURCE_PATTERN.test(value.trim());
}

export function sanitizeVideoSource(value: unknown, fallback = "") {
  return isValidVideoSource(value) ? String(value).trim() : fallback;
}
