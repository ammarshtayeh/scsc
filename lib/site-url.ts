export function getSiteUrl() {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "https://www.pscsc.com").trim().replace(/\/+$/, "");

  try {
    return new URL(raw).toString().replace(/\/+$/, "");
  } catch {
    return "https://www.pscsc.com";
  }
}

export function toAbsoluteUrl(path: string) {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
