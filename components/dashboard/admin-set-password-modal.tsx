"use client";

import { useEffect, useState } from "react";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { validateNewPassword } from "@/lib/auth/password-policy";
import { setUserPasswordAdmin } from "@/lib/firebase/functions";

export interface AdminPasswordTarget {
  id: string;
  name: string;
  email: string;
}

export function AdminSetPasswordModal({
  target,
  locale,
  onClose
}: {
  target: AdminPasswordTarget | null;
  locale: "ar" | "en";
  onClose: () => void;
}) {
  const { pushToast } = useToast();
  const ar = locale === "ar";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPassword("");
    setConfirmation("");
    setError(null);
  }, [target?.id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) {
      return;
    }

    const validationError = validateNewPassword(password, confirmation, locale);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await setUserPasswordAdmin({ uid: target.id, password });
      pushToast(
        ar
          ? `تم تعيين كلمة المرور الجديدة لـ ${target.name}. أعطها له بطريقة آمنة.`
          : `New password set for ${target.name}. Share it securely.`,
        "success"
      );
      onClose();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "";
      const arabicMessages: Record<string, string> = {
        "Admin passwords can only be changed by their owner.": "كلمة مرور الأدمن يغيّرها صاحب الحساب فقط من حسابه.",
        "Change your own password from your profile.": "غيّر كلمة مرورك من زر تغيير كلمة المرور في أعلى الصفحة.",
        "Password must be between 8 and 128 characters.": "كلمة المرور يجب أن تكون بين 8 و128 حرفاً."
      };
      setError(
        ar
          ? arabicMessages[message] || "تعذّر تعيين كلمة المرور. حاول مجدداً."
          : message || "Could not set the password."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={Boolean(target)} onClose={onClose} title={ar ? "تعيين كلمة مرور جديدة" : "Set a new password"}>
      {target ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm leading-7 text-slate-600 dark:text-brand-mist">
            {ar ? "الحساب:" : "Account:"}{" "}
            <span className="font-semibold text-brand-primary dark:text-brand-ink">{target.name}</span>{" "}
            <span dir="ltr" className="text-slate-500">({target.email})</span>
          </p>
          <PasswordInput
            label={ar ? "كلمة المرور الجديدة" : "New password"}
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            autoFocus
            showLabel={ar ? "إظهار كلمة المرور" : "Show password"}
            hideLabel={ar ? "إخفاء كلمة المرور" : "Hide password"}
          />
          <PasswordInput
            label={ar ? "تأكيد كلمة المرور" : "Confirm password"}
            value={confirmation}
            onChange={setConfirmation}
            autoComplete="new-password"
            showLabel={ar ? "إظهار كلمة المرور" : "Show password"}
            hideLabel={ar ? "إخفاء كلمة المرور" : "Hide password"}
          />
          <p className="text-xs leading-6 text-slate-500 dark:text-brand-mist">
            {ar
              ? "8 أحرف على الأقل مع حروف وأرقام. سيتم تسجيل خروج المستخدم من أجهزته، وننصحه بتغييرها بعد الدخول."
              : "At least 8 characters with letters and numbers. The user will be signed out of their devices; advise them to change it after signing in."}
          </p>
          {error ? (
            <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-200">
              {error}
            </p>
          ) : null}
          <Button type="submit" loading={saving} className="w-full">
            {ar ? "حفظ كلمة المرور" : "Save password"}
          </Button>
        </form>
      ) : null}
    </Modal>
  );
}
