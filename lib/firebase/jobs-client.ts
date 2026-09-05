"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where
} from "firebase/firestore";

import { db } from "@/lib/firebase/firebase";
import type {
  Job,
  JobApplication,
  JobApplicationStatus,
  JobEmploymentType,
  JobStatus,
  Role
} from "@/types";

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => cleanString(entry)).filter(Boolean);
  }
  return typeof value === "string" ? [value.trim()].filter(Boolean) : [];
}

function cleanNumber(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function mapJobDoc(id: string, data: Record<string, unknown>): Job {
  const employmentType = cleanString(data.employmentType, "full-time") as JobEmploymentType;
  const status = cleanString(data.status, "open") as JobStatus;

  return {
    id,
    slug: cleanString(data.slug, id) || id,
    title: cleanString(data.title, "Untitled job"),
    description: cleanString(data.description),
    requirements: cleanStringArray(data.requirements),
    location: cleanString(data.location, "Nablus"),
    employmentType: ["full-time", "part-time", "internship", "contract"].includes(employmentType)
      ? employmentType
      : "full-time",
    company: cleanString(data.company, "SCSC"),
    ownerId: cleanString(data.ownerId),
    ownerRole: (cleanString(data.ownerRole, "admin") as Role) || "admin",
    status: status === "closed" ? "closed" : "open",
    published: data.published !== false,
    applicationCount: Math.max(0, cleanNumber(data.applicationCount)),
    createdAt: cleanString(data.createdAt, new Date(0).toISOString()),
    updatedAt: cleanString(data.updatedAt) || undefined
  };
}

export function mapJobApplicationDoc(id: string, data: Record<string, unknown>): JobApplication {
  const status = cleanString(data.status, "pending") as JobApplicationStatus;

  return {
    id,
    jobId: cleanString(data.jobId),
    jobTitle: cleanString(data.jobTitle, "Job"),
    jobSlug: cleanString(data.jobSlug),
    ownerId: cleanString(data.ownerId),
    userId: cleanString(data.userId),
    displayName: cleanString(data.displayName),
    email: cleanString(data.email),
    phone: cleanString(data.phone) || undefined,
    coverLetter: cleanString(data.coverLetter) || undefined,
    additionalInfo: cleanString(data.additionalInfo) || undefined,
    cvUrl: cleanString(data.cvUrl),
    cvFileName: cleanString(data.cvFileName, "cv"),
    cvContentType: cleanString(data.cvContentType) || undefined,
    status: ["pending", "reviewed", "accepted", "rejected"].includes(status) ? status : "pending",
    createdAt: cleanString(data.createdAt, new Date(0).toISOString()),
    updatedAt: cleanString(data.updatedAt) || undefined
  };
}

export async function fetchPublishedJobsClient(): Promise<Job[]> {
  if (!db) {
    return [];
  }

  try {
    const snapshot = await getDocs(
      query(
        collection(db, "jobs"),
        where("published", "==", true),
        where("status", "==", "open"),
        orderBy("createdAt", "desc")
      )
    );
    return snapshot.docs.map((entry) => mapJobDoc(entry.id, entry.data() as Record<string, unknown>));
  } catch {
    const snapshot = await getDocs(collection(db, "jobs"));
    return snapshot.docs
      .map((entry) => mapJobDoc(entry.id, entry.data() as Record<string, unknown>))
      .filter((job) => job.published && job.status === "open")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function fetchJobBySlugClient(slug: string): Promise<Job | null> {
  if (!db || !slug) {
    return null;
  }

  const bySlug = await getDocs(query(collection(db, "jobs"), where("slug", "==", slug)));
  if (bySlug.docs.length > 0) {
    const entry = bySlug.docs[0];
    return mapJobDoc(entry.id, entry.data() as Record<string, unknown>);
  }

  const byId = await getDoc(doc(db, "jobs", slug));
  if (!byId.exists()) {
    return null;
  }

  return mapJobDoc(byId.id, byId.data() as Record<string, unknown>);
}

export async function fetchJobsForManagerClient(options: {
  ownerId?: string;
  elevated?: boolean;
}): Promise<Job[]> {
  if (!db) {
    return [];
  }

  try {
    if (options.elevated) {
      const snapshot = await getDocs(collection(db, "jobs"));
      return snapshot.docs
        .map((entry) => mapJobDoc(entry.id, entry.data() as Record<string, unknown>))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (!options.ownerId) {
      return [];
    }

    try {
      const snapshot = await getDocs(
        query(
          collection(db, "jobs"),
          where("ownerId", "==", options.ownerId),
          orderBy("createdAt", "desc")
        )
      );
      return snapshot.docs.map((entry) =>
        mapJobDoc(entry.id, entry.data() as Record<string, unknown>)
      );
    } catch {
      const snapshot = await getDocs(
        query(collection(db, "jobs"), where("ownerId", "==", options.ownerId))
      );
      return snapshot.docs
        .map((entry) => mapJobDoc(entry.id, entry.data() as Record<string, unknown>))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch {
    return [];
  }
}

export async function fetchApplicationsForManagerClient(options: {
  ownerId?: string;
  elevated?: boolean;
}): Promise<JobApplication[]> {
  if (!db) {
    return [];
  }

  try {
    if (options.elevated) {
      const snapshot = await getDocs(collection(db, "jobApplications"));
      return snapshot.docs
        .map((entry) => mapJobApplicationDoc(entry.id, entry.data() as Record<string, unknown>))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (!options.ownerId) {
      return [];
    }

    try {
      const snapshot = await getDocs(
        query(
          collection(db, "jobApplications"),
          where("ownerId", "==", options.ownerId),
          orderBy("createdAt", "desc")
        )
      );
      return snapshot.docs.map((entry) =>
        mapJobApplicationDoc(entry.id, entry.data() as Record<string, unknown>)
      );
    } catch {
      const snapshot = await getDocs(
        query(collection(db, "jobApplications"), where("ownerId", "==", options.ownerId))
      );
      return snapshot.docs
        .map((entry) => mapJobApplicationDoc(entry.id, entry.data() as Record<string, unknown>))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch {
    return [];
  }
}
