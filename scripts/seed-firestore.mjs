import "dotenv/config";

import { readFileSync } from "node:fs";

import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const credentialFile = credentialPath
  ? JSON.parse(readFileSync(credentialPath, "utf8"))
  : null;

function normalizePrivateKey(value) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  return unquoted.replace(/\\n/g, "\n");
}

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  credentialFile?.project_id;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

if (!projectId) {
  console.error("Missing FIREBASE_PROJECT_ID or project_id in GOOGLE_APPLICATION_CREDENTIALS.");
  process.exit(1);
}

if (!credentialPath && (!clientEmail || !privateKey)) {
  console.error(
    "Missing FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or GOOGLE_APPLICATION_CREDENTIALS."
  );
  process.exit(1);
}

initializeApp({
  credential: credentialPath
    ? applicationDefault()
    : cert({
        projectId,
        clientEmail,
        privateKey
      }),
  projectId
});

const db = getFirestore();
const auth = getAuth();

const articles = [
  {
    id: "art-1",
    slug: "skin-barrier-basics",
    title: "Skin Barrier Basics for Students and Young Professionals",
    excerpt:
      "A practical guide to cleansing, hydration, and sun protection for simple effective routines.",
    content: [
      "Healthy skin starts with a stable barrier and consistent routine.",
      "A balanced routine usually includes gentle cleansing, hydration, moisturizer, and sun protection.",
      "Members should document reactions before introducing new active ingredients."
    ],
    coverImage:
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1200&q=80",
    category: "Skin Care",
    publishedAt: "2026-03-04T09:30:00.000Z",
    authorName: "SCSC Editorial Team",
    approved: true,
    references: [{ label: "AAD Skin Care Advice", url: "https://www.aad.org" }]
  },
  {
    id: "art-2",
    slug: "makeup-hygiene-campus-events",
    title: "Makeup Hygiene for Long Campus Event Days",
    excerpt:
      "Brush sanitation, expiration awareness, and safer touch-up habits for workshops.",
    content: [
      "Brushes and sponges should be cleaned routinely.",
      "Cream formulas need extra hygiene discipline in shared environments.",
      "Touch-up kits should focus on blotting, light powder, and lip care."
    ],
    coverImage:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
    category: "Makeup",
    publishedAt: "2026-02-20T12:00:00.000Z",
    authorName: "Dr. Lina Abu Salim",
    approved: true,
    references: [{ label: "FDA Cosmetics", url: "https://www.fda.gov" }]
  }
];

const events = [
  {
    id: "evt-1",
    slug: "master-your-time",
    title: "Master Your Time: Time Management & Midterm Preparation",
    excerpt:
      "An interactive student session on time management, midterm preparation, productivity, and balanced study habits.",
    description: [
      "انضموا إلينا في جلسة تفاعلية حول إدارة الوقت بفعالية والاستعداد للامتحانات النصفية.",
      "تناقش الجلسة الحفاظ على الإنتاجية خلال الأوقات الصعبة، مع التطرق للحديث عن بر الوالدين بمناسبة قرب يوم الأم."
    ],
    coverImage:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80",
    startsAt: "2026-03-17T10:00:00.000Z",
    venue: "An-Najah National University",
    capacity: 60,
    registeredCount: 0,
    tags: ["Workshop", "Members"],
    isFeatured: true
  },
  {
    id: "evt-2",
    slug: "future-digital-marketing-cosmetics-pharmacy",
    title: "The Future of Digital Marketing in Cosmetics & Pharmacy",
    excerpt:
      "A specialized session on the future of digital marketing in cosmetics and pharmacy.",
    description: [
      "A student activity supervised by Dr. Firas Al-Naser, Dr. Faten Amer, and Dr. Noor Barakat.",
      "The session connects cosmetics, pharmacy, and digital marketing skills for students preparing for the professional field."
    ],
    coverImage:
      "https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=1200&q=80",
    startsAt: "2026-04-22T10:00:00.000Z",
    venue: "An-Najah National University",
    capacity: 80,
    registeredCount: 0,
    tags: ["Workshop", "Networking"]
  },
  {
    id: "evt-3",
    slug: "lotion-bar-solid-perfume",
    title: "Lotion Bar & Solid Perfume",
    excerpt:
      "A practical cosmetics activity for society members focused on lotion bars and solid perfume.",
    description: [
      "A hands-on activity for members to explore applied cosmetic preparation.",
      "Participants learn through practical demonstration and guided student engagement."
    ],
    coverImage:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1200&q=80",
    startsAt: "2026-04-22T12:00:00.000Z",
    venue: "An-Najah National University",
    capacity: 40,
    registeredCount: 0,
    tags: ["Lab", "Members"]
  },
  {
    id: "evt-4",
    slug: "face-mapping",
    title: "Face Mapping",
    excerpt:
      "An awareness exhibition about the relationship between internal health and skin appearance.",
    description: [
      "بإشراف عمادة شؤون الطلبة وكلية الصيدلة، تم تنظيم معرض تعريفي بعنوان Face Mapping للحديث عن العلاقة بين الصحة الداخلية والبشرة.",
      "تضمن المعرض بوثات حول الجبهة والأمعاء، الهالات السوداء، الخدود والمعدة ونمط الحياة، والذقن والهرمونات.",
      "تضمن النشاط أيضًا بوثًا للتعريف بأكاديمية النجاح للتجميل N-Joy وألعابًا ترفيهية."
    ],
    coverImage:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80",
    startsAt: "2026-05-05T10:00:00.000Z",
    venue: "An-Najah National University",
    capacity: 120,
    registeredCount: 0,
    tags: ["Workshop", "Networking"]
  }
];

const products = [
  {
    id: "prd-1",
    slug: "radiance-repair-serum",
    name: "Radiance Repair Serum",
    description: "Barrier-support serum with niacinamide and peptide complex.",
    longDescription: [
      "Designed for daily professional skin care routines.",
      "Members receive discounted pricing automatically during checkout."
    ],
    price: 34,
    memberPrice: 29.5,
    category: "Skin Care",
    company: "DermaLab",
    stock: 32,
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80"
    ],
    featured: true
  },
  {
    id: "prd-2",
    slug: "studio-finish-palette",
    name: "Studio Finish Palette",
    description: "Professional makeup palette curated for events and workshops.",
    longDescription: [
      "Combines neutral and accent tones for demonstration-ready looks.",
      "Built for members who need versatile workshop options."
    ],
    price: 46,
    memberPrice: 39,
    category: "Makeup",
    company: "Canvas Pro",
    stock: 18,
    images: [
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80"
    ],
    featured: true
  }
];

const boardMembers = [
  {
    id: "bm-2026-1",
    year: "2026",
    name: "Yara Samhan",
    role: "President",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
    bio: "Leads strategic partnerships, academic programming, and member development."
  },
  {
    id: "bm-2026-2",
    year: "2026",
    name: "Mariam Shtayyeh",
    role: "Vice President",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80",
    bio: "Coordinates workshops and volunteer initiatives."
  }
];

const users = [
  {
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
    displayName: "SCSC Admin",
    membershipId: "SCSC-ADMIN-001"
  },
  {
    email: "moderator@example.com",
    password: "admin123",
    role: "moderator",
    displayName: "SCSC Moderator",
    membershipId: "SCSC-MOD-001"
  },
  {
    email: "user@example.com",
    password: "admin123",
    role: "user",
    displayName: "SCSC Member",
    membershipId: "SCSC-USER-001"
  }
];

async function setCollection(name, items) {
  const batch = db.batch();
  for (const item of items) {
    const { id, ...payload } = item;
    batch.set(db.collection(name).doc(id), payload, { merge: true });
  }
  await batch.commit();
  console.log(`Seeded ${items.length} ${name} documents.`);
}

async function upsertAuthUser(seedUser) {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(seedUser.email);
  } catch {
    userRecord = await auth.createUser({
      email: seedUser.email,
      password: seedUser.password,
      displayName: seedUser.displayName,
      emailVerified: true
    });
  }

  await auth.setCustomUserClaims(userRecord.uid, { role: seedUser.role });
  await db.collection("users").doc(userRecord.uid).set(
    {
      membershipId: seedUser.membershipId,
      displayName: seedUser.displayName,
      email: seedUser.email,
      role: seedUser.role,
      membershipStatus: "active",
      membershipExpiresAt: "2026-12-31T23:59:59.000Z",
      joinedAt: new Date().toISOString(),
      qrToken: crypto.randomUUID(),
      savedArticleIds: ["art-1"],
      registeredEventIds: [],
      activeQrSessionId: null,
      activeQrSessionExpiresAt: null,
      lastQrIssuedAt: null,
      lastQrScanAt: null,
      discountRate: 0.12
    },
    { merge: true }
  );
  console.log(`Seeded user ${seedUser.email} with role ${seedUser.role}.`);
}

await setCollection("articles", articles);
await setCollection("events", events);
await setCollection("products", products);
await setCollection("boardMembers", boardMembers);

for (const user of users) {
  await upsertAuthUser(user);
}

console.log("Firebase seed completed.");
