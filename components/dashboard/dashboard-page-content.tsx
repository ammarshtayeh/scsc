import { DashboardShell, type DashboardSection } from "@/components/dashboard/dashboard-shell";
import { PageHero } from "@/components/ui/page-hero";
import {
  getArchivedEvents,
  getAllOrders,
  getAllBoardMembers,
  getAllProducts,
  getAllUsers,
  getArticlesForModeration,
  getDashboardStats,
  getEventRegistrationsForDashboard,
  getFinanceSettings,
  getHomePageSettings,
  getUpcomingEvents
} from "@/lib/firebase/queries";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";

interface DashboardPageContentProps {
  mode?: "admin" | "moderator";
  section?: string;
}

const dashboardSections: DashboardSection[] = [
  "overview",
  "home",
  "events",
  "event-archive",
  "registrants",
  "products",
  "companies",
  "board-members",
  "users",
  "orders",
  "finance",
  "moderation"
];

function normalizeDashboardSection(section?: string): DashboardSection {
  return dashboardSections.includes(section as DashboardSection)
    ? (section as DashboardSection)
    : "overview";
}

export async function DashboardPageContent({ mode = "admin", section }: DashboardPageContentProps) {
  const dictionary = getServerDictionary();
  const locale = getServerLocale();
  const activeSection =
    mode === "moderator"
      ? section === "event-archive"
        ? "event-archive"
        : "moderation"
      : normalizeDashboardSection(section);
  const [
    stats,
    events,
    archivedEvents,
    products,
    users,
    orders,
    articles,
    boardMembers,
    eventRegistrations,
    financeSettings,
    homeSettings
  ] = await Promise.all([
    getDashboardStats(),
    getUpcomingEvents(8),
    getArchivedEvents(),
    getAllProducts(),
    getAllUsers(),
    getAllOrders(),
    getArticlesForModeration(),
    getAllBoardMembers(),
    getEventRegistrationsForDashboard(),
    getFinanceSettings(),
    getHomePageSettings()
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
        archivedEvents={archivedEvents}
        products={products}
        users={users}
        orders={orders}
        articles={articles}
        boardMembers={boardMembers}
        eventRegistrations={eventRegistrations}
        financeSettings={financeSettings}
        homeSettings={homeSettings}
        locale={locale}
        labels={dictionary.dashboard}
        mode={mode}
        activeSection={activeSection}
      />
    </>
  );
}
