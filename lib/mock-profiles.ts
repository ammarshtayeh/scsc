import { mockUsers } from "@/lib/mock-data";
import type { UserProfile } from "@/types";

export const MOCK_PROFILE_STORAGE_KEY = "scsc-mock-profiles";
export const MOCK_PROFILE_UPDATED_EVENT = "scsc-mock-profile-updated";

type MockProfileStore = Record<string, UserProfile>;

function buildSeedProfiles(): MockProfileStore {
  return mockUsers.reduce<MockProfileStore>((collection, profile) => {
    collection[profile.id] = profile;
    return collection;
  }, {});
}

function normalizeProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    savedArticleIds: profile.savedArticleIds || [],
    registeredEventIds: profile.registeredEventIds || [],
    activeQrSessionId: profile.activeQrSessionId ?? null,
    activeQrSessionExpiresAt: profile.activeQrSessionExpiresAt ?? null,
    lastQrIssuedAt: profile.lastQrIssuedAt ?? null,
    lastQrScanAt: profile.lastQrScanAt ?? null,
    discountRate: typeof profile.discountRate === "number" ? profile.discountRate : 0.12
  };
}

function dispatchProfileUpdate(userIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(MOCK_PROFILE_UPDATED_EVENT, {
      detail: { userIds }
    })
  );
}

export function readMockProfiles(): MockProfileStore {
  const seeded = buildSeedProfiles();

  if (typeof window === "undefined") {
    return seeded;
  }

  const raw = window.localStorage.getItem(MOCK_PROFILE_STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(MOCK_PROFILE_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as MockProfileStore;
    const merged: MockProfileStore = { ...seeded };

    Object.entries(parsed).forEach(([userId, profile]) => {
      merged[userId] = normalizeProfile({
        ...(merged[userId] || {}),
        ...(profile as UserProfile)
      } as UserProfile);
    });

    window.localStorage.setItem(MOCK_PROFILE_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    window.localStorage.setItem(MOCK_PROFILE_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function writeMockProfiles(next: MockProfileStore, userIds: string[] = Object.keys(next)) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MOCK_PROFILE_STORAGE_KEY, JSON.stringify(next));
  dispatchProfileUpdate(userIds);
}

export function getMockUserProfile(identity: { id?: string; email?: string }) {
  const profiles = Object.values(readMockProfiles());
  const normalizedEmail = identity.email?.toLowerCase();

  return (
    profiles.find(
      (profile) =>
        profile.id === identity.id ||
        (normalizedEmail ? profile.email.toLowerCase() === normalizedEmail : false)
    ) || null
  );
}

export function upsertMockUserProfile(profile: UserProfile) {
  const profiles = readMockProfiles();
  const nextProfile = normalizeProfile(profile);
  profiles[nextProfile.id] = nextProfile;
  writeMockProfiles(profiles, [nextProfile.id]);
  return nextProfile;
}

export function patchMockUserProfile(userId: string, patch: Partial<UserProfile>) {
  const profiles = readMockProfiles();
  const current = profiles[userId];

  if (!current) {
    return null;
  }

  const nextProfile = normalizeProfile({
    ...current,
    ...patch,
    id: current.id
  });
  profiles[userId] = nextProfile;
  writeMockProfiles(profiles, [userId]);
  return nextProfile;
}

export function subscribeToMockProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  callback(getMockUserProfile({ id: userId }));

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== MOCK_PROFILE_STORAGE_KEY) {
      return;
    }

    callback(getMockUserProfile({ id: userId }));
  };

  const handleProfileUpdate = (event: Event) => {
    const detail = (event as CustomEvent<{ userIds?: string[] }>).detail;
    if (detail?.userIds && !detail.userIds.includes(userId)) {
      return;
    }

    callback(getMockUserProfile({ id: userId }));
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(
    MOCK_PROFILE_UPDATED_EVENT,
    handleProfileUpdate as EventListener
  );

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(
      MOCK_PROFILE_UPDATED_EVENT,
      handleProfileUpdate as EventListener
    );
  };
}
