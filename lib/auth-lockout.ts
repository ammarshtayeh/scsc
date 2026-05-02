"use client";

import { LOGIN_LOCK_DURATION_MINUTES, LOGIN_LOCK_MAX_ATTEMPTS } from "@/lib/constants";

const STORAGE_KEY = "scsc-login-attempts";

interface LockoutEntry {
  attempts: number;
  lockedUntil?: number;
}

function readStore() {
  if (typeof window === "undefined") {
    return {} as Record<string, LockoutEntry>;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, LockoutEntry>) : {};
}

function writeStore(store: Record<string, LockoutEntry>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getLoginLockout(email: string) {
  const store = readStore();
  const entry = store[email.toLowerCase()];

  if (!entry?.lockedUntil) {
    return null;
  }

  if (entry.lockedUntil <= Date.now()) {
    delete store[email.toLowerCase()];
    writeStore(store);
    return null;
  }

  return entry.lockedUntil;
}

export function recordFailedLogin(email: string) {
  const store = readStore();
  const normalized = email.toLowerCase();
  const current = store[normalized] || { attempts: 0 };
  const attempts = current.attempts + 1;

  store[normalized] = {
    attempts,
    lockedUntil:
      attempts >= LOGIN_LOCK_MAX_ATTEMPTS
        ? Date.now() + LOGIN_LOCK_DURATION_MINUTES * 60 * 1000
        : undefined
  };

  writeStore(store);
  return store[normalized];
}

export function clearFailedLogins(email: string) {
  const store = readStore();
  delete store[email.toLowerCase()];
  writeStore(store);
}
