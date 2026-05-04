"use client";

import { onIdTokenChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  getRoleRedirect,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail
} from "@/lib/firebase/auth";
import { auth, db, isFirebaseClientConfigured } from "@/lib/firebase/firebase";
import type { AppSessionUser, Role, UserProfile } from "@/types";

interface AuthContextValue {
  user: AppSessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  signup: (params: {
    displayName: string;
    email: string;
    password: string;
    company?: string;
  }) => Promise<string>;
  loginWithGoogle: () => Promise<string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncSessionCookie(token: string) {
  await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });
}

async function clearSessionCookie() {
  await fetch("/api/session/logout", { method: "POST" });
}

async function buildFirebaseSessionUser(firebaseUser: FirebaseUser): Promise<AppSessionUser> {
  const tokenResult = await firebaseUser.getIdTokenResult();
  let role = (tokenResult.claims.role as Role | undefined) || "user";
  let displayName = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Member";
  let photoURL = firebaseUser.photoURL || undefined;

  if (db) {
    const profileSnap = await getDoc(doc(db, "users", firebaseUser.uid));
    if (profileSnap.exists()) {
      const profile = profileSnap.data() as unknown as UserProfile;
      role = profile.role || role;
      displayName = profile.displayName || displayName;
      photoURL = profile.photoURL || photoURL;
    }
  }

  return {
    id: firebaseUser.uid,
    displayName,
    email: firebaseUser.email || "",
    role,
    photoURL
  };
}

function buildMembershipId(uid: string) {
  return `SCSC-${uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase()}`;
}

async function ensureFirebaseUserProfile(firebaseUser: FirebaseUser) {
  if (!db) {
    return;
  }

  const profileRef = doc(db, "users", firebaseUser.uid);
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    return;
  }

  await setDoc(
    profileRef,
    {
      membershipId: buildMembershipId(firebaseUser.uid),
      displayName:
        firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Association Member",
      email: firebaseUser.email || "",
      company: "",
      photoURL: firebaseUser.photoURL || "",
      role: "user",
      membershipStatus: "active",
      membershipExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      joinedAt: serverTimestamp(),
      qrToken: uuidv4(),
      savedArticleIds: [],
      registeredEventIds: [],
      activeQrSessionId: null,
      activeQrSessionExpiresAt: null,
      lastQrIssuedAt: null,
      lastQrScanAt: null,
      discountRate: 0.12
    },
    { merge: true }
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseClientConfigured || !auth) {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        await clearSessionCookie();
        setLoading(false);
        return;
      }

      const [sessionUser, token] = await Promise.all([
        buildFirebaseSessionUser(firebaseUser),
        firebaseUser.getIdToken()
      ]);
      setUser(sessionUser);
      await syncSessionCookie(token);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!isFirebaseClientConfigured || !auth) {
      throw new Error("Firebase Auth is not configured.");
    }

    const credential = await signInWithEmail(email, password);
    const sessionUser = await buildFirebaseSessionUser(credential.user);
    setUser(sessionUser);
    await syncSessionCookie(await credential.user.getIdToken());
    return getRoleRedirect(sessionUser.role);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!isFirebaseClientConfigured || !auth) {
      throw new Error("Firebase Auth is not configured.");
    }

    const credential = await signInWithGoogle();
    await ensureFirebaseUserProfile(credential.user);
    const sessionUser = await buildFirebaseSessionUser(credential.user);
    setUser(sessionUser);
    await syncSessionCookie(await credential.user.getIdToken());
    return getRoleRedirect(sessionUser.role);
  }, []);

  const signup = useCallback(
    async ({
      displayName,
      email,
      password,
      company
    }: {
      displayName: string;
      email: string;
      password: string;
      company?: string;
    }) => {
      if (!isFirebaseClientConfigured || !auth) {
        throw new Error("Firebase Auth is not configured.");
      }

      const credential = await signUpWithEmail(email, password, displayName);
      if (db) {
        await ensureFirebaseUserProfile(credential.user);
        await setDoc(
          doc(db, "users", credential.user.uid),
          {
            displayName,
            email,
            company: company || ""
          },
          { merge: true }
        );
      }

      const sessionUser = await buildFirebaseSessionUser(credential.user);
      setUser(sessionUser);
      await syncSessionCookie(await credential.user.getIdToken());
      return "/profile";
    },
    []
  );

  const logout = useCallback(async () => {
    if (!isFirebaseClientConfigured || !auth) {
      setUser(null);
      await clearSessionCookie();
      return;
    }

    await signOutUser();
    setUser(null);
    await clearSessionCookie();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      loginWithGoogle,
      logout
    }),
    [user, loading, login, signup, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used inside AuthProvider");
  }

  return context;
}
