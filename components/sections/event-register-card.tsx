"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import {
  cancelEventRegistration,
  isUserRegisteredForEvent,
  registerForEvent
} from "@/lib/firebase/firestore";
import { formatNumber } from "@/lib/utils";

interface EventRegisterCardProps {
  eventId: string;
  capacity: number;
  registeredCount: number;
}

export function EventRegisterCard({
  eventId,
  capacity,
  registeredCount
}: EventRegisterCardProps) {
  const { user } = useAuth();
  const { dictionary, locale } = useLocale();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentRegisteredCount, setCurrentRegisteredCount] = useState(registeredCount);

  const isFull = currentRegisteredCount >= capacity;

  useEffect(() => {
    setCurrentRegisteredCount(registeredCount);
  }, [registeredCount]);

  useEffect(() => {
    if (!user) {
      setIsRegistered(false);
      return;
    }

    let cancelled = false;

    isUserRegisteredForEvent(eventId, user.id)
      .then((registered) => {
        if (!cancelled) {
          setIsRegistered(registered);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsRegistered(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, user]);

  async function handleRegister() {
    if (!user || isRegistered || isFull) {
      return;
    }

    try {
      setLoading(true);
      await registerForEvent(eventId, user.id);
      setIsRegistered(true);
      setCurrentRegisteredCount((current) => Math.min(capacity, current + 1));
      pushToast(dictionary.eventRegistration.success, "success");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : dictionary.eventRegistration.genericError,
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelRegistration() {
    if (!user || !isRegistered) {
      return;
    }

    try {
      setLoading(true);
      await cancelEventRegistration(eventId, user.id);
      setIsRegistered(false);
      setCurrentRegisteredCount((current) => Math.max(0, current - 1));
      pushToast(dictionary.eventRegistration.cancelSuccess, "success");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : dictionary.eventRegistration.genericError,
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-accent">
          {dictionary.eventRegistration.eyebrow}
        </p>
        <h2 className="mt-3 font-heading text-2xl font-semibold text-brand-primary">
          {dictionary.eventRegistration.title}
        </h2>
      </div>
      <p className="text-sm text-slate-600">
        {isRegistered
          ? dictionary.eventRegistration.reserved
          : capacity - currentRegisteredCount > 0
          ? `${formatNumber(capacity - currentRegisteredCount, locale)} ${dictionary.eventRegistration.seatsRemaining}`
          : dictionary.eventRegistration.full}
      </p>
      {user ? (
        isRegistered ? (
          <Button
            className="w-full"
            variant="secondary"
            loading={loading}
            onClick={handleCancelRegistration}
          >
            {dictionary.eventRegistration.cancelRegistration}
          </Button>
        ) : (
          <Button
            className="w-full"
            loading={loading}
            disabled={isFull}
            onClick={handleRegister}
          >
            {isFull
              ? dictionary.eventRegistration.fullButton
              : dictionary.eventRegistration.registerNow}
          </Button>
        )
      ) : (
        <Link href="/auth/login" className="block">
          <Button className="w-full">{dictionary.eventRegistration.loginToRegister}</Button>
        </Link>
      )}
      <p className="text-xs leading-6 text-slate-500">
        {dictionary.eventRegistration.duplicateNote}
      </p>
    </Card>
  );
}
