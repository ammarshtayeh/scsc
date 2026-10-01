"use client";

import Link from "next/link";

import { SiteLogo } from "@/components/ui/site-logo";
import { useLocale } from "@/hooks/useLocale";

export function Footer() {
  const { dictionary } = useLocale();
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL;
  const isArabic = dictionary.localeName === "العربية";
  const navLinks = [
    { href: "/", label: dictionary.nav.home },
    { href: "/about", label: dictionary.nav.about },
    { href: "/education", label: dictionary.nav.education },
    { href: "/events", label: dictionary.nav.events },
    { href: "/jobs", label: dictionary.nav.jobs },
    { href: "/contact", label: dictionary.nav.contact },
    { href: "/store", label: dictionary.nav.store }
  ];

  return (
    <footer className="mt-16 px-4 pb-4 sm:px-6 lg:px-8">
      <div className="glass-surface mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-[32px] border border-white/70 px-5 py-12 text-brand-primary shadow-soft dark:border-white/10 dark:text-brand-ink sm:px-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0 space-y-3">
          <SiteLogo
            title={dictionary.site.title}
            university={dictionary.site.university}
            shortName="SCSC"
          />
          <p className="text-pretty text-sm text-[#445061] dark:text-[#d7e1f1]">
            {dictionary.site.description}
          </p>
        </div>
        <div className="min-w-0">
          <h4 className="font-heading text-lg font-semibold text-brand-primary dark:text-white">
            {dictionary.footer.explore}
          </h4>
          <div className="mt-3 flex flex-col gap-2 text-sm text-[#445061] dark:text-[#d7e1f1]">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="break-words transition hover:text-brand-primary dark:hover:text-brand-accent">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <h4 className="font-heading text-lg font-semibold text-brand-primary dark:text-white">
            {dictionary.footer.contact}
          </h4>
          <div className="mt-3 space-y-2 text-sm text-[#445061] dark:text-[#d7e1f1]">
            <p className="break-all">scsc@najah.edu</p>
            {instagramUrl ? (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="block break-words font-medium text-brand-primary underline underline-offset-4 dark:text-brand-accent"
              >
                {dictionary.footer.instagram}
              </a>
            ) : null}
            <p className="text-pretty">{dictionary.footer.location}</p>
            <p className="text-pretty">{dictionary.footer.officeHours}</p>
          </div>
        </div>
        <div className="min-w-0">
          <h4 className="font-heading text-lg font-semibold text-brand-primary dark:text-white">
            {dictionary.footer.membership}
          </h4>
          <p className="mt-3 text-pretty text-sm text-[#445061] dark:text-[#d7e1f1]">
            {dictionary.footer.membershipText}
          </p>
          <Link
            href="/privacy"
            className="mt-4 inline-block text-sm font-medium text-brand-primary underline underline-offset-4 dark:text-brand-accent"
          >
            {isArabic ? "سياسة الخصوصية وشروط الاستخدام" : "Privacy policy & terms"}
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-3 flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 text-center text-xs text-[#5b6677] dark:text-[#aebbd0]">
        <span>© {new Date().getFullYear()} SCSC-NNU</span>
        <span aria-hidden="true">·</span>
        <span>
          {isArabic ? "تم تطوير الموقع بواسطة عمار اشتية" : "Developed by Ammar Shtayeh"}
          {" — "}
          <a
            href="https://www.instagram.com/zeriv.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-primary underline-offset-4 hover:underline dark:text-brand-accent"
          >
            ZerivTech
          </a>
        </span>
      </div>
    </footer>
  );
}
