"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { getAuthErrorMessage, validateNewPassword } from "@/lib/auth/password-policy";
import {
  applyEmailActionCode,
  completePasswordReset,
  sendPasswordReset,
  verifyPasswordResetLink
} from "@/lib/firebase/auth";

type ViewState =
  | { status: "loading" }
  | { status: "resetForm"; email: string }
  | { status: "resetDone" }
  | { status: "emailDone"; message: string }
  | { status: "error"; message: string; canResend: boolean };

export function AuthActionHandler() {
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const { user } = useAuth();
  const ar = locale === "ar";
  const mode = searchParams.get("mode") || "";
  const oobCode = searchParams.get("oobCode") || "";
  const [view, setView] = useState<ViewState>({ status: "loading" });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const handledCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (handledCodeRef.current === `${mode}:${oobCode}`) {
      return;
    }
    handledCodeRef.current = `${mode}:${oobCode}`;
    let active = true;

    async function run() {
      if (!oobCode || !mode) {
        setView({
          status: "error",
          message: ar ? "الرابط غير مكتمل. افتحه مباشرة من الإيميل." : "This link is incomplete. Open it directly from the email.",
          canResend: mode === "resetPassword" || !mode
        });
        return;
      }

      try {
        if (mode === "resetPassword") {
          const email = await verifyPasswordResetLink(oobCode);
          if (active) {
            setResendEmail(email);
            setView({ status: "resetForm", email });
          }
          return;
        }

        if (mode === "verifyEmail" || mode === "recoverEmail" || mode === "verifyAndChangeEmail") {
          await applyEmailActionCode(oobCode);
          if (active) {
            setView({
              status: "emailDone",
              message:
                mode === "verifyEmail"
                  ? ar ? "تم تأكيد بريدك الإلكتروني بنجاح." : "Your email has been verified."
                  : mode === "recoverEmail"
                    ? ar ? "تمت استعادة بريدك الإلكتروني السابق. ننصحك بتغيير كلمة المرور الآن." : "Your previous email was restored. We recommend changing your password now."
                    : ar ? "تم تحديث بريدك الإلكتروني بنجاح." : "Your email address has been updated."
            });
          }
          return;
        }

        if (active) {
          setView({
            status: "error",
            message: ar ? "نوع الرابط غير معروف." : "Unknown link type.",
            canResend: false
          });
        }
      } catch (error) {
        if (active) {
          setView({
            status: "error",
            message: getAuthErrorMessage(error, locale),
            canResend: mode === "resetPassword"
          });
        }
      }
    }

    void run();
    return () => {
      active = handledCodeRef.current === `${mode}:${oobCode}`;
    };
  }, [ar, locale, mode, oobCode]);

  const toggleLabels = {
    showLabel: ar ? "إظهار كلمة المرور" : "Show password",
    hideLabel: ar ? "إخفاء كلمة المرور" : "Hide password"
  };

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validationError = validateNewPassword(newPassword, confirmPassword, locale);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      await completePasswordReset(oobCode, newPassword);
      setView({ status: "resetDone" });
    } catch (error) {
      const message = getAuthErrorMessage(error, locale);
      const code = String((error as { code?: string })?.code || "");
      if (code.includes("action-code")) {
        setView({ status: "error", message, canResend: true });
      } else {
        setFormError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resendEmail.trim()) {
      return;
    }
    try {
      setResendState("sending");
      await sendPasswordReset(resendEmail);
      setResendState("sent");
    } catch (error) {
      setResendState("idle");
      setView({ status: "error", message: getAuthErrorMessage(error, locale), canResend: true });
    }
  }

  const loginHref = user ? "/profile" : "/auth/login";

  return (
    <Card className="w-full max-w-lg">
      {view.status === "loading" ? (
        <div className="space-y-4" aria-busy="true">
          <div className="h-8 w-2/3 animate-pulse rounded-full bg-brand-sky dark:bg-white/10" />
          <div className="h-12 animate-pulse rounded-2xl bg-brand-sky dark:bg-white/10" />
          <div className="h-12 animate-pulse rounded-2xl bg-brand-sky dark:bg-white/10" />
        </div>
      ) : null}

      {view.status === "resetForm" ? (
        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <h1 className="font-heading text-3xl font-bold text-brand-primary">
              {ar ? "تعيين كلمة مرور جديدة" : "Set a new password"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-brand-mist">
              {ar ? "للحساب:" : "For the account:"}{" "}
              <span dir="ltr" className="font-semibold text-brand-primary dark:text-brand-ink">
                {view.email}
              </span>
            </p>
          </div>
          <PasswordInput
            label={ar ? "كلمة المرور الجديدة" : "New password"}
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            autoFocus
            {...toggleLabels}
          />
          <PasswordInput
            label={ar ? "تأكيد كلمة المرور" : "Confirm password"}
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            {...toggleLabels}
          />
          <p className="text-xs leading-6 text-slate-500 dark:text-brand-mist">
            {ar ? "8 أحرف على الأقل، وتحتوي على حروف وأرقام." : "At least 8 characters, with letters and numbers."}
          </p>
          {formError ? (
            <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-200">
              {formError}
            </p>
          ) : null}
          <Button type="submit" loading={saving} className="w-full">
            {ar ? "حفظ كلمة المرور" : "Save password"}
          </Button>
        </form>
      ) : null}

      {view.status === "resetDone" ? (
        <div className="space-y-5 text-center">
          <h1 className="font-heading text-3xl font-bold text-brand-primary">
            {ar ? "تم تغيير كلمة المرور" : "Password updated"}
          </h1>
          <p className="text-sm leading-7 text-slate-600 dark:text-brand-mist">
            {ar ? "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة." : "You can now sign in with your new password."}
          </p>
          <Link href="/auth/login">
            <Button className="w-full">{ar ? "تسجيل الدخول" : "Sign in"}</Button>
          </Link>
        </div>
      ) : null}

      {view.status === "emailDone" ? (
        <div className="space-y-5 text-center">
          <h1 className="font-heading text-3xl font-bold text-brand-primary">{ar ? "تم بنجاح" : "Done"}</h1>
          <p className="text-sm leading-7 text-slate-600 dark:text-brand-mist">{view.message}</p>
          <Link href={loginHref}>
            <Button className="w-full">{user ? (ar ? "حسابي" : "My account") : ar ? "تسجيل الدخول" : "Sign in"}</Button>
          </Link>
        </div>
      ) : null}

      {view.status === "error" ? (
        <div className="space-y-5">
          <h1 className="font-heading text-2xl font-bold text-brand-primary">
            {ar ? "تعذّر استخدام الرابط" : "This link can't be used"}
          </h1>
          <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-200">
            {view.message}
          </p>
          {view.canResend ? (
            resendState === "sent" ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-200">
                {ar
                  ? "إذا كان البريد مسجلاً لدينا فستصلك رسالة برابط جديد خلال دقائق. تحقق من مجلد الرسائل غير المرغوب فيها أيضاً."
                  : "If this email is registered, a new link will arrive within minutes. Check your spam folder too."}
              </p>
            ) : (
              <form onSubmit={handleResend} className="space-y-3">
                <label className="block text-sm font-medium text-brand-primary">
                  {ar ? "اطلب رابطاً جديداً على بريدك" : "Request a new link"}
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  autoComplete="email"
                  value={resendEmail}
                  onChange={(event) => setResendEmail(event.target.value)}
                  className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
                  placeholder="name@example.com"
                />
                <Button type="submit" loading={resendState === "sending"} className="w-full">
                  {ar ? "إرسال رابط جديد" : "Send a new link"}
                </Button>
              </form>
            )
          ) : null}
          <Link href={loginHref} className="block text-center text-sm font-medium text-brand-primary underline underline-offset-4 dark:text-brand-ink">
            {ar ? "العودة لتسجيل الدخول" : "Back to sign in"}
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
