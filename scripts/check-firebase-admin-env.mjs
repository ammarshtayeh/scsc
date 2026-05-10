import nextEnv from "@next/env";
import { cert, deleteApp, initializeApp } from "firebase-admin/app";

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

const formatOk =
  privateKey.startsWith("-----BEGIN PRIVATE KEY-----") &&
  privateKey.includes("\n") &&
  privateKey.trim().endsWith("-----END PRIVATE KEY-----");

const result = {
  projectId,
  clientEmailConfigured: Boolean(clientEmail),
  privateKeyConfigured: Boolean(privateKey),
  privateKeyFormatOk: formatOk,
  firebaseAdminCredentialAccepted: false
};

if (projectId && clientEmail && formatOk) {
  const app = initializeApp(
    {
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      }),
      projectId
    },
    "admin-env-check"
  );

  result.firebaseAdminCredentialAccepted = true;
  await deleteApp(app);
}

console.log(JSON.stringify(result, null, 2));

if (!result.firebaseAdminCredentialAccepted) {
  process.exit(1);
}
