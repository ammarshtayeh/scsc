"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/hooks/useLocale";
import { sendContactEmail } from "@/lib/firebase/functions";

export function ContactForm() {
  const { dictionary } = useLocale();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      pushToast(dictionary.contact.fillAllFields, "error");
      return;
    }

    const isEmailValid = /\S+@\S+\.\S+/.test(form.email);
    if (!isEmailValid) {
      pushToast(dictionary.contact.invalidEmail, "error");
      return;
    }

    try {
      setLoading(true);
      await sendContactEmail(form);
      setForm({ name: "", email: "", message: "" });
      pushToast(dictionary.contact.success, "success");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : dictionary.contact.genericError,
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {dictionary.contact.formName}
          </label>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={dictionary.contact.namePlaceholder}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {dictionary.contact.formEmail}
          </label>
          <input
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={dictionary.contact.emailPlaceholder}
            type="email"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-primary">
            {dictionary.contact.formMessage}
          </label>
          <textarea
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            className="min-h-40 w-full rounded-2xl border border-brand-primary/10 bg-white px-4 py-3 outline-none transition focus:border-brand-accent"
            placeholder={dictionary.contact.messagePlaceholder}
          />
        </div>
        <Button type="submit" loading={loading}>
          {dictionary.contact.send}
        </Button>
      </form>
    </Card>
  );
}
