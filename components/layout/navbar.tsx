"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShoppingBag, User2, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { SiteLogo } from "@/components/ui/site-logo";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { dictionary, locale } = useLocale();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/", label: dictionary.nav.home },
    { href: "/about", label: dictionary.nav.about },
    { href: "/education", label: dictionary.nav.education },
    { href: "/events", label: dictionary.nav.events },
    { href: "/contact", label: dictionary.nav.contact },
    { href: "/store", label: dictionary.nav.store }
  ];
  const accountHref =
    user?.role === "admin" ? "/admin" : user?.role === "moderator" ? "/moderator" : "/profile";

  const linkClass = (href: string) =>
    cn(
      "text-sm font-medium transition hover:text-brand-accent",
      pathname === href ? "text-brand-accent" : "text-slate-700 dark:text-brand-mist"
    );

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-brand-background/72 backdrop-blur-2xl dark:border-white/10 dark:bg-brand-night/80">
      <div className="mx-auto flex max-w-[96rem] min-w-0 items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-10">
        <Link
          href="/"
          className="min-w-0 max-w-[calc(100vw-5rem)] flex-1 lg:max-w-[31rem] xl:max-w-[36rem]"
        >
          <SiteLogo
            compact
            title={dictionary.site.title}
            university={dictionary.site.university}
            className={locale === "ar" ? "text-right" : ""}
          />
        </Link>

        <nav className="hidden shrink-0 items-center gap-4 xl:gap-5 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                linkClass(link.href),
                "relative whitespace-nowrap after:absolute after:inset-x-0 after:-bottom-2 after:h-px after:origin-center after:scale-x-0 after:bg-brand-accent after:transition-transform hover:after:scale-x-100"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
          <ThemeSwitcher />
          <LanguageToggle />
          {user ? (
            <>
              <Link href="/store">
                <Button variant="secondary" size="sm" className="whitespace-nowrap">
                  <ShoppingBag className="h-4 w-4" />
                  <span>{dictionary.nav.store}</span>
                </Button>
              </Link>
              <Link href={accountHref}>
                <Button variant="ghost" size="sm" className="whitespace-nowrap">
                  <User2 className="h-4 w-4" />
                  <span className="max-w-28 truncate">{user.displayName}</span>
                </Button>
              </Link>
              <Button variant="primary" size="sm" onClick={() => logout()} className="whitespace-nowrap">
                {dictionary.nav.logout}
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="whitespace-nowrap">
                  {dictionary.nav.login}
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="accent" size="sm" className="whitespace-nowrap">
                  {dictionary.nav.signup}
                </Button>
              </Link>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 lg:hidden"
          onClick={() => setOpen((current) => !current)}
          aria-label={dictionary.nav.toggleNavigation}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-white/40 bg-brand-background px-4 py-4 dark:border-white/10 dark:bg-brand-night lg:hidden"
          >
            <nav className="flex flex-col gap-3">
              <div className="flex items-center gap-3 pb-2">
                <ThemeSwitcher />
                <LanguageToggle />
              </div>
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass(link.href)} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700 dark:text-brand-mist">
                    {dictionary.nav.profile}
                  </Link>
                  {(user.role === "admin" || user.role === "moderator") && (
                    <Link href={accountHref} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700 dark:text-brand-mist">
                      {dictionary.nav.dashboard}
                    </Link>
                  )}
                  <Button size="sm" onClick={() => logout()}>
                    {dictionary.nav.logout}
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      {dictionary.nav.login}
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setOpen(false)}>
                    <Button variant="accent" size="sm" className="w-full">
                      {dictionary.nav.signup}
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
