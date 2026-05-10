import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/firebase/session";

function shouldUseSecureCookie(request: Request) {
  return process.env.NODE_ENV === "production" && new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: shouldUseSecureCookie(request),
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
  return response;
}
