import { BoardMembers } from "@/components/sections/board-members";
import { OrganizationStructure } from "@/components/sections/organization-structure";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { SmartImage } from "@/components/ui/smart-image";
import { getBoardMembersByYear } from "@/lib/firebase/queries";
import { getServerDictionary } from "@/lib/i18n/server";
import { CheckCircle2, UsersRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const dictionary = getServerDictionary();
  const groupedMembers = await getBoardMembersByYear();
  const managedBoardMembers = Object.values(groupedMembers).flat();

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

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent">
                <UsersRound className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary">
                {dictionary.about.principlesTitle}
              </h2>
            </div>
            <ul className="space-y-3">
              {dictionary.about.principles.map((principle) => (
                <li key={principle} className="flex gap-3 text-sm leading-7 text-slate-600">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-brand-accent" />
                  <span>{principle}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-brand-primary">
                {dictionary.about.goalsTitle}
              </h2>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {dictionary.about.goals.map((goal) => (
                <li key={goal} className="rounded-lg border border-brand-primary/10 bg-white/70 p-4 text-sm leading-7 text-slate-600 dark:border-white/10 dark:bg-white/5">
                  {goal}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="max-w-4xl">
          <Card className="space-y-5">
            <h2 className="font-heading text-2xl font-bold text-brand-primary">
              {dictionary.about.membershipTitle}
            </h2>
            <p className="text-sm leading-8 text-slate-600">
              {dictionary.about.membershipText}
            </p>
            <ul className="space-y-3">
              {dictionary.about.membershipConditions.map((condition) => (
                <li key={condition} className="flex gap-3 text-sm leading-7 text-slate-600">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-brand-accent" />
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <OrganizationStructure
        title={dictionary.about.structureTitle}
        foundingBody={dictionary.about.foundingBody}
        leadershipTitle={dictionary.about.structureLeadershipTitle}
        committeesTitle={dictionary.about.structureCommitteesTitle}
        roles={dictionary.about.structure}
        members={managedBoardMembers}
      />

      <BoardMembers groupedMembers={groupedMembers} />
    </>
  );
}
