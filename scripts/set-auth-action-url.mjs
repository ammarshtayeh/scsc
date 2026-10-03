import nextEnv from "@next/env";
import { cert } from "firebase-admin/app";

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
const actionUrl = process.argv.find((arg) => arg.startsWith("https://")) || "https://www.pscsc.com/auth/action";
const apply = process.argv.includes("--apply");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY.");
  process.exit(1);
}

const { access_token: accessToken } = await cert({ projectId, clientEmail, privateKey }).getAccessToken();
const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

const current = await fetch(configUrl, { headers });
if (!current.ok) {
  console.error(`Read failed: ${current.status} ${await current.text()}`);
  process.exit(1);
}

const config = await current.json();
console.log("current callbackUri:", config.notification?.sendEmail?.callbackUri || "(Firebase default)");
console.log("authorizedDomains:", (config.authorizedDomains || []).join(", "));

if (!apply) {
  console.log(`Dry run. Re-run with --apply to set callbackUri to ${actionUrl}`);
  process.exit(0);
}

const updated = await fetch(`${configUrl}?updateMask=notification.sendEmail.callbackUri`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ notification: { sendEmail: { callbackUri: actionUrl } } })
});

if (!updated.ok) {
  console.error(`Update failed: ${updated.status} ${await updated.text()}`);
  process.exit(1);
}

const result = await updated.json();
console.log("new callbackUri:", result.notification?.sendEmail?.callbackUri);
