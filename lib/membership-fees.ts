import type { MemberGrade } from "@/types";

export function getMembershipFeeAmount(memberGrade?: MemberGrade) {
  return memberGrade === "first" ? 20 : 15;
}

export function buildMembershipReceiptId() {
  return `SCSC-RCP-${Date.now().toString(36).toUpperCase()}`;
}
