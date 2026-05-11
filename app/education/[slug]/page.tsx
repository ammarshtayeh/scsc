import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { SmartImage } from "@/components/ui/smart-image";
import { getArticleBySlug } from "@/lib/firebase/queries";
import { translateArticleCategory } from "@/lib/i18n/helpers";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";
import { formatDateShort } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const dictionary = getServerDictionary();
  const locale = getServerLocale();
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <>
      <PageHero
        eyebrow={translateArticleCategory(article.category, locale)}
        title={article.title}
        description={article.excerpt}
      />
      <section className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden p-0">
          <div className="relative h-[360px]">
            <SmartImage
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
          <div className="space-y-6 p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>{translateArticleCategory(article.category, locale)}</Badge>
              <span className="text-sm text-slate-500">
                {formatDateShort(article.publishedAt, locale)}
              </span>
              <span className="text-sm text-slate-500">
                {dictionary.education.authorPrefix} {article.authorName}
              </span>
            </div>
            {article.content.map((paragraph, index) => (
              <p key={index} className="text-sm leading-8 text-slate-700">
                {paragraph}
              </p>
            ))}
            <div className="space-y-3">
              <h2 className="font-heading text-2xl font-semibold text-brand-primary">
                {dictionary.education.references}
              </h2>
              {article.references.length ? (
                <div className="flex flex-col gap-3">
                  {article.references.map((reference) => (
                    <a
                      key={reference.url}
                      href={reference.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-brand-primary underline decoration-brand-accent underline-offset-4"
                    >
                      {reference.label}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">{dictionary.education.noReferences}</p>
              )}
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
