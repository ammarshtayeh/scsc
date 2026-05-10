"use client";

import { httpsCallable } from "firebase/functions";

import { functions } from "@/lib/firebase/firebase";
import type {
  Article,
  BoardMember,
  ContactMessagePayload,
  EventItem,
  EventRegistration,
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
type AdminArticleInput = Partial<Article> & Pick<Article, "title" | "excerpt" | "category">;
type AdminBoardMemberInput = Partial<BoardMember> & Pick<BoardMember, "name" | "role" | "year">;

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

export async function deleteEventAdmin(id: string, cleanupRegistrations = false) {
  return callAdminFunction<{ id: string; cleanupRegistrations?: boolean }>("deleteEvent", {
    id,
    cleanupRegistrations
  });
}

export async function upsertProductAdmin(payload: AdminProductInput) {
  return callAdminFunction<AdminProductInput>("upsertProduct", payload);
}

export async function deleteProductAdmin(id: string) {
  return callAdminFunction<{ id: string }>("deleteProduct", { id });
}

export async function upsertArticleAdmin(payload: AdminArticleInput) {
  return callAdminFunction<AdminArticleInput>("upsertArticle", payload);
}

export async function deleteArticleAdmin(id: string) {
  return callAdminFunction<{ id: string }>("deleteArticle", { id });
}

export async function upsertBoardMemberAdmin(payload: AdminBoardMemberInput) {
  return callAdminFunction<AdminBoardMemberInput>("upsertBoardMember", payload);
}

export async function deleteBoardMemberAdmin(id: string) {
  return callAdminFunction<{ id: string }>("deleteBoardMember", { id });
}

export async function setEventRegistrationCheckInAdmin(payload: {
  eventId: string;
  userId: string;
  checkedIn: boolean;
}) {
  return callAdminFunction("setEventRegistrationCheckIn", payload);
}

export async function removeEventRegistrationAdmin(payload: Pick<EventRegistration, "eventId" | "userId">) {
  return callAdminFunction("removeEventRegistration", payload);
}

export async function updateUserAdmin(payload: {
  uid: string;
  role?: Role;
  membershipStatus?: UserProfile["membershipStatus"];
  membershipExpiresAt?: string;
}) {
  return callAdminFunction("updateUserAdmin", payload);
}

export async function deleteUserAdmin(uid: string) {
  return callAdminFunction<{ uid: string }>("deleteUserAdmin", { uid });
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
