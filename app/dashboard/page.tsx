import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PageHero } from "@/components/ui/page-hero";
import {
  getAllArticles,
  getAllOrders,
  getAllProducts,
  getAllUsers,
  getDashboardStats,
  getUpcomingEvents
} from "@/lib/firebase/queries";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";

export default async function DashboardPage() {
  const dictionary = getServerDictionary();
  const locale = getServerLocale();
  const [stats, events, products, users, orders, articles] = await Promise.all([
    getDashboardStats(),
    getUpcomingEvents(8),
    getAllProducts(),
    getAllUsers(),
    getAllOrders(),
    getAllArticles()
  ]);

  return (
    <>
      <PageHero
        eyebrow={dictionary.dashboard.eyebrow}
        title={dictionary.dashboard.title}
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
      />
    </>
  );
}
