import { BoardMembers } from "@/components/sections/board-members";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { SmartImage } from "@/components/ui/smart-image";
import { getBoardMembersByYear } from "@/lib/firebase/queries";
import { getServerDictionary } from "@/lib/i18n/server";

export default async function AboutPage() {
  const dictionary = getServerDictionary();
  const groupedMembers = await getBoardMembersByYear();

  return (
    <>
      <PageHero
        eyebrow={dictionary.about.eyebrow}
        title={dictionary.about.title}
        description={dictionary.about.description}
      />

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="space-y-5">
            <h2 className="font-heading text-3xl font-bold text-brand-primary">
              {dictionary.about.overviewTitle}
            </h2>
            <p className="text-sm leading-8 text-slate-600">
              {dictionary.about.overviewTextOne}
            </p>
            <p className="text-sm leading-8 text-slate-600">
              {dictionary.about.overviewTextTwo}
            </p>
          </Card>
          <Card className="overflow-hidden p-0">
            <div className="relative h-full min-h-80">
              <SmartImage
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80"
                alt={dictionary.about.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </Card>
        </div>
      </section>

      <BoardMembers groupedMembers={groupedMembers} />
    </>
  );
}
