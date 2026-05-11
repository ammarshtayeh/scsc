import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const rules = readFileSync(join(process.cwd(), "firestore.rules"), "utf8");

describe("Firestore security rules coverage", () => {
  it("keeps products writable only by admins or moderators", () => {
    expect(rules).toContain("match /products/{productId}");
    expect(rules).toContain("allow read: if isSignedIn() || isAdminOrModerator();");
    expect(rules).toContain("allow create, update, delete: if isAdminOrModerator();");
  });

  it("blocks duplicate event registration and enforces capacity", () => {
    expect(rules).toContain("match /registrations/{userId}");
    expect(rules).toContain("allow create: if isSelf(userId)");
    expect(rules).toContain("!exists(/databases/$(database)/documents/events/$(eventId)/registrations/$(userId))");
    expect(rules).toContain(".data.registeredCount <");
    expect(rules).toContain(".data.capacity");
  });

  it("keeps event admin writes elevated while allowing only transactional count updates by users", () => {
    const eventBlock = rules.slice(rules.indexOf("match /events/{eventId}"), rules.indexOf("match /articles/{articleId}"));

    expect(eventBlock).toContain("allow create, delete: if isAdminOrModerator();");
    expect(eventBlock).toContain("request.resource.data.diff(resource.data).changedKeys().hasOnly([\"registeredCount\"])");
    expect(eventBlock).toContain("request.resource.data.registeredCount == resource.data.registeredCount + 1");
    expect(eventBlock).toContain("request.resource.data.registeredCount == resource.data.registeredCount - 1");
  });

  it("prevents normal users from changing role and QR security fields", () => {
    const userUpdateBlock = rules.slice(rules.indexOf("match /users/{userId}"), rules.indexOf("match /events/{eventId}"));

    expect(userUpdateBlock).toContain("changedKeys().hasOnly");
    expect(userUpdateBlock).not.toContain('"role"');
    expect(userUpdateBlock).not.toContain('"qrToken"');
    expect(userUpdateBlock).not.toContain('"activeQrSessionId"');
  });

  it("limits carts and orders to their owner or elevated roles", () => {
    expect(rules).toContain("match /orders/{orderId}");
    expect(rules).toContain("resource.data.userId == request.auth.uid");
    expect(rules).toContain("request.resource.data.userId == request.auth.uid");
    expect(rules).toContain("allow update, delete: if isAdminOrModerator();");
    expect(rules).toContain("match /carts/{userId}");
    expect(rules).toContain("allow read, write: if isSelf(userId) || isAdminOrModerator();");
  });

  it("defaults every unmatched document path to deny reads and writes", () => {
    expect(rules).toContain("match /{document=**}");
    expect(rules).toContain("allow read, write: if false;");
  });
});
