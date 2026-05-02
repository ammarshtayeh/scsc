"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { useLocale } from "@/hooks/useLocale";
import { translateArticleCategory } from "@/lib/i18n/helpers";
import { formatDateShort } from "@/lib/utils";
import type { Article } from "@/types";

export function NewsSection({ articles }: { articles: Article[] }) {
  const { dictionary, locale } = useLocale();

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="rounded-[28px] border border-white/70 bg-section-mesh p-5 shadow-soft dark:border-white/10 dark:bg-brand-surface/84 sm:rounded-[32px] sm:p-8">
        <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent">
              {dictionary.home.latestNewsLabel}
            </p>
            <h2 className="mt-3 font-heading text-2xl font-bold text-brand-primary dark:text-brand-ink sm:text-3xl">
              {dictionary.home.latestNewsTitle}
            </h2>
          </div>
          <Link href="/education" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto">{dictionary.common.browseArticles}</Button>
          </Link>
        </div>

        {articles.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.1, duration: 0.45 }}
              >
                <Card interactive className="h-full overflow-hidden p-0">
                  <div className="relative h-48 sm:h-56">
                    <SmartImage
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <Badge>{translateArticleCategory(article.category, locale)}</Badge>
                      <span className="text-xs text-slate-500">
                        {formatDateShort(article.publishedAt, locale)}
                      </span>
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-brand-primary">
                      {article.title}
                    </h3>
                    <p className="text-sm leading-7 text-slate-600">{article.excerpt}</p>
                    <Link href={`/education/${article.slug}`} className="block sm:inline-block">
                      <Button variant="ghost" className="w-full sm:w-auto">{dictionary.common.readMore}</Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={dictionary.home.newsEmptyTitle}
            description={dictionary.home.newsEmptyDescription}
          />
        )}
      </div>
    </section>
  );
}
