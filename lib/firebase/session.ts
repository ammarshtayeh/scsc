import { createRemoteJWKSet, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "scsc_token";
export const SESSION_ROLE_COOKIE_NAME = "scsc_role";

export type SessionRole = "admin" | "moderator" | "company" | "user";

export interface SessionData {
  uid: string;
  role: SessionRole;
}

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

function normalizeRole(role: unknown): SessionRole {
  return role === "admin" || role === "moderator" || role === "company" ? role : "user";
}

export async function verifySessionToken(
  token?: string,
  roleOverride?: string | null
): Promise<SessionData | null> {
  if (!token || !projectId) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, firebaseJwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId
    });

    const claimRole = normalizeRole(payload.role);
    const cookieRole = typeof roleOverride === "string" ? normalizeRole(roleOverride) : null;

    return {
      uid: String(payload.user_id || payload.sub),
      // Prefer the synced role cookie (Firestore-aware) over JWT claims alone.
      role: cookieRole || claimRole
    };
  } catch {
    return null;
  }
}

/** Server pages/middleware: always read token + role cookies together. */
export async function getSessionFromCookies(cookieStore: CookieReader): Promise<SessionData | null> {
  return verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
    cookieStore.get(SESSION_ROLE_COOKIE_NAME)?.value
  );
}
