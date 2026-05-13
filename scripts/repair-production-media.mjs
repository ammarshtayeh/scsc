import nextEnv from "@next/env";
import { cert, deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const IMAGE_SOURCE_PATTERN =
  /^(https?:\/\/.+|data:image\/.+|blob:.+|\/.+\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)([?#].*)?)$/i;

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

function isValidImageSource(value) {
  return typeof value === "string" && IMAGE_SOURCE_PATTERN.test(value.trim());
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
  "repair-production-media"
);

const db = getFirestore(app);

try {
  const snapshot = await db.collection("products").get();
  const invalidProducts = [];
  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const images = Array.isArray(data.images) ? data.images : [];
    const sanitizedImages = images.filter((entry) => isValidImageSource(entry)).map((entry) => entry.trim());

    if (sanitizedImages.length !== images.length) {
      invalidProducts.push({
        id: doc.id,
        before: images,
        after: sanitizedImages
      });

      batch.set(
        doc.ref,
        {
          images: sanitizedImages,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }
  });

  if (!invalidProducts.length) {
    console.log(JSON.stringify({ projectId, updated: 0, products: [] }, null, 2));
  } else {
    await batch.commit();
    console.log(
      JSON.stringify(
        {
          projectId,
          updated: invalidProducts.length,
          products: invalidProducts
        },
        null,
        2
      )
    );
  }
} finally {
  await deleteApp(app);
}
