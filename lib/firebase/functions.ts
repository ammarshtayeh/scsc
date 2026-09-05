"use client";

import { httpsCallable } from "firebase/functions";

import { functions } from "@/lib/firebase/firebase";
import type {
  Article,
  ArchivedEvent,
  BoardMember,
  ContactMessagePayload,
  EventItem,
  EventRegistration,
  FinanceSettings,
  FinanceTransactionType,
  HomePageSettings,
  Job,
  JobApplication,
  JobApplicationStatus,
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
type AdminArchivedEventInput = Partial<ArchivedEvent> & Pick<ArchivedEvent, "title" | "eventDate">;
type AdminProductInput = Partial<Product> & Pick<Product, "name" | "price" | "stock">;
type AdminArticleInput = Partial<Article> & Pick<Article, "title" | "excerpt" | "category">;
type AdminBoardMemberInput = Partial<BoardMember> & Pick<BoardMember, "name" | "role" | "year">;
type AdminHomeSettingsInput = Partial<
  Pick<
    HomePageSettings,
    | "slides"
    | "partnerEyebrow"
    | "partnerTitle"
    | "partnerDescription"
    | "partners"
    | "featuredVideo"
    | "storeEyebrow"
    | "storeTitle"
    | "storeDescription"
    | "storeCtaLabel"
    | "storeCtaHref"
    | "storePerks"
  >
>;
type AdminFinanceInput =
  | { balance: number }
  | {
      transactionType: FinanceTransactionType;
      amount: number;
      description: string;
      eventName?: string;
    };

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
  try {
    const callable = httpsCallable<Input, Output>(requireFunctions(), name);
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    const nextError = error as {
      message?: string;
      code?: string;
      details?: unknown;
    };

    if (typeof nextError.details === "string" && nextError.details.trim()) {
      throw new Error(nextError.details);
    }

    if (
      typeof nextError.details === "object" &&
      nextError.details !== null &&
      "message" in nextError.details &&
      typeof (nextError.details as { message?: unknown }).message === "string"
    ) {
      const detailsMessage = (nextError.details as { message: string }).message.trim();
      if (detailsMessage) {
        throw new Error(detailsMessage);
      }
    }

    if (typeof nextError.message === "string" && nextError.message.trim()) {
      const normalizedMessage = nextError.message.replace(/^functions\/[a-z-]+\s*/i, "").trim();
      if (normalizedMessage && normalizedMessage.toLowerCase() !== "internal") {
        throw new Error(normalizedMessage);
      }
    }

    if (typeof nextError.code === "string" && nextError.code.includes("permission-denied")) {
      throw new Error("Your session does not currently have admin permissions. Sign out, sign back in, then try again.");
    }

    if (typeof nextError.code === "string" && nextError.code.includes("already-exists")) {
      throw new Error("This email is already in use.");
    }

    throw error;
  }
}

export async function sendContactEmail(payload: ContactMessagePayload) {
  const callable = httpsCallable(requireFunctions(), "sendContactEmail");
  const result = await callable(payload);
  return result.data;
}

export async function issueMembershipQrPass(
  input?: IssueMembershipQrInput
): Promise<MembershipQrSession> {
  try {
    const callable = httpsCallable<undefined, MembershipQrSession>(
      requireFunctions(),
      "issueMembershipQrPass"
    );
    const result = await callable(undefined);
    return result.data;
  } catch (error) {
    throw normalizeCallableError(error, "Unable to issue membership QR pass.");
  }
}

function normalizeCallableError(error: unknown, fallbackMessage: string) {
  const nextError = error as {
    message?: string;
    code?: string;
    details?: unknown;
  };

  if (typeof nextError.details === "string" && nextError.details.trim()) {
    return new Error(nextError.details);
  }

  if (
    typeof nextError.details === "object" &&
    nextError.details !== null &&
    "message" in nextError.details &&
    typeof (nextError.details as { message?: unknown }).message === "string"
  ) {
    const detailsMessage = (nextError.details as { message: string }).message.trim();
    if (detailsMessage) {
      return new Error(detailsMessage);
    }
  }

  if (typeof nextError.message === "string" && nextError.message.trim()) {
    const normalizedMessage = nextError.message.replace(/^functions\/[a-z-]+\s*/i, "").trim();
    if (normalizedMessage && normalizedMessage.toLowerCase() !== "internal") {
      return new Error(normalizedMessage);
    }
  }

  return new Error(fallbackMessage);
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

export async function upsertArchivedEventAdmin(payload: AdminArchivedEventInput) {
  return callAdminFunction<AdminArchivedEventInput>("upsertArchivedEvent", payload);
}

export async function deleteArchivedEventAdmin(id: string) {
  return callAdminFunction<{ id: string }>("deleteArchivedEvent", { id });
}

export async function upsertProductAdmin(payload: AdminProductInput) {
  return callAdminFunction<AdminProductInput, { success: boolean; id?: string; slug?: string }>(
    "upsertProduct",
    payload
  );
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

export async function upsertHomeSettingsAdmin(payload: AdminHomeSettingsInput) {
  return callAdminFunction<AdminHomeSettingsInput>("upsertHomeSettings", payload);
}

export async function updateFinanceSettingsAdmin(payload: AdminFinanceInput) {
  return callAdminFunction<AdminFinanceInput, { success: boolean; finance: FinanceSettings }>(
    "updateFinanceSettings",
    payload
  );
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
  displayName?: string;
  email?: string;
  phone?: string;
  studentId?: string;
  specialization?: string;
  degree?: string;
  memberGrade?: UserProfile["memberGrade"];
  accountStatus?: UserProfile["accountStatus"];
  role?: Role;
  company?: string;
  photoURL?: string;
  membershipStatus?: UserProfile["membershipStatus"];
  membershipExpiresAt?: string;
}) {
  return callAdminFunction("updateUserAdmin", payload);
}

export async function createUserAdmin(payload: {
  displayName: string;
  email: string;
  password: string;
  phone?: string;
  studentId?: string;
  specialization?: string;
  degree?: string;
  memberGrade?: UserProfile["memberGrade"];
  accountStatus?: UserProfile["accountStatus"];
  role?: Role;
  company?: string;
  photoURL?: string;
  membershipStatus?: UserProfile["membershipStatus"];
}) {
  return callAdminFunction<
    {
      displayName: string;
      email: string;
      password: string;
      phone?: string;
      studentId?: string;
      specialization?: string;
      degree?: string;
      memberGrade?: UserProfile["memberGrade"];
      accountStatus?: UserProfile["accountStatus"];
      role?: Role;
      company?: string;
      photoURL?: string;
      membershipStatus?: UserProfile["membershipStatus"];
    },
    { success: boolean; uid: string }
  >("createUserAdmin", payload);
}

export async function sendUserPasswordResetAdmin(payload: {
  uid?: string;
  email?: string;
}) {
  return callAdminFunction<
    {
      uid?: string;
      email?: string;
    },
    {
      success: boolean;
      emailed: boolean;
      resetLink?: string;
    }
  >("sendUserPasswordResetAdmin", payload);
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

export async function updateCompanyOrderFulfillment(payload: {
  id: string;
  status: OrderStatus;
}) {
  return callAdminFunction("updateCompanyOrderFulfillment", payload);
}

export async function deleteOrderAdmin(id: string) {
  return callAdminFunction<{ id: string }>("deleteOrder", { id });
}

type JobInput = Partial<Job> & Pick<Job, "title">;

export async function upsertJobAdmin(payload: JobInput) {
  return callAdminFunction<JobInput, { success: boolean; id?: string; slug?: string }>(
    "upsertJob",
    payload
  );
}

export async function deleteJobAdmin(id: string) {
  return callAdminFunction<{ id: string }>("deleteJob", { id });
}

export async function submitJobApplication(payload: {
  jobId: string;
  displayName: string;
  email: string;
  phone?: string;
  coverLetter?: string;
  additionalInfo?: string;
  cvUrl: string;
  cvFileName: string;
  cvContentType?: string;
}) {
  return callAdminFunction<typeof payload, { success: boolean; id?: string }>(
    "submitJobApplication",
    payload
  );
}

export async function updateJobApplicationStatusAdmin(payload: {
  id: string;
  status: JobApplicationStatus;
}) {
  return callAdminFunction("updateJobApplicationStatus", payload);
}

export async function moderateArticleAdmin(payload: Pick<Article, "id" | "approved">) {
  return callAdminFunction("moderateArticle", payload);
}
