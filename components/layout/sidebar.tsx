"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLocale } from "@/hooks/useLocale";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { dictionary } = useLocale();
  const basePath = pathname.startsWith("/admin")
    ? "/admin"
    : pathname.startsWith("/moderator")
      ? "/moderator"
      : "/dashboard";
  const isModeratorPanel = basePath === "/moderator";
  const dashboardLinks = isModeratorPanel
    ? [
        { href: "/moderator", label: dictionary.dashboard.overview },
        { href: "/moderator/moderation#moderation", label: dictionary.dashboard.moderation }
      ]
    : [
        { href: basePath, label: dictionary.dashboard.overview },
        { href: `${basePath}/events#events`, label: dictionary.nav.events },
        { href: `${basePath}/registrants#registrants`, label: dictionary.dashboard.eventRegistrants || "Registrants" },
        { href: `${basePath}/products#products`, label: dictionary.dashboard.productManagement },
        { href: `${basePath}/board-members#board-members`, label: dictionary.dashboard.boardMembers || "Board" },
        { href: `${basePath}/users#users`, label: dictionary.dashboard.userManagement },
        { href: `${basePath}/orders#orders`, label: dictionary.dashboard.orders },
        { href: `${basePath}/moderation#moderation`, label: dictionary.dashboard.moderation }
      ];

  return (
    <aside className="rounded-[28px] border border-white/50 bg-white/88 p-5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1b2e]/92 dark:shadow-[0_18px_46px_rgba(3,8,18,0.42)]">
      <h2 className="font-heading text-xl font-semibold text-brand-primary dark:text-brand-ink">
        {dictionary.dashboard.sectionTitle}
      </h2>
      <div className="mt-5 flex flex-col gap-2">
        {dashboardLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-medium transition",
              pathname === link.href.split("#")[0]
                ? "bg-brand-primary text-white shadow-soft dark:bg-[#2b5794] dark:text-white"
                : "text-slate-700 hover:bg-brand-sky hover:text-brand-primary dark:text-brand-mist dark:hover:bg-white/8 dark:hover:text-white"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
