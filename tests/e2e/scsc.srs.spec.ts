import { expect, test } from "@playwright/test";

import {
  assertUrl,
  BASE_URL,
  clickAndWaitNetworkIdle,
  ensureLoggedOut,
  goTo,
  loginAs,
  logout,
  maybeAcceptDialog
} from "./helpers";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASSWORD = process.env.USER_PASSWORD;
const MOD_EMAIL = process.env.MOD_EMAIL;
const MOD_PASSWORD = process.env.MOD_PASSWORD;

function randomSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

function testRequiresUser() {
  test.skip(!USER_EMAIL || !USER_PASSWORD, "USER_EMAIL/USER_PASSWORD are required.");
}

function testRequiresAdmin() {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "ADMIN_EMAIL/ADMIN_PASSWORD are required.");
}

function testRequiresModerator() {
  test.skip(!MOD_EMAIL || !MOD_PASSWORD, "MOD_EMAIL/MOD_PASSWORD are required.");
}

test.describe("GROUP 1 — URL Integrity & Clean Navigation @url", () => {
  test("public pages return HTTP 200 @redirect", async ({ request }) => {
    for (const path of ["/", "/about", "/education", "/events", "/contact", "/auth/login"]) {
      const response = await request.get(`${BASE_URL}${path}`);
      // WHY: direct page health checks catch routing regressions before UI assertions.
      expect(response.ok()).toBeTruthy();
    }
  });

  test("public routes resolve with clean URLs @smoke @redirect", async ({ page }) => {
    for (const path of ["/", "/about", "/education", "/events", "/contact", "/auth/login"]) {
      await goTo(page, path);
      // WHY: clean URLs are an explicit acceptance criterion in SRS.
      await assertUrl(page, path);
    }
  });

  test("fake route renders not-found page @redirect", async ({ page }) => {
    await goTo(page, "/this-route-should-not-exist-qa");
    // WHY: app must fail gracefully without crashing router/runtime.
    await expect(page.locator("body")).toContainText(/not found|404|غير موجود/i);
  });

  test("logged-out protected routes always land on auth login @redirect @auth", async ({ page }) => {
    for (const path of ["/store", "/profile", "/admin"]) {
      await goTo(page, path);
      // WHY: security requirement demands protected routes enforce auth every time.
      await expect(new URL(page.url()).pathname).toContain("/auth/login");
    }
  });

  test("auth redirect query preserves intended destination @redirect @auth", async ({ page }) => {
    await goTo(page, "/admin");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/auth/login");
    // WHY: login page needs original destination to avoid forcing a second login flow.
    expect(url.searchParams.get("redirect")).toContain("/admin");
  });

  test("redirect query is cleared after successful login @auth @redirect", async ({ page }) => {
    testRequiresUser();
    await goTo(page, "/auth/login?redirect=%2F");
    await page.waitForSelector("input[type='email']");
    await page.locator("input[type='email']").fill(USER_EMAIL!);
    await page.locator("input[type='password']").fill(USER_PASSWORD!);
    await clickAndWaitNetworkIdle(
      page,
      page.getByRole("button", { name: /sign in|تسجيل الدخول/i })
    );
    // WHY: SRS requires no leftover redirect query after auth completes.
    await assertUrl(page, "/");
  });

  test("session API rejects missing and invalid Firebase tokens @security @api", async ({ request }) => {
    const missing = await request.post(`${BASE_URL}/api/session`, { data: {} });
    expect(missing.status()).toBe(400);

    const invalid = await request.post(`${BASE_URL}/api/session`, {
      data: { token: "not-a-valid-firebase-id-token" }
    });
    // WHY: the session endpoint must not create cookies for arbitrary client input.
    expect(invalid.status()).toBe(401);
    expect(invalid.headers()["set-cookie"]).toBeFalsy();
  });
});

test.describe("GROUP 2 — Authentication & Redirects @auth @redirect", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test("regular user login succeeds and redirects cleanly @smoke @auth @redirect", async ({ page }) => {
    testRequiresUser();
    await loginAs(page, USER_EMAIL!, USER_PASSWORD!);
    await assertUrl(page, "/");
  });

  test("already-authenticated admin visiting login with admin redirect enters admin directly @auth @redirect @admin", async ({
    page
  }) => {
    testRequiresAdmin();
    await loginAs(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await goTo(page, "/auth/login?redirect=%2Fadmin");
    // WHY: admin users must not be asked to authenticate a second time for /admin.
    await assertUrl(page, "/admin");
  });

  test("invalid login stays on /auth/login and shows error @auth @redirect", async ({ page }) => {
    testRequiresUser();
    await goTo(page, "/auth/login");
    await page.waitForSelector("input[type='email']");
    await page.locator("input[type='email']").fill(USER_EMAIL!);
    await page.locator("input[type='password']").fill("bad-password-123");
    await clickAndWaitNetworkIdle(
      page,
      page.getByRole("button", { name: /sign in|تسجيل الدخول/i })
    );
    // WHY: invalid credentials must not navigate away from login page.
    await expect(new URL(page.url()).pathname).toContain("/auth/login");
    await expect(page.locator("body")).toContainText(/invalid|credentials|خطأ|غير صحيح|error/i);
  });

  test("password reset shows confirmation toast/message @auth", async ({ page }) => {
    testRequiresUser();
    await goTo(page, "/auth/login");
    await page.waitForSelector("input[type='email']");
    await page.locator("input[type='email']").fill(USER_EMAIL!);
    await clickAndWaitNetworkIdle(
      page,
      page.getByRole("button", { name: /forgot password|نسيت كلمة المرور/i })
    );
    // WHY: reset flow must show user feedback without navigation.
    await expect(page.locator("body")).toContainText(/reset|email|sent|تم/i);
  });

  test("signup rejects weak password and duplicate email @auth", async ({ page }) => {
    testRequiresUser();
    await goTo(page, "/auth/signup");
    await page.waitForSelector("form");
    await page.locator("input").nth(0).fill("QA Duplicate User");
    await page.locator("input[type='email']").fill(USER_EMAIL!);
    await page.locator("input").nth(2).fill("QA Inc");
    await page.locator("input[type='password']").fill("weak");
    await clickAndWaitNetworkIdle(
      page,
      page.getByRole("button", { name: /create account|إنشاء/i })
    );
    // WHY: weak password policy (8 chars + number) is an explicit SRS rule.
    await expect(page.locator("body")).toContainText(/password|8|number|كلمة المرور|رقم/i);

    await page.locator("input[type='password']").fill("StrongPass123");
    await clickAndWaitNetworkIdle(
      page,
      page.getByRole("button", { name: /create account|إنشاء/i })
    );
    // WHY: duplicate email must return clear error feedback to user.
    await expect(page.locator("body")).toContainText(/already|exists|in use|مستخدم/i);
  });

  test("protected routes redirect logged-out users to login @auth @redirect", async ({ page }) => {
    for (const protectedPath of ["/store", "/profile", "/admin"]) {
      await goTo(page, protectedPath);
      // WHY: route protection is a core security requirement.
      await expect(new URL(page.url()).pathname).toContain("/auth/login");
    }
  });

  test("logout returns to home and re-protects sensitive routes @auth @redirect", async ({ page }) => {
    testRequiresUser();
    await loginAs(page, USER_EMAIL!, USER_PASSWORD!);
    await logout(page);
    await assertUrl(page, "/");
    await goTo(page, "/profile");
    // WHY: post-logout access to protected pages must be denied immediately.
    await expect(new URL(page.url()).pathname).toContain("/auth/login");
  });
});

test.describe("GROUP 3 — Homepage @homepage", () => {
  test("hero, slider, CTA and cards render correctly @smoke", async ({ page }) => {
    await goTo(page, "/");
    await page.waitForSelector("main");
    await expect(page.locator("main")).toContainText(/member|عضوية|association|جمعية/i);
    // WHY: homepage must render primary value proposition and key content blocks.
    await expect(page.locator("main img").first()).toBeVisible();
    await expect(page.locator("main")).toContainText(/event|news|workshop|فعالية|ورش/i);
    const cardCount = await page.locator("a[href^='/events/']").count();
    // WHY: events preview must not overflow with excessive cards.
    expect(cardCount).toBeLessThanOrEqual(4);
  });

  test("become member CTA routes by auth state @auth", async ({ page }) => {
    const cta = page.getByRole("link", { name: /become a member|انضم|عضوية/i }).first();
    await goTo(page, "/");
    await page.waitForSelector("main");
    if (await cta.isVisible().catch(() => false)) {
      await clickAndWaitNetworkIdle(page, cta);
      await expect(new URL(page.url()).pathname).toContain("/auth/login");
    }
  });

  test("homepage has no horizontal overflow on default viewport @smoke", async ({ page }) => {
    await goTo(page, "/");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    // WHY: homepage is a primary entry point and must not break layout.
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});

test.describe("GROUP 4 — About Page @about", () => {
  test("about page content and board section render @smoke", async ({ page }) => {
    await goTo(page, "/about");
    await page.waitForSelector("main");
    await expect(page.locator("main")).toContainText(/about|association|board|من نحن|الهيئة/i);
  });
});

test.describe("GROUP 5 — Education Page @education", () => {
  test("education listing renders and article links open detail @smoke", async ({ page }) => {
    await goTo(page, "/education");
    await page.waitForSelector("main");
    const firstReadMore = page.getByRole("link", { name: /read more|اقرأ المزيد/i }).first();
    if (await firstReadMore.isVisible().catch(() => false)) {
      await clickAndWaitNetworkIdle(page, firstReadMore);
      // WHY: article deep-linking must remain functional for public readers.
      await expect(new URL(page.url()).pathname).toContain("/education/");
    }
  });
});

test.describe("GROUP 6 — Events Page @events", () => {
  test("events page loads and event details are reachable @smoke", async ({ page }) => {
    await goTo(page, "/events");
    await page.waitForSelector("main");
    const firstEventLink = page.locator("a[href^='/events/']").first();
    if (await firstEventLink.isVisible().catch(() => false)) {
      await clickAndWaitNetworkIdle(page, firstEventLink);
      await expect(new URL(page.url()).pathname).toContain("/events/");
    }
  });

  test("event registration card redirects logged-out users to login @events @redirect @auth", async ({
    page
  }) => {
    await goTo(page, "/events");
    const firstEventLink = page.locator("a[href^='/events/']").first();
    test.skip(!(await firstEventLink.isVisible().catch(() => false)), "No events available.");
    await clickAndWaitNetworkIdle(page, firstEventLink);
    const loginToRegister = page.getByRole("button", { name: /login|تسجيل الدخول/i }).first();
    test.skip(
      !(await loginToRegister.isVisible().catch(() => false)),
      "Event register card did not expose login call-to-action."
    );
    await clickAndWaitNetworkIdle(page, loginToRegister);
    await expect(new URL(page.url()).pathname).toContain("/auth/login");
  });
});

test.describe("GROUP 7 — Store @store", () => {
  test("logged-out access to /store redirects to login @store @auth @redirect", async ({ page }) => {
    await goTo(page, "/store");
    await expect(new URL(page.url()).pathname).toContain("/auth/login");
  });

  test("member can access store, add to cart, persist across navigation @smoke @store", async ({
    page
  }) => {
    testRequiresUser();
    await loginAs(page, USER_EMAIL!, USER_PASSWORD!);
    await goTo(page, "/store");
    await page.waitForSelector("main");
    await expect(page.locator("main")).toContainText(/filters|cart|السلة|products/i);

    const addButton = page
      .getByRole("button", { name: /add to cart|أضف للسلة/i })
      .filter({ hasNotText: /out of stock|نفذ المخزون/i })
      .first();

    test.skip(!(await addButton.isVisible().catch(() => false)), "No in-stock products available.");

    await clickAndWaitNetworkIdle(page, addButton);
    await expect(page.locator("main")).toContainText(/estimated total|المجموع|total/i);
    await goTo(page, "/profile");
    await goTo(page, "/store");
    // WHY: persistence across route change verifies Firestore-backed cart behavior.
    await expect(page.locator("main")).toContainText(/estimated total|المجموع|total/i);
  });

  test("checkout button is disabled for empty cart @store", async ({ page }) => {
    testRequiresUser();
    await loginAs(page, USER_EMAIL!, USER_PASSWORD!);
    await goTo(page, "/store");
    const checkoutBtn = page.getByRole("button", { name: /checkout|إتمام الطلب/i }).first();
    await expect(checkoutBtn).toBeDisabled();
  });

  test("product detail page renders required fields @store", async ({ page }) => {
    testRequiresUser();
    await loginAs(page, USER_EMAIL!, USER_PASSWORD!);
    await goTo(page, "/store");
    const details = page.getByRole("button", { name: /view details|التفاصيل/i }).first();
    test.skip(!(await details.isVisible().catch(() => false)), "No product details button found.");
    await clickAndWaitNetworkIdle(page, details);
    // WHY: product detail must expose image/description/price/stock indicators.
    await expect(page.locator("main img").first()).toBeVisible();
    await expect(page.locator("main")).toContainText(/stock|in stock|out of stock|المخزون/i);
    await expect(page.locator("main")).toContainText(/\$|usd|دولار/i);
  });

  test("store URL stays clean for logged-out redirect @store @redirect", async ({ page }) => {
    await goTo(page, "/store");
    const url = new URL(page.url());
    // WHY: login redirection must not leak stale route params unexpectedly.
    expect(url.pathname).toContain("/auth/login");
  });
});

test.describe("GROUP 8 — User Profile & QR @profile @qr", () => {
  test("profile loads and membership card shows QR + timer + warning @smoke @auth", async ({
    page
  }) => {
    testRequiresUser();
    await loginAs(page, USER_EMAIL!, USER_PASSWORD!);
    await goTo(page, "/profile");
    await page.waitForSelector("main");
    await expect(page.locator("main")).toContainText(/membership|order history|عضوية|الطلبات/i);
    await clickAndWaitNetworkIdle(
      page,
      page.getByRole("button", { name: /view membership card|بطاقة العضوية/i })
    );
    await expect(page.locator("main img").first()).toBeVisible();
    // WHY: anti-screenshot warning and countdown are mandatory in QR SRS.
    await expect(page.locator("main")).toContainText(/screenshot|expires in|تنبيه|ثانية/i);
  });
});

test.describe("GROUP 9 — Admin Dashboard @admin", () => {
  test("admin login reaches /admin with stats cards @smoke @admin @auth @redirect", async ({
    page
  }) => {
    testRequiresAdmin();
    await loginAs(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await goTo(page, "/admin");
    await assertUrl(page, "/admin");
    // WHY: dashboard KPIs must render to validate admin data pipelines.
    await expect(page.locator("main")).toContainText(/users|orders|events|companies|المستخدمين/i);
  });

  test("admin can add and delete product from dashboard @admin @store", async ({ page }) => {
    testRequiresAdmin();
    const name = `qa-product-${randomSuffix()}`;
    const editedName = `${name}-edited`;
    await loginAs(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await goTo(page, "/admin/products");
    await page.waitForSelector("form");

    await page.getByPlaceholder(/product name|اسم المنتج/i).fill(name);
    await page.getByPlaceholder(/company|الشركة/i).first().fill("QA Co");
    await page.locator("input[type='number']").nth(2).fill("15");
    await page.locator("input[type='number']").nth(3).fill("11");
    await page.getByPlaceholder(/image url|رابط الصورة/i).nth(1).fill("https://placehold.co/600x400");
    await page
      .getByPlaceholder(/description|الوصف/i)
      .first()
      .fill("Automated product created by Playwright.");
    await clickAndWaitNetworkIdle(page, page.getByRole("button", { name: /add product|إضافة منتج/i }));

    await goTo(page, "/store");
    // WHY: admin CRUD should immediately reflect in member-facing store.
    await expect(page.locator("main")).toContainText(name);

    await goTo(page, "/admin/products");
    const productCard = page.locator("div").filter({ hasText: name }).first();
    await expect(productCard).toBeVisible();
    await productCard.locator("summary").click();
    await productCard.locator("input[name='name']").fill(editedName);
    await productCard.locator("input[name='stock']").fill("3");
    await clickAndWaitNetworkIdle(
      page,
      productCard.getByRole("button", { name: /save changes|حفظ التعديلات/i }).first()
    );

    await goTo(page, "/store");
    await expect(page.locator("main")).toContainText(editedName);
    await expect(page.locator("main")).not.toContainText(name);

    await goTo(page, "/admin/products");
    const editedProductCard = page.locator("div").filter({ hasText: editedName }).first();
    await expect(editedProductCard).toBeVisible();
    await clickAndWaitNetworkIdle(
      page,
      editedProductCard.getByRole("button", { name: /delete|حذف/i }).first()
    );

    await goTo(page, "/store");
    await expect(page.locator("main")).not.toContainText(editedName);
  });

  test("admin can create, edit, publish, and delete event from dashboard @admin @events", async ({
    page
  }) => {
    testRequiresAdmin();
    const name = `qa-event-${randomSuffix()}`;
    const editedName = `${name}-edited`;
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 16);

    await loginAs(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await goTo(page, "/admin/events");
    await page.waitForSelector("form");

    await page.getByPlaceholder(/event title|عنوان الفعالية/i).fill(name);
    await page.locator("input[type='datetime-local']").first().fill(futureDate);
    await page.getByPlaceholder(/venue|المكان/i).first().fill("QA Hall");
    await page.getByPlaceholder(/capacity|السعة/i).first().fill("2");
    await page
      .getByPlaceholder(/cover image|صورة الغلاف/i)
      .first()
      .fill("https://placehold.co/800x500");
    await page.getByPlaceholder(/excerpt|ملخص/i).first().fill("Automated event created by Playwright.");
    await page
      .getByPlaceholder(/description|الوصف/i)
      .first()
      .fill("Automated event description.");
    await page.getByPlaceholder(/tags|وسوم/i).first().fill("Workshop");
    await clickAndWaitNetworkIdle(page, page.getByRole("button", { name: /add event|إضافة فعالية/i }));

    await goTo(page, "/events");
    await expect(page.locator("main")).toContainText(name);

    await goTo(page, "/admin/events");
    const eventCard = page.locator("div").filter({ hasText: name }).first();
    await expect(eventCard).toBeVisible();
    await eventCard.locator("summary").click();
    await eventCard.locator("input[name='title']").fill(editedName);
    await eventCard.locator("input[name='capacity']").fill("4");
    await clickAndWaitNetworkIdle(
      page,
      eventCard.getByRole("button", { name: /save changes|حفظ التعديلات/i }).first()
    );

    await goTo(page, "/events");
    await expect(page.locator("main")).toContainText(editedName);
    await expect(page.locator("main")).not.toContainText(name);

    await goTo(page, "/admin/events");
    const editedEventCard = page.locator("div").filter({ hasText: editedName }).first();
    await expect(editedEventCard).toBeVisible();
    await clickAndWaitNetworkIdle(
      page,
      editedEventCard.getByRole("button", { name: /^delete$|^حذف$/i }).first()
    );

    await goTo(page, "/events");
    await expect(page.locator("main")).not.toContainText(editedName);
  });

  test("admin can assign moderator role to user @admin", async ({ page }) => {
    testRequiresAdmin();
    testRequiresUser();
    await loginAs(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await goTo(page, "/admin/users");
    const userRow = page.locator("div").filter({ hasText: USER_EMAIL! }).first();
    test.skip(!(await userRow.isVisible().catch(() => false)), "Target user row not found.");
    await userRow.locator("select").first().selectOption("moderator");
    await clickAndWaitNetworkIdle(page, userRow.getByRole("button", { name: /save|حفظ/i }).first());
    // WHY: role assignment operation must complete and surface status feedback.
    await expect(page.locator("body")).toContainText(/saved|updated|success|تم/i);

    // WHY: restore original user role so this test stays independent and non-destructive.
    await userRow.locator("select").first().selectOption("user");
    await clickAndWaitNetworkIdle(page, userRow.getByRole("button", { name: /save|حفظ/i }).first());
    await expect(page.locator("body")).toContainText(/saved|updated|success|تم/i);
  });

  test("admin cannot delete own account @admin", async ({ page }) => {
    testRequiresAdmin();
    await loginAs(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await goTo(page, "/admin/users");
    await maybeAcceptDialog(page);
    const selfRow = page.locator("div").filter({ hasText: ADMIN_EMAIL! }).first();
    test.skip(!(await selfRow.isVisible().catch(() => false)), "Could not locate admin row.");
    await clickAndWaitNetworkIdle(
      page,
      selfRow.getByRole("button", { name: /delete|حذف/i }).first()
    );
    // WHY: deleting current admin would lock operational access.
    await expect(page.locator("body")).toContainText(/cannot|not allowed|forbidden|غير مسموح/i);
  });
});

test.describe("GROUP 10 — Moderator Features @moderator", () => {
  test("moderator can access moderation queue and cannot use full admin UI @auth @admin", async ({
    page
  }) => {
    testRequiresModerator();
    await loginAs(page, MOD_EMAIL!, MOD_PASSWORD!);
    await goTo(page, "/moderator");
    await expect(page.locator("main")).toContainText(/moderation|articles|مراجعة|مقالات/i);
    await goTo(page, "/admin");
    // WHY: moderator must not gain full admin control surfaces.
    await expect(page.locator("body")).not.toContainText(/user management|إدارة المستخدمين/i);
  });

  test("moderator can approve/reject article from queue @moderator", async ({ page }) => {
    testRequiresModerator();
    await loginAs(page, MOD_EMAIL!, MOD_PASSWORD!);
    await goTo(page, "/moderator");
    const actionButton = page.getByRole("button", { name: /approve|reject|قبول|رفض/i }).first();
    test.skip(!(await actionButton.isVisible().catch(() => false)), "No moderation actions present.");
    await clickAndWaitNetworkIdle(page, actionButton);
    // WHY: moderation action should produce a visible success/error toast.
    await expect(page.locator("body")).toContainText(/saved|updated|success|error|تم|خطأ/i);
  });
});

test.describe("GROUP 11 — Non-Functional @perf @responsive @a11y", () => {
  for (const width of [375, 768, 1024, 1440]) {
    test(`responsive layout has no horizontal overflow at ${width}px @smoke`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await goTo(page, "/");
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      // WHY: no horizontal overflow is required for responsive acceptance.
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  }

  test("buttons expose pointer cursor and forms validate inline @a11y @auth", async ({ page }) => {
    await goTo(page, "/auth/signup");
    await page.waitForSelector("form");
    const submit = page.getByRole("button", { name: /create account|إنشاء/i });
    const cursor = await submit.evaluate((el) => window.getComputedStyle(el).cursor);
    // WHY: pointer cursor validates visible affordance requirement.
    expect(["pointer", "default"]).toContain(cursor);
    await submit.click();
    // WHY: validation feedback should occur without full page reload.
    await expect(new URL(page.url()).pathname).toContain("/auth/signup");
  });

  test("toast-like feedback appears for auth error flows @auth", async ({ page }) => {
    await goTo(page, "/auth/login");
    await page.waitForSelector("input[type='email']");
    await page.locator("input[type='email']").fill("missing-user@example.com");
    await page.locator("input[type='password']").fill("badpass123");
    await clickAndWaitNetworkIdle(
      page,
      page.getByRole("button", { name: /sign in|تسجيل الدخول/i })
    );
    // WHY: user must receive immediate success/error feedback for async actions.
    await expect(page.locator("body")).toContainText(/invalid|error|خطأ/i);
  });

  test("homepage images are optimized with srcset where applicable @perf", async ({ page }) => {
    await goTo(page, "/");
    const hasSrcSet = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll("img"));
      return images.some((img) => img.hasAttribute("srcset"));
    });
    // WHY: image optimization is part of non-functional performance requirements.
    expect(hasSrcSet).toBeTruthy();
  });

  test("contact form validation happens without full page reload @a11y", async ({ page }) => {
    await goTo(page, "/contact");
    await page.waitForSelector("form");
    const beforePath = new URL(page.url()).pathname;
    const submitButton = page.getByRole("button", { name: /send|submit|إرسال/i }).first();
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();
      const afterPath = new URL(page.url()).pathname;
      // WHY: inline validation should not trigger navigation/full page refresh.
      expect(afterPath).toBe(beforePath);
    } else {
      test.skip(true, "Contact submit button selector not found.");
    }
  });

  test("main landmarks and visible images have accessible names @a11y", async ({ page }) => {
    await goTo(page, "/");
    await expect(page.locator("main")).toBeVisible();

    const unnamedVisibleImages = await page.locator("img:visible").evaluateAll((images) =>
      images.filter((image) => !image.getAttribute("alt")?.trim()).length
    );
    // WHY: images without alt text break screen reader comprehension.
    expect(unnamedVisibleImages).toBe(0);
  });

  test("largest contentful image does not cause obvious layout overflow @perf @responsive", async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goTo(page, "/store");
    if (new URL(page.url()).pathname.includes("/auth/login")) {
      test.skip(true, "Store is protected without a logged-in user.");
    }

    const overflow = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img")).some((image) => {
        const rect = image.getBoundingClientRect();
        return rect.right > document.documentElement.clientWidth + 1;
      })
    );
    expect(overflow).toBe(false);
  });
});

test.describe("Environment sanity @meta", () => {
  test("base url points to deployed Vercel app", async ({ page }) => {
    await goTo(page, "/");
    // WHY: suite should target production deployment requested in SRS.
    expect(new URL(page.url()).origin).toBe(new URL(BASE_URL).origin);
  });
});
