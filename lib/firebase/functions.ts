"use client";

import { httpsCallable } from "firebase/functions";

import { functions } from "@/lib/firebase/firebase";
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

export async function sendContactEmail(payload: ContactMessagePayload) {
  const callable = httpsCallable(requireFunctions(), "sendContactEmail");
  const result = await callable(payload);
  return result.data;
}

export async function issueMembershipQrPass(
  input?: IssueMembershipQrInput
): Promise<MembershipQrSession> {
  const callable = httpsCallable<undefined, MembershipQrSession>(
    requireFunctions(),
    "issueMembershipQrPass"
  );
  const result = await callable(undefined);
  return result.data;
}

export async function verifyMembershipPass(pass: string): Promise<VerifyMembershipResponse> {
  const callable = httpsCallable<{ pass: string }, VerifyMembershipResponse>(
    requireFunctions(),
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
