"use client";

import { useEffect, useState } from "react";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/hooks/useLocale";
import { getAuthErrorMessage, validateNewPassword } from "@/lib/auth/password-policy";
import {
  changeOwnPassword,
  createPasswordForCurrentUser,
  currentUserHasPassword,
  sendPasswordReset
} from "@/lib/firebase/auth";

export function ChangePasswordModal({
  open,
  onClose,
  email
}: {
  open: boolean;
  onClose: () => void;
  email: string;
}) {
  const { locale } = useLocale();
  const { pushToast } = useToast();
  const ar = locale === "ar";
  const [hasPassword, setHasPassword] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);

  useEffect(() => {
    if (open) {
      setHasPassword(currentUserHasPassword());
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
    }
  }, [open]);

  const toggleLabels = {
    showLabel: ar ? "إظهار كلمة المرور" : "Show password",
    hideLabel: ar ? "إخفاء كلمة المرور" : "Hide password"
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (hasPassword && !currentPassword) {
      setError(ar ? "أدخل كلمة المرور الحالية." : "Enter your current password.");
      return;
    }

    const validationError = validateNewPassword(newPassword, confirmPassword, locale);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (hasPassword && newPassword === currentPassword) {
      setError(ar ? "كلمة المرور الجديدة يجب أن تختلف عن الحالية." : "The new password must differ from the current one.");
      return;
    }

    try {
      setSaving(true);
      if (hasPassword) {
        await changeOwnPassword(currentPassword, newPassword);
      } else {
        await createPasswordForCurrentUser(newPassword);
      }
      pushToast(
        hasPassword
          ? ar ? "تم تغيير كلمة المرور بنجاح." : "Password changed successfully."
          : ar ? "تم إنشاء كلمة المرور. يمكنك الآن الدخول بالبريد وكلمة المرور أيضاً." : "Password created. You can now also sign in with email and password.",
        "success"
      );
      onClose();
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError, locale));
    } finally {
      setSaving(false);
    }
  }

  async function handleForgot() {
    try {
      setSendingLink(true);
      await sendPasswordReset(email);
      pushToast(ar ? "أرسلنا رابط إعادة التعيين إلى بريدك." : "We sent a reset link to your email.", "success");
      onClose();
    } catch (sendError) {
      setError(getAuthErrorMessage(sendError, locale));
    } finally {
      setSendingLink(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={hasPassword ? (ar ? "تغيير كلمة المرور" : "Change password") : ar ? "إنشاء كلمة مرور" : "Create a password"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!hasPassword ? (
          <p className="text-sm leading-7 text-slate-600 dark:text-brand-mist">
            {ar
              ? "حسابك مسجّل عبر Google ولا يملك كلمة مرور. أنشئ واحدة لتتمكن من الدخول بالبريد أيضاً، وسنطلب منك تأكيد حساب Google."
              : "You signed in with Google and have no password yet. Create one to also sign in with email; we will ask you to confirm your Google account."}
          </p>
        ) : (
          <PasswordInput
            label={ar ? "كلمة المرور الحالية" : "Current password"}
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            autoFocus
            {...toggleLabels}
          />
        )}
        <PasswordInput
          label={ar ? "كلمة المرور الجديدة" : "New password"}
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          autoFocus={!hasPassword}
          {...toggleLabels}
        />
        <PasswordInput
          label={ar ? "تأكيد كلمة المرور الجديدة" : "Confirm new password"}
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          {...toggleLabels}
        />
        <p className="text-xs leading-6 text-slate-500 dark:text-brand-mist">
          {ar ? "8 أحرف على الأقل، وتحتوي على حروف وأرقام." : "At least 8 characters, with letters and numbers."}
        </p>
        {error ? (
          <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-200">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" loading={saving}>
            {hasPassword ? (ar ? "حفظ كلمة المرور" : "Save password") : ar ? "إنشاء كلمة المرور" : "Create password"}
          </Button>
          {hasPassword ? (
            <button
              type="button"
              onClick={() => void handleForgot()}
              disabled={sendingLink}
              className="text-sm font-medium text-brand-primary underline underline-offset-4 disabled:opacity-60 dark:text-brand-ink"
            >
              {ar ? "نسيت كلمة المرور الحالية؟" : "Forgot your current password?"}
            </button>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
