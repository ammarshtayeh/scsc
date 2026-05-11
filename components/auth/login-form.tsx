"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/hooks/useLocale";
import {
  clearFailedLogins,
  getLoginLockout,
  recordFailedLogin
} from "@/lib/auth-lockout";
import { sendPasswordReset } from "@/lib/firebase/auth";
import { isFirebaseClientConfigured } from "@/lib/firebase/firebase";
import { useAuth } from "@/hooks/useAuth";
import { getPostAuthRedirect } from "@/lib/auth-redirect";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login, loginWithGoogle } = useAuth();
  const { dictionary, locale } = useLocale();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const redirect = getPostAuthRedirect(user.role, searchParams.get("redirect"));
    router.replace(redirect);
  }, [authLoading, router, searchParams, user]);

  function getErrorMessage(error: unknown) {
    if (!(error instanceof Error)) {
      return dictionary.auth.invalidCredentials;
    }

    if (
      error.message === "auth/invalid-credentials" ||
      error.message.includes("auth/invalid-credential") ||
      error.message.includes("auth/wrong-password") ||
      error.message.includes("auth/user-not-found")
    ) {
      return dictionary.auth.invalidCredentials;
    }

    return error.message;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const lockedUntil = getLoginLockout(email);
    if (lockedUntil) {
      pushToast(
        `${dictionary.auth.lockoutPrefix} ${new Date(lockedUntil).toLocaleTimeString(
          locale === "ar" ? "ar-PS" : "en-US"
        )}.`,
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      const authRedirect = await login(email, password);
      clearFailedLogins(email);
      pushToast(dictionary.auth.welcomeBack, "success");
      const redirect = getPostAuthRedirect(null, searchParams.get("redirect")) || authRedirect;
      const finalRedirect = searchParams.get("redirect") ? redirect : authRedirect;
      router.replace(finalRedirect);
    } catch (error) {
      const attempt = recordFailedLogin(email);
      if (attempt.lockedUntil) {
        pushToast(
          `${dictionary.auth.lockoutPrefix} ${new Date(attempt.lockedUntil).toLocaleTimeString(
            locale === "ar" ? "ar-PS" : "en-US"
          )}.`,
          "error"
        );
      } else {
        pushToast(getErrorMessage(error), "error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      pushToast(dictionary.auth.enterEmailFirst, "error");
      return;
    }

    if (!isFirebaseClientConfigured) {
      pushToast(dictionary.auth.resetNeedsFirebase, "info");
      return;
    }

    try {
      await sendPasswordReset(email);
      pushToast(dictionary.auth.resetSent, "success");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : dictionary.auth.resetError, "error");
    }
  }

  async function handleGoogleLogin() {
    try {
      setLoading(true);
      const authRedirect = await loginWithGoogle();
      pushToast(dictionary.auth.welcomeBack, "success");
      const redirect = getPostAuthRedirect(null, searchParams.get("redirect")) || authRedirect;
      const finalRedirect = searchParams.get("redirect") ? redirect : authRedirect;
      router.replace(finalRedirect);
    } catch (error) {
      pushToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <h1 className="font-heading text-3xl font-bold text-brand-primary">
        {dictionary.auth.loginCardTitle}
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">{dictionary.auth.loginCardText}</p>
      <Button
        type="button"
        variant="secondary"
        className="mt-6 w-full"
        loading={loading}
        onClick={handleGoogleLogin}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-primary shadow-sm">
          G
        </span>
        {dictionary.auth.continueWithGoogle}
      </Button>
      <div className="mt-6 flex items-center gap-3 text-xs font-medium uppercase text-slate-500">
        <span className="h-px flex-1 bg-brand-primary/10" />
        {dictionary.auth.orEmail}
        <span className="h-px flex-1 bg-brand-primary/10" />
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {dictionary.auth.emailLabel}
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={dictionary.contact.emailPlaceholder}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {dictionary.auth.passwordLabel}
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={dictionary.auth.passwordPlaceholder}
          />
        </div>
        <Button type="submit" loading={loading}>
          {dictionary.auth.signIn}
        </Button>
        <button
          type="button"
          onClick={handlePasswordReset}
          className="block text-sm font-medium text-brand-primary underline underline-offset-4"
        >
          {dictionary.auth.forgotPassword}
        </button>
      </form>
    </Card>
  );
}
