import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/firebase/session";

function shouldUseSecureCookie(request: Request) {
  return process.env.NODE_ENV === "production" && new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  const body = (await request.json()) as { token?: string };

  if (!body.token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, body.token, {
    httpOnly: true,
    secure: shouldUseSecureCookie(request),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}
