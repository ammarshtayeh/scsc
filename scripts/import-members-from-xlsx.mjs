import nextEnv from "@next/env";
import { cert, deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { XMLParser } from "fast-xml-parser";
import { access } from "node:fs/promises";
import { basename } from "node:path";
import { randomUUID } from "node:crypto";
import yauzl from "yauzl";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const DEFAULT_XLSX_PATH =
  "C:\\Users\\Ammar\\OneDrive\\المستندات\\اسماء_منتسبين_-_جمعيه_التجميل_مع_الايميل.xlsx";

const args = process.argv.slice(2);
const commit = args.includes("--commit");
const xlsxPath =
  getArgValue("--xlsx") ||
  getArgValue("--file") ||
  process.env.MEMBERS_XLSX_PATH ||
  DEFAULT_XLSX_PATH;

function getArgValue(name) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) {
    return inline.slice(name.length + 1);
  }

  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function normalizePrivateKey(value) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  return unquoted.replace(/\\n/g, "\n");
}

function cleanString(value, fallback = "") {
  if (value === null || typeof value === "undefined") {
    return fallback;
  }

  return decodeXmlEntities(String(value)).replace(/\s+/g, " ").trim() || fallback;
}

function decodeXmlEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function normalizeHeader(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/[ة]/g, "ه")
    .replace(/[ى]/g, "ي")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "");
}

function normalizeEmail(value) {
  const email = cleanString(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function arrayFrom(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

async function readZipEntry(filePath, entryName) {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, (openError, zipFile) => {
      if (openError) {
        reject(openError);
        return;
      }

      zipFile.readEntry();
      zipFile.on("entry", (entry) => {
        if (entry.fileName !== entryName) {
          zipFile.readEntry();
          return;
        }

        zipFile.openReadStream(entry, (streamError, stream) => {
          if (streamError) {
            zipFile.close();
            reject(streamError);
            return;
          }

          const chunks = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("end", () => {
            zipFile.close();
            resolve(Buffer.concat(chunks).toString("utf8"));
          });
          stream.on("error", (error) => {
            zipFile.close();
            reject(error);
          });
        });
      });
      zipFile.on("end", () => {
        zipFile.close();
        resolve("");
      });
      zipFile.on("error", reject);
    });
  });
}

async function listZipEntries(filePath) {
  return new Promise((resolve, reject) => {
    const entries = [];
    yauzl.open(filePath, { lazyEntries: true }, (openError, zipFile) => {
      if (openError) {
        reject(openError);
        return;
      }

      zipFile.readEntry();
      zipFile.on("entry", (entry) => {
        entries.push(entry.fileName);
        zipFile.readEntry();
      });
      zipFile.on("end", () => {
        zipFile.close();
        resolve(entries);
      });
      zipFile.on("error", reject);
    });
  });
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text",
  parseTagValue: false,
  trimValues: false
});

async function readSharedStrings(filePath) {
  const xml = await readZipEntry(filePath, "xl/sharedStrings.xml");
  if (!xml) {
    return [];
  }

  const parsed = parser.parse(xml);
  return arrayFrom(parsed?.sst?.si).map((entry) => readRichText(entry));
}

function readRichText(entry) {
  if (!entry) {
    return "";
  }

  if (typeof entry.t === "string") {
    return entry.t;
  }

  if (entry.t?.text) {
    return entry.t.text;
  }

  return arrayFrom(entry.r)
    .map((run) => (typeof run.t === "string" ? run.t : run.t?.text || ""))
    .join("");
}

function columnIndexFromRef(ref) {
  const letters = String(ref || "").match(/[A-Z]+/i)?.[0]?.toUpperCase() || "";
  let index = 0;
  for (const letter of letters) {
    index = index * 26 + letter.charCodeAt(0) - 64;
  }

  return index - 1;
}

function getCellValue(cell, sharedStrings) {
  if (!cell) {
    return "";
  }

  if (cell.t === "s") {
    return sharedStrings[Number(cell.v)] || "";
  }

  if (cell.t === "inlineStr") {
    return readRichText(cell.is);
  }

  if (cell.t === "b") {
    return cell.v === "1" ? "TRUE" : "FALSE";
  }

  if (typeof cell.v === "undefined") {
    return "";
  }

  return String(cell.v).trim();
}

async function readFirstWorksheetRows(filePath) {
  const entries = await listZipEntries(filePath);
  const sheetPath = entries.includes("xl/worksheets/sheet1.xml")
    ? "xl/worksheets/sheet1.xml"
    : entries.find((entry) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entry));

  if (!sheetPath) {
    throw new Error("No worksheet XML found in workbook.");
  }

  const [sharedStrings, sheetXml] = await Promise.all([
    readSharedStrings(filePath),
    readZipEntry(filePath, sheetPath)
  ]);
  const parsed = parser.parse(sheetXml);
  const rowNodes = arrayFrom(parsed?.worksheet?.sheetData?.row);

  return rowNodes.map((rowNode) => {
    const row = [];
    for (const cell of arrayFrom(rowNode.c)) {
      row[columnIndexFromRef(cell.r)] = getCellValue(cell, sharedStrings);
    }

    return row.map((value) => cleanString(value));
  });
}

function findHeaderRow(rows) {
  return rows.findIndex((row) => row.filter(Boolean).length >= 2);
}

const headerAliases = {
  displayName: [
    "name",
    "fullname",
    "studentname",
    "membername",
    "الاسم",
    "الاسمواللقب",
    "الاسمالكامل",
    "الاسمالرباعي",
    "اسمالطالب",
    "اسمالطالبه",
    "اسمالمنتسب",
    "اسمالمنتسبه"
  ],
  email: [
    "email",
    "emailaddress",
    "mail",
    "البريد",
    "البريدالالكتروني",
    "الايميل",
    "الايميبل",
    "الايميلالجامعي",
    "ايميل",
    "ايميلالطالب",
    "ايميلالطالبه"
  ],
  phone: [
    "phone",
    "mobile",
    "mobilenumber",
    "phonenumber",
    "رقمالهاتف",
    "الهاتف",
    "الجوال",
    "رقمالجوال",
    "رقمالواتس",
    "واتس",
    "واتساب",
    "whatsapp",
    "رقمالتلفون",
    "التلفون"
  ],
  studentId: [
    "studentid",
    "universityid",
    "studentnumber",
    "id",
    "الرقمالجامعي",
    "رقمالطالب",
    "رقمالطالبه",
    "رقمالتسجيل",
    "رقمالهويه",
    "رقمالهوية"
  ],
  specialization: [
    "major",
    "specialization",
    "program",
    "department",
    "التخصص",
    "التخصصالجامعي",
    "القسم",
    "البرنامج",
    "الدائره",
    "الدائرة"
  ],
  degree: [
    "degree",
    "academicdegree",
    "الدرجه",
    "الدرجة"
  ],
  memberGrade: [
    "membergrade",
    "membershipgrade",
    "membershiptype",
    "type",
    "نوعالعضويه",
    "نوعالعضوية",
    "درجهالعضويه",
    "درجةالعضوية",
    "الفئه",
    "الفئة"
  ],
  membershipId: [
    "membershipid",
    "memberid",
    "رقمالعضويه",
    "رقمالعضوية",
    "رقمالانتساب",
    "رقمالمنتسب"
  ],
  company: ["company", "workplace", "الشركه", "الشركة", "مكانالعمل"],
  joinedAt: ["joinedat", "joindate", "createdat", "تاريخالانضمام", "تاريخالانتساب"],
  membershipExpiresAt: [
    "membershipexpiresat",
    "expiry",
    "expiresat",
    "تاريخانتهاءالعضويه",
    "تاريخانتهاءالعضوية",
    "انتهاءالعضويه",
    "انتهاءالعضوية"
  ]
};

function resolveColumnIndexes(headers) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const mapping = {};

  for (const [field, aliases] of Object.entries(headerAliases)) {
    const normalizedAliases = aliases.map(normalizeHeader);
    const index = normalizedHeaders.findIndex((header) =>
      normalizedAliases.some((alias) => header === alias || header.includes(alias))
    );

    if (index >= 0) {
      mapping[field] = index;
    }
  }

  return mapping;
}

function valueAt(row, mapping, field) {
  const index = mapping[field];
  return typeof index === "number" ? cleanString(row[index]) : "";
}

function normalizeMemberGrade(value, specialization) {
  const normalized = normalizeHeader(value);
  if (["first", "1", "اولى", "اولي", "درجهاولى", "درجهاولي"].includes(normalized)) {
    return "first";
  }

  if (["second", "2", "ثانيه", "ثانية", "درجهثانيه", "درجةثانية"].includes(normalized)) {
    return "second";
  }

  return cleanString(specialization) === "مستحضرات تجميل والعناية بالبشرة" ? "first" : "second";
}

function parseExcelDate(value) {
  const raw = cleanString(value);
  if (!raw) {
    return "";
  }

  const asNumber = Number(raw);
  if (Number.isFinite(asNumber) && asNumber > 25000 && asNumber < 80000) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + asNumber * 24 * 60 * 60 * 1000).toISOString();
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function buildSourceFields(headers, row) {
  return Object.fromEntries(
    headers
      .map((header, index) => [cleanString(header), cleanString(row[index])])
      .filter(([header, value]) => header && value)
  );
}

function buildMemberRows(rows) {
  const headerRowIndex = findHeaderRow(rows);
  if (headerRowIndex < 0) {
    throw new Error("Could not find a usable header row in the workbook.");
  }

  const headers = rows[headerRowIndex];
  const mapping = resolveColumnIndexes(headers);

  if (typeof mapping.email !== "number") {
    throw new Error(`Could not find an email column. Headers: ${headers.join(" | ")}`);
  }

  const members = rows
    .slice(headerRowIndex + 1)
    .map((row, index) => {
      const email = normalizeEmail(valueAt(row, mapping, "email"));
      const sourceFields = buildSourceFields(headers, row);
      const displayName =
        valueAt(row, mapping, "displayName") ||
        cleanString(Object.values(sourceFields)[0]) ||
        email.split("@")[0];
      const specialization = valueAt(row, mapping, "specialization");
      const joinedAt = parseExcelDate(valueAt(row, mapping, "joinedAt"));
      const membershipExpiresAt = parseExcelDate(valueAt(row, mapping, "membershipExpiresAt"));

      return {
        rowNumber: headerRowIndex + index + 2,
        displayName,
        email,
        phone: valueAt(row, mapping, "phone"),
        studentId: valueAt(row, mapping, "studentId"),
        specialization,
        degree: valueAt(row, mapping, "degree"),
        memberGrade: normalizeMemberGrade(valueAt(row, mapping, "memberGrade"), specialization),
        membershipId: valueAt(row, mapping, "membershipId"),
        company: valueAt(row, mapping, "company"),
        joinedAt,
        membershipExpiresAt,
        sourceFields
      };
    })
    .filter((member) => Object.values(member.sourceFields).some(Boolean));

  return {
    headers,
    mapping,
    members
  };
}

function dedupeMembers(members) {
  const byEmail = new Map();
  const duplicateEmails = new Set();
  const invalidRows = [];

  for (const member of members) {
    if (!member.email) {
      invalidRows.push(member.rowNumber);
      continue;
    }

    if (byEmail.has(member.email)) {
      duplicateEmails.add(member.email);
    }

    byEmail.set(member.email, member);
  }

  return {
    members: [...byEmail.values()],
    duplicateEmails: [...duplicateEmails],
    invalidRows
  };
}

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY.");
  }

  return { projectId, clientEmail, privateKey };
}

async function findUserByEmail(auth, email) {
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      return null;
    }

    throw error;
  }
}

function buildMembershipId(uid, importedMembershipId) {
  return importedMembershipId || `SCSC-${uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase()}`;
}

async function importMember({ auth, db, member, now, workbookName }) {
  const existingUser = await findUserByEmail(auth, member.email);
  let userRecord;

  if (existingUser) {
    userRecord = await auth.updateUser(existingUser.uid, {
      displayName: member.displayName,
      password: member.email,
      emailVerified: true,
      disabled: false
    });
  } else {
    userRecord = await auth.createUser({
      displayName: member.displayName,
      email: member.email,
      password: member.email,
      emailVerified: true,
      disabled: false
    });
  }

  const userRef = db.collection("users").doc(userRecord.uid);
  const existingDoc = await userRef.get();
  const existingData = existingDoc.exists ? existingDoc.data() || {} : {};
  const existingRole = existingData.role === "admin" || existingData.role === "moderator" ? existingData.role : "user";

  if (existingRole === "user") {
    await auth.setCustomUserClaims(userRecord.uid, { role: "user" });
  }

  const joinedAt = member.joinedAt || existingData.joinedAt || now;
  const membershipExpiresAt =
    member.membershipExpiresAt || existingData.membershipExpiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const payload = {
    membershipId: buildMembershipId(userRecord.uid, member.membershipId || existingData.membershipId),
    displayName: member.displayName,
    email: member.email,
    phone: member.phone,
    studentId: member.studentId,
    specialization: member.specialization,
    degree: member.degree,
    memberGrade: member.memberGrade,
    accountStatus: "approved",
    company: member.company || existingData.company || "",
    role: existingRole,
    membershipStatus: "active",
    membershipExpiresAt,
    joinedAt,
    qrToken: existingData.qrToken || randomUUID(),
    savedArticleIds: Array.isArray(existingData.savedArticleIds) ? existingData.savedArticleIds : [],
    registeredEventIds: Array.isArray(existingData.registeredEventIds) ? existingData.registeredEventIds : [],
    activeQrSessionId: existingData.activeQrSessionId || null,
    activeQrSessionExpiresAt: existingData.activeQrSessionExpiresAt || null,
    lastQrIssuedAt: existingData.lastQrIssuedAt || null,
    lastQrScanAt: existingData.lastQrScanAt || null,
    sourceWorkbook: workbookName,
    sourceFields: member.sourceFields,
    updatedAt: now,
    ...(existingDoc.exists ? {} : { importedAt: now })
  };

  await userRef.set(payload, { merge: true });

  return {
    uid: userRecord.uid,
    email: member.email,
    displayName: member.displayName,
    action: existingUser ? "updated" : "created"
  };
}

async function main() {
  await access(xlsxPath);

  const rows = await readFirstWorksheetRows(xlsxPath);
  const { headers, mapping, members: rawMembers } = buildMemberRows(rows);
  const { members, duplicateEmails, invalidRows } = dedupeMembers(rawMembers);

  console.log(
    JSON.stringify(
      {
        mode: commit ? "commit" : "dry-run",
        file: xlsxPath,
        headers,
        mappedColumns: Object.fromEntries(
          Object.entries(mapping).map(([field, index]) => [field, headers[index]])
        ),
        parsedRows: rawMembers.length,
        validMembers: members.length,
        invalidRows,
        duplicateEmails,
        preview: members.slice(0, 5).map((member) => ({
          rowNumber: member.rowNumber,
          displayName: member.displayName,
          email: member.email,
          phone: member.phone,
          studentId: member.studentId,
          specialization: member.specialization,
          degree: member.degree,
          memberGrade: member.memberGrade
        }))
      },
      null,
      2
    )
  );

  if (!commit) {
    console.log("Dry run only. Re-run with --commit to import these members.");
    return;
  }

  const { projectId, clientEmail, privateKey } = getFirebaseConfig();
  const app = initializeApp(
    {
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId
    },
    "member-xlsx-import"
  );

  try {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const now = new Date().toISOString();
    const results = [];
    const failures = [];

    for (const member of members) {
      try {
        results.push(await importMember({ auth, db, member, now, workbookName: basename(xlsxPath) }));
      } catch (error) {
        failures.push({
          rowNumber: member.rowNumber,
          email: member.email,
          error: error?.message || String(error)
        });
      }
    }

    console.log(
      JSON.stringify(
        {
          projectId,
          imported: results.length,
          created: results.filter((result) => result.action === "created").length,
          updated: results.filter((result) => result.action === "updated").length,
          failures,
          results
        },
        null,
        2
      )
    );

    if (failures.length) {
      process.exitCode = 1;
    }
  } finally {
    await deleteApp(app);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
