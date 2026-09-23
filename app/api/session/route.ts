import { NextResponse } from "next/server";

import { resolveUserRoleFromToken } from "@/lib/firebase/resolve-user-role";
import {
  SESSION_COOKIE_NAME,
  SESSION_ROLE_COOKIE_NAME,
  verifySessionToken
} from "@/lib/firebase/session";

function shouldUseSecureCookie(request: Request) {
  try {
    return process.env.NODE_ENV === "production" && new URL(request.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

function setSessionCookies(response: NextResponse, request: Request, token: string, role: string) {
  const secure = shouldUseSecureCookie(request);
  const cookieOptions = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  };

  response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions);
  response.cookies.set(SESSION_ROLE_COOKIE_NAME, role, cookieOptions);
}

export async function POST(request: Request) {
  let body: { token?: string };

  try {
    body = (await request.json()) as { token?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.token || typeof body.token !== "string") {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  try {
    const roleFromProfile = await resolveUserRoleFromToken(body.token);
    const verified = await verifySessionToken(body.token, roleFromProfile);

    if (!verified) {
      return NextResponse.json({ error: "Invalid token." }, { status: 401 });
    }

    // Never let a failed/empty claim resolution wipe an elevated JWT claim.
    const role =
      roleFromProfile !== "user"
        ? roleFromProfile
        : verified.role !== "user"
          ? verified.role
          : "user";

    const response = NextResponse.json({ ok: true, role });
    setSessionCookies(response, request, body.token, role);
    return response;
  } catch (error) {
    console.error("[session:POST]", error instanceof Error ? error.message : error);
    // Soft-fail: still set cookie with token so auth can recover client-side.
    try {
      const verified = await verifySessionToken(body.token);
      if (verified) {
        const response = NextResponse.json({ ok: true, role: verified.role, degraded: true });
        setSessionCookies(response, request, body.token, verified.role);
        return response;
      }
    } catch {
      // fall through
    }

    return NextResponse.json({ error: "Session sync failed." }, { status: 503 });
  }
}
