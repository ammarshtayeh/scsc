"use client";

import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { useLocale } from "@/hooks/useLocale";
import { translateBoardRole } from "@/lib/i18n/helpers";
import { cn } from "@/lib/utils";
import type { BoardMember } from "@/types";

interface BoardMembersProps {
  groupedMembers: Record<string, BoardMember[]>;
}

export function BoardMembers({ groupedMembers }: BoardMembersProps) {
  const { dictionary, locale } = useLocale();
  const years = useMemo(
    () => Object.keys(groupedMembers).sort((a, b) => Number(b) - Number(a)),
    [groupedMembers]
  );
  const [selectedYear, setSelectedYear] = useState(years[0] || "");
  const members = groupedMembers[selectedYear] || [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-white/60 bg-white/70 p-8 shadow-soft backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent">
              {dictionary.about.boardEyebrow}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-brand-primary">
              {dictionary.about.boardTitle}
            </h2>
          </div>
          {years.length ? (
            <div className="flex flex-wrap gap-2">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    year === selectedYear
                      ? "bg-brand-primary text-white"
                      : "bg-brand-sky text-brand-primary hover:bg-brand-primary hover:text-white"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          {members.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {members.map((member) => (
                <Card key={member.id} interactive className="overflow-hidden p-0">
                  <div className="relative h-72">
                    <SmartImage
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1280px) 50vw, 25vw"
                    />
                  </div>
                  <div className="space-y-3 p-6">
                    <h3 className="font-heading text-xl font-semibold text-brand-primary">
                      {member.name}
                    </h3>
                    <p className="text-sm font-medium text-brand-accent">
                      {translateBoardRole(member.role, locale)}
                    </p>
                    <p className="text-sm leading-7 text-slate-600">{member.bio}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title={dictionary.about.boardEmptyTitle}
              description={dictionary.about.boardEmptyDescription}
            />
          )}
        </div>
      </div>
    </section>
  );
}
