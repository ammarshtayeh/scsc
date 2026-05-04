import Link from "next/link";

import { SiteLogo } from "@/components/ui/site-logo";
import { getServerDictionary } from "@/lib/i18n/server";

export function Footer() {
  const dictionary = getServerDictionary();
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL;
  const navLinks = [
    { href: "/", label: dictionary.nav.home },
    { href: "/about", label: dictionary.nav.about },
    { href: "/education", label: dictionary.nav.education },
    { href: "/events", label: dictionary.nav.events },
    { href: "/contact", label: dictionary.nav.contact },
    { href: "/store", label: dictionary.nav.store }
  ];

  return (
    <footer className="border-t border-brand-primary/10 bg-[#f2f0e8] text-brand-primary backdrop-blur-2xl dark:border-white/10 dark:bg-[#07101f] dark:text-brand-ink">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
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
                Instagram
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
        </div>
      </div>
    </footer>
  );
}
