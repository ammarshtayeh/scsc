/**
 * @jest-environment node
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { NextRequest } from "next/server";

jest.mock("@/lib/firebase/session", () => ({
  SESSION_COOKIE_NAME: "scsc_token",
  SESSION_ROLE_COOKIE_NAME: "scsc_role",
  verifySessionToken: jest.fn()
}));

const { middleware } = require("@/middleware") as typeof import("@/middleware");
const { verifySessionToken } = jest.requireMock("@/lib/firebase/session") as {
  verifySessionToken: jest.Mock;
};

const mockedVerifySessionToken = verifySessionToken as unknown as jest.MockedFunction<
  (token?: string, roleCookie?: string) => Promise<{ uid: string; role: "admin" | "moderator" | "company" | "user" } | null>
>;

function nextRequest(path: string, cookieValue = "token", role = "user") {
  return new NextRequest(`https://scsc.example${path}`, {
    headers: { cookie: `scsc_token=${cookieValue}; scsc_role=${role}` }
  });
}

describe("role middleware guards", () => {
  beforeEach(() => {
    mockedVerifySessionToken.mockReset();
  });

  it("redirects logged-out admin requests to login with original destination", async () => {
    mockedVerifySessionToken.mockResolvedValue(null);

    const response = await middleware(nextRequest("/admin?tab=products"));
    const location = response.headers.get("location") || "";

    expect(response.status).toBe(307);
    expect(location).toContain("/auth/login");
    expect(decodeURIComponent(location)).toContain("redirect=/admin?tab=products");
  });

  it("allows admins to enter admin without another login", async () => {
    mockedVerifySessionToken.mockResolvedValue({ uid: "admin-1", role: "admin" });

    const response = await middleware(nextRequest("/admin", "token", "admin"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("sends non-admins away from admin instead of exposing the dashboard", async () => {
    mockedVerifySessionToken.mockResolvedValue({ uid: "user-1", role: "user" });

    const response = await middleware(nextRequest("/admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://scsc.example/profile");
  });

  it("allows companies to enter company portal", async () => {
    mockedVerifySessionToken.mockResolvedValue({ uid: "company-1", role: "company" });

    const response = await middleware(nextRequest("/company", "token", "company"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("sends non-company non-admin users away from company portal", async () => {
    mockedVerifySessionToken.mockResolvedValue({ uid: "user-1", role: "user" });

    const response = await middleware(nextRequest("/company"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://scsc.example/profile");
  });
});
