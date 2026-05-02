import type {
  Article,
  BoardMember,
  DashboardStats,
  EventItem,
  Order,
  Product,
  UserProfile
} from "@/types";
import type { AppLocale } from "@/lib/i18n/config";

export const mockArticles: Article[] = [
  {
    id: "art-1",
    slug: "skin-barrier-basics",
    title: "Skin Barrier Basics for Students and Young Professionals",
    excerpt:
      "A practical guide to cleansing, hydration, and sun protection that keeps routines effective without overwhelming beginners.",
    content: [
      "Healthy skin starts with a stable barrier. Over-cleansing and frequent product switching often cause irritation more than poor product quality does.",
      "A balanced routine should usually include a gentle cleanser, a hydrating layer, a moisturizer, and broad-spectrum sun protection every morning.",
      "Students with active schedules benefit from keeping routines simple and consistent while documenting reactions before introducing new actives."
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
      "Brush sanitation, product expiration awareness, and touch-up routines that reduce irritation during workshops and conferences.",
    content: [
      "Brushes and sponges should be cleaned routinely to reduce breakouts and preserve product performance.",
      "Cream formulas require extra hygiene discipline when used across long event days and shared backstage settings.",
      "Touch-up kits should focus on blotting, light powder, and lip care rather than repeated full-face layering."
    ],
    coverImage:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
    category: "Makeup",
    publishedAt: "2026-02-20T12:00:00.000Z",
    authorName: "Dr. Lina Abu Salim",
    approved: true,
    references: [{ label: "FDA Cosmetics", url: "https://www.fda.gov" }]
  },
  {
    id: "art-3",
    slug: "healthy-hair-care-routines",
    title: "Healthy Hair Care Routines Between Clinical Days and Workshops",
    excerpt:
      "Simple strategies for scalp comfort, heat protection, and product layering with limited time between classes.",
    content: [
      "Scalp care should prioritize gentle cleansing frequency matched to lifestyle, exercise, and styling habits.",
      "Heat styling protection is essential even for occasional use, especially during repeated event preparation.",
      "A weekly repair mask can support dry ends without forcing a heavy daily routine."
    ],
    coverImage:
      "https://images.unsplash.com/photo-1523263685509-57c1d050d19b?auto=format&fit=crop&w=1200&q=80",
    category: "Hair Care",
    publishedAt: "2026-01-16T14:00:00.000Z",
    authorName: "Raghad Qawasmeh",
    approved: true,
    references: [{ label: "NIH Hair Disorders Overview", url: "https://www.nih.gov" }]
  }
];

export const mockEvents: EventItem[] = [
  {
    id: "evt-1",
    slug: "derma-glow-symposium",
    title: "Derma Glow Symposium 2026",
    excerpt:
      "A full-day campus symposium on evidence-based skin care, dermocosmetics, and member networking.",
    description: [
      "The symposium combines keynote talks, product science sessions, and peer-led case discussions.",
      "Attendees will explore formulation trends, ingredient literacy, and real-world member collaboration opportunities."
    ],
    coverImage:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    startsAt: "2026-05-18T09:00:00.000Z",
    venue: "Engineering Auditorium, An-Najah National University",
    capacity: 120,
    registeredCount: 78,
    tags: ["Workshop", "Research", "Networking"],
    isFeatured: true
  },
  {
    id: "evt-2",
    slug: "advanced-makeup-lab",
    title: "Advanced Makeup Lab",
    excerpt:
      "Hands-on demo covering skin prep, long-wear looks, and hygiene protocols for beauty professionals.",
    description: [
      "This lab is designed for members who want guided practical training in preparation and finishing techniques.",
      "Participants will rotate through live stations with tutors and receive curated reference notes after the session."
    ],
    coverImage:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80",
    startsAt: "2026-06-02T11:00:00.000Z",
    venue: "Student Innovation Hub",
    capacity: 40,
    registeredCount: 26,
    tags: ["Makeup", "Lab"]
  },
  {
    id: "evt-3",
    slug: "member-orientation-day",
    title: "Member Orientation Day",
    excerpt:
      "An onboarding event introducing benefits, committees, and professional growth tracks for new members.",
    description: [
      "Orientation focuses on helping new members navigate the association's opportunities and standards.",
      "Sessions include leadership introductions, volunteer pathways, and store discount guidance."
    ],
    coverImage:
      "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80",
    startsAt: "2026-05-05T10:30:00.000Z",
    venue: "Main Conference Hall",
    capacity: 90,
    registeredCount: 90,
    tags: ["Members", "Orientation"]
  }
];

export const mockProducts: Product[] = [
  {
    id: "prd-1",
    slug: "radiance-repair-serum",
    name: "Radiance Repair Serum",
    description: "Barrier-support serum with niacinamide and peptide complex.",
    longDescription: [
      "Designed for daily use in professional skin care routines with a lightweight, fast-absorbing texture.",
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
    slug: "silk-touch-mask",
    name: "Silk Touch Mask",
    description: "Hydrating sheet mask suitable for post-event skin recovery.",
    longDescription: [
      "A soothing mask designed to calm dryness and restore comfort after long makeup wear.",
      "Best used one to two times per week depending on skin needs."
    ],
    price: 12,
    memberPrice: 10,
    category: "Masks",
    company: "Glow Theory",
    stock: 86,
    images: [
      "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    id: "prd-3",
    slug: "studio-finish-palette",
    name: "Studio Finish Palette",
    description: "Professional makeup palette curated for events and workshops.",
    longDescription: [
      "Combines blendable neutral and accent tones for demonstration-ready looks.",
      "Built for members who need versatile options without carrying oversized kits."
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
  },
  {
    id: "prd-4",
    slug: "velvet-body-lotion",
    name: "Velvet Body Lotion",
    description: "Daily moisturizing body care with a lightweight finish.",
    longDescription: [
      "A balanced formula for hydration without residue, suitable for warm climates and busy schedules.",
      "Pairs well with simplified routines recommended in association workshops."
    ],
    price: 18,
    memberPrice: 15.5,
    category: "Body Care",
    company: "Botaniq",
    stock: 52,
    images: [
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=80"
    ]
  }
];

export const mockBoardMembers: BoardMember[] = [
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
    bio: "Coordinates interdisciplinary workshops and volunteer initiatives."
  },
  {
    id: "bm-2025-1",
    year: "2025",
    name: "Lina Odeh",
    role: "President",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
    bio: "Expanded the association's education content and company collaborations."
  },
  {
    id: "bm-2025-2",
    year: "2025",
    name: "Rahaf Hamad",
    role: "Treasurer",
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80",
    bio: "Managed sponsorship pipelines and financial reporting."
  }
];

export const mockOrders: Order[] = [
  {
    id: "ord-1001",
    userId: "user-1",
    createdAt: "2026-03-28T14:15:00.000Z",
    status: "processing",
    subtotal: 64,
    discount: 7.68,
    total: 56.32,
    items: [
      {
        productId: "prd-1",
        name: "Radiance Repair Serum",
        price: 34,
        quantity: 1
      },
      {
        productId: "prd-2",
        name: "Silk Touch Mask",
        price: 12,
        quantity: 2
      }
    ]
  },
  {
    id: "ord-1002",
    userId: "user-3",
    createdAt: "2026-04-19T10:20:00.000Z",
    status: "delivered",
    subtotal: 51.5,
    discount: 6.18,
    total: 45.32,
    items: [
      {
        productId: "prd-4",
        name: "Velvet Body Lotion",
        price: 15.5,
        quantity: 1
      },
      {
        productId: "prd-2",
        name: "Silk Touch Mask",
        price: 10,
        quantity: 3
      }
    ]
  }
];

export const mockUsers: UserProfile[] = [
  {
    id: "user-1",
    membershipId: "SCSC-ASEEL-001",
    displayName: "Aseel Nassar",
    email: "aseel@example.com",
    role: "admin",
    phone: "+970 599 000 111",
    company: "An-Najah National University",
    photoURL:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
    membershipStatus: "active",
    membershipExpiresAt: "2026-12-31T23:59:59.000Z",
    joinedAt: "2025-09-01T08:00:00.000Z",
    qrToken: "11111111-1111-4111-8111-111111111111",
    savedArticleIds: ["art-1", "art-2"],
    registeredEventIds: ["evt-1", "evt-2"],
    activeQrSessionId: null,
    activeQrSessionExpiresAt: null,
    lastQrIssuedAt: null,
    lastQrScanAt: null,
    discountRate: 0.12
  },
  {
    id: "user-2",
    membershipId: "SCSC-LAMAR-002",
    displayName: "Lamar Hanani",
    email: "lamar@example.com",
    role: "moderator",
    membershipStatus: "pendingRenewal",
    membershipExpiresAt: "2026-05-14T23:59:59.000Z",
    joinedAt: "2025-10-10T11:30:00.000Z",
    qrToken: "22222222-2222-4222-8222-222222222222",
    savedArticleIds: ["art-3"],
    registeredEventIds: ["evt-3"],
    activeQrSessionId: null,
    activeQrSessionExpiresAt: null,
    lastQrIssuedAt: null,
    lastQrScanAt: null,
    discountRate: 0.12
  },
  {
    id: "user-3",
    membershipId: "SCSC-USER-003",
    displayName: "Sara Qadri",
    email: "user@example.com",
    role: "user",
    phone: "+970 599 000 333",
    company: "Student Member",
    photoURL:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
    membershipStatus: "active",
    membershipExpiresAt: "2026-11-30T23:59:59.000Z",
    joinedAt: "2026-01-22T09:15:00.000Z",
    qrToken: "33333333-3333-4333-8333-333333333333",
    savedArticleIds: ["art-1"],
    registeredEventIds: ["evt-1"],
    activeQrSessionId: null,
    activeQrSessionExpiresAt: null,
    lastQrIssuedAt: null,
    lastQrScanAt: null,
    discountRate: 0.12
  }
];

export const mockDashboardStats: DashboardStats = {
  totalUsers: 324,
  upcomingEvents: 7,
  totalOrders: 146,
  registeredCompanies: 18
};

type LocalizedOverrides<T extends { id: string }> = Record<
  string,
  Partial<Record<AppLocale, Partial<T>>>
>;

function localizeMockCollection<T extends { id: string }>(
  collection: T[],
  locale: AppLocale,
  overrides: LocalizedOverrides<T>
) {
  return collection.map((entry) => ({
    ...entry,
    ...(overrides[entry.id]?.[locale] || {})
  }));
}

const articleLocalizations: LocalizedOverrides<Article> = {
  "art-1": {
    ar: {
      title: "أساسيات حاجز البشرة للطلبة والمهنيين الشباب",
      excerpt:
        "دليل عملي للتنظيف والترطيب والوقاية من الشمس يحافظ على فعالية الروتين بدون تعقيد للمبتدئين.",
      content: [
        "البشرة الصحية تبدأ من حاجز جلدي متوازن. الإفراط في التنظيف وتبديل المنتجات باستمرار يسببان التهيج أكثر من ضعف جودة المنتج نفسه.",
        "الروتين المتوازن يتضمن غالبًا غسولًا لطيفًا وطبقة ترطيب ومرطبًا وواقي شمس واسع الطيف كل صباح.",
        "الطلبة أصحاب الجداول المزدحمة يستفيدون من روتين بسيط وثابت مع متابعة أي تفاعل قبل إدخال مواد فعالة جديدة."
      ],
      authorName: "الفريق التحريري للجمعية",
      references: [{ label: "نصائح الأكاديمية الأمريكية للأمراض الجلدية", url: "https://www.aad.org" }]
    }
  },
  "art-2": {
    ar: {
      title: "نظافة المكياج خلال أيام الفعاليات الجامعية الطويلة",
      excerpt:
        "تنظيف الفرش ومراقبة صلاحية المنتجات وروتين التعديلات السريعة لتقليل التهيج أثناء الورش والمؤتمرات.",
      content: [
        "يجب تنظيف الفرش والإسفنجات بشكل منتظم لتقليل الحبوب والحفاظ على أداء المنتجات.",
        "التركيبات الكريمية تحتاج إلى التزام أكبر بالنظافة خصوصًا خلال أيام الفعاليات الطويلة أو البيئات المشتركة خلف الكواليس.",
        "مجموعة التعديلات السريعة الأفضل تركّز على امتصاص الزيوت وبودرة خفيفة والعناية بالشفاه بدل إعادة طبقات كاملة من المكياج."
      ],
      authorName: "د. لينا أبو سليم",
      references: [{ label: "هيئة الغذاء والدواء الأمريكية - مستحضرات التجميل", url: "https://www.fda.gov" }]
    }
  },
  "art-3": {
    ar: {
      title: "روتين صحي للعناية بالشعر بين الأيام العملية والورش",
      excerpt:
        "استراتيجيات بسيطة لراحة فروة الرأس والحماية من الحرارة وتنسيق المنتجات مع ضيق الوقت بين المحاضرات.",
      content: [
        "العناية بفروة الرأس يجب أن تعتمد على تنظيف لطيف يتناسب مع نمط الحياة والرياضة وعادات التصفيف.",
        "الحماية من الحرارة ضرورية حتى مع الاستخدام المتقطع، خاصة عند التحضير المتكرر للفعاليات.",
        "قناع إصلاحي أسبوعي يمكن أن يدعم الأطراف الجافة بدون فرض روتين يومي ثقيل."
      ],
      authorName: "رغد قواسمة",
      references: [{ label: "نظرة عامة من المعاهد الوطنية للصحة حول اضطرابات الشعر", url: "https://www.nih.gov" }]
    }
  }
};

const eventLocalizations: LocalizedOverrides<EventItem> = {
  "evt-1": {
    ar: {
      title: "ملتقى ديرما جلو 2026",
      excerpt:
        "ملتقى جامعي ليوم كامل حول العناية بالبشرة المبنية على الدليل العلمي والدرموكوزمتك والتواصل بين الأعضاء.",
      description: [
        "يجمع الملتقى بين كلمات رئيسية وجلسات عن علم المنتجات ونقاشات حالة يقودها الزملاء.",
        "سيتعرف الحضور على اتجاهات التركيبات وقراءة المكونات وفرص التعاون الواقعية بين أعضاء الجمعية."
      ],
      venue: "مدرج الهندسة، جامعة النجاح الوطنية"
    }
  },
  "evt-2": {
    ar: {
      title: "مختبر المكياج المتقدم",
      excerpt:
        "تطبيق عملي مباشر حول تجهيز البشرة والإطلالات طويلة الثبات وبروتوكولات النظافة للمتخصصين في الجمال.",
      description: [
        "صُمم هذا المختبر للأعضاء الذين يريدون تدريبًا عمليًا موجّهًا في تقنيات التحضير واللمسات النهائية.",
        "سينتقل المشاركون بين محطات تطبيق حي مع المدربين ويحصلون على ملاحظات مرجعية مختارة بعد الجلسة."
      ],
      venue: "مركز الابتكار الطلابي"
    }
  },
  "evt-3": {
    ar: {
      title: "يوم التعريف بالأعضاء",
      excerpt:
        "فعالية تعريفية توضح المزايا واللجان ومسارات التطور المهني للأعضاء الجدد.",
      description: [
        "تركّز الفعالية على مساعدة الأعضاء الجدد في فهم فرص الجمعية ومعاييرها وآليات الاستفادة منها.",
        "تشمل الجلسات تقديمًا للقيادة ومسارات التطوع وإرشادات الاستفادة من خصومات المتجر."
      ],
      venue: "قاعة المؤتمرات الرئيسية"
    }
  }
};

const productLocalizations: LocalizedOverrides<Product> = {
  "prd-1": {
    ar: {
      name: "سيروم إصلاح الإشراقة",
      description: "سيروم داعم لحاجز البشرة يحتوي على النياسيناميد ومركب الببتيدات.",
      longDescription: [
        "مصمم للاستخدام اليومي ضمن روتين عناية احترافي بقوام خفيف وسريع الامتصاص.",
        "يستفيد الأعضاء من سعر مخفض يُطبّق تلقائيًا أثناء إتمام الطلب."
      ],
      company: "ديرمالاب"
    }
  },
  "prd-2": {
    ar: {
      name: "قناع سيلك تاتش",
      description: "قناع ورقي مرطب مناسب لاستعادة راحة البشرة بعد الفعاليات.",
      longDescription: [
        "قناع مهدئ صُمم لتقليل الجفاف واستعادة الراحة بعد فترات طويلة من وضع المكياج.",
        "يفضل استخدامه مرة إلى مرتين أسبوعيًا بحسب احتياج البشرة."
      ],
      company: "جلو ثيوري"
    }
  },
  "prd-3": {
    ar: {
      name: "باليت ستوديو فينيش",
      description: "لوحة مكياج احترافية مناسبة للفعاليات والورش العملية.",
      longDescription: [
        "تجمع بين درجات حيادية ولمسات بارزة سهلة الدمج لإطلالات جاهزة للعروض والتطبيق.",
        "مناسبة للأعضاء الذين يحتاجون خيارات متعددة دون حمل حقائب كبيرة."
      ],
      company: "كانفس برو"
    }
  },
  "prd-4": {
    ar: {
      name: "لوشن فيلفت للجسم",
      description: "عناية يومية مرطبة للجسم بملمس خفيف ومريح.",
      longDescription: [
        "تركيبة متوازنة تمنح ترطيبًا بدون بقايا ثقيلة، ومناسبة للأجواء الدافئة والجداول اليومية المزدحمة.",
        "يناسب الروتينات البسيطة الموصى بها في ورش الجمعية."
      ],
      company: "بوتانيك"
    }
  }
};

const boardMemberLocalizations: LocalizedOverrides<BoardMember> = {
  "bm-2026-1": {
    ar: {
      name: "يارا سمحان",
      bio: "تقود الشراكات الاستراتيجية والبرامج الأكاديمية وتطوير الأعضاء."
    }
  },
  "bm-2026-2": {
    ar: {
      name: "مريم اشتية",
      bio: "تنسق الورش متعددة التخصصات ومبادرات العمل التطوعي."
    }
  },
  "bm-2025-1": {
    ar: {
      name: "لينا عودة",
      bio: "وسّعت المحتوى التثقيفي للجمعية وعززت التعاون مع الشركات."
    }
  },
  "bm-2025-2": {
    ar: {
      name: "رهف حمد",
      bio: "أدارت مسارات الرعاية والتقارير المالية."
    }
  }
};

const userLocalizations: LocalizedOverrides<UserProfile> = {
  "user-1": {
    ar: {
      displayName: "أسيل نصار",
      company: "جامعة النجاح الوطنية"
    }
  },
  "user-2": {
    ar: {
      displayName: "لمار حناني"
    }
  }
};

export function getLocalizedMockArticles(locale: AppLocale) {
  return localizeMockCollection(mockArticles, locale, articleLocalizations);
}

export function getLocalizedMockEvents(locale: AppLocale) {
  return localizeMockCollection(mockEvents, locale, eventLocalizations);
}

export function getLocalizedMockProducts(locale: AppLocale) {
  return localizeMockCollection(mockProducts, locale, productLocalizations);
}

export function getLocalizedMockBoardMembers(locale: AppLocale) {
  return localizeMockCollection(mockBoardMembers, locale, boardMemberLocalizations);
}

export function getLocalizedMockUsers(locale: AppLocale) {
  return localizeMockCollection(mockUsers, locale, userLocalizations);
}

export function getLocalizedMockOrders(locale: AppLocale) {
  const localizedProductNames = new Map(
    getLocalizedMockProducts(locale).map((product) => [product.id, product.name])
  );

  return mockOrders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      name: localizedProductNames.get(item.productId) || item.name
    }))
  }));
}
