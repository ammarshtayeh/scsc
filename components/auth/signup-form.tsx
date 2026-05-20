"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/hooks/useLocale";
import { useAuth } from "@/hooks/useAuth";
import { getPostAuthRedirect } from "@/lib/auth-redirect";
import type { UserProfile } from "@/types";

function isValidSignupPassword(password: string) {
  return password.length >= 8 && /\d/.test(password);
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signup, loginWithGoogle } = useAuth();
  const { dictionary, locale } = useLocale();
  const { pushToast } = useToast();
  const phoneLabel = locale === "ar" ? "رقم الهاتف" : "Phone Number";
  const phonePlaceholder = locale === "ar" ? "رقم هاتفك" : "Your phone number";
  const studentIdLabel = locale === "ar" ? "الرقم الجامعي" : "Student ID";
  const studentIdPlaceholder = locale === "ar" ? "رقمك الجامعي" : "Your university ID";
  const specializationLabel = locale === "ar" ? "التخصص" : "Specialization";
  const specializationPlaceholder = locale === "ar" ? "التخصص" : "Your specialization";
  const memberGradeLabel = locale === "ar" ? "درجة الانتساب المطلوبة" : "Requested membership grade";
  const specializationBeautyLabel = locale === "ar" ? "تجميل" : "Cosmetology";
  const specializationOtherLabel = locale === "ar" ? "أخرى" : "Other";
  const specializationOtherPlaceholder =
    locale === "ar" ? "اكتب تخصصك" : "Write your specialization";
  const memberGradeHelp =
    locale === "ar"
      ? "انتساب الدرجة الأولى 20 شيقل، وانتساب الدرجة الثانية 15 شيقل. استمتع بعروض وخصومات مميزة من الشركات الشريكة كونك منتسبًا."
      : "First-degree membership is 20 NIS and second-degree membership is 15 NIS. Enjoy exclusive offers and discounts from partner companies as a member.";
  const memberGradeOptions: Array<{
    label: string;
    value: NonNullable<UserProfile["memberGrade"]>;
    description: string;
  }> = [
    {
      value: "first",
      label: locale === "ar" ? "درجة أولى" : "First degree",
      description: locale === "ar" ? "20 شيقل" : "20 NIS"
    },
    {
      value: "second",
      label: locale === "ar" ? "درجة ثانية" : "Second degree",
      description: locale === "ar" ? "15 شيقل" : "15 NIS"
    }
  ];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    phone: "",
    studentId: "",
    specialization: "",
    memberGrade: "first" as NonNullable<UserProfile["memberGrade"]>
  });
  const [specializationChoice, setSpecializationChoice] = useState<"beauty" | "other">("beauty");

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const redirect = getPostAuthRedirect(user.role, searchParams.get("redirect"));
    router.replace(redirect);
  }, [authLoading, router, searchParams, user]);

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
      const specialization =
        specializationChoice === "beauty" ? specializationBeautyLabel : form.specialization;
      const memberGrade = specializationChoice === "beauty" ? "first" : form.memberGrade;
      const authRedirect = await signup({ ...form, specialization, memberGrade });
      pushToast(dictionary.auth.createSuccess, "success");
      const redirect = getPostAuthRedirect(null, searchParams.get("redirect"));
      const finalRedirect = searchParams.get("redirect") ? redirect : authRedirect;
      router.replace(finalRedirect);
    } catch (error) {
      pushToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    try {
      setLoading(true);
      const authRedirect = await loginWithGoogle();
      pushToast(dictionary.auth.createSuccess, "success");
      const redirect = getPostAuthRedirect(null, searchParams.get("redirect"));
      const finalRedirect = searchParams.get("redirect") ? redirect : authRedirect;
      router.replace(finalRedirect);
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
            {phoneLabel}
          </label>
          <input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={phonePlaceholder}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {studentIdLabel}
          </label>
          <input
            value={form.studentId}
            onChange={(event) =>
              setForm((current) => ({ ...current, studentId: event.target.value }))
            }
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={studentIdPlaceholder}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {specializationLabel}
          </label>
          <select
            value={specializationChoice}
            onChange={(event) => {
              const nextChoice = event.target.value as "beauty" | "other";
              setSpecializationChoice(nextChoice);
              setForm((current) => ({
                ...current,
                specialization: nextChoice === "beauty" ? "" : current.specialization,
                memberGrade: nextChoice === "beauty" ? "first" : current.memberGrade
              }));
            }}
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
          >
            <option value="beauty">{specializationBeautyLabel}</option>
            <option value="other">{specializationOtherLabel}</option>
          </select>
          {specializationChoice === "other" ? (
            <input
              required
              value={form.specialization}
              onChange={(event) =>
                setForm((current) => ({ ...current, specialization: event.target.value }))
              }
              className="mt-3 w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
              placeholder={specializationOtherPlaceholder || specializationPlaceholder}
            />
          ) : null}
        </div>
        <div className="md:col-span-2">
          <div className="mb-3 rounded-2xl border border-brand-primary/10 bg-brand-sky/60 px-4 py-3 text-sm leading-7 text-slate-700">
            {memberGradeHelp}
          </div>
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {memberGradeLabel}
          </label>
          <select
            value={form.memberGrade}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                memberGrade: event.target.value as NonNullable<UserProfile["memberGrade"]>
              }))
            }
            disabled={specializationChoice === "beauty"}
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
          >
            {memberGradeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
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
