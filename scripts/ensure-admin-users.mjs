import nextEnv from "@next/env";
import { cert, deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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

function emailToDisplayName(email) {
  const localPart = email.split("@")[0] || "admin";
  return localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const rawEmails = process.argv.slice(2).map((entry) => entry.trim().toLowerCase()).filter(Boolean);

if (!rawEmails.length) {
  console.error("Provide one or more email addresses.");
  process.exit(1);
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
  "ensure-admin-users"
);

const auth = getAuth(app);
const db = getFirestore(app);

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

async function ensureAdmin(email) {
  const existingUser = await findUserByEmail(email);
  const password = email;
  const displayName =
    existingUser?.displayName?.trim() || emailToDisplayName(email) || "SCSC Admin";

  const user = existingUser
    ? await auth.updateUser(existingUser.uid, {
        email,
        password,
        displayName,
        emailVerified: true,
        disabled: false
      })
    : await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
        disabled: false
      });

  await auth.setCustomUserClaims(user.uid, { role: "admin" });

  const existingDoc = await db.collection("users").doc(user.uid).get();
  await db.collection("users").doc(user.uid).set(
    {
      displayName,
      email,
      role: "admin",
      membershipStatus: "active",
      membershipExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      registeredEventIds: [],
      savedArticleIds: [],
      updatedAt: new Date().toISOString(),
      ...(existingDoc.exists ? {} : { joinedAt: new Date().toISOString() })
    },
    { merge: true }
  );

  return {
    uid: user.uid,
    email,
    password,
    displayName,
    action: existingUser ? "updated" : "created",
    role: "admin"
  };
}

try {
  const results = [];
  for (const email of rawEmails) {
    results.push(await ensureAdmin(email));
  }

  console.log(
    JSON.stringify(
      {
        projectId,
        count: results.length,
        results
      },
      null,
      2
    )
  );
} finally {
  await deleteApp(app);
}
