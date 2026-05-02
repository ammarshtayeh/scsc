"use client";

import { useLocaleContext } from "@/components/providers/locale-provider";

export function useLocale() {
  return useLocaleContext();
}
