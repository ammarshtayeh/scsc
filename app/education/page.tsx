import { ArticleBrowser } from "@/components/sections/article-browser";
import { PageHero } from "@/components/ui/page-hero";
import { getAllArticles } from "@/lib/firebase/queries";
import { getServerDictionary } from "@/lib/i18n/server";

export default async function EducationPage() {
  const dictionary = getServerDictionary();
  const articles = await getAllArticles();

  return (
    <>
      <PageHero
        eyebrow={dictionary.education.eyebrow}
        title={dictionary.education.title}
        description={dictionary.education.description}
      />
      <ArticleBrowser articles={articles} />
    </>
  );
}
