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

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY."
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
  "production-firebase-check"
);

const db = getFirestore(app);
const auth = getAuth(app);

const collectionSchemas = {
  articles: ["slug", "title", "excerpt", "content", "category", "publishedAt", "approved"],
  events: ["slug", "title", "startsAt", "venue", "capacity", "registeredCount"],
  products: ["slug", "name", "price", "stock", "category", "company"],
  boardMembers: ["year", "name", "role", "image"],
  users: ["displayName", "email", "role", "membershipStatus"],
  orders: ["userId", "createdAt", "status", "items", "total"]
};

async function inspectCollection(collection, fields) {
  const snapshot = await db.collection(collection).limit(50).get();
  const missingRequiredFields = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const missingFields = fields.filter(
      (field) => data[field] === undefined || data[field] === null || data[field] === ""
    );

    if (missingFields.length) {
      missingRequiredFields.push({
        id: doc.id,
        missingFields
      });
    }
  });

  return {
    checked: snapshot.size,
    missingRequiredFields: missingRequiredFields.slice(0, 10)
  };
}

try {
  const firestore = {};

  for (const [collection, fields] of Object.entries(collectionSchemas)) {
    firestore[collection] = await inspectCollection(collection, fields);
  }

  const claims = {};
  for (const email of ["admin@example.com", "moderator@example.com", "user@example.com"]) {
    try {
      const user = await auth.getUserByEmail(email);
      claims[email] = {
        exists: true,
        roleClaim: user.customClaims?.role || null
      };
    } catch (error) {
      claims[email] = {
        exists: false,
        error: error.code || "unknown"
      };
    }
  }

  console.log(
    JSON.stringify(
      {
        projectId,
        firestore,
        claims
      },
      null,
      2
    )
  );
} finally {
  await deleteApp(app);
}
