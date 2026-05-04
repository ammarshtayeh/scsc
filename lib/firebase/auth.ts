"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
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

  await sendPasswordResetEmail(auth, email);
}

export function getRoleRedirect(role: Role | undefined) {
  if (role === "admin" || role === "moderator") {
    return "/dashboard";
  }

  return "/profile";
}
