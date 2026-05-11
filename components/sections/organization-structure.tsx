"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { motion } from "framer-motion";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
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

import { SmartImage } from "@/components/ui/smart-image";
import { db } from "@/lib/firebase/firebase";
import type { BoardMember } from "@/types";

interface OrganizationStructureProps {
  title: string;
  foundingBody: string;
  leadershipTitle: string;
  committeesTitle: string;
  roles: readonly string[];
  members?: BoardMember[];
}

const leadershipIcons = [Crown, ShieldCheck, WalletCards];
const committeeIcons = [
  Megaphone,
  Handshake,
  CalendarDays,
  Lightbulb,
  UserRoundCheck,
  FlaskConical
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

function normalizeBoardMember(id: string, data: Record<string, unknown>): BoardMember {
  const order = Number(data.order);

  return {
    id,
    name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : "Board member",
    role: typeof data.role === "string" && data.role.trim() ? data.role.trim() : "Board member",
    year: typeof data.year === "string" && data.year.trim()
      ? data.year.trim()
      : String(new Date().getFullYear()),
    order: Number.isFinite(order) ? order : 99,
    image: typeof data.image === "string" ? data.image : "",
    bio: typeof data.bio === "string" ? data.bio : ""
  };
}

function MemberPhotoCard({
  role,
  name,
  image,
  index,
  Icon,
  featured = false
}: {
  role: string;
  name: string;
  image?: string;
  index: number;
  Icon: ComponentType<{ className?: string }>;
  featured?: boolean;
}) {
  const hasImage = Boolean(image);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -7 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`group overflow-hidden rounded-2xl border border-white/12 bg-white/[0.075] text-white shadow-[0_22px_52px_rgba(2,8,23,0.26)] backdrop-blur-sm ${
        featured ? "lg:rounded-[1.35rem]" : ""
      }`}
    >
      <div
        className={`relative min-h-[230px] overflow-hidden bg-[#08213d] sm:min-h-[260px] ${
          featured ? "aspect-[4/3] lg:aspect-[16/10]" : "aspect-[4/5]"
        }`}
      >
        {hasImage ? (
          <SmartImage
            src={image}
            alt={name}
            fill
            className="object-cover object-top transition duration-700 group-hover:scale-105"
            sizes={
              featured
                ? "(max-width: 768px) 92vw, 30vw"
                : "(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 16vw"
            }
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(242,195,24,0.32),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))]">
            <span className="font-heading text-4xl font-bold text-brand-accent/90">
              {initials}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06172b]/48 via-transparent to-transparent opacity-80" />
        <div className="absolute left-3 top-3 rounded-full border border-white/16 bg-[#06172b]/62 px-3 py-1 text-xs font-bold text-brand-accent backdrop-blur-md">
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>
      <div className="flex min-h-[132px] items-center justify-between gap-4 border-t border-white/10 bg-[#06172b]/68 p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="break-words font-heading text-lg font-bold leading-7 text-white sm:text-xl">
            {name}
          </h3>
          <p className="mt-2 break-words text-sm font-semibold leading-6 text-white/68">
            {role}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-accent text-brand-primary shadow-[0_12px_26px_rgba(242,195,24,0.2)]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </motion.div>
  );
}

export function OrganizationStructure({
  title,
  foundingBody,
  leadershipTitle,
  committeesTitle,
  roles,
  members = []
}: OrganizationStructureProps) {
  const [clientMembers, setClientMembers] = useState(members);

  useEffect(() => {
    setClientMembers(members);
  }, [members]);

  useEffect(() => {
    if (!db) {
      return;
    }

    let mounted = true;

    async function loadMembers() {
      const snapshot = await getDocs(query(collection(db!, "boardMembers"), orderBy("year", "desc")));
      if (!mounted) {
        return;
      }

      setClientMembers(
        snapshot.docs.map((entry) =>
          normalizeBoardMember(entry.id, entry.data() as Record<string, unknown>)
        )
      );
    }

    void loadMembers().catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const managedMembers = useMemo(
    () =>
      [...clientMembers].sort((a, b) => {
        const yearDiff = Number(b.year) - Number(a.year);
        return yearDiff || (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name);
      }),
    [clientMembers]
  );
  const latestYear = managedMembers[0]?.year;
  const visibleMembers = latestYear
    ? managedMembers.filter((member) => member.year === latestYear)
    : [];
  const leadershipMembers = visibleMembers.slice(0, 3);
  const committeeMembers = visibleMembers.slice(3);
  const leadershipRoles = roles.slice(0, 3);
  const isArabic = /[\u0600-\u06FF]/.test(roles[0] || "");
  const emptyText = isArabic
    ? "لم تتم إضافة أعضاء للهيئة الإدارية بعد. يمكن إدارتهم من لوحة الأدمن."
    : "No board members have been added yet. Manage them from the admin dashboard.";

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.16 }}
      variants={containerVariants}
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[linear-gradient(135deg,#06172b,#0b3b78_46%,#14515b)] py-12 text-white dark:bg-[linear-gradient(135deg,#06172b,#0a2d4d_50%,#124348)] sm:py-16"
    >
      <div className="absolute left-[6%] top-8 h-56 w-56 rounded-full bg-brand-accent/16 blur-3xl" />
      <div className="absolute bottom-0 right-[8%] h-72 w-72 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={cardVariants}
          className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"
        >
          <div className="flex max-w-3xl items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-brand-accent shadow-[0_14px_32px_rgba(0,0,0,0.18)]">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-accent">
                SCSC-NNU
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold leading-tight sm:text-4xl">
                {title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">
                {foundingBody}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="relative mt-10 space-y-10">
          {visibleMembers.length ? (
            <>
              <div>
                <motion.p
                  variants={cardVariants}
                  className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/62"
                >
                  {leadershipTitle}
                </motion.p>
                <motion.div variants={containerVariants} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {leadershipMembers.map((member, index) => (
                    <MemberPhotoCard
                      key={member.id}
                      role={member.role}
                      name={member.name}
                      image={member.image}
                      index={index}
                      Icon={leadershipIcons[index] || UsersRound}
                      featured
                    />
                  ))}
                </motion.div>
              </div>

              {committeeMembers.length ? (
                <div>
                  <motion.p
                    variants={cardVariants}
                    className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/62"
                  >
                    {committeesTitle}
                  </motion.p>
                  <motion.div
                    variants={containerVariants}
                    className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
                  >
                    {committeeMembers.map((member, index) => {
                      const Icon = committeeIcons[index] || UsersRound;
                      const memberIndex = index + leadershipRoles.length;
                      return (
                        <MemberPhotoCard
                          key={member.id}
                          role={member.role}
                          name={member.name}
                          image={member.image}
                          index={memberIndex}
                          Icon={Icon}
                        />
                      );
                    })}
                  </motion.div>
                </div>
              ) : null}
            </>
          ) : (
            <motion.div variants={cardVariants} className="rounded-2xl border border-white/12 bg-white/8 p-6 text-sm leading-7 text-white/74">
              {emptyText}
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
