"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { useLocale } from "@/hooks/useLocale";
import { ARTICLE_CATEGORIES } from "@/lib/constants";
import { translateArticleCategory } from "@/lib/i18n/helpers";
import { formatDateShort } from "@/lib/utils";
import type { Article, ArticleCategory } from "@/types";

type ArticleFilter = ArticleCategory | "All";

export function ArticleBrowser({ articles }: { articles: Article[] }) {
  const { dictionary, locale } = useLocale();
  const [activeCategory, setActiveCategory] = useState<ArticleFilter>("All");

  const filteredArticles = useMemo(() => {
    if (activeCategory === "All") {
      return articles;
    }

    return articles.filter((article) => article.category === activeCategory);
  }, [activeCategory, articles]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setActiveCategory("All")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            activeCategory === "All"
              ? "bg-brand-primary text-white"
              : "bg-white text-brand-primary"
          }`}
        >
          {dictionary.common.all}
        </button>
        {ARTICLE_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              activeCategory === category
                ? "bg-brand-primary text-white"
                : "bg-white text-brand-primary"
            }`}
          >
            {translateArticleCategory(category, locale)}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {filteredArticles.length ? (
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredArticles.map((article) => (
              <Card key={article.id} interactive className="h-full overflow-hidden p-0">
                <div className="relative h-56">
                  <SmartImage
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 50vw, 33vw"
                  />
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <Badge>{translateArticleCategory(article.category, locale)}</Badge>
                    <span className="text-xs text-slate-500">
                      {formatDateShort(article.publishedAt, locale)}
                    </span>
                  </div>
                  <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                    {article.title}
                  </h2>
                  <p className="text-sm leading-7 text-slate-600">{article.excerpt}</p>
                  <Link href={`/education/${article.slug}`}>
                    <Button variant="ghost">{dictionary.common.readMore}</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title={dictionary.education.emptyTitle}
            description={dictionary.education.emptyDescription}
          />
        )}
      </div>
    </section>
  );
}
