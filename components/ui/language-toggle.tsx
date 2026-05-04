"use client";

import { Globe2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { useLocale } from "@/hooks/useLocale";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const router = useRouter();
  const { locale, dictionary, setLocale } = useLocale();
  const options = [
    {
      value: "en" as const,
      label: dictionary.languageToggle.english,
      ariaLabel: dictionary.languageToggle.switchToEnglish
    },
    {
      value: "ar" as const,
      label: dictionary.languageToggle.arabic,
      ariaLabel: dictionary.languageToggle.switchToArabic
    }
  ];

  function handleChange(nextLocale: "en" | "ar") {
    if (nextLocale === locale) {
      return;
    }

    setLocale(nextLocale);
    router.refresh();
  }

  return (
    <div
      className="inline-flex h-11 items-center rounded-full border border-brand-primary/15 bg-white/90 p-1 shadow-card transition-shadow hover:shadow-soft dark:border-white/12 dark:bg-[#121f33]/90"
      role="group"
      aria-label={dictionary.languageToggle.label}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full text-brand-primary/70 dark:text-brand-ink/80">
        <Globe2 className="h-4 w-4" />
      </span>
      {options.map((option) => {
        const active = locale === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.ariaLabel}
            onClick={() => handleChange(option.value)}
            className={cn(
              "h-9 min-w-20 rounded-full px-4 text-sm font-semibold transition-all",
              active
                ? "bg-brand-primary text-white shadow-soft dark:bg-[#2b5794] dark:text-white"
                : "text-brand-primary/70 hover:bg-brand-sky/75 hover:text-brand-primary dark:text-brand-ink/72 dark:hover:bg-white/8 dark:hover:text-white"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
