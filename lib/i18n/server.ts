import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  normalizeLocale,
  type AppLocale
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function getServerLocale(): AppLocale {
  try {
    const cookieStore = cookies();
    return normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function getServerDictionary() {
  return getDictionary(getServerLocale());
}
