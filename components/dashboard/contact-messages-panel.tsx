"use client";

import { collection, getDocs } from "firebase/firestore";
import { CheckCircle2, Mail, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { db } from "@/lib/firebase/firebase";
import { deleteContactMessageAdmin, updateContactMessageStatusAdmin } from "@/lib/firebase/functions";
import { formatDateTime } from "@/lib/utils";
import type { ContactMessage } from "@/types";

type Filter = "new" | "handled" | "all";

function toIsoDate(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  const maybeTimestamp = value as { toDate?: () => Date } | null;
  if (maybeTimestamp && typeof maybeTimestamp.toDate === "function") {
    return maybeTimestamp.toDate().toISOString();
  }

  return new Date(0).toISOString();
}

function normalizeMessage(id: string, data: Record<string, unknown>): ContactMessage {
  return {
    id,
    name: typeof data.name === "string" ? data.name : "",
    email: typeof data.email === "string" ? data.email : "",
    message: typeof data.message === "string" ? data.message : "",
    status: data.status === "handled" ? "handled" : "new",
    createdAt: toIsoDate(data.createdAt),
    handledAt: data.handledAt ? toIsoDate(data.handledAt) : null
  };
}

export function ContactMessagesPanel({
  initialMessages,
  locale,
  canDelete
}: {
  initialMessages: ContactMessage[];
  locale: "en" | "ar";
  canDelete: boolean;
}) {
  const { pushToast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [filter, setFilter] = useState<Filter>("new");
  const [busyId, setBusyId] = useState<string | null>(null);
  const isAr = locale === "ar";

  const copy = isAr
    ? {
        title: "رسائل التواصل",
        description: "الرسائل الواردة من صفحة تواصل معنا. رد عليها بالإيميل ثم علّمها كمنجزة.",
        filterNew: "جديدة",
        filterHandled: "منجزة",
        filterAll: "الكل",
        empty: "لا توجد رسائل هنا.",
        reply: "رد بالإيميل",
        markHandled: "تعليم كمنجزة",
        markNew: "إرجاع كجديدة",
        delete: "حذف",
        confirmDelete: "حذف هذه الرسالة نهائيًا؟",
        saved: "تم الحفظ",
        failed: "تعذّر تنفيذ العملية",
        statusNew: "جديدة",
        statusHandled: "منجزة"
      }
    : {
        title: "Contact messages",
        description: "Messages sent from the Contact page. Reply by email, then mark them as handled.",
        filterNew: "New",
        filterHandled: "Handled",
        filterAll: "All",
        empty: "No messages here.",
        reply: "Reply by email",
        markHandled: "Mark handled",
        markNew: "Mark as new",
        delete: "Delete",
        confirmDelete: "Delete this message permanently?",
        saved: "Saved",
        failed: "Action failed",
        statusNew: "New",
        statusHandled: "Handled"
      };

  const refresh = useCallback(async () => {
    if (!db) {
      return;
    }

    try {
      const snapshot = await getDocs(collection(db, "contacts"));
      const next = snapshot.docs
        .map((entry) => normalizeMessage(entry.id, entry.data() as Record<string, unknown>))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMessages(next);
    } catch {
      // Keep the server-rendered list if the client read is not permitted.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const counts = useMemo(
    () => ({
      new: messages.filter((entry) => entry.status === "new").length,
      handled: messages.filter((entry) => entry.status === "handled").length,
      all: messages.length
    }),
    [messages]
  );

  const visible = useMemo(
    () => (filter === "all" ? messages : messages.filter((entry) => entry.status === filter)),
    [filter, messages]
  );

  async function setStatus(message: ContactMessage, status: ContactMessage["status"]) {
    try {
      setBusyId(message.id);
      await updateContactMessageStatusAdmin({ id: message.id, status });
      setMessages((current) =>
        current.map((entry) => (entry.id === message.id ? { ...entry, status } : entry))
      );
      pushToast(copy.saved, "success");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : copy.failed, "error");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(message: ContactMessage) {
    if (!window.confirm(copy.confirmDelete)) {
      return;
    }

    try {
      setBusyId(message.id);
      await deleteContactMessageAdmin(message.id);
      setMessages((current) => current.filter((entry) => entry.id !== message.id));
      pushToast(copy.saved, "success");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : copy.failed, "error");
    } finally {
      setBusyId(null);
    }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "new", label: copy.filterNew },
    { id: "handled", label: copy.filterHandled },
    { id: "all", label: copy.filterAll }
  ];

  return (
    <Card id="messages" className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-brand-primary">{copy.title}</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{copy.description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((entry) => (
          <Button
            key={entry.id}
            type="button"
            size="sm"
            variant={filter === entry.id ? "primary" : "secondary"}
            onClick={() => setFilter(entry.id)}
          >
            {entry.label} ({counts[entry.id]})
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-slate-500">{copy.empty}</p>
      ) : (
        <div className="grid gap-4">
          {visible.map((message) => (
            <div
              key={message.id}
              className="rounded-2xl border border-brand-primary/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-brand-primary">{message.name}</p>
                  <p className="break-all text-sm text-slate-500" dir="ltr">
                    {message.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{message.status === "handled" ? copy.statusHandled : copy.statusNew}</Badge>
                  <span className="text-xs text-slate-400">{formatDateTime(message.createdAt, locale)}</span>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-200">
                {message.message}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`mailto:${message.email}?subject=${encodeURIComponent("SCSC-NNU")}`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-brand-primary/15 bg-white px-4 text-sm font-medium text-brand-primary transition hover:bg-brand-sky dark:border-white/15 dark:bg-transparent dark:text-brand-ink"
                >
                  <Mail className="h-4 w-4" />
                  {copy.reply}
                </a>
                {message.status === "new" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    loading={busyId === message.id}
                    onClick={() => void setStatus(message, "handled")}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {copy.markHandled}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    loading={busyId === message.id}
                    onClick={() => void setStatus(message, "new")}
                  >
                    <RotateCcw className="h-4 w-4" />
                    {copy.markNew}
                  </Button>
                )}
                {canDelete ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    loading={busyId === message.id}
                    onClick={() => void remove(message)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {copy.delete}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
