"use client";

import {
  Briefcase,
  Download,
  Plus,
  Save,
  Trash2,
  Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import {
  deleteJobAdmin,
  updateJobApplicationStatusAdmin,
  upsertJobAdmin
} from "@/lib/firebase/functions";
import {
  fetchApplicationsForManagerClient,
  fetchJobsForManagerClient
} from "@/lib/firebase/jobs-client";
import { formatDateTime } from "@/lib/utils";
import type {
  Job,
  JobApplication,
  JobApplicationStatus,
  JobEmploymentType,
  JobStatus
} from "@/types";

interface JobsManagePanelProps {
  initialJobs: Job[];
  initialApplications: JobApplication[];
  defaultCompanyName?: string;
  canSetCompanyName?: boolean;
  ownerId?: string;
}

const employmentTypes: JobEmploymentType[] = [
  "full-time",
  "part-time",
  "internship",
  "contract"
];
const jobStatuses: JobStatus[] = ["open", "closed"];
const applicationStatuses: JobApplicationStatus[] = [
  "pending",
  "reviewed",
  "accepted",
  "rejected"
];

function employmentLabel(type: JobEmploymentType, ar: boolean) {
  if (!ar) {
    return type.replace("-", " ");
  }
  switch (type) {
    case "full-time":
      return "دوام كامل";
    case "part-time":
      return "دوام جزئي";
    case "internship":
      return "تدريب";
    case "contract":
      return "عقد";
    default:
      return type;
  }
}

function applicationStatusLabel(status: JobApplicationStatus, ar: boolean) {
  if (!ar) return status;
  switch (status) {
    case "pending":
      return "قيد المراجعة";
    case "reviewed":
      return "تمت المراجعة";
    case "accepted":
      return "مقبول";
    case "rejected":
      return "مرفوض";
    default:
      return status;
  }
}

export function JobsManagePanel({
  initialJobs,
  initialApplications,
  defaultCompanyName = "SCSC",
  canSetCompanyName = false,
  ownerId
}: JobsManagePanelProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { locale } = useLocale();
  const ar = locale === "ar";
  const { pushToast } = useToast();

  const [jobs, setJobs] = useState(initialJobs);
  const [applications, setApplications] = useState(initialApplications);
  const [panel, setPanel] = useState<"jobs" | "applications">("jobs");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    company: defaultCompanyName,
    location: "Nablus",
    employmentType: "full-time" as JobEmploymentType,
    status: "open" as JobStatus,
    published: true,
    description: "",
    requirements: ""
  });

  const elevated = user?.role === "admin" || user?.role === "moderator";
  const managerOwnerId = ownerId || user?.id;

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const [nextJobs, nextApplications] = await Promise.all([
        fetchJobsForManagerClient({
          ownerId: managerOwnerId,
          elevated
        }),
        fetchApplicationsForManagerClient({
          ownerId: managerOwnerId,
          elevated
        })
      ]);

      if (cancelled) return;

      if (nextJobs.length || !initialJobs.length) {
        setJobs(nextJobs);
      }
      if (nextApplications.length || !initialApplications.length) {
        setApplications(nextApplications);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [elevated, managerOwnerId, initialJobs.length, initialApplications.length]);

  const pendingApplications = useMemo(
    () => applications.filter((entry) => entry.status === "pending").length,
    [applications]
  );

  function resetForm() {
    setEditingId(null);
    setForm({
      title: "",
      company: defaultCompanyName,
      location: "Nablus",
      employmentType: "full-time",
      status: "open",
      published: true,
      description: "",
      requirements: ""
    });
  }

  function openEdit(job: Job) {
    setEditingId(job.id);
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      employmentType: job.employmentType,
      status: job.status,
      published: job.published,
      description: job.description,
      requirements: job.requirements.join("\n")
    });
    setPanel("jobs");
  }

  async function handleSave() {
    if (!form.title.trim()) {
      pushToast(ar ? "عنوان الوظيفة مطلوب" : "Job title is required", "error");
      return;
    }

    try {
      setLoadingAction("save");
      const payload = {
        id: editingId || undefined,
        title: form.title.trim(),
        company: form.company.trim() || defaultCompanyName,
        location: form.location.trim() || "Nablus",
        employmentType: form.employmentType,
        status: form.status,
        published: form.published,
        description: form.description.trim(),
        requirements: form.requirements
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      };
      const result = await upsertJobAdmin(payload);
      const nextId = result.id || editingId || crypto.randomUUID();
      const nextJob: Job = {
        id: nextId,
        slug: result.slug || nextId,
        title: payload.title,
        company: payload.company,
        location: payload.location,
        employmentType: payload.employmentType,
        status: payload.status,
        published: payload.published,
        description: payload.description,
        requirements: payload.requirements,
        ownerId: jobs.find((job) => job.id === nextId)?.ownerId || managerOwnerId || "",
        ownerRole: jobs.find((job) => job.id === nextId)?.ownerRole || user?.role || "company",
        applicationCount: jobs.find((job) => job.id === nextId)?.applicationCount || 0,
        createdAt: jobs.find((job) => job.id === nextId)?.createdAt || new Date().toISOString()
      };

      setJobs((current) =>
        editingId
          ? current.map((entry) => (entry.id === editingId ? { ...entry, ...nextJob } : entry))
          : [nextJob, ...current]
      );
      resetForm();
      pushToast(ar ? "تم حفظ الوظيفة" : "Job saved", "success");

      const [refreshedJobs, refreshedApplications] = await Promise.all([
        fetchJobsForManagerClient({ ownerId: managerOwnerId, elevated }),
        fetchApplicationsForManagerClient({ ownerId: managerOwnerId, elevated })
      ]);
      if (refreshedJobs.length) setJobs(refreshedJobs);
      if (refreshedApplications.length) setApplications(refreshedApplications);
      router.refresh();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Save failed", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleDelete(jobId: string) {
    if (!window.confirm(ar ? "حذف هذه الوظيفة وجميع طلباتها؟" : "Delete this job and its applications?")) {
      return;
    }

    try {
      setLoadingAction(`delete-${jobId}`);
      await deleteJobAdmin(jobId);
      setJobs((current) => current.filter((job) => job.id !== jobId));
      setApplications((current) => current.filter((app) => app.jobId !== jobId));
      if (editingId === jobId) resetForm();
      pushToast(ar ? "تم الحذف" : "Deleted", "success");
      router.refresh();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Delete failed", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleApplicationStatus(id: string, status: JobApplicationStatus) {
    try {
      setLoadingAction(`app-${id}`);
      await updateJobApplicationStatusAdmin({ id, status });
      setApplications((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, status } : entry))
      );
      pushToast(ar ? "تم تحديث حالة الطلب" : "Application updated", "success");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Update failed", "error");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={panel === "jobs" ? "primary" : "secondary"}
          onClick={() => setPanel("jobs")}
        >
          <Briefcase className="h-4 w-4" />
          {ar ? `الوظائف (${jobs.length})` : `Jobs (${jobs.length})`}
        </Button>
        <Button
          size="sm"
          variant={panel === "applications" ? "primary" : "secondary"}
          onClick={() => setPanel("applications")}
        >
          <Users className="h-4 w-4" />
          {ar
            ? `الطلبات (${applications.length}${pendingApplications ? ` / ${pendingApplications} جديد` : ""})`
            : `Applications (${applications.length}${pendingApplications ? ` / ${pendingApplications} new` : ""})`}
        </Button>
      </div>

      {panel === "jobs" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-lg font-semibold text-brand-primary dark:text-brand-ink">
                {editingId
                  ? ar
                    ? "تعديل وظيفة"
                    : "Edit job"
                  : ar
                    ? "إضافة وظيفة"
                    : "Post a job"}
              </h3>
              {editingId ? (
                <Button size="sm" variant="ghost" onClick={resetForm}>
                  <Plus className="h-4 w-4" />
                  {ar ? "جديد" : "New"}
                </Button>
              ) : null}
            </div>

            <label className="block space-y-1.5 text-sm">
              <span>{ar ? "المسمى الوظيفي" : "Job title"}</span>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0b1524]"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>

            {canSetCompanyName ? (
              <label className="block space-y-1.5 text-sm">
                <span>{ar ? "الجهة / الشركة" : "Company / organization"}</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0b1524]"
                  value={form.company}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, company: event.target.value }))
                  }
                />
              </label>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm">
                <span>{ar ? "الموقع" : "Location"}</span>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0b1524]"
                  value={form.location}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, location: event.target.value }))
                  }
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span>{ar ? "نوع العقد" : "Employment type"}</span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0b1524]"
                  value={form.employmentType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      employmentType: event.target.value as JobEmploymentType
                    }))
                  }
                >
                  {employmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {employmentLabel(type, ar)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm">
                <span>{ar ? "الحالة" : "Status"}</span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0b1524]"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value as JobStatus }))
                  }
                >
                  {jobStatuses.map((status) => (
                    <option key={status} value={status}>
                      {ar ? (status === "open" ? "مفتوحة" : "مغلقة") : status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, published: event.target.checked }))
                  }
                />
                <span>{ar ? "منشورة للعامة" : "Published publicly"}</span>
              </label>
            </div>

            <label className="block space-y-1.5 text-sm">
              <span>{ar ? "الوصف" : "Description"}</span>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0b1524]"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>

            <label className="block space-y-1.5 text-sm">
              <span>{ar ? "المتطلبات (سطر لكل متطلب)" : "Requirements (one per line)"}</span>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#0b1524]"
                value={form.requirements}
                onChange={(event) =>
                  setForm((current) => ({ ...current, requirements: event.target.value }))
                }
              />
            </label>

            <Button onClick={handleSave} disabled={loadingAction === "save"}>
              <Save className="h-4 w-4" />
              {loadingAction === "save"
                ? ar
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : ar
                  ? "حفظ الوظيفة"
                  : "Save job"}
            </Button>
          </Card>

          <div className="space-y-3">
            {jobs.length ? (
              jobs.map((job) => (
                <Card key={job.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-heading text-lg font-semibold text-brand-primary dark:text-brand-ink">
                        {job.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-brand-mist">
                        {job.company} · {job.location} · {employmentLabel(job.employmentType, ar)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{ar ? (job.status === "open" ? "مفتوحة" : "مغلقة") : job.status}</Badge>
                        <Badge>
                          {job.published
                            ? ar
                              ? "منشورة"
                              : "Published"
                            : ar
                              ? "مسودة"
                              : "Draft"}
                        </Badge>
                        <Badge>
                          {ar
                            ? `${job.applicationCount} طلب`
                            : `${job.applicationCount} apps`}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(job)}>
                        {ar ? "تعديل" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(job.id)}
                        disabled={loadingAction === `delete-${job.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {job.description ? (
                    <p className="line-clamp-3 text-sm text-slate-600 dark:text-brand-mist">
                      {job.description}
                    </p>
                  ) : null}
                </Card>
              ))
            ) : (
              <Card className="p-6 text-sm text-slate-600 dark:text-brand-mist">
                {ar ? "لا توجد وظائف بعد. أضيفوا أول وظيفة من النموذج." : "No jobs yet. Post the first one from the form."}
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.length ? (
            applications.map((application) => (
              <Card key={application.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="font-heading text-lg font-semibold text-brand-primary dark:text-brand-ink">
                      {application.displayName}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-brand-mist">
                      {application.jobTitle} · {application.email}
                      {application.phone ? ` · ${application.phone}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(application.createdAt, locale)}
                    </p>
                  </div>
                  <Badge>{applicationStatusLabel(application.status, ar)}</Badge>
                </div>

                {application.coverLetter ? (
                  <p className="text-sm text-slate-700 dark:text-[#dfe8f6]">
                    <span className="font-medium">{ar ? "رسالة التقديم: " : "Cover letter: "}</span>
                    {application.coverLetter}
                  </p>
                ) : null}
                {application.additionalInfo ? (
                  <p className="text-sm text-slate-700 dark:text-[#dfe8f6]">
                    <span className="font-medium">{ar ? "معلومات إضافية: " : "Additional info: "}</span>
                    {application.additionalInfo}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <a href={application.cvUrl} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="secondary">
                      <Download className="h-4 w-4" />
                      {application.cvFileName || (ar ? "تحميل السيرة" : "Download CV")}
                    </Button>
                  </a>
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#0b1524]"
                    value={application.status}
                    disabled={loadingAction === `app-${application.id}`}
                    onChange={(event) =>
                      handleApplicationStatus(
                        application.id,
                        event.target.value as JobApplicationStatus
                      )
                    }
                  >
                    {applicationStatuses.map((status) => (
                      <option key={status} value={status}>
                        {applicationStatusLabel(status, ar)}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-sm text-slate-600 dark:text-brand-mist">
              {ar
                ? "لا توجد طلبات بعد. ستظهر هنا عندما يتقدم الطلاب أو الأعضاء."
                : "No applications yet. They will appear here when members apply."}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
