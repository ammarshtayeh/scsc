import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import {
  getAllArticles,
  getAllOrders,
  getAllProducts,
  getAllUsers,
  getDashboardStats,
  getUpcomingEvents
} from "@/lib/firebase/queries";
import {
  translateArticleCategory,
  translateOrderStatus,
  translateProductCategory,
  translateRole
} from "@/lib/i18n/helpers";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";
import { formatCurrency, formatDateLong, formatDateTime, formatNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const dictionary = getServerDictionary();
  const locale = getServerLocale();
  const [stats, events, products, users, orders, articles] = await Promise.all([
    getDashboardStats(),
    getUpcomingEvents(4),
    getAllProducts(),
    getAllUsers(),
    getAllOrders(),
    getAllArticles()
  ]);

  const statCards = [
    { label: dictionary.dashboard.totalUsers, value: stats.totalUsers },
    { label: dictionary.dashboard.upcomingEvents, value: stats.upcomingEvents },
    { label: dictionary.dashboard.totalOrders, value: stats.totalOrders },
    { label: dictionary.dashboard.registeredCompanies, value: stats.registeredCompanies }
  ];

  return (
    <>
      <PageHero
        eyebrow={dictionary.dashboard.eyebrow}
        title={dictionary.dashboard.title}
        description={dictionary.dashboard.description}
      />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.32fr_0.68fr]">
          <Sidebar />

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <Card key={card.label}>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-3 font-heading text-4xl font-bold text-brand-primary">
                    {formatNumber(card.value, locale)}
                  </p>
                </Card>
              ))}
            </div>

            <Card id="events" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                  {dictionary.dashboard.eventManagement}
                </h2>
                <Button>{dictionary.dashboard.addEvent}</Button>
              </div>
              <div className="grid gap-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col gap-3 rounded-2xl border border-brand-primary/10 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-brand-primary">{event.title}</p>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(event.startsAt, locale)} - {event.venue}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>
                        {formatNumber(event.registeredCount, locale)}/{formatNumber(event.capacity, locale)}
                      </Badge>
                      <Button variant="secondary" size="sm">
                        {dictionary.dashboard.edit}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card id="products" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                  {dictionary.dashboard.productManagement}
                </h2>
                <Button>{dictionary.dashboard.addProduct}</Button>
              </div>
              <div className="grid gap-4">
                {products.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col gap-3 rounded-2xl border border-brand-primary/10 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-brand-primary">{product.name}</p>
                      <p className="text-sm text-slate-500">
                        {product.company} - {translateProductCategory(product.category, locale)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>
                        {formatNumber(product.stock, locale)} {dictionary.store.stockSuffix}
                      </Badge>
                      <span className="text-sm font-medium text-brand-primary">
                        {formatCurrency(product.memberPrice ?? product.price, "USD", locale)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card id="users" className="space-y-4">
              <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                {dictionary.dashboard.userManagement}
              </h2>
              <div className="grid gap-4">
                {users.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-3 rounded-2xl border border-brand-primary/10 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-brand-primary">{entry.displayName}</p>
                      <p className="text-sm text-slate-500">{entry.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{translateRole(entry.role, locale)}</Badge>
                      <Button variant="secondary" size="sm">
                        {dictionary.store.manage}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card id="orders" className="space-y-4">
              <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                {dictionary.dashboard.orders}
              </h2>
              <div className="grid gap-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 rounded-2xl border border-brand-primary/10 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-brand-primary">{order.id}</p>
                      <p className="text-sm text-slate-500">
                        {formatDateLong(order.createdAt, locale)} - {formatNumber(order.items.length, locale)} {dictionary.dashboard.items}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{translateOrderStatus(order.status, locale)}</Badge>
                      <span className="text-sm font-medium text-brand-primary">
                        {formatCurrency(order.total, "USD", locale)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card id="moderation" className="space-y-4">
              <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                {dictionary.dashboard.moderation}
              </h2>
              <div className="grid gap-4">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="flex flex-col gap-3 rounded-2xl border border-brand-primary/10 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-brand-primary">{article.title}</p>
                      <p className="text-sm text-slate-500">
                        {translateArticleCategory(article.category, locale)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>
                        {article.approved
                          ? dictionary.dashboard.approved
                          : dictionary.dashboard.pending}
                      </Badge>
                      <Button variant="secondary" size="sm">
                        {dictionary.dashboard.review}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
