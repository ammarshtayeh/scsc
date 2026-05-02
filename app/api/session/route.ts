import { NextResponse } from "next/server";

const COOKIE_NAME = "scsc_token";

function shouldUseSecureCookie(request: Request) {
  return process.env.NODE_ENV === "production" && new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  const body = (await request.json()) as { token?: string };

  if (!body.token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, body.token, {
    httpOnly: true,
    secure: shouldUseSecureCookie(request),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}
