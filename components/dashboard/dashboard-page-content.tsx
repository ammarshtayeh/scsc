import { DashboardShell, type DashboardSection } from "@/components/dashboard/dashboard-shell";
import { PageHero } from "@/components/ui/page-hero";
import {
  getArchivedEvents,
  getAllJobApplications,
  getAllJobs,
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
  "jobs",
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
        : section === "jobs"
          ? "jobs"
          : "moderation"
      : normalizeDashboardSection(section);

  let stats = {
    totalUsers: 0,
    upcomingEvents: 0,
    totalOrders: 0,
    registeredCompanies: 0
  };
  let events: Awaited<ReturnType<typeof getUpcomingEvents>> = [];
  let archivedEvents: Awaited<ReturnType<typeof getArchivedEvents>> = [];
  let products: Awaited<ReturnType<typeof getAllProducts>> = [];
  let jobs: Awaited<ReturnType<typeof getAllJobs>> = [];
  let jobApplications: Awaited<ReturnType<typeof getAllJobApplications>> = [];
  let users: Awaited<ReturnType<typeof getAllUsers>> = [];
  let orders: Awaited<ReturnType<typeof getAllOrders>> = [];
  let articles: Awaited<ReturnType<typeof getArticlesForModeration>> = [];
  let boardMembers: Awaited<ReturnType<typeof getAllBoardMembers>> = [];
  let eventRegistrations: Awaited<ReturnType<typeof getEventRegistrationsForDashboard>> = [];
  let financeSettings: Awaited<ReturnType<typeof getFinanceSettings>> = {
    balance: 0,
    transactions: []
  };
  let homeSettings: Awaited<ReturnType<typeof getHomePageSettings>> = null;

  try {
    [
      stats,
      events,
      archivedEvents,
      products,
      jobs,
      jobApplications,
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
      getAllJobs(),
      getAllJobApplications(),
      getAllUsers(),
      getAllOrders(),
      getArticlesForModeration(),
      getAllBoardMembers(),
      getEventRegistrationsForDashboard(),
      getFinanceSettings(),
      getHomePageSettings()
    ]);
  } catch (error) {
    console.error("[dashboard:load]", error instanceof Error ? error.message : error);
  }

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
        jobs={jobs}
        jobApplications={jobApplications}
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
