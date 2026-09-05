"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShoppingBag, User2, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { getManagementPortalHref, getProfileHref } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";
import { Button, getButtonClassName } from "@/components/ui/button";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { SiteLogo } from "@/components/ui/site-logo";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

export function Navbar() {
  const pathname = usePathname();
  const { user, loading: authLoading, logout } = useAuth();
  const { dictionary, locale } = useLocale();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/", label: dictionary.nav.home },
    { href: "/about", label: dictionary.nav.about },
    { href: "/education", label: dictionary.nav.education },
    { href: "/events", label: dictionary.nav.events },
    { href: "/jobs", label: dictionary.nav.jobs },
    { href: "/contact", label: dictionary.nav.contact }
  ];
  const portalHref = getManagementPortalHref(user?.role) || "/admin";
  const showPortal =
    user?.role === "admin" || user?.role === "moderator" || user?.role === "company";
  const profileHref = getProfileHref();
  const portalLabel =
    user?.role === "company"
      ? locale === "ar"
        ? "لوحة الشركة"
        : "Company Portal"
      : dictionary.nav.dashboard;

  const linkClass = (href: string) =>
    cn(
      "text-sm font-medium transition hover:text-brand-accent-strong dark:hover:text-[#f5d669]",
      pathname === href || (href !== "/" && pathname.startsWith(href))
        ? "text-brand-accent-strong dark:text-[#f5d669]"
        : "text-slate-700 dark:text-brand-mist"
    );

  const authActions = user ? (
    <>
      <Link href="/store" className={getButtonClassName({ variant: "secondary", size: "sm", className: "whitespace-nowrap" })}>
        <ShoppingBag className="h-4 w-4" />
        <span>{dictionary.nav.store}</span>
      </Link>
      {showPortal ? (
        <Link
          href={portalHref}
          className={getButtonClassName({
            variant: pathname.startsWith(portalHref) ? "primary" : "secondary",
            size: "sm",
            className: "whitespace-nowrap"
          })}
        >
          <span>{portalLabel}</span>
        </Link>
      ) : null}
      <Link
        href={profileHref}
        className={getButtonClassName({
          variant: pathname.startsWith("/profile") ? "secondary" : "ghost",
          size: "sm",
          className: "whitespace-nowrap"
        })}
      >
        <User2 className="h-4 w-4" />
        <span className="max-w-28 truncate">{user.displayName}</span>
      </Link>
      <Button variant="primary" size="sm" onClick={() => logout()} className="whitespace-nowrap">
        {dictionary.nav.logout}
      </Button>
    </>
  ) : (
    <>
      <Link href="/auth/login" className={getButtonClassName({ variant: "ghost", size: "sm", className: "whitespace-nowrap" })}>
        {dictionary.nav.login}
      </Link>
      <Link href="/auth/signup" className={getButtonClassName({ variant: "accent", size: "sm", className: "whitespace-nowrap" })}>
        {dictionary.nav.signup}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto max-w-[96rem]">
        <div className="glass-surface relative flex min-w-0 items-center gap-3 rounded-[24px] border border-white/70 px-3 py-3 shadow-soft ring-1 ring-brand-primary/5 dark:border-white/10 dark:ring-white/10 sm:gap-4 sm:px-5 sm:py-4 xl:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px] bg-brand-radial opacity-80" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 overflow-hidden rounded-l-[24px] bg-gradient-to-r from-white/35 to-transparent dark:from-white/5" />

          <Link href="/" className="relative z-10 shrink-0 lg:max-w-[18rem] xl:max-w-[22rem]">
            <SiteLogo
              compact
              title={dictionary.site.title}
              university={dictionary.site.university}
              className={locale === "ar" ? "text-right" : ""}
            />
          </Link>

          <nav className="relative z-10 hidden min-w-0 flex-1 items-center justify-center gap-3 xl:gap-4 lg:flex">
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

          <div className="relative z-10 ms-auto hidden shrink-0 items-center gap-2 lg:flex xl:gap-2.5">
            <ThemeSwitcher />
            <LanguageToggle />
            <PwaInstallButton />
            {authLoading ? (
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="h-9 w-16 animate-pulse rounded-full bg-brand-primary/10" />
                <span className="h-9 w-20 animate-pulse rounded-full bg-brand-primary/10" />
              </div>
            ) : (
              authActions
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="relative z-10 ms-auto shrink-0 lg:hidden"
            onClick={() => setOpen((current) => !current)}
            aria-label={dictionary.nav.toggleNavigation}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-auto mt-2 max-w-[96rem] px-1 lg:hidden"
          >
            <nav className="glass-surface flex flex-col gap-3 rounded-[24px] border border-white/60 px-4 py-4 shadow-soft dark:border-white/10">
              <div className="flex flex-wrap items-center gap-3 pb-2">
                <ThemeSwitcher />
                <LanguageToggle />
                <PwaInstallButton />
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={linkClass(link.href)}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {authLoading ? (
                <div className="space-y-2 pt-1" aria-hidden="true">
                  <span className="block h-10 animate-pulse rounded-2xl bg-brand-primary/10" />
                  <span className="block h-10 animate-pulse rounded-2xl bg-brand-primary/10" />
                </div>
              ) : user ? (
                <>
                  <Link
                    href="/store"
                    onClick={() => setOpen(false)}
                    className="text-sm font-medium text-slate-700 dark:text-brand-mist"
                  >
                    {dictionary.nav.store}
                  </Link>
                  {showPortal ? (
                    <Link
                      href={portalHref}
                      onClick={() => setOpen(false)}
                      className="text-sm font-medium text-slate-700 dark:text-brand-mist"
                    >
                      {portalLabel}
                    </Link>
                  ) : null}
                  <Link
                    href={profileHref}
                    onClick={() => setOpen(false)}
                    className="text-sm font-medium text-slate-700 dark:text-brand-mist"
                  >
                    {dictionary.nav.profile}
                  </Link>
                  <Button size="sm" onClick={() => logout()}>
                    {dictionary.nav.logout}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-3 pt-1">
                  <Link href="/auth/login" onClick={() => setOpen(false)} className="w-full">
                    <span className={getButtonClassName({ variant: "secondary", size: "sm", className: "w-full" })}>
                      {dictionary.nav.login}
                    </span>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setOpen(false)} className="w-full">
                    <span className={getButtonClassName({ variant: "accent", size: "sm", className: "w-full" })}>
                      {dictionary.nav.signup}
                    </span>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
