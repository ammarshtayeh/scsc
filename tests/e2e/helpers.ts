import { expect, type Locator, type Page } from "@playwright/test";

export const BASE_URL = process.env.BASE_URL ?? "https://scsc-iota.vercel.app";

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }
  return pathname.replace(/\/+$/, "");
}

export async function assertUrl(page: Page, expectedPath: string) {
  const current = new URL(page.url());
  const expected = new URL(expectedPath, BASE_URL);
  // WHY: URL integrity is a hard requirement in SRS (no redirect/query leftovers).
  expect(current.origin).toBe(expected.origin);
  expect(normalizePath(current.pathname)).toBe(normalizePath(expected.pathname));
  expect(current.search).toBe("");
  expect(current.hash).toBe("");
}

export async function goTo(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
}

export async function loginAs(page: Page, email: string, password: string) {
  await goTo(page, "/auth/login");
  await page.waitForSelector("input[type='email']");
  await page.locator("input[type='email']").fill(email);
  await page.locator("input[type='password']").fill(password);
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.getByRole("button", { name: /sign in|تسجيل الدخول/i }).click()
  ]);
}

export async function logout(page: Page) {
  const logoutTrigger = page
    .locator("button, a")
    .filter({ hasText: /logout|log out|تسجيل الخروج/i })
    .first();
  if (await logoutTrigger.isVisible().catch(() => false)) {
    await Promise.all([page.waitForLoadState("networkidle"), logoutTrigger.click()]);
  }
}

export async function ensureLoggedOut(page: Page) {
  await goTo(page, "/");
  await logout(page);
  await goTo(page, "/auth/login");
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export async function maybeAcceptDialog(page: Page) {
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
}

export async function clickAndWaitNetworkIdle(page: Page, locator: Locator) {
  await Promise.all([page.waitForLoadState("networkidle"), locator.click()]);
}
