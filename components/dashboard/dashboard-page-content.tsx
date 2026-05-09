import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PageHero } from "@/components/ui/page-hero";
import {
  getAllOrders,
  getAllProducts,
  getAllUsers,
  getArticlesForModeration,
  getDashboardStats,
  getUpcomingEvents
} from "@/lib/firebase/queries";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";

interface DashboardPageContentProps {
  mode?: "admin" | "moderator";
}

export async function DashboardPageContent({ mode = "admin" }: DashboardPageContentProps) {
  const dictionary = getServerDictionary();
  const locale = getServerLocale();
  const [stats, events, products, users, orders, articles] = await Promise.all([
    getDashboardStats(),
    getUpcomingEvents(8),
    getAllProducts(),
    getAllUsers(),
    getAllOrders(),
    getArticlesForModeration()
  ]);

  return (
    <>
      <PageHero
        eyebrow={mode === "moderator" ? dictionary.dashboard.moderation : dictionary.dashboard.eyebrow}
        title={mode === "moderator" ? dictionary.dashboard.moderation : dictionary.dashboard.title}
        description={dictionary.dashboard.description}
      />
      <DashboardShell
        stats={stats}
        events={events}
        products={products}
        users={users}
        orders={orders}
        articles={articles}
        locale={locale}
        labels={dictionary.dashboard}
        mode={mode}
      />
    </>
  );
}
