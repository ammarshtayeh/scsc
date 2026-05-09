"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/hooks/useLocale";
import { useAuth } from "@/hooks/useAuth";
import { getRoleRedirect } from "@/lib/firebase/auth";

function resolveRedirect(redirect: string | null, fallback: string) {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("/auth/")) {
    return fallback;
  }

  return redirect;
}

function isValidSignupPassword(password: string) {
  return password.length >= 8 && /\d/.test(password);
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { user, loading: authLoading, signup, loginWithGoogle } = useAuth();
  const { dictionary } = useLocale();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    company: ""
  });

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    router.replace(resolveRedirect(redirect, getRoleRedirect(user.role)));
  }, [authLoading, redirect, router, user]);

  function getErrorMessage(error: unknown) {
    if (!(error instanceof Error)) {
      return dictionary.auth.createError;
    }

    if (error.message === "auth/email-already-in-use") {
      return dictionary.auth.emailAlreadyExists;
    }

    return error.message;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidSignupPassword(form.password)) {
      pushToast(dictionary.auth.passwordShort, "error");
      return;
    }

    try {
      setLoading(true);
      const nextPath = await signup(form);
      pushToast(dictionary.auth.createSuccess, "success");
      router.replace(resolveRedirect(redirect, nextPath));
    } catch (error) {
      pushToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    try {
      setLoading(true);
      const nextPath = await loginWithGoogle();
      pushToast(dictionary.auth.createSuccess, "success");
      router.replace(resolveRedirect(redirect, nextPath));
    } catch (error) {
      pushToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-xl">
      <h1 className="font-heading text-3xl font-bold text-brand-primary">
        {dictionary.auth.signupCardTitle}
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">{dictionary.auth.signupCardText}</p>
      <Button
        type="button"
        variant="secondary"
        className="mt-6 w-full"
        loading={loading}
        onClick={handleGoogleSignup}
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
      <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {dictionary.auth.fullName}
          </label>
          <input
            value={form.displayName}
            onChange={(event) =>
              setForm((current) => ({ ...current, displayName: event.target.value }))
            }
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={dictionary.auth.fullNamePlaceholder}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {dictionary.auth.emailLabel}
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={dictionary.contact.emailPlaceholder}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {dictionary.auth.companyLabel}
          </label>
          <input
            value={form.company}
            onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={dictionary.auth.companyPlaceholder}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {dictionary.auth.passwordLabel}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={dictionary.auth.signupPasswordPlaceholder}
          />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" loading={loading}>
            {dictionary.auth.createAccount}
          </Button>
        </div>
      </form>
    </Card>
  );
}
