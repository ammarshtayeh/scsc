import "server-only";

import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function normalizePrivateKey(value?: string) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  return unquoted.replace(/\\n/g, "\n");
}

function parseServiceAccountJson(value?: string) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
  } catch {
    return null;
  }
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
const serviceAccountJson =
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
  (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
    ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
    : undefined);
const serviceAccount = parseServiceAccountJson(serviceAccountJson);

export const isFirebaseAdminConfigured = Boolean(
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    (projectId && clientEmail && privateKey) ||
    (serviceAccount?.project_id && serviceAccount.client_email && serviceAccount.private_key)
);

const adminApp =
  isFirebaseAdminConfigured && getApps().length === 0
    ? initializeApp({
        credential: process.env.GOOGLE_APPLICATION_CREDENTIALS
          ? applicationDefault()
          : cert({
              projectId: projectId || serviceAccount?.project_id,
              clientEmail: clientEmail || serviceAccount?.client_email,
              privateKey: privateKey || normalizePrivateKey(serviceAccount?.private_key)
            }),
        projectId: projectId || serviceAccount?.project_id
      })
    : isFirebaseAdminConfigured
      ? getApp()
      : null;

export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const adminAuth = adminApp ? getAuth(adminApp) : null;
