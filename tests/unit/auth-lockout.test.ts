import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  clearFailedLogins,
  getLoginLockout,
  recordFailedLogin
} from "@/lib/auth-lockout";

describe("auth lockout policy", () => {
  const email = "qa-user@example.com";

  beforeEach(() => {
    window.localStorage.clear();
    jest.useRealTimers();
  });

  it("locks user after five failed attempts", () => {
    for (let i = 0; i < 4; i += 1) {
      const attempt = recordFailedLogin(email);
      expect(attempt.lockedUntil).toBeUndefined();
    }

    const fifth = recordFailedLogin(email);
    expect(fifth.lockedUntil).toBeDefined();
    expect(getLoginLockout(email)).not.toBeNull();
  });

  it("clears lockout after successful login clear call", () => {
    for (let i = 0; i < 5; i += 1) {
      recordFailedLogin(email);
    }
    expect(getLoginLockout(email)).not.toBeNull();
    clearFailedLogins(email);
    expect(getLoginLockout(email)).toBeNull();
  });

  it("expires lockout automatically after time passes", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    for (let i = 0; i < 5; i += 1) {
      recordFailedLogin(email);
    }
    expect(getLoginLockout(email)).not.toBeNull();

    jest.setSystemTime(new Date("2026-01-01T00:16:00.000Z"));
    expect(getLoginLockout(email)).toBeNull();
  });
});
