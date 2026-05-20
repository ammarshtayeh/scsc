import nextEnv from "@next/env";
import { cert, deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const sourceWorkbook =
  process.argv.find((arg) => arg.startsWith("--source="))?.slice("--source=".length) ||
  "اسماء_منتسبين_-_جمعيه_التجميل_مع_الايميل.xlsx";
const sampleEmail =
  process.argv.find((arg) => arg.startsWith("--sample="))?.slice("--sample=".length) ||
  "s12505440@stu.najah.edu";

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

const app = initializeApp(
  {
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    }),
    projectId
  },
  "verify-members-import"
);

try {
  const db = getFirestore(app);
  const auth = getAuth(app);

  const importedCount = await db
    .collection("users")
    .where("sourceWorkbook", "==", sourceWorkbook)
    .count()
    .get();
  const activeApprovedCount = await db
    .collection("users")
    .where("sourceWorkbook", "==", sourceWorkbook)
    .where("accountStatus", "==", "approved")
    .where("membershipStatus", "==", "active")
    .count()
    .get();
  const importedSnapshot = await db.collection("users").where("sourceWorkbook", "==", sourceWorkbook).get();
  const missingDegreeCount = importedSnapshot.docs.filter((doc) => {
    const degree = doc.get("degree");
    return typeof degree !== "string" || !degree.trim();
  }).length;

  const sampleUser = await auth.getUserByEmail(sampleEmail);
  const sampleDoc = await db.collection("users").doc(sampleUser.uid).get();
  const sampleData = sampleDoc.data() || {};

  console.log(
    JSON.stringify(
      {
        projectId,
        sourceWorkbook,
        importedFromWorkbook: importedCount.data().count,
        activeApprovedImported: activeApprovedCount.data().count,
        importedMissingDegree: missingDegreeCount,
        sample: {
          uid: sampleUser.uid,
          email: sampleUser.email,
          displayName: sampleData.displayName,
          role: sampleData.role,
          accountStatus: sampleData.accountStatus,
          membershipStatus: sampleData.membershipStatus,
          studentId: sampleData.studentId,
          phone: sampleData.phone,
          specialization: sampleData.specialization,
          degree: sampleData.degree
        }
      },
      null,
      2
    )
  );
} finally {
  await deleteApp(app);
}
