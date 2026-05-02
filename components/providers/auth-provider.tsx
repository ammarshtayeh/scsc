"use client";

import { onIdTokenChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { getRoleRedirect, signInWithEmail, signOutUser, signUpWithEmail } from "@/lib/firebase/auth";
import { auth, db, isFirebaseClientConfigured } from "@/lib/firebase/firebase";
import { mockUsers } from "@/lib/mock-data";
import { upsertMockUserProfile } from "@/lib/mock-profiles";
import type { AppSessionUser, Role, UserProfile } from "@/types";

const MOCK_USER_STORAGE_KEY = "scsc-mock-user";
const MOCK_ACCOUNT_STORAGE_KEY = "scsc-mock-accounts";

interface MockAccount {
  id: string;
  email: string;
  displayName: string;
  password: string;
  role: Role;
  company?: string;
  photoURL?: string;
}

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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function serializeMockUser(user: AppSessionUser) {
  return `mock:${btoa(JSON.stringify(user))}`;
}

function parseMockUser(): AppSessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(MOCK_USER_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as AppSessionUser) : null;
}

function getSeedMockAccounts(): MockAccount[] {
  const seeded = mockUsers.map((entry) => ({
    id: entry.id,
    email: entry.email.toLowerCase(),
    displayName: entry.displayName,
    password: "admin123",
    role: entry.role,
    company: entry.company,
    photoURL: entry.photoURL
  }));

  return [
    ...seeded,
    {
      ...seeded[0],
      email: "admin@example.com"
    },
    {
      ...seeded[1],
      email: "moderator@example.com"
    }
  ];
}

function writeMockAccounts(accounts: MockAccount[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MOCK_ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
}

function readMockAccounts() {
  const seeded = getSeedMockAccounts();

  if (typeof window === "undefined") {
    return seeded;
  }

  const raw = window.localStorage.getItem(MOCK_ACCOUNT_STORAGE_KEY);
  if (!raw) {
    writeMockAccounts(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as MockAccount[];
    const seededMap = new Map(seeded.map((entry) => [entry.email, entry]));
    const merged = new Map(seededMap);

    parsed.forEach((entry) => {
      const normalizedEmail = entry.email.toLowerCase();
      const seededEntry = seededMap.get(normalizedEmail);

      if (seededEntry) {
        merged.set(normalizedEmail, {
          ...entry,
          ...seededEntry,
          email: normalizedEmail
        });
        return;
      }

      merged.set(normalizedEmail, {
        ...merged.get(normalizedEmail),
        ...entry,
        email: normalizedEmail
      });
    });

    const accounts = [...merged.values()];
    writeMockAccounts(accounts);
    return accounts;
  } catch {
    writeMockAccounts(seeded);
    return seeded;
  }
}

function findMockAccount(email: string) {
  return readMockAccounts().find((entry) => entry.email === email.toLowerCase()) || null;
}

function buildMockSessionUser(account: MockAccount): AppSessionUser {
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
    role: account.role,
    photoURL: account.photoURL
  };
}

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseClientConfigured || !auth) {
      setUser(parseMockUser());
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
      const account = findMockAccount(email);
      if (!account || account.password !== password) {
        throw new Error("auth/invalid-credentials");
      }

      const mockUser = buildMockSessionUser(account);
      window.localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      await syncSessionCookie(serializeMockUser(mockUser));
      return getRoleRedirect(mockUser.role);
    }

    const credential = await signInWithEmail(email, password);
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
        const normalizedEmail = email.toLowerCase();
        const existingAccount = findMockAccount(normalizedEmail);
        if (existingAccount) {
          throw new Error("auth/email-already-in-use");
        }

        const mockAccount: MockAccount = {
          id: `mock-${normalizedEmail}`,
          email: normalizedEmail,
          displayName,
          password,
          role: "user",
          company: company || ""
        };
        writeMockAccounts([mockAccount, ...readMockAccounts()]);
        upsertMockUserProfile({
          id: mockAccount.id,
          membershipId: buildMembershipId(mockAccount.id),
          displayName,
          email: normalizedEmail,
          company: company || "",
          role: "user",
          membershipStatus: "active",
          membershipExpiresAt: new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 365
          ).toISOString(),
          joinedAt: new Date().toISOString(),
          qrToken: uuidv4(),
          savedArticleIds: [],
          registeredEventIds: [],
          activeQrSessionId: null,
          activeQrSessionExpiresAt: null,
          lastQrIssuedAt: null,
          lastQrScanAt: null,
          discountRate: 0.12
        });

        const mockUser = buildMockSessionUser(mockAccount);
        window.localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(mockUser));
        setUser(mockUser);
        await syncSessionCookie(serializeMockUser(mockUser));
        return "/profile";
      }

      const credential = await signUpWithEmail(email, password, displayName);
      if (db) {
        const membershipExpiresAt = new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 365
        ).toISOString();

        await setDoc(
          doc(db, "users", credential.user.uid),
          {
            membershipId: buildMembershipId(credential.user.uid),
            displayName,
            email,
            company: company || "",
            role: "user",
            membershipStatus: "active",
            membershipExpiresAt,
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

      const sessionUser = await buildFirebaseSessionUser(credential.user);
      setUser(sessionUser);
      await syncSessionCookie(await credential.user.getIdToken());
      return "/profile";
    },
    []
  );

  const logout = useCallback(async () => {
    if (!isFirebaseClientConfigured || !auth) {
      window.localStorage.removeItem(MOCK_USER_STORAGE_KEY);
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
      logout
    }),
    [user, loading, login, signup, logout]
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
