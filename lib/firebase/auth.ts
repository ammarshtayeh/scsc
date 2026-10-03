"use client";

import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  verifyPasswordResetCode
} from "firebase/auth";

import { auth } from "@/lib/firebase/firebase";
import type { Role } from "@/types";

export async function signInWithEmail(email: string, password: string) {
  if (!auth) {
    throw new Error("Firebase Auth is not configured.");
  }

  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  if (!auth) {
    throw new Error("Firebase Auth is not configured.");
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account"
  });

  return signInWithPopup(auth, provider);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  if (!auth) {
    throw new Error("Firebase Auth is not configured.");
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  return credential;
}

export async function signOutUser() {
  if (!auth) {
    return;
  }

  await signOut(auth);
}

export async function sendPasswordReset(email: string) {
  if (!auth) {
    throw new Error("Firebase Auth is not configured.");
  }

  const continueUrl =
    typeof window !== "undefined" ? `${window.location.origin}/auth/login` : undefined;
  try {
    await sendPasswordResetEmail(auth, email.trim(), continueUrl ? { url: continueUrl } : undefined);
  } catch (error) {
    const code = (error as { code?: string }).code || "";
    if (continueUrl && (code.includes("unauthorized-continue-uri") || code.includes("invalid-continue-uri"))) {
      await sendPasswordResetEmail(auth, email.trim());
      return;
    }
    throw error;
  }
}

function requireSignedInUser() {
  const currentUser = auth?.currentUser;
  if (!currentUser || !currentUser.email) {
    throw new Error("auth/requires-recent-login");
  }
  return currentUser;
}

export function currentUserHasPassword() {
  return Boolean(auth?.currentUser?.providerData.some((provider) => provider.providerId === "password"));
}

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const currentUser = requireSignedInUser();
  const credential = EmailAuthProvider.credential(currentUser.email as string, currentPassword);
  await reauthenticateWithCredential(currentUser, credential);
  await updatePassword(currentUser, newPassword);
}

export async function createPasswordForCurrentUser(newPassword: string) {
  const currentUser = requireSignedInUser();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account", login_hint: currentUser.email as string });
  await reauthenticateWithPopup(currentUser, provider);
  await linkWithCredential(
    currentUser,
    EmailAuthProvider.credential(currentUser.email as string, newPassword)
  );
}

export async function verifyPasswordResetLink(code: string) {
  if (!auth) {
    throw new Error("Firebase Auth is not configured.");
  }
  return verifyPasswordResetCode(auth, code);
}

export async function completePasswordReset(code: string, newPassword: string) {
  if (!auth) {
    throw new Error("Firebase Auth is not configured.");
  }
  await confirmPasswordReset(auth, code, newPassword);
}

export async function applyEmailActionCode(code: string) {
  if (!auth) {
    throw new Error("Firebase Auth is not configured.");
  }
  const info = await checkActionCode(auth, code);
  await applyActionCode(auth, code);
  return info;
}

export function getRoleRedirect(role: Role | undefined) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "moderator") {
    return "/moderator";
  }

  return "/profile";
}
