"use client";

import { motion } from "framer-motion";
import { Award, BriefcaseBusiness, ChevronDown, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";

export function MembershipPromo() {
  const { user } = useAuth();
  const { dictionary } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const joinHref = user ? "/profile" : "/auth/signup";
  const benefits = [
    {
      ...dictionary.membershipPromo.benefits[0],
      icon: BriefcaseBusiness
    },
    {
      ...dictionary.membershipPromo.benefits[1],
      icon: GraduationCap
    },
    {
      ...dictionary.membershipPromo.benefits[2],
      icon: Award
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <Card
        surface="none"
        className="overflow-hidden bg-gradient-to-br from-brand-primary via-[#11488d] to-[#0b3b78] p-0 text-white shadow-elevated"
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div 
            className="p-6 sm:p-12"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.p 
              className="text-xs font-bold uppercase tracking-widest text-brand-accent"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {dictionary.membershipPromo.eyebrow}
            </motion.p>
            <motion.h2 
              className="mt-4 font-heading text-3xl font-bold leading-tight sm:text-5xl"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {dictionary.membershipPromo.title}
            </motion.h2>
            <motion.p 
              className="mt-5 max-w-2xl text-sm leading-7 text-white/90 sm:mt-6 sm:text-base sm:leading-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {dictionary.membershipPromo.description}
            </motion.p>

            <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                    className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur transition-all duration-300 sm:p-6 sm:hover:bg-white/15"
                  >
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-brand-accent/20 mb-4">
                      <Icon className="h-6 w-6 text-brand-accent" />
                    </div>
                    <h3 className="font-heading text-lg font-bold">{benefit.title}</h3>
                    <p className="mt-3 text-sm text-white/80 leading-relaxed">{benefit.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div 
            className="flex flex-col justify-between border-t border-white/20 bg-white/10 p-6 backdrop-blur-xl lg:border-l lg:border-t-0 sm:p-12"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div>
              <h3 className="font-heading text-2xl font-bold">
                {dictionary.membershipPromo.whyTitle}
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/90 sm:text-base sm:leading-8">
                {dictionary.membershipPromo.whyDescription}
              </p>
              <motion.div
                animate={{ height: expanded ? "auto" : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {expanded ? (
                  <p className="mt-4 text-sm leading-7 text-white/80 sm:text-base sm:leading-8">
                    {dictionary.membershipPromo.whyExtra}
                  </p>
                ) : null}
              </motion.div>
            </div>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link href={joinHref} className="w-full sm:w-auto">
                <Button variant="accent" size="lg" className="w-full font-semibold sm:w-auto">
                  {dictionary.membershipPromo.joinCta}
                </Button>
              </Link>
              <Button 
                variant="secondary" 
                onClick={() => setExpanded((current) => !current)}
                className="w-full font-semibold sm:w-auto"
              >
                {dictionary.membershipPromo.learnMore}
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </Button>
            </div>
          </motion.div>
        </div>
      </Card>
    </section>
  );
}
