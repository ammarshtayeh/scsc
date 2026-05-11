/**
 * @jest-environment node
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";

jest.mock("@/lib/firebase/session", () => ({
  SESSION_COOKIE_NAME: "scsc_token",
  verifySessionToken: jest.fn()
}));

const { POST } = require("@/app/api/session/route") as typeof import("@/app/api/session/route");
const { verifySessionToken } = jest.requireMock("@/lib/firebase/session") as {
  verifySessionToken: jest.Mock;
};

const mockedVerifySessionToken = verifySessionToken as unknown as jest.MockedFunction<
  (token?: string) => Promise<{ uid: string; role: "admin" | "moderator" | "user" } | null>
>;

function requestWithBody(body: unknown, url = "https://scsc.example/api/session") {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

describe("session API token validation", () => {
  beforeEach(() => {
    mockedVerifySessionToken.mockReset();
  });

  it("returns 400 when token is missing", async () => {
    const response = await POST(requestWithBody({}));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Missing token." });
    expect(mockedVerifySessionToken).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON", async () => {
    const response = await POST(requestWithBody("{bad-json"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON body." });
  });

  it("returns 401 and no cookie when Firebase token verification fails", async () => {
    mockedVerifySessionToken.mockResolvedValue(null);

    const response = await POST(requestWithBody({ token: "not-a-real-firebase-token" }));

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.json()).toEqual({ error: "Invalid token." });
  });

  it("sets an httpOnly session cookie after valid Firebase token verification", async () => {
    mockedVerifySessionToken.mockResolvedValue({ uid: "admin-1", role: "admin" });

    const response = await POST(requestWithBody({ token: "valid-token" }));
    const setCookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(setCookie).toContain("scsc_token=valid-token");
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");
  });
});
