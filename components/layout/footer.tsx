import Link from "next/link";

import { SiteLogo } from "@/components/ui/site-logo";
import { getServerDictionary } from "@/lib/i18n/server";

export function Footer() {
  const dictionary = getServerDictionary();
  const navLinks = [
    { href: "/", label: dictionary.nav.home },
    { href: "/about", label: dictionary.nav.about },
    { href: "/education", label: dictionary.nav.education },
    { href: "/events", label: dictionary.nav.events },
    { href: "/contact", label: dictionary.nav.contact },
    { href: "/store", label: dictionary.nav.store }
  ];

  return (
    <footer className="border-t border-white/60 bg-white/78 backdrop-blur-2xl dark:border-white/10 dark:bg-brand-surface/88">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="min-w-0 space-y-3">
          <SiteLogo
            title={dictionary.site.title}
            university={dictionary.site.university}
            shortName="SCSC"
          />
          <p className="text-pretty text-sm text-slate-600 dark:text-brand-mist">
            {dictionary.site.description}
          </p>
        </div>
        <div className="min-w-0">
          <h4 className="font-heading text-lg font-semibold text-brand-primary dark:text-brand-ink">
            {dictionary.footer.explore}
          </h4>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600 dark:text-brand-mist">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="break-words hover:text-brand-accent">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <h4 className="font-heading text-lg font-semibold text-brand-primary dark:text-brand-ink">
            {dictionary.footer.contact}
          </h4>
          <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-brand-mist">
            <p className="break-all">scsc@najah.edu</p>
            <p className="text-pretty">{dictionary.footer.location}</p>
            <p className="text-pretty">{dictionary.footer.officeHours}</p>
          </div>
        </div>
        <div className="min-w-0">
          <h4 className="font-heading text-lg font-semibold text-brand-primary dark:text-brand-ink">
            {dictionary.footer.membership}
          </h4>
          <p className="mt-3 text-pretty text-sm text-slate-600 dark:text-brand-mist">
            {dictionary.footer.membershipText}
          </p>
        </div>
      </div>
    </footer>
  );
}
