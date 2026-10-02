import nextEnv from "@next/env";
import { cert, deleteApp, initializeApp } from "firebase-admin/app";
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
  console.error("Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY.");
  process.exit(1);
}

const deleteIndex = process.argv.indexOf("--delete");
const idsToDelete = deleteIndex === -1 ? [] : process.argv.slice(deleteIndex + 1);

const app = initializeApp(
  { credential: cert({ projectId, clientEmail, privateKey }), projectId },
  "manage-products"
);

const db = getFirestore(app);

try {
  if (idsToDelete.length) {
    for (const id of idsToDelete) {
      await db.collection("products").doc(id).delete();
      console.log(`deleted products/${id}`);
    }
  } else {
    const snapshot = await db.collection("products").get();
    const rows = snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() ?? data.createdAt ?? null;

      return {
        id: doc.id,
        name: data.name ?? "",
        company: data.company ?? data.companyName ?? "",
        companyId: data.companyId ?? "",
        price: data.price ?? null,
        published: data.published ?? data.active ?? null,
        createdAt: createdAt ? String(createdAt) : ""
      };
    });

    console.log(JSON.stringify(rows, null, 2));
    console.log(`total: ${rows.length}`);
  }
} finally {
  await deleteApp(app);
}
