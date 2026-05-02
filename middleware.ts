import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "scsc_token";
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

type SessionData = {
  uid: string;
  role: string;
};

function buildLoginRedirect(request: NextRequest) {
  const redirect = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const url = new URL(`/auth/login?redirect=${encodeURIComponent(redirect)}`, request.url);
  return NextResponse.redirect(url);
}

function parseMockSession(token: string): SessionData | null {
  try {
    const decoded = JSON.parse(atob(token.replace("mock:", ""))) as {
      id: string;
      role: string;
    };
    return {
      uid: decoded.id,
      role: decoded.role
    };
  } catch {
    return null;
  }
}

async function verifySession(request: NextRequest): Promise<SessionData | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  if (token.startsWith("mock:")) {
    return parseMockSession(token);
  }

  if (!projectId) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, firebaseJwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId
    });

    return {
      uid: String(payload.user_id || payload.sub),
      role: String(payload.role || "user")
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const session = await verifySession(request);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/store") || pathname.startsWith("/profile")) {
    if (!session) {
      return buildLoginRedirect(request);
    }
  }

  if (pathname.startsWith("/dashboard")) {
    if (!session || !["admin", "moderator"].includes(session.role)) {
      return buildLoginRedirect(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/store/:path*", "/profile/:path*", "/dashboard/:path*"]
};
