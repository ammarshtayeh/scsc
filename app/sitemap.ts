import type { MetadataRoute } from "next";

import { getAllArticles, getAllProducts, getUpcomingEvents } from "@/lib/firebase/queries";

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://pscsc.com").replace(/\/+$/, "");
}

function toAbsoluteUrl(path: string) {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: toAbsoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: toAbsoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: toAbsoluteUrl("/education"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8
    },
    {
      url: toAbsoluteUrl("/events"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: toAbsoluteUrl("/store"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: toAbsoluteUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7
    }
  ];

  try {
    const [articles, events, products] = await Promise.all([
      getAllArticles(),
      getUpcomingEvents(),
      getAllProducts()
    ]);

    return [
      ...staticRoutes,
      ...articles.map((article) => ({
        url: toAbsoluteUrl(`/education/${article.slug}`),
        lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.7
      })),
      ...events.map((event) => ({
        url: toAbsoluteUrl(`/events/${event.slug}`),
        lastModified: event.startsAt ? new Date(event.startsAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8
      })),
      ...products.map((product) => ({
        url: toAbsoluteUrl(`/store/${product.slug}`),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7
      }))
    ];
  } catch {
    return staticRoutes;
  }
}
