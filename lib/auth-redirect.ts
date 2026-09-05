import type { Role } from "@/types";

const DEFAULT_REDIRECT_BY_ROLE: Record<Role, string> = {
  admin: "/admin",
  moderator: "/moderator",
  company: "/company",
  user: "/"
};

function normalizePath(path: string) {
  if (!path.startsWith("/")) {
    return null;
  }

  // Block protocol-relative and malformed external targets.
  if (path.startsWith("//")) {
    return null;
  }

  return path;
}

export function getDefaultRedirectByRole(role?: Role | null) {
  if (!role) {
    return "/";
  }

  return DEFAULT_REDIRECT_BY_ROLE[role] || "/";
}

/** Staff/partner management portal. Null for regular members. */
export function getManagementPortalHref(role?: Role | null): string | null {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "moderator") {
    return "/moderator";
  }

  if (role === "company") {
    return "/company";
  }

  return null;
}

/** Personal account page for every signed-in role. */
export function getProfileHref() {
  return "/profile";
}

export function getPostAuthRedirect(role?: Role | null, redirectParam?: string | null) {
  const safeRedirect = redirectParam ? normalizePath(redirectParam) : null;
  if (safeRedirect) {
    return safeRedirect;
  }

  return getDefaultRedirectByRole(role);
}
