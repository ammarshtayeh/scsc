"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import {
  getDirection,
  LOCALE_COOKIE_NAME,
  type AppLocale
} from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";

interface LocaleContextValue {
  locale: AppLocale;
  direction: "ltr" | "rtl";
  dictionary: Dictionary;
  setLocale: (locale: AppLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function persistLocale(locale: AppLocale) {
  if (typeof window === "undefined") {
    return;
  }

  const maxAge = 60 * 60 * 24 * 365;
  window.localStorage.setItem(LOCALE_COOKIE_NAME, locale);
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function applyDocumentLocale(locale: AppLocale) {
  if (typeof document === "undefined") {
    return;
  }

  const direction = getDirection(locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = direction;
}

export function LocaleProvider({
  children,
  initialLocale
}: {
  children: ReactNode;
  initialLocale: AppLocale;
}) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
    applyDocumentLocale(initialLocale);
    persistLocale(initialLocale);
  }, [initialLocale]);

  const setLocale = (nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    applyDocumentLocale(nextLocale);
    persistLocale(nextLocale);
  };

  const value = useMemo(
    () => ({
      locale,
      direction: getDirection(locale),
      dictionary: getDictionary(locale),
      setLocale
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocaleContext must be used inside LocaleProvider");
  }

  return context;
}
