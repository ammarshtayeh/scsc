import { describe, expect, it } from "@jest/globals";

import {
  getDefaultRedirectByRole,
  getManagementPortalHref,
  getPostAuthRedirect,
  getProfileHref
} from "@/lib/auth-redirect";

describe("auth redirect helpers", () => {
  it("returns role default redirect", () => {
    expect(getDefaultRedirectByRole("admin")).toBe("/admin");
    expect(getDefaultRedirectByRole("moderator")).toBe("/moderator");
    expect(getDefaultRedirectByRole("company")).toBe("/company");
    expect(getDefaultRedirectByRole("user")).toBe("/");
  });

  it("returns management portal href only for staff roles", () => {
    expect(getManagementPortalHref("admin")).toBe("/admin");
    expect(getManagementPortalHref("moderator")).toBe("/moderator");
    expect(getManagementPortalHref("company")).toBe("/company");
    expect(getManagementPortalHref("user")).toBeNull();
    expect(getProfileHref()).toBe("/profile");
  });

  it("uses safe redirect param when present", () => {
    expect(getPostAuthRedirect("user", "/admin")).toBe("/admin");
    expect(getPostAuthRedirect("user", "/store?x=1")).toBe("/store?x=1");
  });

  it("rejects unsafe redirect param and falls back to role home", () => {
    expect(getPostAuthRedirect("admin", "https://evil.com")).toBe("/admin");
    expect(getPostAuthRedirect("admin", "//evil.com")).toBe("/admin");
  });
});
