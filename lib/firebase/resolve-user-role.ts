import "server-only";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { Role } from "@/types";

function normalizeRole(value: unknown): Role {
  return value === "admin" || value === "moderator" || value === "company" ? value : "user";
}

export async function resolveUserRoleFromToken(token: string): Promise<Role> {
  if (!adminAuth) {
    return "user";
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const claimRole = normalizeRole(decoded.role);

    if (!adminDb) {
      return claimRole;
    }

    const profileSnap = await adminDb.collection("users").doc(decoded.uid).get();
    if (!profileSnap.exists) {
      return claimRole;
    }

    const profileRole = normalizeRole(profileSnap.data()?.role);
    // Prefer elevated Firestore role (admin/moderator/company) over stale JWT claims.
    return profileRole !== "user" ? profileRole : claimRole;
  } catch {
    return "user";
  }
}

export async function resolveUserRoleFromUid(uid: string, fallback: Role = "user"): Promise<Role> {
  if (!uid || !adminDb) {
    return fallback;
  }

  try {
    const profileSnap = await adminDb.collection("users").doc(uid).get();
    if (!profileSnap.exists) {
      return fallback;
    }

    const profileRole = normalizeRole(profileSnap.data()?.role);
    return profileRole !== "user" ? profileRole : fallback;
  } catch {
    return fallback;
  }
}
