import type { Role } from "@/types";

const DEFAULT_REDIRECT_BY_ROLE: Record<Role, string> = {
  admin: "/admin",
  moderator: "/moderator",
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

export function getPostAuthRedirect(role?: Role | null, redirectParam?: string | null) {
  const safeRedirect = redirectParam ? normalizePath(redirectParam) : null;
  if (safeRedirect) {
    return safeRedirect;
  }

  return getDefaultRedirectByRole(role);
}
