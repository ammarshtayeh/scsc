import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const queriesSource = readFileSync(join(process.cwd(), "lib/firebase/queries.ts"), "utf8");

describe("Dashboard data query contracts", () => {
  it("normalizes event and user dates before rendering dashboard/client pages", () => {
    expect(queriesSource).toContain("function normalizeDateValue");
    expect(queriesSource).toContain("function normalizeEvent");
    expect(queriesSource).toContain("function normalizeArchivedEvent");
    expect(queriesSource).toContain("function normalizeUserProfile");
    expect(queriesSource).toContain("function normalizeHomeSettings");
    expect(queriesSource).toContain("normalizeEvent(doc.id, doc.data())");
    expect(queriesSource).toContain("normalizeArchivedEvent(doc.id, doc.data())");
    expect(queriesSource).toContain("normalizeUserProfile(doc.id, doc.data())");
  });

  it("loads archived events from a dedicated collection and sorts them by historical event date", () => {
    const archiveBlock = queriesSource.slice(
      queriesSource.indexOf("export async function getArchivedEvents"),
      queriesSource.indexOf("export async function getAllProducts")
    );

    expect(archiveBlock).toContain("collection(\"archivedEvents\")");
    expect(archiveBlock).toContain("normalizeArchivedEvent(doc.id, doc.data())");
    expect(archiveBlock).toContain("new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime()");
  });

  it("loads editable home page settings from a single site settings document", () => {
    const homeSettingsBlock = queriesSource.slice(
      queriesSource.indexOf("export async function getHomePageSettings"),
      queriesSource.indexOf("export async function getAllArticles")
    );

    expect(homeSettingsBlock).toContain("collection(\"siteSettings\").doc(\"home\")");
    expect(homeSettingsBlock).toContain("normalizeHomeSettings");
  });

  it("keeps admin users visible even when older profiles are missing joinedAt", () => {
    const getAllUsersBlock = queriesSource.slice(
      queriesSource.indexOf("export async function getAllUsers"),
      queriesSource.indexOf("export async function getAllOrders")
    );

    expect(getAllUsersBlock).toContain("adminDb.collection(\"users\").get()");
    expect(getAllUsersBlock).not.toContain("orderBy(\"joinedAt\"");
  });

  it("counts upcoming events after date normalization to support string and Timestamp data", () => {
    const statsBlock = queriesSource.slice(
      queriesSource.indexOf("export async function getDashboardStats"),
      queriesSource.indexOf("export async function getUserProfileById")
    );

    expect(statsBlock).toContain("collection(\"events\").select(\"startsAt\").get()");
    expect(statsBlock).toContain("normalizeDateValue(doc.get(\"startsAt\"))");
  });
});
