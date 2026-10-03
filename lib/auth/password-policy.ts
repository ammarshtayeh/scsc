export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

type Locale = "ar" | "en";

export function validateNewPassword(password: string, confirmation: string, locale: Locale) {
  const ar = locale === "ar";

  if (password.length < PASSWORD_MIN_LENGTH) {
    return ar
      ? `كلمة المرور يجب أن تكون ${PASSWORD_MIN_LENGTH} أحرف على الأقل.`
      : `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return ar ? "كلمة المرور طويلة جداً." : "Password is too long.";
  }

  if (!/\d/.test(password) || !/\p{L}/u.test(password)) {
    return ar
      ? "كلمة المرور يجب أن تحتوي على حروف وأرقام."
      : "Password must contain both letters and numbers.";
  }

  if (password !== confirmation) {
    return ar ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.";
  }

  return null;
}

export function getAuthErrorMessage(error: unknown, locale: Locale) {
  const ar = locale === "ar";
  const code = String((error as { code?: string })?.code || (error instanceof Error ? error.message : ""));

  if (code.includes("wrong-password") || code.includes("invalid-credential") || code.includes("invalid-login-credentials")) {
    return ar ? "كلمة المرور الحالية غير صحيحة." : "Your current password is incorrect.";
  }
  if (code.includes("too-many-requests")) {
    return ar ? "محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً." : "Too many attempts. Please wait and try again.";
  }
  if (code.includes("weak-password") || code.includes("password-does-not-meet-requirements")) {
    return ar ? "كلمة المرور ضعيفة. استخدم حروفاً وأرقاماً و8 أحرف على الأقل." : "Password is too weak. Use letters, numbers, and at least 8 characters.";
  }
  if (code.includes("requires-recent-login") || code.includes("user-token-expired")) {
    return ar ? "انتهت الجلسة. سجّل الخروج ثم الدخول مجدداً وحاول مرة أخرى." : "Your session expired. Sign out, sign back in, and try again.";
  }
  if (code.includes("expired-action-code")) {
    return ar ? "انتهت صلاحية هذا الرابط. اطلب رابطاً جديداً." : "This link has expired. Request a new one.";
  }
  if (code.includes("invalid-action-code")) {
    return ar ? "هذا الرابط غير صالح أو تم استخدامه من قبل. اطلب رابطاً جديداً." : "This link is invalid or was already used. Request a new one.";
  }
  if (code.includes("user-disabled")) {
    return ar ? "هذا الحساب معطّل. تواصل مع إدارة الجمعية." : "This account is disabled. Contact the association.";
  }
  if (code.includes("user-not-found")) {
    return ar ? "لا يوجد حساب بهذا البريد." : "No account exists for this email.";
  }
  if (code.includes("invalid-email")) {
    return ar ? "البريد الإلكتروني غير صحيح." : "The email address is invalid.";
  }
  if (code.includes("popup-closed-by-user") || code.includes("cancelled-popup-request")) {
    return ar ? "تم إغلاق نافذة Google قبل إكمال التحقق." : "The Google window was closed before verification finished.";
  }
  if (code.includes("user-mismatch")) {
    return ar ? "اختر نفس حساب Google المسجّل به." : "Choose the same Google account you signed in with.";
  }
  if (code.includes("provider-already-linked") || code.includes("credential-already-in-use") || code.includes("email-already-in-use")) {
    return ar ? "هذا الحساب لديه كلمة مرور بالفعل." : "This account already has a password.";
  }
  if (code.includes("network-request-failed")) {
    return ar ? "تعذّر الاتصال. تحقق من الإنترنت وحاول مجدداً." : "Network error. Check your connection and try again.";
  }

  return ar ? "تعذّر إكمال العملية. حاول مجدداً." : "Something went wrong. Please try again.";
}
