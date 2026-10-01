"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/hooks/useLocale";
import { sendContactEmail } from "@/lib/firebase/functions";

const NAME_MAX = 100;
const EMAIL_MAX = 200;
const MESSAGE_MIN = 5;
const MESSAGE_MAX = 3000;

export function ContactForm() {
  const { dictionary, locale } = useLocale();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [website, setWebsite] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const nextErrors: Partial<typeof form> = {};

    if (!form.name.trim()) {
      nextErrors.name = dictionary.contact.fillAllFields;
    }

    if (!form.email.trim()) {
      nextErrors.email = dictionary.contact.fillAllFields;
    }

    if (!form.message.trim()) {
      nextErrors.message = dictionary.contact.fillAllFields;
    } else if (form.message.trim().length < MESSAGE_MIN) {
      nextErrors.message =
        locale === "ar" ? "الرسالة قصيرة جدًا." : "The message is too short.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      pushToast(Object.values(nextErrors)[0] || dictionary.contact.fillAllFields, "error");
      return;
    }

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim());
    if (!isEmailValid) {
      setErrors({ email: dictionary.contact.invalidEmail });
      pushToast(dictionary.contact.invalidEmail, "error");
      return;
    }

    try {
      setLoading(true);
      await sendContactEmail({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        website
      });
      setForm({ name: "", email: "", message: "" });
      setErrors({});
      pushToast(dictionary.contact.success, "success");
    } catch (error) {
      const code = (error as { code?: string } | null)?.code || "";
      const message = code.includes("resource-exhausted")
        ? locale === "ar"
          ? "أرسلت رسائل كثيرة خلال وقت قصير. حاول بعد ساعة."
          : "Too many messages in a short time. Please try again in an hour."
        : error instanceof Error
          ? error.message
          : dictionary.contact.genericError;
      pushToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </label>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {dictionary.contact.formName}
          </label>
          <input
            value={form.name}
            maxLength={NAME_MAX}
            onChange={(event) => {
              setForm((current) => ({ ...current, name: event.target.value }));
              setErrors((current) => ({ ...current, name: undefined }));
            }}
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={dictionary.contact.namePlaceholder}
          />
          {errors.name ? <p className="mt-2 text-sm text-rose-600">{errors.name}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {dictionary.contact.formEmail}
          </label>
          <input
            value={form.email}
            maxLength={EMAIL_MAX}
            onChange={(event) => {
              setForm((current) => ({ ...current, email: event.target.value }));
              setErrors((current) => ({ ...current, email: undefined }));
            }}
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={dictionary.contact.emailPlaceholder}
            type="email"
            dir="ltr"
          />
          {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {dictionary.contact.formMessage}
          </label>
          <textarea
            value={form.message}
            maxLength={MESSAGE_MAX}
            onChange={(event) => {
              setForm((current) => ({ ...current, message: event.target.value }));
              setErrors((current) => ({ ...current, message: undefined }));
            }}
            className="min-h-40 w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={dictionary.contact.messagePlaceholder}
          />
          <div className="mt-1 flex items-center justify-between gap-3">
            {errors.message ? <p className="text-sm text-rose-600">{errors.message}</p> : <span />}
            <span className="text-xs text-slate-400">
              {form.message.length}/{MESSAGE_MAX}
            </span>
          </div>
        </div>
        <Button type="submit" loading={loading}>
          {dictionary.contact.send}
        </Button>
      </form>
    </Card>
  );
}
