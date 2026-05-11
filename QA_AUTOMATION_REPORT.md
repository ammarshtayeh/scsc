# QA Automation Report

## Scope

Enterprise-style QA coverage for the SCSC application, with priority on:

- Store product CRUD, cart behavior, checkout contracts, stock handling, member pricing, and protected access.
- Events admin CRUD, public visibility, registration contracts, capacity/duplicate prevention, and deleted/invalid event handling.
- Firestore security rules, callable-function RBAC, middleware redirects, and route protection.
- Production data sanity and public-route performance smoke checks.

## Test Artifacts Added / Updated

- `tests/unit/store-events-contracts.test.ts`
- `tests/unit/firestore-rules-security.test.ts`
- `tests/e2e/scsc.srs.spec.ts`
- `jest.setup.ts`

## Execution Summary

### Jest

- Command: `npm run test:unit`
- Result: **Passed**
- Test suites: **6 passed**
- Tests: **29 passed**

### TypeScript

- Command: `npm run typecheck:local`
- Result: **Passed**

### Playwright Smoke

- Command: `npm run test:e2e:smoke`
- Result: **Passed with credential-gated skips**
- Passed: **10**
- Skipped: **4**
- Failed: **0**

Skipped tests require `.env.playwright` auth credentials:

- user login smoke
- member store add-to-cart persistence
- profile QR smoke
- admin dashboard smoke

### Playwright Redirect / Security Guards

- Command: `npm run test:e2e:redirect`
- Result: **Passed with credential-gated skips**
- Passed: **8**
- Skipped: **9**
- Failed: **0**

Verified without credentials:

- public pages return 200
- public URLs stay clean
- fake route renders not-found
- logged-out protected routes redirect to `/auth/login`
- `/admin` redirect preserves intended destination
- logged-out `/store` redirects to login
- store redirect URL remains clean

### Production Firebase Read-Only Check

- Command: `npm run firebase:prod:check`
- Result: **Passed**
- Firestore production data checked:
  - `events`: **4 docs**, required fields present
  - `products`: **5 docs**, required fields present
  - `articles`: **2 docs**, required fields present
  - `users`: **3 docs**, required fields present
  - `boardMembers`: **2 docs**, required fields present
  - `orders`: **0 docs**
- Auth custom claims checked:
  - admin test account exists with `admin`
  - moderator test account exists with `moderator`
  - user test account exists with `user`

## Store Coverage

Passed contract/security checks:

- Checkout must reject empty carts.
- Checkout must reject invalid/deleted product IDs.
- Checkout must validate stock inside a Firestore transaction.
- Checkout creates an order with `userId`, `pending` status, subtotal, discount, total, items, and trimmed delivery info.
- Checkout decrements product stock and deletes the user cart in the same transaction.
- Cart documents are stored under `carts/{userId}`.
- Cart quantity updates remove items when quantity reaches zero.
- Admin product callable functions require admin/moderator role.
- Admin product create/edit/delete UI paths are covered by Playwright tests and ready for credentialed execution.
- Product create/edit/delete changes are asserted against `/store` in the updated Playwright test.

Not fully executed end-to-end yet:

- Authenticated admin product CRUD in browser.
- Authenticated member add/remove/update cart in browser.
- Real checkout order creation through the browser.
- Concurrent cart update simulation against live Firestore.

## Events Coverage

Passed contract/security checks:

- Registration runs inside a Firestore transaction.
- Duplicate registration is blocked.
- Capacity limits are enforced transactionally.
- Registration increments `registeredCount`.
- User profile receives `registeredEventIds`.
- Cancellation decrements count with `Math.max(0, ...)`.
- Admin event callable functions require admin/moderator role.
- Event deletion blocks unsafe deletion when registrations exist unless cleanup is confirmed.
- Admin event create/edit/delete UI paths are covered by Playwright tests and ready for credentialed execution.
- Event public visibility after create/edit/delete is asserted in the updated Playwright test.

Not fully executed end-to-end yet:

- Browser-based successful registration.
- Browser duplicate-registration prevention.
- Browser capacity race.
- Event registration email notification, because no event-registration email implementation was found.

## Bugs / Risks Found

1. **Credentialed Store/Event E2E is still blocked**
   - `.env.playwright` is missing `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `USER_EMAIL`, and `USER_PASSWORD`.
   - The tests exist, but authenticated Store/Admin/Event workflows are skipped until credentials are supplied.

2. **Concurrent cart updates can lose increments**
   - `addCartItem` reads current cart and writes with `setDoc`, not a transaction.
   - Two simultaneous add requests can both read the same old quantity and overwrite each other.

3. **Potential double-discount in checkout**
   - Checkout uses `memberPrice` for line-item price and then applies `MEMBER_DISCOUNT_RATE` again.
   - Confirm intended pricing model before production.

4. **Event registration emails appear missing**
   - Email exists for contact form and order status updates.
   - No registration confirmation email path was found for events.

5. **Firestore rules are statically tested, not emulator-proven**
   - Static rules tests verify required rule patterns.
   - Emulator assertions should be added for real allow/deny proof.

## Production Readiness Score

**72 / 100**

Public routing, redirects, production Firestore shape, and Store/Event contracts are in solid shape. The score is held back by missing credentialed E2E execution for admin/member workflows, non-transactional cart updates, unclear member discount behavior, and missing event-registration email verification.

## Recommended Fixes

1. Add `.env.playwright` credentials and run `npm run test:e2e`.
2. Convert cart add/update writes to Firestore transactions.
3. Decide whether member checkout should use `memberPrice` or percentage discount, not both unless intentionally stacked.
4. Add event registration confirmation email and test it.
5. Add Firestore emulator tests for unauthorized writes, role escalation, forged token assumptions, direct cart/order/product/event writes, and registration races.
6. Add a live performance script for `/store`, `/events`, and Firestore query timings under concurrent users.
