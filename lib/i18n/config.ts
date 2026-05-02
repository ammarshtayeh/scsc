export const LOCALE_COOKIE_NAME = "scsc-locale";
export const LOCALES = ["en", "ar"] as const;
export const DEFAULT_LOCALE = "en";

export type AppLocale = (typeof LOCALES)[number];
export type AppDirection = "ltr" | "rtl";

export function isLocale(value: string | undefined | null): value is AppLocale {
  return Boolean(value && LOCALES.includes(value as AppLocale));
}

export function normalizeLocale(value: string | undefined | null): AppLocale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getDirection(locale: AppLocale): AppDirection {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getIntlLocale(locale: AppLocale) {
  return locale === "ar" ? "ar-PS" : "en-US";
}
