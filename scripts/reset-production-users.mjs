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
const resetToken = process.env.RESET_PRODUCTION_USERS;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY.");
  process.exit(1);
}

if (resetToken !== "DELETE_AND_RECREATE_USERS") {
  console.error(
    "Refusing to reset users. Set RESET_PRODUCTION_USERS=DELETE_AND_RECREATE_USERS to continue."
  );
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
  "production-user-reset"
);

const auth = getAuth(app);
const db = getFirestore(app);

const accounts = [
  {
    email: getEnv("RESET_ADMIN_EMAIL", "admin@example.com"),
    password: getEnv("RESET_ADMIN_PASSWORD", generatePassword()),
    displayName: getEnv("RESET_ADMIN_NAME", "SCSC Admin"),
    role: "admin"
  },
  {
    email: getEnv("RESET_MOD_EMAIL", "moderator@example.com"),
    password: getEnv("RESET_MOD_PASSWORD", generatePassword()),
    displayName: getEnv("RESET_MOD_NAME", "SCSC Moderator"),
    role: "moderator"
  },
  {
    email: getEnv("RESET_USER_EMAIL", "user@example.com"),
    password: getEnv("RESET_USER_PASSWORD", generatePassword()),
    displayName: getEnv("RESET_USER_NAME", "SCSC Member"),
    role: "user"
  }
];

async function deleteAllAuthUsers() {
  let pageToken;
  let deleted = 0;

  do {
    const result = await auth.listUsers(1000, pageToken);
    const uids = result.users.map((user) => user.uid);

    if (uids.length) {
      const deleteResult = await auth.deleteUsers(uids);
      deleted += deleteResult.successCount;

      if (deleteResult.failureCount) {
        console.warn(
          `Failed to delete ${deleteResult.failureCount} auth users.`,
          deleteResult.errors.map((entry) => entry.error.message)
        );
      }
    }

    pageToken = result.pageToken;
  } while (pageToken);

  return deleted;
}

async function deleteCollection(path, batchSize = 300) {
  let deleted = 0;

  while (true) {
    const snapshot = await db.collection(path).limit(batchSize).get();

    if (snapshot.empty) {
      return deleted;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
  }
}

async function deleteEventRegistrations() {
  const eventsSnapshot = await db.collection("events").get();
  let deleted = 0;
  const touchedEvents = [];

  for (const eventDoc of eventsSnapshot.docs) {
    const registrations = await eventDoc.ref.collection("registrations").get();

    if (registrations.empty) {
      continue;
    }

    const batch = db.batch();
    registrations.docs.forEach((registrationDoc) => batch.delete(registrationDoc.ref));
    batch.set(
      eventDoc.ref,
      {
        registeredCount: 0,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    await batch.commit();
    deleted += registrations.size;
    touchedEvents.push(eventDoc.id);
  }

  return { deleted, touchedEvents };
}

async function createAccount(account) {
  const user = await auth.createUser({
    email: account.email,
    password: account.password,
    displayName: account.displayName,
    emailVerified: true,
    disabled: false
  });

  await auth.setCustomUserClaims(user.uid, { role: account.role });

  await db.collection("users").doc(user.uid).set({
    displayName: account.displayName,
    email: account.email,
    role: account.role,
    membershipStatus: "active",
    membershipExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    joinedAt: new Date().toISOString(),
    registeredEventIds: [],
    savedArticleIds: [],
    updatedAt: new Date().toISOString()
  });

  return {
    uid: user.uid,
    email: account.email,
    password: account.password,
    role: account.role
  };
}

try {
  const [deletedAuthUsers, deletedFirestoreUsers, deletedCarts, registrations] =
    await Promise.all([
      deleteAllAuthUsers(),
      deleteCollection("users"),
      deleteCollection("carts"),
      deleteEventRegistrations()
    ]);

  const created = [];
  for (const account of accounts) {
    created.push(await createAccount(account));
  }

  console.log(
    JSON.stringify(
      {
        projectId,
        deleted: {
          authUsers: deletedAuthUsers,
          firestoreUsers: deletedFirestoreUsers,
          carts: deletedCarts,
          eventRegistrations: registrations.deleted,
          eventsReset: registrations.touchedEvents
        },
        created
      },
      null,
      2
    )
  );
} finally {
  await deleteApp(app);
}
