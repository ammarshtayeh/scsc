"use client";

import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase/firebase";
import type { MembershipStatus } from "@/types";

function isActiveMembership(data: Record<string, unknown> | undefined) {
  const status = (data?.membershipStatus as MembershipStatus | undefined) || "active";
  const expiresAt = typeof data?.membershipExpiresAt === "string" ? data.membershipExpiresAt : "";

  if (status !== "active") {
    return false;
  }

  return !expiresAt || new Date(expiresAt).getTime() >= Date.now();
}

export function useMemberPricing() {
  const { user } = useAuth();
  const [useMemberPricing, setUseMemberPricing] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setUseMemberPricing(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    getDoc(doc(db, "users", user.id))
      .then((snapshot) => {
        if (!cancelled) {
          setUseMemberPricing(isActiveMembership(snapshot.data() as Record<string, unknown> | undefined));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUseMemberPricing(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { useMemberPricing, loading };
}
