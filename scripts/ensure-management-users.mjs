import nextEnv from "@next/env";
import { cert, deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { randomBytes } from "node:crypto";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function normalizePrivateKey(value) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  return unquoted.replace(/\\n/g, "\n");
}

function getEnv(name, fallback = "") {
  return process.env[name]?.trim() || fallback;
}

function generatePassword() {
  return `SCSC-${randomBytes(9).toString("base64url")}aA1!`;
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY.");
  process.exit(1);
}

const app = initializeApp(
  {
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    }),
    projectId
  },
  "management-user-ensure"
);

const auth = getAuth(app);
const db = getFirestore(app);

const accounts = [
  {
    email: getEnv("SEED_ADMIN_EMAIL", "admin@example.com"),
    password: getEnv("SEED_ADMIN_PASSWORD", generatePassword()),
    displayName: getEnv("SEED_ADMIN_NAME", "SCSC Admin"),
    role: "admin"
  },
  {
    email: getEnv("SEED_MOD_EMAIL", "moderator@example.com"),
    password: getEnv("SEED_MOD_PASSWORD", generatePassword()),
    displayName: getEnv("SEED_MOD_NAME", "SCSC Moderator"),
    role: "moderator"
  },
  {
    email: getEnv("SEED_USER_EMAIL", "user@example.com"),
    password: getEnv("SEED_USER_PASSWORD", generatePassword()),
    displayName: getEnv("SEED_USER_NAME", "SCSC Member"),
    role: "user"
  }
];

async function findUserByEmail(email) {
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      return null;
    }

    throw error;
  }
}

async function ensureAccount(account) {
  const existingUser = await findUserByEmail(account.email);
  const user = existingUser
    ? await auth.updateUser(existingUser.uid, {
        displayName: account.displayName,
        password: account.password,
        emailVerified: true,
        disabled: false
      })
    : await auth.createUser({
        email: account.email,
        password: account.password,
        displayName: account.displayName,
        emailVerified: true,
        disabled: false
      });

  await auth.setCustomUserClaims(user.uid, { role: account.role });

  const payload = {
    displayName: account.displayName,
    email: account.email,
    role: account.role,
    membershipStatus: "active",
    membershipExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    registeredEventIds: [],
    savedArticleIds: [],
    updatedAt: new Date().toISOString(),
    ...(existingUser ? {} : { joinedAt: new Date().toISOString() })
  };

  await db.collection("users").doc(user.uid).set(payload, { merge: true });

  return {
    uid: user.uid,
    email: account.email,
    password: account.password,
    role: account.role,
    action: existingUser ? "updated" : "created"
  };
}

try {
  const results = [];
  for (const account of accounts) {
    results.push(await ensureAccount(account));
  }

  console.log(
    JSON.stringify(
      {
        projectId,
        results
      },
      null,
      2
    )
  );
} finally {
  await deleteApp(app);
}
