"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLocale } from "@/hooks/useLocale";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { dictionary } = useLocale();
  const dashboardLinks = [
    { href: "/dashboard", label: dictionary.dashboard.overview },
    { href: "/dashboard#events", label: dictionary.nav.events },
    { href: "/dashboard#products", label: dictionary.store.eyebrow },
    { href: "/dashboard#users", label: dictionary.dashboard.userManagement },
    { href: "/dashboard#orders", label: dictionary.dashboard.orders },
    { href: "/dashboard#moderation", label: dictionary.dashboard.moderation }
  ];

  return (
    <aside className="rounded-[28px] border border-white/50 bg-white/80 p-5 shadow-soft backdrop-blur-xl">
      <h2 className="font-heading text-xl font-semibold text-brand-primary">
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
                ? "bg-brand-primary text-white"
                : "text-slate-600 hover:bg-brand-sky hover:text-brand-primary"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
