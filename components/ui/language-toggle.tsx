"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/useLocale";

export function LanguageToggle() {
  const router = useRouter();
  const { locale, dictionary, setLocale } = useLocale();

  function handleChange(nextLocale: "en" | "ar") {
    if (nextLocale === locale) {
      return;
    }

    setLocale(nextLocale);
    router.refresh();
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/20 bg-white/85 p-1.5 shadow-card hover:shadow-soft transition-shadow dark:border-white/10 dark:bg-brand-surface/84">
      <span className="flex h-8 w-8 items-center justify-center text-brand-primary dark:text-brand-ink">
        <Languages className="h-4 w-4" />
      </span>
      <Button
        size="sm"
        variant={locale === "en" ? "primary" : "ghost"}
        aria-label={dictionary.languageToggle.switchToEnglish}
        onClick={() => handleChange("en")}
        className={locale === "en" ? "" : "hover:bg-brand-sky/60"}
      >
        {dictionary.languageToggle.english}
      </Button>
      <Button
        size="sm"
        variant={locale === "ar" ? "primary" : "ghost"}
        aria-label={dictionary.languageToggle.switchToArabic}
        onClick={() => handleChange("ar")}
        className={locale === "ar" ? "" : "hover:bg-brand-sky/60"}
      >
        {dictionary.languageToggle.arabic}
      </Button>
    </div>
  );
}
