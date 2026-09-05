"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileUp, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { submitJobApplication } from "@/lib/firebase/functions";
import { uploadFileToStorage } from "@/lib/firebase/storage";
import type { Job } from "@/types";

const CV_ACCEPT =
  ".pdf,.doc,.docx,.rtf,.txt,.odt,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/*";

const MAX_CV_BYTES = 10 * 1024 * 1024;

interface JobApplyFormProps {
  job: Job;
  alreadyApplied?: boolean;
}

export function JobApplyForm({ job, alreadyApplied = false }: JobApplyFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { locale, dictionary } = useLocale();
  const ar = locale === "ar";
  const { pushToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(alreadyApplied);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    coverLetter: "",
    additionalInfo: ""
  });

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      displayName: current.displayName || user.displayName || "",
      email: current.email || user.email || ""
    }));
  }, [user]);

  if (!user) {
    return (
      <Card className="space-y-3 p-5">
        <p className="text-sm text-slate-700 dark:text-brand-mist">
          {dictionary.jobs.loginToApply}
        </p>
        <Link href={`/auth/login?redirect=/jobs/${job.slug}`}>
          <Button>{dictionary.nav.login}</Button>
        </Link>
      </Card>
    );
  }

  if (applied || job.status !== "open") {
    return (
      <Card className="p-5 text-sm text-slate-700 dark:text-brand-mist">
        {applied
          ? dictionary.jobs.alreadyApplied
          : dictionary.jobs.jobClosed}
      </Card>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!user) {
      pushToast(dictionary.jobs.loginToApply, "error");
      return;
    }

    if (!cvFile) {
      pushToast(dictionary.jobs.cvRequired, "error");
      return;
    }

    if (cvFile.size > MAX_CV_BYTES) {
      pushToast(dictionary.jobs.cvTooLarge, "error");
      return;
    }

    if (!form.displayName.trim() || !form.email.trim()) {
      pushToast(dictionary.jobs.profileRequired, "error");
      return;
    }

    try {
      setSubmitting(true);
      const safeName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `documents/cvs/${user.id}/${job.id}-${Date.now()}-${safeName}`;
      const cvUrl = await uploadFileToStorage(path, cvFile);

      await submitJobApplication({
        jobId: job.id,
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        coverLetter: form.coverLetter.trim() || undefined,
        additionalInfo: form.additionalInfo.trim() || undefined,
        cvUrl,
        cvFileName: cvFile.name,
        cvContentType: cvFile.type || undefined
      });

      setApplied(true);
      pushToast(dictionary.jobs.applySuccess, "success");
      router.refresh();
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : dictionary.jobs.applyError,
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <h3 className="font-heading text-xl font-semibold text-brand-primary dark:text-brand-ink">
        {dictionary.jobs.applyTitle}
      </h3>
      <p className="text-sm text-slate-600 dark:text-brand-mist">{dictionary.jobs.applyHint}</p>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block space-y-1.5 text-sm">
          <span>{dictionary.jobs.fullName}</span>
          <input
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0b1524]"
            value={form.displayName}
            onChange={(event) =>
              setForm((current) => ({ ...current, displayName: event.target.value }))
            }
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>{dictionary.jobs.email}</span>
          <input
            required
            type="email"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0b1524]"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>{dictionary.jobs.phone}</span>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0b1524]"
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>{dictionary.jobs.coverLetter}</span>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0b1524]"
            value={form.coverLetter}
            onChange={(event) =>
              setForm((current) => ({ ...current, coverLetter: event.target.value }))
            }
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>{dictionary.jobs.additionalInfo}</span>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0b1524]"
            value={form.additionalInfo}
            onChange={(event) =>
              setForm((current) => ({ ...current, additionalInfo: event.target.value }))
            }
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>{dictionary.jobs.cvLabel}</span>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-300 px-3 py-3 dark:border-white/15">
            <FileUp className="h-4 w-4 text-brand-primary" />
            <input
              required
              type="file"
              accept={CV_ACCEPT}
              onChange={(event) => setCvFile(event.target.files?.[0] || null)}
            />
          </div>
          <p className="text-xs text-slate-500">{dictionary.jobs.cvFormats}</p>
          {cvFile ? (
            <p className="text-xs text-slate-600 dark:text-brand-mist">
              {cvFile.name} ({Math.ceil(cvFile.size / 1024)} KB)
            </p>
          ) : null}
        </label>

        <Button type="submit" disabled={submitting}>
          <Send className="h-4 w-4" />
          {submitting
            ? ar
              ? "جارٍ الإرسال..."
              : "Submitting..."
            : dictionary.jobs.submitApplication}
        </Button>
      </form>
    </Card>
  );
}
