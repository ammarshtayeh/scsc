import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  SESSION_ROLE_COOKIE_NAME,
  verifySessionToken
} from "@/lib/firebase/session";

function buildLoginRedirect(request: NextRequest) {
  const url = new URL("/auth/login", request.url);
  const pathname = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

function buildRoleRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL("/profile", request.url));
}

export async function middleware(request: NextRequest) {
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
    request.cookies.get(SESSION_ROLE_COOKIE_NAME)?.value
  );
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/profile")) {
    if (!session) {
      return buildLoginRedirect(request);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return buildLoginRedirect(request);
    }

    if (session.role !== "admin") {
      return buildRoleRedirect(request);
    }
  }

  if (pathname.startsWith("/moderator")) {
    if (!session) {
      return buildLoginRedirect(request);
    }

    if (!["admin", "moderator"].includes(session.role)) {
      return buildRoleRedirect(request);
    }
  }

  if (pathname.startsWith("/company")) {
    if (!session) {
      return buildLoginRedirect(request);
    }

    if (!["admin", "company"].includes(session.role)) {
      return buildRoleRedirect(request);
    }
  }

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return buildLoginRedirect(request);
    }

    if (!["admin", "moderator"].includes(session.role)) {
      return buildRoleRedirect(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/admin/:path*", "/moderator/:path*", "/company/:path*", "/dashboard/:path*"]
};
