import { BoardMembers } from "@/components/sections/board-members";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { SmartImage } from "@/components/ui/smart-image";
import { getBoardMembersByYear } from "@/lib/firebase/queries";
import { getServerDictionary } from "@/lib/i18n/server";
import {
  CalendarDays,
  CheckCircle2,
  Crown,
  FlaskConical,
  Handshake,
  Lightbulb,
  Megaphone,
  Network,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  WalletCards
} from "lucide-react";

export default async function AboutPage() {
  const dictionary = getServerDictionary();
  const groupedMembers = await getBoardMembersByYear();
  const leadershipRoles = dictionary.about.structure.slice(0, 3);
  const committeeRoles = dictionary.about.structure.slice(3);
  const leadershipIcons = [Crown, ShieldCheck, WalletCards];
  const committeeIcons = [
    Megaphone,
    Handshake,
    CalendarDays,
    Lightbulb,
    UserRoundCheck,
    FlaskConical
  ];

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
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
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

          <Card className="overflow-hidden p-0">
            <div className="relative bg-[linear-gradient(135deg,rgba(11,59,120,0.96),rgba(18,74,126,0.9)_48%,rgba(34,105,112,0.86))] p-5 text-white dark:bg-[linear-gradient(135deg,rgba(10,24,44,0.98),rgba(14,45,77,0.96)_50%,rgba(18,67,72,0.92))] sm:p-7">
              <div className="absolute inset-x-6 top-24 h-px bg-white/12" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-brand-accent shadow-[0_14px_32px_rgba(0,0,0,0.18)]">
                  <Network className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-accent">
                    SCSC-NNU
                  </p>
                  <h2 className="mt-2 font-heading text-3xl font-bold leading-tight">
                    {dictionary.about.structureTitle}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">
                    {dictionary.about.foundingBody}
                  </p>
                </div>
              </div>

              <div className="relative mt-8 space-y-6">
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-white/62">
                    {dictionary.about.structureLeadershipTitle}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {leadershipRoles.map((role, index) => {
                      const Icon = leadershipIcons[index];
                      return (
                        <div
                          key={role}
                          className={`rounded-2xl border p-4 shadow-[0_18px_36px_rgba(2,8,23,0.22)] ${
                            index === 0
                              ? "border-brand-accent/55 bg-brand-accent text-brand-primary sm:col-span-3"
                              : "border-white/14 bg-white/10 text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                index === 0
                                  ? "bg-brand-primary/12 text-brand-primary"
                                  : "bg-brand-accent/16 text-brand-accent"
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="text-sm font-bold">{role}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-white/62">
                    {dictionary.about.structureCommitteesTitle}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {committeeRoles.map((role, index) => {
                      const Icon = committeeIcons[index] || UsersRound;
                      return (
                        <div
                          key={role}
                          className="rounded-2xl border border-white/12 bg-white/[0.075] p-4 transition-colors hover:border-brand-accent/40 hover:bg-white/[0.11]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-accent">
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="text-sm font-semibold leading-6 text-white/92">
                              {role}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <BoardMembers groupedMembers={groupedMembers} />
    </>
  );
}
