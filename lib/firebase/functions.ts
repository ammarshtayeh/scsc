"use client";

import { httpsCallable } from "firebase/functions";

import { functions } from "@/lib/firebase/firebase";
import { patchMockUserProfile, getMockUserProfile } from "@/lib/mock-profiles";
import { resolveMembershipStatus } from "@/lib/membership";
import { absoluteUrl } from "@/lib/utils";
import type {
  Article,
  ContactMessagePayload,
  EventItem,
  MembershipQrSession,
  MembershipStatus,
  OrderStatus,
  Product,
  Role,
  UserProfile,
  VerifyMembershipResponse
} from "@/types";

const MOCK_QR_STORAGE_KEY = "scsc-mock-qr-passes";
const DEFAULT_QR_LIFETIME_SECONDS = 45;

interface MockQrRegistryItem {
  userId?: string;
  sessionId: string;
  memberId: string;
  fullName: string;
  membershipExpiryDate: string;
  membershipStatus: MembershipStatus;
  accessToken: string;
  issuedAt: string;
  expiresAt: string;
  status?: "active" | "used" | "expired" | "revoked";
  duplicateAttempts?: number;
  usedAt?: string;
}

interface MockQrPassPayload {
  sessionId: string;
  accessToken: string;
}

interface IssueMembershipQrInput {
  userId?: string;
  memberId: string;
  fullName: string;
  membershipExpiryDate: string;
  membershipStatus: MembershipStatus;
}

type AdminEventInput = Partial<EventItem> & Pick<EventItem, "title" | "startsAt" | "capacity">;
type AdminProductInput = Partial<Product> & Pick<Product, "name" | "price" | "stock">;

function requireFunctions() {
  if (!functions) {
    throw new Error("Firebase Functions are not configured. Add Firebase environment variables first.");
  }

  return functions;
}

async function callAdminFunction<Input, Output = { success: boolean; id?: string }>(
  name: string,
  payload: Input
) {
  const callable = httpsCallable<Input, Output>(requireFunctions(), name);
  const result = await callable(payload);
  return result.data;
}

function readMockQrRegistry() {
  if (typeof window === "undefined") {
    return {} as Record<string, MockQrRegistryItem>;
  }

  const raw = window.localStorage.getItem(MOCK_QR_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, MockQrRegistryItem>) : {};
}

function writeMockQrRegistry(next: Record<string, MockQrRegistryItem>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MOCK_QR_STORAGE_KEY, JSON.stringify(next));
}

function createMockPassValue(item: MockQrRegistryItem) {
  const payload = btoa(
    JSON.stringify({
      sessionId: item.sessionId,
      accessToken: item.accessToken
    } satisfies MockQrPassPayload)
  );
  return `mock:${payload}`;
}

export async function sendContactEmail(payload: ContactMessagePayload) {
  if (!functions) {
    return {
      ok: true,
      mock: true
    };
  }

  const callable = httpsCallable(functions, "sendContactEmail");
  const result = await callable(payload);
  return result.data;
}

export async function issueMembershipQrPass(
  input?: IssueMembershipQrInput
): Promise<MembershipQrSession> {
  if (!functions) {
    if (!input) {
      throw new Error("Missing profile information for local QR generation.");
    }

    if (input.membershipStatus !== "active") {
      throw new Error("Only active memberships can generate a QR pass.");
    }

    const sessionId = crypto.randomUUID();
    const accessToken = crypto.randomUUID();
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + DEFAULT_QR_LIFETIME_SECONDS * 1000).toISOString();
    const profile = input.userId ? getMockUserProfile({ id: input.userId }) : null;

    const registry = readMockQrRegistry();
    const previousSessionId = profile?.activeQrSessionId;

    if (previousSessionId && registry[previousSessionId]) {
      registry[previousSessionId] = {
        ...registry[previousSessionId],
        status: "revoked"
      };
    }

    registry[sessionId] = {
      userId: input.userId,
      sessionId,
      memberId: input.memberId,
      fullName: input.fullName,
      membershipExpiryDate: input.membershipExpiryDate,
      membershipStatus: input.membershipStatus,
      accessToken,
      issuedAt,
      expiresAt,
      status: "active",
      duplicateAttempts: 0
    };
    writeMockQrRegistry(registry);

    if (input.userId) {
      patchMockUserProfile(input.userId, {
        activeQrSessionId: sessionId,
        activeQrSessionExpiresAt: expiresAt,
        lastQrIssuedAt: issuedAt,
        qrToken: crypto.randomUUID()
      });
    }

    return {
      qrValue: absoluteUrl(`/verify?pass=${encodeURIComponent(createMockPassValue(registry[sessionId]))}`),
      sessionId,
      memberId: input.memberId,
      fullName: input.fullName,
      membershipExpiryDate: input.membershipExpiryDate,
      issuedAt,
      expiresAt,
      refreshIntervalSeconds: DEFAULT_QR_LIFETIME_SECONDS
    };
  }

  const callable = httpsCallable<undefined, MembershipQrSession>(
    functions,
    "issueMembershipQrPass"
  );
  const result = await callable(undefined);
  return result.data;
}

export async function verifyMembershipPass(pass: string): Promise<VerifyMembershipResponse> {
  if (!functions) {
    if (!pass.startsWith("mock:")) {
      return { valid: false, reason: "invalid" };
    }

    try {
      const decoded = JSON.parse(atob(pass.replace("mock:", ""))) as Partial<MockQrPassPayload>;
      if (!decoded.sessionId || !decoded.accessToken) {
        return { valid: false, reason: "invalid" };
      }

      const registry = readMockQrRegistry();
      const stored = registry[decoded.sessionId];

      if (!stored) {
        return { valid: false, reason: "invalid" };
      }

      if (stored.accessToken !== decoded.accessToken) {
        return { valid: false, reason: "invalid" };
      }

      const profile = stored.userId ? getMockUserProfile({ id: stored.userId }) : null;
      const profileStatus = profile ? resolveMembershipStatus(profile) : stored.membershipStatus;

      if (profileStatus !== "active") {
        return {
          valid: false,
          reason: "inactive",
          memberId: stored.memberId,
          memberName: stored.fullName,
          membershipExpiryDate: profile?.membershipExpiresAt || stored.membershipExpiryDate
        };
      }

      if (
        profile?.activeQrSessionId &&
        profile.activeQrSessionId !== stored.sessionId
      ) {
        stored.status = "revoked";
        registry[stored.sessionId] = stored;
        writeMockQrRegistry(registry);

        return {
          valid: false,
          reason: "stale",
          memberId: stored.memberId,
          memberName: stored.fullName,
          membershipExpiryDate: stored.membershipExpiryDate
        };
      }

      if (stored.usedAt) {
        stored.duplicateAttempts = (stored.duplicateAttempts || 0) + 1;
        registry[stored.sessionId] = stored;
        writeMockQrRegistry(registry);

        return {
          valid: false,
          reason: "duplicate",
          memberId: stored.memberId,
          memberName: stored.fullName,
          membershipExpiryDate: stored.membershipExpiryDate
        };
      }

      if (new Date(stored.expiresAt).getTime() <= Date.now()) {
        stored.status = "expired";
        registry[stored.sessionId] = stored;
        writeMockQrRegistry(registry);

        return {
          valid: false,
          reason: "expired",
          memberId: stored.memberId,
          memberName: stored.fullName,
          membershipExpiryDate: stored.membershipExpiryDate
        };
      }

      if (stored.status === "revoked") {
        return {
          valid: false,
          reason: "stale",
          memberId: stored.memberId,
          memberName: stored.fullName,
          membershipExpiryDate: stored.membershipExpiryDate
        };
      }

      stored.usedAt = new Date().toISOString();
      stored.status = "used";
      registry[stored.sessionId] = stored;
      writeMockQrRegistry(registry);

      if (stored.userId) {
        patchMockUserProfile(stored.userId, {
          activeQrSessionId: null,
          activeQrSessionExpiresAt: null,
          lastQrScanAt: stored.usedAt,
          qrToken: crypto.randomUUID()
        });
      }

      return {
        valid: true,
        memberId: stored.memberId,
        memberName: stored.fullName,
        membershipExpiryDate: stored.membershipExpiryDate,
        scannedAt: stored.usedAt,
        newTokenIssued: true
      };
    } catch {
      return { valid: false, reason: "invalid" };
    }
  }

  const callable = httpsCallable<{ pass: string }, VerifyMembershipResponse>(
    functions,
    "verifyMembership"
  );
  const result = await callable({ pass });
  return result.data;
}

export async function upsertEventAdmin(payload: AdminEventInput) {
  return callAdminFunction<AdminEventInput>("upsertEvent", payload);
}

export async function deleteEventAdmin(id: string) {
  return callAdminFunction<{ id: string }>("deleteEvent", { id });
}

export async function upsertProductAdmin(payload: AdminProductInput) {
  return callAdminFunction<AdminProductInput>("upsertProduct", payload);
}

export async function deleteProductAdmin(id: string) {
  return callAdminFunction<{ id: string }>("deleteProduct", { id });
}

export async function updateUserAdmin(payload: {
  uid: string;
  role?: Role;
  membershipStatus?: UserProfile["membershipStatus"];
  membershipExpiresAt?: string;
}) {
  return callAdminFunction("updateUserAdmin", payload);
}

export async function updateOrderStatusAdmin(payload: {
  id: string;
  status: OrderStatus;
}) {
  return callAdminFunction("updateOrderStatus", payload);
}

export async function moderateArticleAdmin(payload: Pick<Article, "id" | "approved">) {
  return callAdminFunction("moderateArticle", payload);
}
