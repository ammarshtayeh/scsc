import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, SESSION_ROLE_COOKIE_NAME } from "@/lib/firebase/session";

function shouldUseSecureCookie(request: Request) {
  try {
    return process.env.NODE_ENV === "production" && new URL(request.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export async function POST(request: Request) {
  try {
    const response = NextResponse.json({ ok: true });
    const cookieOptions = {
      httpOnly: true,
      secure: shouldUseSecureCookie(request),
      sameSite: "lax" as const,
      path: "/",
      expires: new Date(0)
    };

    response.cookies.set(SESSION_COOKIE_NAME, "", cookieOptions);
    response.cookies.set(SESSION_ROLE_COOKIE_NAME, "", cookieOptions);
    return response;
  } catch (error) {
    console.error("[session:logout]", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: true });
  }
}
